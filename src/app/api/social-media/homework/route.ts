import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// Helper to get the user identifier for homework
function getUserIdentifier(session: { user?: { teacherId?: string; id?: string; role?: string } }) {
  if (session?.user?.teacherId) {
    return { type: "teacher" as const, id: session.user.teacherId }
  }
  if (session?.user?.id && (session.user.role === "OWNER" || session.user.role === "HQ_ADMIN")) {
    return { type: "user" as const, id: session.user.id }
  }
  return null
}

// GET - Fetch homework submissions (works for both teachers and studio owners)
export async function GET(request: NextRequest) {
  const session = await getSession()
  const userIdent = getUserIdentifier(session as { user?: { teacherId?: string; id?: string; role?: string } })

  if (!userIdent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Build where clause based on user type
    const whereClause = userIdent.type === "teacher" 
      ? { teacherId: userIdent.id }
      : { userId: userIdent.id }

    // Get all submissions
    const submissions = await db.socialHomeworkSubmission.findMany({
      where: whereClause,
      include: {
        homework: {
          include: {
            module: {
              include: { category: true }
            }
          }
        },
        attachedFlow: {
          select: {
            id: true,
            name: true,
            triggerType: true,
            account: {
              select: {
                platform: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Check if there's an active homework
    const activeHomework = submissions.find(s => s.status === "ACTIVE" && !s.isCompleted)

    return NextResponse.json({
      submissions,
      activeHomeworkId: activeHomework?.homeworkId || null,
      hasActiveHomework: !!activeHomework
    })
  } catch (error) {
    console.error("Failed to fetch homework:", error)
    return NextResponse.json({ error: "Failed to fetch homework" }, { status: 500 })
  }
}

// POST - Start/cancel/update homework (works for both teachers and studio owners)
export async function POST(request: NextRequest) {
  const session = await getSession()
  const userIdent = getUserIdentifier(session as { user?: { teacherId?: string; id?: string; role?: string } })

  if (!userIdent || !session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, homeworkId, progress, submissionNotes, submissionUrls, attachedFlowId } = body

    // Build where clause based on user type
    const whereClause = userIdent.type === "teacher" 
      ? { teacherId: userIdent.id }
      : { userId: userIdent.id }

    // Get studio for generating booking URL
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId },
      select: { subdomain: true }
    })

    // Handle different actions
    if (action === "start") {
      // Check if there's already an active homework
      const activeSubmission = await db.socialHomeworkSubmission.findFirst({
        where: {
          ...whereClause,
          status: "ACTIVE",
          isCompleted: false
        },
        include: {
          homework: {
            include: { module: true }
          }
        }
      })

      if (activeSubmission) {
        return NextResponse.json({
          error: "You already have an active homework",
          activeHomework: {
            id: activeSubmission.homeworkId,
            title: activeSubmission.homework.title,
            moduleTitle: activeSubmission.homework.module.title
          }
        }, { status: 400 })
      }

      // Get homework details
      const homework = await db.socialTrainingHomework.findUnique({
        where: { id: homeworkId },
        include: { module: true }
      })

      if (!homework) {
        return NextResponse.json({ error: "Homework not found" }, { status: 404 })
      }

      // Check if already exists (maybe completed or cancelled before)
      // Need to use the right unique constraint based on user type
      const existingSubmission = userIdent.type === "teacher"
        ? await db.socialHomeworkSubmission.findUnique({
            where: {
              homeworkId_teacherId: {
                homeworkId,
                teacherId: userIdent.id
              }
            }
          })
        : await db.socialHomeworkSubmission.findUnique({
            where: {
              homeworkId_userId: {
                homeworkId,
                userId: userIdent.id
              }
            }
          })

      // Generate tracking code
      const trackingCode = `hw_${userIdent.id.slice(-6)}_${homeworkId.slice(-6)}_${Date.now().toString(36)}`
      
      // Generate full tracking URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const fullTrackingUrl = studio?.subdomain 
        ? `${baseUrl}/${studio.subdomain}/book?utm_source=social&utm_medium=homework&utm_campaign=${trackingCode}`
        : `${baseUrl}/book?utm_source=social&utm_medium=homework&utm_campaign=${trackingCode}`

      if (existingSubmission) {
        // Reactivate if it was cancelled
        if (existingSubmission.status === "CANCELLED") {
          const updated = await db.socialHomeworkSubmission.update({
            where: { id: existingSubmission.id },
            data: {
              status: "ACTIVE",
              progress: JSON.stringify({}), // Reset progress
              cancelledAt: null,
              startedAt: new Date(),
              trackingCode,
              fullTrackingUrl,
              attachedFlowId: attachedFlowId || null,
              submissionUrls: [] // Reset video links
            },
            include: {
              homework: {
                include: {
                  module: {
                    include: { category: true }
                  }
                }
              },
              attachedFlow: {
                select: {
                  id: true,
                  name: true,
                  triggerType: true,
                  account: {
                    select: {
                      platform: true,
                      username: true
                    }
                  }
                }
              }
            }
          })
          return NextResponse.json(updated)
        }
        
        return NextResponse.json({ 
          error: "You've already started or completed this homework" 
        }, { status: 400 })
      }

      // Create new submission with the right user identifier
      const createData = userIdent.type === "teacher"
        ? {
            homeworkId,
            teacherId: userIdent.id,
            progress: JSON.stringify({}),
            status: "ACTIVE" as const,
            trackingCode,
            fullTrackingUrl,
            startedAt: new Date(),
            attachedFlowId: attachedFlowId || null
          }
        : {
            homeworkId,
            userId: userIdent.id,
            progress: JSON.stringify({}),
            status: "ACTIVE" as const,
            trackingCode,
            fullTrackingUrl,
            startedAt: new Date(),
            attachedFlowId: attachedFlowId || null
          }

      const submission = await db.socialHomeworkSubmission.create({
        data: createData,
        include: {
          homework: {
            include: {
              module: {
                include: { category: true }
              }
            }
          },
          attachedFlow: {
            select: {
              id: true,
              name: true,
              triggerType: true,
              account: {
                select: {
                  platform: true,
                  username: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json(submission)
    }

    if (action === "cancel") {
      // Cancel active homework
      const submission = await db.socialHomeworkSubmission.findFirst({
        where: {
          homeworkId,
          ...whereClause,
          status: "ACTIVE"
        }
      })

      if (!submission) {
        return NextResponse.json({ error: "No active homework found" }, { status: 404 })
      }

      const cancelled = await db.socialHomeworkSubmission.update({
        where: { id: submission.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date()
        }
      })

      return NextResponse.json(cancelled)
    }

    if (action === "update") {
      // Update progress on active homework
      const submission = await db.socialHomeworkSubmission.findFirst({
        where: {
          homeworkId,
          ...whereClause,
          status: "ACTIVE"
        },
        include: { homework: true }
      })

      if (!submission) {
        return NextResponse.json({ error: "No active homework found" }, { status: 404 })
      }

      const requirements = JSON.parse(submission.homework.requirements || "[]")
      const progressData = progress || {}

      // Check if all requirements are met
      let isCompleted = true
      for (const req of requirements) {
        const current = progressData[req.metric] || 0
        if (current < req.quantity) {
          isCompleted = false
          break
        }
      }

      const updated = await db.socialHomeworkSubmission.update({
        where: { id: submission.id },
        data: {
          progress: JSON.stringify(progressData),
          isCompleted,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
          completedAt: isCompleted ? new Date() : null,
          ...(submissionNotes !== undefined && { submissionNotes }),
          ...(submissionUrls !== undefined && { submissionUrls }),
          ...(attachedFlowId !== undefined && { attachedFlowId }),
          ...(isCompleted && { pointsAwarded: submission.homework.points })
        },
        include: {
          homework: {
            include: {
              module: {
                include: { category: true }
              }
            }
          },
          attachedFlow: {
            select: {
              id: true,
              name: true,
              triggerType: true,
              account: {
                select: {
                  platform: true,
                  username: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({
        ...updated,
        progress: JSON.parse(updated.progress)
      })
    }

    if (action === "saveVideoLinks") {
      // Save video links for evidence
      const submission = await db.socialHomeworkSubmission.findFirst({
        where: {
          homeworkId,
          ...whereClause,
          status: "ACTIVE"
        }
      })

      if (!submission) {
        return NextResponse.json({ error: "No active homework found" }, { status: 404 })
      }

      const updated = await db.socialHomeworkSubmission.update({
        where: { id: submission.id },
        data: {
          submissionUrls: submissionUrls || []
        },
        include: {
          homework: {
            include: {
              module: {
                include: { category: true }
              }
            }
          },
          attachedFlow: {
            select: {
              id: true,
              name: true,
              triggerType: true,
              account: {
                select: {
                  platform: true,
                  username: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json(updated)
    }

    if (action === "attachFlow") {
      // Attach a flow to the homework for tracking
      const submission = await db.socialHomeworkSubmission.findFirst({
        where: {
          homeworkId,
          ...whereClause,
          status: "ACTIVE"
        }
      })

      if (!submission) {
        return NextResponse.json({ error: "No active homework found" }, { status: 404 })
      }

      const updated = await db.socialHomeworkSubmission.update({
        where: { id: submission.id },
        data: {
          attachedFlowId: attachedFlowId || null
        },
        include: {
          homework: {
            include: {
              module: {
                include: { category: true }
              }
            }
          },
          attachedFlow: {
            select: {
              id: true,
              name: true,
              triggerType: true,
              account: {
                select: {
                  platform: true,
                  username: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to process homework:", error)
    return NextResponse.json({ error: "Failed to process homework" }, { status: 500 })
  }
}















