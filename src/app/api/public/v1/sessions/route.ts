import { NextRequest, NextResponse } from "next/server"
import { BookingStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { parsePublicApiLimit, requirePublicApiAuth, withPublicApiHeaders } from "@/lib/public-api"

const NON_CANCELLED_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"]

function parseIsoDate(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function GET(request: NextRequest) {
  const { auth, response } = await requirePublicApiAuth(request, "sessions.read")
  if (response || !auth) return withPublicApiHeaders(response!)

  const limit = parsePublicApiLimit(request.nextUrl.searchParams.get("limit"))
  const from = parseIsoDate(request.nextUrl.searchParams.get("from")) || new Date()
  const to = parseIsoDate(request.nextUrl.searchParams.get("to"))
  const classTypeId = request.nextUrl.searchParams.get("classTypeId") || undefined
  const teacherId = request.nextUrl.searchParams.get("teacherId") || undefined
  const locationId = request.nextUrl.searchParams.get("locationId") || undefined

  const sessions = await db.classSession.findMany({
    where: {
      studioId: auth.studioId,
      startTime: {
        gte: from,
        ...(to ? { lte: to } : {}),
      },
      ...(classTypeId ? { classTypeId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    take: limit,
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      capacity: true,
      notes: true,
      classType: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
      teacher: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
      bookings: {
        where: { status: { in: NON_CANCELLED_STATUSES } },
        select: { id: true },
      },
    },
  })

  return withPublicApiHeaders(
    NextResponse.json({
      data: sessions.map((session) => ({
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        capacity: session.capacity,
        bookedCount: session.bookings.length,
        remainingSpots: Math.max(0, session.capacity - session.bookings.length),
        notes: session.notes,
        classType: session.classType,
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.user.firstName,
          lastName: session.teacher.user.lastName,
          email: session.teacher.user.email,
        },
        location: session.location,
      })),
      meta: { limit, from: from.toISOString(), to: to?.toISOString() || null },
    })
  )
}
