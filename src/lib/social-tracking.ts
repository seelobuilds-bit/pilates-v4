import crypto from "crypto"
import { db } from "@/lib/db"

const TRACKING_CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,127}$/

function buildPlatformUserId(fingerprint?: string | null) {
  if (fingerprint) {
    const digest = crypto.createHash("sha256").update(fingerprint).digest("hex")
    return `web_${digest.slice(0, 24)}`
  }
  return `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeSocialTrackingCode(raw: unknown) {
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (!TRACKING_CODE_PATTERN.test(trimmed)) return null
  return trimmed
}

export async function trackSocialLinkClick(params: {
  studioId: string
  trackingCode: string | null
  fingerprint?: string | null
}) {
  const trackingCode = normalizeSocialTrackingCode(params.trackingCode)
  if (!trackingCode) return false

  return db.$transaction(async (tx) => {
    const link = await tx.socialMediaTrackingLink.findFirst({
      where: {
        code: trackingCode,
        studioId: params.studioId
      },
      include: {
        flow: {
          select: {
            id: true,
            triggerType: true
          }
        }
      }
    })

    if (!link) return false

    await tx.socialMediaTrackingLink.update({
      where: {
        id: link.id
      },
      data: {
        clicks: {
          increment: 1
        }
      }
    })

    if (link.flow) {
      const now = new Date()
      await tx.socialMediaFlow.updateMany({
        where: {
          id: link.flow.id
        },
        data: {
          totalTriggered: {
            increment: 1
          },
          totalResponded: {
            increment: 1
          }
        }
      })

      await tx.socialMediaFlowEvent.create({
        data: {
          flowId: link.flow.id,
          platformUserId: buildPlatformUserId(params.fingerprint),
          triggerType: link.flow.triggerType,
          responseSent: true,
          responseAt: now,
          clickedLink: true,
          clickedAt: now
        }
      })
    }

    return true
  })
}

export async function trackSocialLinkConversion(params: {
  studioId: string
  trackingCode: string | null
  bookingId: string
  revenue?: number
  fingerprint?: string | null
}) {
  const trackingCode = normalizeSocialTrackingCode(params.trackingCode)
  if (!trackingCode) return false

  const revenue = Number.isFinite(params.revenue) ? Math.max(0, params.revenue || 0) : 0

  return db.$transaction(async (tx) => {
    const link = await tx.socialMediaTrackingLink.findFirst({
      where: {
        code: trackingCode,
        studioId: params.studioId
      },
      include: {
        flow: {
          select: {
            id: true,
            triggerType: true
          }
        }
      }
    })

    if (!link) return false

    await tx.socialMediaTrackingLink.update({
      where: {
        id: link.id
      },
      data: {
        conversions: {
          increment: 1
        },
        revenue: {
          increment: revenue
        }
      }
    })

    if (link.flow) {
      const now = new Date()
      await tx.socialMediaFlow.updateMany({
        where: {
          id: link.flow.id
        },
        data: {
          totalBooked: {
            increment: 1
          }
        }
      })

      const existingConversionEvent = await tx.socialMediaFlowEvent.findFirst({
        where: {
          flowId: link.flow.id,
          bookingId: params.bookingId
        },
        select: {
          id: true
        }
      })

      if (existingConversionEvent) {
        await tx.socialMediaFlowEvent.update({
          where: {
            id: existingConversionEvent.id
          },
          data: {
            converted: true,
            convertedAt: now,
            bookingId: params.bookingId,
            clickedLink: true,
            clickedAt: now
          }
        })
      } else {
        await tx.socialMediaFlowEvent.create({
          data: {
            flowId: link.flow.id,
            platformUserId: buildPlatformUserId(params.fingerprint || params.bookingId),
            triggerType: link.flow.triggerType,
            responseSent: true,
            responseAt: now,
            clickedLink: true,
            clickedAt: now,
            converted: true,
            convertedAt: now,
            bookingId: params.bookingId
          }
        })
      }
    }

    return true
  })
}
