import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import {
  buildClientEntityStats,
  mapClientCommunications,
} from "@/lib/reporting/client-entity"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const studioId = await getDemoStudioId()
    if (!studioId) {
      return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
    }

    const { clientId } = await params
    const { startDate, endDate } = resolveDefaultEntityReportDateRange(request.nextUrl.searchParams)

    const client = await db.client.findFirst({
      where: {
        id: clientId,
        studioId,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const allBookings = await db.booking.findMany({
      where: {
        clientId: client.id,
        studioId,
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const recentBookings = allBookings.slice(0, 20)

    const messages = await db.message.findMany({
      where: {
        studioId,
        clientId: client.id,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        channel: true,
        direction: true,
        subject: true,
        body: true,
        createdAt: true,
      },
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
      communications,
    })
  } catch (error) {
    console.error("Error fetching demo client:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const studioId = await getDemoStudioId()
    if (!studioId) {
      return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
    }

    const { clientId } = await params
    const body = await request.json()

    const existingClient = await db.client.findFirst({
      where: {
        id: clientId,
        studioId,
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const credits = Number.isFinite(body?.credits) ? Math.max(0, Number(body.credits)) : existingClient.credits

    const updatedClient = await db.client.update({
      where: { id: existingClient.id },
      data: {
        firstName: typeof body?.firstName === "string" ? body.firstName.trim() : existingClient.firstName,
        lastName: typeof body?.lastName === "string" ? body.lastName.trim() : existingClient.lastName,
        phone: typeof body?.phone === "string" ? body.phone.trim() || null : existingClient.phone,
        credits,
        isActive: typeof body?.isActive === "boolean" ? body.isActive : existingClient.isActive,
        staffNotes: typeof body?.staffNotes === "string" ? body.staffNotes.trim() || null : existingClient.staffNotes,
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Error updating demo client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}
