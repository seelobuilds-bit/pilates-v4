import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import {
  buildClientEntityStats,
  mapClientCommunications,
} from "@/lib/reporting/client-entity"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { clientId } = await params
    const { startDate, endDate } = resolveDefaultEntityReportDateRange(request.nextUrl.searchParams)

    const client = await db.client.findFirst({
      where: {
        id: clientId,
        studioId: session.user.studioId
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const allBookings = await db.booking.findMany({
      where: {
        clientId: client.id,
        studioId: session.user.studioId
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
      orderBy: { createdAt: "desc" }
    })

    const recentBookings = allBookings.slice(0, 20)

    const messages = await db.message.findMany({
      where: {
        studioId: session.user.studioId,
        clientId: client.id
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        channel: true,
        direction: true,
        subject: true,
        body: true,
        createdAt: true
      }
    })

    const reportBookings = allBookings.filter((booking) => {
      const classStart = new Date(booking.classSession.startTime)
      return classStart >= startDate && classStart <= endDate
    })

    const communications = mapClientCommunications(messages)
    const stats = buildClientEntityStats({
      reportBookings,
      endDate,
      credits: client.credits,
    })

    return NextResponse.json({
      client,
      bookings: recentBookings,
      stats,
      communications
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
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
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
        isActive: body.isActive,
        staffNotes:
          typeof body.staffNotes === "string"
            ? body.staffNotes.trim() || null
            : existingClient.staffNotes,
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
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
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

    // Delete all related records in a transaction
    await db.$transaction(async (tx) => {
      // Delete waitlist entries
      await tx.waitlist.deleteMany({
        where: { clientId }
      })
      
      // Delete bookings
      await tx.booking.deleteMany({
        where: { clientId }
      })
      
      // Delete messages
      await tx.message.deleteMany({
        where: { clientId }
      })
      
      // Delete payments
      await tx.payment.deleteMany({
        where: { clientId }
      })
      
      // Delete vault enrollments if they exist
      await tx.vaultEnrollment.deleteMany({
        where: { clientId }
      }).catch(() => {})
      
      // Delete vault bundle subscriptions if they exist
      await tx.vaultBundleSubscription.deleteMany({
        where: { clientId }
      }).catch(() => {})
      
      // Delete vault reviews if they exist
      await tx.vaultReview.deleteMany({
        where: { clientId }
      }).catch(() => {})
      
      // Delete vault subscriptions if they exist
      await tx.vaultSubscriber.deleteMany({
        where: { clientId }
      }).catch(() => {})
      
      // Finally delete the client
      await tx.client.delete({
        where: { id: clientId }
      })
    })

    return NextResponse.json({ success: true, message: "Client deleted successfully" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
