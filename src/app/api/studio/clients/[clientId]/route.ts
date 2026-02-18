import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const DEFAULT_REPORT_PERIOD_DAYS = 30
const ALLOWED_DAY_PRESETS = new Set([7, 30, 90])

function getReportDateRange(searchParams: URLSearchParams) {
  const startDateParam = searchParams.get("startDate")
  const endDateParam = searchParams.get("endDate")

  if (startDateParam && endDateParam) {
    const start = new Date(`${startDateParam}T00:00:00.000Z`)
    const end = new Date(`${endDateParam}T23:59:59.999Z`)

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
      return { startDate: start, endDate: end }
    }
  }

  const parsedDays = Number.parseInt(searchParams.get("days") || "", 10)
  const days = ALLOWED_DAY_PRESETS.has(parsedDays) ? parsedDays : DEFAULT_REPORT_PERIOD_DAYS

  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (days - 1))

  return { startDate, endDate }
}

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
    const { startDate, endDate } = getReportDateRange(request.nextUrl.searchParams)

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

    const nonCancelledBookings = reportBookings.filter((booking) => booking.status !== "CANCELLED")
    const completedClasses = reportBookings.filter((booking) => booking.status === "COMPLETED").length
    const cancelledClasses = reportBookings.filter((booking) => booking.status === "CANCELLED").length

    const totalSpent = nonCancelledBookings.reduce((sum, booking) => {
      const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
      return sum + amount
    }, 0)

    const totalBookings = nonCancelledBookings.length
    const totalBookingAttempts = reportBookings.length
    const cancelRate = totalBookingAttempts > 0 ? Math.round((cancelledClasses / totalBookingAttempts) * 1000) / 10 : 0

    const classCounts = new Map<string, number>()
    const teacherCounts = new Map<string, number>()
    const locationCounts = new Map<string, number>()

    for (const booking of nonCancelledBookings) {
      const className = booking.classSession.classType.name
      classCounts.set(className, (classCounts.get(className) || 0) + 1)

      const teacherName = `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`.trim()
      teacherCounts.set(teacherName, (teacherCounts.get(teacherName) || 0) + 1)

      const locationName = booking.classSession.location.name
      locationCounts.set(locationName, (locationCounts.get(locationName) || 0) + 1)
    }

    const classBreakdown = Array.from(classCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const teacherBreakdown = Array.from(teacherCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const locationBreakdown = Array.from(locationCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const oldestBookingDate = nonCancelledBookings.reduce<Date | null>((oldest, booking) => {
      const classStart = booking.classSession.startTime
      if (!oldest || classStart < oldest) return classStart
      return oldest
    }, null)
    let avgBookingsPerMonth = 0
    if (oldestBookingDate && totalBookings > 0) {
      const now = new Date()
      const monthDiff =
        (now.getFullYear() - oldestBookingDate.getFullYear()) * 12 +
        (now.getMonth() - oldestBookingDate.getMonth()) +
        1
      const activeMonths = Math.max(1, monthDiff)
      avgBookingsPerMonth = Math.round((totalBookings / activeMonths) * 10) / 10
    }

    const now = new Date()
    const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleDateString("en-US", { month: "short" }),
        count: 0
      }
    })
    const bucketLookup = new Map(monthlyBuckets.map((bucket) => [bucket.key, bucket]))

    for (const booking of nonCancelledBookings) {
      const bookingDate = new Date(booking.classSession.startTime)
      const key = `${bookingDate.getFullYear()}-${bookingDate.getMonth()}`
      const bucket = bucketLookup.get(key)
      if (bucket) {
        bucket.count += 1
      }
    }

    const activityTimeline = reportBookings.slice(0, 10).map((booking) => {
      let action = "Updated"
      if (booking.status === "CONFIRMED") action = "Booked"
      if (booking.status === "COMPLETED") action = "Completed"
      if (booking.status === "CANCELLED") action = "Cancelled"
      if (booking.status === "NO_SHOW") action = "No Show"
      if (booking.status === "PENDING") action = "Pending"

      const classDate = new Date(booking.classSession.startTime)
      return {
        date: new Date(booking.createdAt).toLocaleDateString(),
        action,
        details: `${booking.classSession.classType.name} - ${classDate.toLocaleDateString()} ${classDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      }
    })

    const communications = messages.map((message) => ({
      id: message.id,
      type: message.channel === "SMS" ? "sms" : "email",
      direction: message.direction === "INBOUND" ? "inbound" : "outbound",
      subject: message.subject || undefined,
      content: message.body,
      timestamp: message.createdAt.toISOString()
    }))

    const stats = {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalBookings,
      completedClasses,
      cancelRate,
      avgBookingsPerMonth,
      membershipType:
        client.credits > 0
          ? `${client.credits} credit${client.credits === 1 ? "" : "s"} available`
          : "No active package",
      favoriteClass: classBreakdown[0]?.name || "No data yet",
      favoriteTeacher: teacherBreakdown[0]?.name || "No data yet",
      favoriteLocation: locationBreakdown[0]?.name || "No data yet",
      classBreakdown,
      teacherBreakdown,
      locationBreakdown,
      monthlyBookings: monthlyBuckets.map(({ month, count }) => ({ month, count })),
      activityTimeline
    }

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
