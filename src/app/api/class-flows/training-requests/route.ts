import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch training requests
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const requests = await db.trainingRequest.findMany({
      where: {
        studioId: session.user.studioId,
        // If teacher, only show their requests
        ...(session.user.teacherId && { requestedById: session.user.teacherId })
      },
      include: {
        requestedBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Failed to fetch training requests:", error)
    return NextResponse.json({ error: "Failed to fetch training requests" }, { status: 500 })
  }
}

// POST - Create new training request
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId || !session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      trainingType,
      preferredDate1,
      preferredDate2,
      preferredDate3,
      contactName,
      contactEmail,
      contactPhone,
      location,
      address,
      attendeeCount,
      notes
    } = body

    const trainingRequest = await db.trainingRequest.create({
      data: {
        title,
        description,
        trainingType,
        preferredDate1: preferredDate1 ? new Date(preferredDate1) : null,
        preferredDate2: preferredDate2 ? new Date(preferredDate2) : null,
        preferredDate3: preferredDate3 ? new Date(preferredDate3) : null,
        contactName,
        contactEmail,
        contactPhone,
        location,
        address,
        attendeeCount: attendeeCount || 1,
        notes,
        studioId: session.user.studioId,
        requestedById: session.user.teacherId
      }
    })

    return NextResponse.json(trainingRequest)
  } catch (error) {
    console.error("Failed to create training request:", error)
    return NextResponse.json({ error: "Failed to create training request" }, { status: 500 })
  }
}






















