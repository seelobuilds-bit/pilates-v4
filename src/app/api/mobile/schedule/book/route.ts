import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import { sendMobilePushNotification } from "@/lib/mobile-push"
import { triggerClientPackAutoRenew } from "@/lib/client-booking-plans"

function formatStartTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can book classes" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: { id: true, subdomain: true, ownerId: true, name: true },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const classSessionId = String(body?.classSessionId || "").trim()

    if (!classSessionId) {
      return NextResponse.json({ error: "classSessionId is required" }, { status: 400 })
    }

    const clientId = decoded.clientId || decoded.sub

    const client = await db.client.findFirst({
      where: {
        id: clientId,
        studioId: studio.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        credits: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const classSession = await db.classSession.findFirst({
      where: {
        id: classSessionId,
        studioId: studio.id,
      },
      include: {
        classType: {
          select: { id: true, name: true, price: true },
        },
        teacher: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ["PENDING", "CONFIRMED", "COMPLETED"],
                },
              },
            },
          },
        },
      },
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class session not found" }, { status: 404 })
    }

    if (classSession.startTime < new Date()) {
      return NextResponse.json({ error: "Cannot book a class in the past" }, { status: 400 })
    }

    const canUseCredit = client.credits > 0
    const autoRenewPackPlanId =
      classSession.classType.price > 0 && client.credits === 1
        ? (
            await db.clientBookingPlan.findFirst({
              where: {
                studioId: studio.id,
                clientId: client.id,
                kind: "PACK",
                status: "active",
                autoRenew: true,
              },
              select: { id: true },
            })
          )?.id || null
        : null

    if (classSession.classType.price > 0 && !canUseCredit) {
      return NextResponse.json(
        { error: "Paid classes must be booked on web checkout for now" },
        { status: 400 }
      )
    }

    if (classSession._count.bookings >= classSession.capacity) {
      return NextResponse.json({ error: "Class is full" }, { status: 409 })
    }

    const existingBooking = await db.booking.findUnique({
      where: {
        clientId_classSessionId: {
          clientId,
          classSessionId: classSession.id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    })

    if (existingBooking) {
      if (existingBooking.status === "CANCELLED" || existingBooking.status === "NO_SHOW") {
        const reactivationData: {
          status: "CONFIRMED"
          cancelledAt: null
          cancellationReason: null
          paidAmount?: number
        } = {
          status: "CONFIRMED",
          cancelledAt: null,
          cancellationReason: null,
        }

        if (classSession.classType.price > 0 && canUseCredit) {
          reactivationData.paidAmount = classSession.classType.price
        }

        const reactivated = await db.$transaction(async (tx) => {
          if (classSession.classType.price > 0 && canUseCredit) {
            await tx.client.update({
              where: { id: client.id },
              data: {
                credits: {
                  decrement: 1,
                },
              },
            })
          }

          return tx.booking.update({
            where: { id: existingBooking.id },
            data: reactivationData,
          })
        })

        try {
          const targetUserIds = Array.from(new Set([studio.ownerId, classSession.teacher.userId]))
          await sendMobilePushNotification({
            studioId: studio.id,
            userIds: targetUserIds,
            category: "BOOKINGS",
            title: "Booking reactivated",
            body: `${client.firstName} ${client.lastName} rebooked ${classSession.classType.name} (${formatStartTime(classSession.startTime)})`,
            data: {
              type: "mobile_booking_reactivated",
              bookingId: reactivated.id,
              classSessionId: classSession.id,
              clientId: client.id,
            },
          })
        } catch (pushError) {
          console.error("Mobile booking reactivated push failed:", pushError)
        }

        if (autoRenewPackPlanId) {
          const renewalResult = await triggerClientPackAutoRenew(autoRenewPackPlanId)
          if (!renewalResult.renewed) {
            console.error("Mobile class pack auto-renew did not complete:", renewalResult)
          }
        }

        return NextResponse.json({ success: true, bookingId: reactivated.id, status: reactivated.status })
      }

      return NextResponse.json({ error: "You are already booked in this class" }, { status: 409 })
    }

    const booking = await db.$transaction(async (tx) => {
      if (classSession.classType.price > 0 && canUseCredit) {
        await tx.client.update({
          where: { id: client.id },
          data: {
            credits: {
              decrement: 1,
            },
          },
        })
      }

      return tx.booking.create({
        data: {
          studioId: studio.id,
          clientId,
          classSessionId: classSession.id,
          status: "CONFIRMED",
          paidAmount: classSession.classType.price > 0 && canUseCredit ? classSession.classType.price : 0,
        },
        select: {
          id: true,
          status: true,
        },
      })
    })

    try {
      const targetUserIds = Array.from(new Set([studio.ownerId, classSession.teacher.userId]))
      await sendMobilePushNotification({
        studioId: studio.id,
        userIds: targetUserIds,
        category: "BOOKINGS",
        title: "New class booking",
        body: `${client.firstName} ${client.lastName} booked ${classSession.classType.name} (${formatStartTime(classSession.startTime)})`,
        data: {
          type: "mobile_booking_created",
          bookingId: booking.id,
          classSessionId: classSession.id,
          clientId: client.id,
        },
      })
    } catch (pushError) {
      console.error("Mobile booking push failed:", pushError)
    }

    if (autoRenewPackPlanId) {
      const renewalResult = await triggerClientPackAutoRenew(autoRenewPackPlanId)
      if (!renewalResult.renewed) {
        console.error("Mobile class pack auto-renew did not complete:", renewalResult)
      }
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: booking.status,
      usedCredit: classSession.classType.price > 0 && canUseCredit,
    })
  } catch (error) {
    console.error("Mobile schedule book error:", error)
    return NextResponse.json({ error: "Failed to book class" }, { status: 500 })
  }
}
