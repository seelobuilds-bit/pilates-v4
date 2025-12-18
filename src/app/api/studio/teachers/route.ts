import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

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

    // Create user and teacher in a transaction
    const result = await db.$transaction(async (tx) => {
      let user = existingUser

      if (!user) {
        // Create a temporary password - in production, send an invite email instead
        const tempPassword = await bcrypt.hash("teacher123", 10)
        user = await tx.user.create({
          data: {
            email,
            firstName,
            lastName,
            password: tempPassword,
            role: "TEACHER"
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

      return teacher
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to create teacher:", error)
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 })
  }
}
