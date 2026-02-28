import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientTokenFromRequest } from "@/lib/client-auth"
import { upsertClientWeeklyBookingPlan } from "@/lib/client-booking-plans"
import { getStripe } from "@/lib/stripe"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  try {
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientTokenFromRequest(request, subdomain)
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const client = await db.client.findUnique({
      where: { id: decoded.clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    if (studio.stripeAccountId && client.stripeCustomerId) {
      try {
        const stripe = getStripe()
        const weeklySubscriptions = await stripe.subscriptions.list(
          {
            customer: client.stripeCustomerId,
            status: "all",
            limit: 100,
          },
          {
            stripeAccount: studio.stripeAccountId,
          }
        )

        for (const subscription of weeklySubscriptions.data) {
          if (
            !["active", "trialing", "past_due", "unpaid", "incomplete"].includes(subscription.status) ||
            subscription.metadata?.type !== "weekly_class_booking"
          ) {
            continue
          }

          const classSession = subscription.metadata?.classSessionId
            ? await db.classSession.findFirst({
                where: {
                  id: subscription.metadata.classSessionId,
                  studioId: studio.id,
                },
                include: {
                  classType: true,
                  teacher: { include: { user: true } },
                  location: true,
                },
              })
            : null

          const firstItem = subscription.items.data[0]
          const unitAmount = firstItem?.price?.unit_amount ?? 0
          const currentPeriodEnd =
            (subscription as { current_period_end?: number }).current_period_end

          await upsertClientWeeklyBookingPlan({
            studioId: studio.id,
            clientId: client.id,
            classTypeName: classSession?.classType.name || subscription.metadata?.classTypeId || "Weekly Subscription",
            teacherName: classSession
              ? `${classSession.teacher.user.firstName} ${classSession.teacher.user.lastName}`
              : "Assigned Teacher",
            locationName: classSession?.location.name || "Studio",
            pricePerCycle: unitAmount / 100,
            currency: subscription.currency || studio.stripeCurrency || "usd",
            stripeSubscriptionId: subscription.id,
            nextChargeAt:
              typeof currentPeriodEnd === "number"
                ? new Date(currentPeriodEnd * 1000)
                : null,
          })
        }
      } catch (stripeSyncError) {
        console.error("Failed to sync weekly class subscriptions:", stripeSyncError)
      }
    }

    // Get client's vault subscriptions
    const now = new Date()
    const [subscriptions, bookingPlans] = await Promise.all([
      db.vaultSubscriber.findMany({
        where: {
          clientId: client.id,
          OR: [
            { status: "active" },
            { status: "cancelled", currentPeriodEnd: { gt: now } },
          ],
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              audience: true,
              monthlyPrice: true,
              yearlyPrice: true,
              features: true,
              description: true,
              communityChat: {
                select: {
                  id: true,
                  isEnabled: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      db.clientBookingPlan.findMany({
        where: {
          clientId: client.id,
          OR: [
            { status: "active" },
            { status: "cancelled" },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ subscriptions, bookingPlans })
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}









