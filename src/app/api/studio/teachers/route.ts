import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendSystemTemplateEmail } from "@/lib/email"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const teachers = await db.teacher.findMany({
    where: { studioId: session.user.studioId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(teachers)
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, firstName, lastName, specialties } = body

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Check if already a teacher at this studio
      const existingTeacher = await db.teacher.findFirst({
        where: {
          userId: existingUser.id,
          studioId: session.user.studioId
        }
      })

      if (existingTeacher) {
        return NextResponse.json({ error: "Teacher already exists at this studio" }, { status: 400 })
      }
    }

    // Get studio info for the email
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Create user and teacher in a transaction
    const result = await db.$transaction(async (tx) => {
      let user = existingUser
      let resetToken: string | null = null

      if (!user) {
        // Generate a reset token for the teacher to set their password
        resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        
        // Create a temporary password - will be replaced when they set up
        const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10)
        user = await tx.user.create({
          data: {
            email,
            firstName,
            lastName,
            password: tempPassword,
            role: "TEACHER",
            resetToken,
            resetTokenExpiry
          }
        })
      }

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          studioId: session.user.studioId,
          specialties: specialties || []
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })

      return { teacher, resetToken }
    })

    // Send invite email if new user was created
    if (result.resetToken) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://thecurrent.app'
      const inviteLink = `${baseUrl}/setup-account?token=${result.resetToken}`
      
      await sendSystemTemplateEmail({
        studioId: session.user.studioId,
        templateType: "TEACHER_INVITE",
        to: email,
        variables: {
          firstName,
          lastName,
          studioName: studio.name,
          inviteLink
        }
      })
    }

    return NextResponse.json(result.teacher)
  } catch (error) {
    console.error("Failed to create teacher:", error)
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 })
  }
}
