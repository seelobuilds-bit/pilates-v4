import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch a specific studio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    console.log("Session check:", { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      role: session?.user?.role 
    })
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ 
        error: "Unauthorized", 
        debug: { hasSession: !!session, role: session?.user?.role }
      }, { status: 401 })
    }

    const { studioId } = await params

    const studio = await db.studio.findUnique({
      where: { id: studioId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        locations: true,
        teachers: {
          include: { 
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            clients: true,
            classSessions: true,
            bookings: true,
          },
        },
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Error fetching studio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update a studio
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studioId } = await params
    const body = await request.json()
    const { name, subdomain, primaryColor } = body

    const studio = await db.studio.update({
      where: { id: studioId },
      data: {
        ...(name && { name }),
        ...(subdomain && { subdomain }),
        ...(primaryColor && { primaryColor }),
      },
    })

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Error updating studio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a studio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studioId } = await params

    await db.studio.delete({
      where: { id: studioId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting studio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
