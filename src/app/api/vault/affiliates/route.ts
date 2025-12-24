import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// Generate unique affiliate code
function generateAffiliateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// GET - Fetch affiliate links and stats
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  
  const courseId = searchParams.get("courseId")
  const myLinks = searchParams.get("myLinks")

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const where: Record<string, unknown> = {}

    // Teacher viewing their own links
    if (myLinks === "true" && session.user.teacherId) {
      where.teacherId = session.user.teacherId
    }

    // Filter by course
    if (courseId) {
      where.courseId = courseId
    }

    // Studio viewing all links for their courses
    if (session.user.studioId && !myLinks) {
      where.course = { studioId: session.user.studioId }
    }

    const affiliateLinks = await db.vaultAffiliateLink.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true, price: true, affiliateCommission: true }
        },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        sales: {
          orderBy: { createdAt: "desc" },
          take: 10
        },
        _count: {
          select: { enrollments: true, sales: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Calculate overall stats
    const stats = {
      totalLinks: affiliateLinks.length,
      totalClicks: affiliateLinks.reduce((sum, l) => sum + l.clicks, 0),
      totalConversions: affiliateLinks.reduce((sum, l) => sum + l.conversions, 0),
      totalEarnings: affiliateLinks.reduce((sum, l) => sum + l.totalEarnings, 0),
      pendingPayout: 0
    }

    // Calculate pending payout
    if (session.user.teacherId) {
      const pendingSales = await db.vaultAffiliateSale.aggregate({
        where: {
          affiliateLink: { teacherId: session.user.teacherId },
          status: "approved"
        },
        _sum: { commissionAmount: true }
      })
      stats.pendingPayout = pendingSales._sum.commissionAmount || 0
    }

    return NextResponse.json({ affiliateLinks, stats })
  } catch (error) {
    console.error("Failed to fetch affiliate links:", error)
    return NextResponse.json({ error: "Failed to fetch affiliate links" }, { status: 500 })
  }
}

// POST - Create affiliate link
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { courseId, customCommission } = body

    // Check if course exists and allows affiliates
    const course = await db.vaultCourse.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (!course.affiliateEnabled) {
      return NextResponse.json({ error: "Affiliates not enabled for this course" }, { status: 400 })
    }

    // Check if link already exists
    const existing = await db.vaultAffiliateLink.findUnique({
      where: {
        courseId_teacherId: { courseId, teacherId: session.user.teacherId }
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Affiliate link already exists" }, { status: 400 })
    }

    // Generate unique code
    let code = generateAffiliateCode()
    while (await db.vaultAffiliateLink.findUnique({ where: { code } })) {
      code = generateAffiliateCode()
    }

    const affiliateLink = await db.vaultAffiliateLink.create({
      data: {
        code,
        courseId,
        teacherId: session.user.teacherId,
        customCommission
      },
      include: {
        course: {
          select: { id: true, title: true, price: true, affiliateCommission: true }
        }
      }
    })

    return NextResponse.json(affiliateLink)
  } catch (error) {
    console.error("Failed to create affiliate link:", error)
    return NextResponse.json({ error: "Failed to create affiliate link" }, { status: 500 })
  }
}

// PATCH - Track click or update link
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, action, linkId, isActive, customCommission } = body

    // Track click (public action)
    if (action === "click" && code) {
      const link = await db.vaultAffiliateLink.update({
        where: { code },
        data: { clicks: { increment: 1 } }
      })
      return NextResponse.json({ success: true, courseId: link.courseId })
    }

    // Update link (requires auth)
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (linkId) {
      const link = await db.vaultAffiliateLink.findFirst({
        where: {
          id: linkId,
          teacherId: session.user.teacherId || undefined
        }
      })

      if (!link) {
        return NextResponse.json({ error: "Link not found" }, { status: 404 })
      }

      await db.vaultAffiliateLink.update({
        where: { id: linkId },
        data: {
          ...(isActive !== undefined && { isActive }),
          ...(customCommission !== undefined && { customCommission })
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update affiliate link:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

// GET affiliate sales for payouts (studio admin)
export async function PUT(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, saleIds, paymentReference } = body

    if (action === "approveSales") {
      await db.vaultAffiliateSale.updateMany({
        where: {
          id: { in: saleIds },
          affiliateLink: {
            course: { studioId: session.user.studioId }
          },
          status: "pending"
        },
        data: { status: "approved" }
      })

      return NextResponse.json({ success: true })
    }

    if (action === "markPaid") {
      await db.vaultAffiliateSale.updateMany({
        where: {
          id: { in: saleIds },
          affiliateLink: {
            course: { studioId: session.user.studioId }
          },
          status: "approved"
        },
        data: {
          status: "paid",
          paidAt: new Date(),
          paymentReference
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to process sales:", error)
    return NextResponse.json({ error: "Failed to process" }, { status: 500 })
  }
}
