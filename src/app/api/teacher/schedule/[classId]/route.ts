import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { classId } = await params
    const teacherId = session.user.teacherId

    // Fetch class session - only if it belongs to this teacher
    const classSession = await db.classSession.findFirst({
      where: {
        id: classId,
        teacherId
      },
      include: {
        classType: {
          select: {
            id: true,
            name: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        },
        bookings: {
          where: {
            status: "CONFIRMED"
          },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                healthIssues: true,
                classNotes: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: { status: "CONFIRMED" }
            }
          }
        }
      }
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const clientAlertCount = classSession.bookings.reduce((count, booking) => {
      const healthIssues = booking.client.healthIssues?.trim()
      const classNotes = booking.client.classNotes?.trim()
      return healthIssues || classNotes ? count + 1 : count
    }, 0)

    return NextResponse.json({
      ...classSession,
      clientAlertCount
    })
  } catch (error) {
    console.error("Failed to fetch class:", error)
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 })
  }
}












