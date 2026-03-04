import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildClientEntityResponse } from "@/lib/reporting/entity-response"
import { loadClientEntityReport } from "@/lib/reporting/entity-loaders"

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

    const clientReport = await loadClientEntityReport({
      studioId,
      clientId,
      startDate,
      endDate,
    })

    if (!clientReport) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json(
      buildClientEntityResponse({
        client: clientReport.client,
        bookings: clientReport.bookings,
        stats: clientReport.stats,
        communications: clientReport.communications,
      })
    )
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
