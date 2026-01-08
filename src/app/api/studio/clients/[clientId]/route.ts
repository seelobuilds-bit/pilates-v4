import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { clientId } = await params

    const client = await db.client.findFirst({
      where: {
        id: clientId,
        studioId: session.user.studioId
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const bookings = await db.booking.findMany({
      where: {
        clientId: client.id
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    return NextResponse.json({
      client,
      bookings
    })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { clientId } = await params
    const body = await request.json()

    // Verify client belongs to studio
    const existingClient = await db.client.findFirst({
      where: {
        id: clientId,
        studioId: session.user.studioId
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const updatedClient = await db.client.update({
      where: { id: clientId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        credits: body.credits,
        isActive: body.isActive
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { clientId } = await params

    // Verify client belongs to studio
    const existingClient = await db.client.findFirst({
      where: {
        id: clientId,
        studioId: session.user.studioId
      },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                status: "CONFIRMED",
                classSession: {
                  startTime: { gte: new Date() }
                }
              }
            }
          }
        }
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check for upcoming bookings
    if (existingClient._count.bookings > 0) {
      return NextResponse.json({ 
        error: "Cannot delete client with upcoming bookings. Please cancel their bookings first." 
      }, { status: 400 })
    }

    // Delete client and their bookings (cascade)
    await db.client.delete({
      where: { id: clientId }
    })

    return NextResponse.json({ success: true, message: "Client deleted successfully" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
