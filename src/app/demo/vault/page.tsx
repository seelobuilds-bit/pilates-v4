import { db } from "@/lib/db"
import { VaultView } from "@/components/studio"
import type { VaultData, Course, SubscriptionPlan, Enrollment, AffiliateLink } from "@/components/studio"

// Demo uses data from a real studio (Zenith) to always reflect the current state
const DEMO_STUDIO_SUBDOMAIN = process.env.DEMO_STUDIO_SUBDOMAIN || "zenith"

export default async function DemoVaultPage() {
  // Find the demo studio
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  const studioId = studio.id

  // Fetch all vault data
  const [
    courses,
    subscriptionPlans,
    enrollments,
    affiliateLinks
  ] = await Promise.all([
    // Fetch courses
    db.vaultCourse.findMany({
      where: { studioId },
      include: {
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    // Fetch subscription plans with community chat
    db.vaultSubscriptionPlan.findMany({
      where: { studioId },
      include: {
        communityChat: {
          select: { id: true, isEnabled: true }
        },
        _count: {
          select: { subscribers: true }
        }
      }
    }),
    // Fetch recent enrollments
    db.vaultEnrollment.findMany({
      where: {
        course: { studioId }
      },
      include: {
        course: { select: { id: true, title: true, price: true } },
        client: { select: { firstName: true, lastName: true } }
      },
      orderBy: { enrolledAt: "desc" },
      take: 20
    }),
    // Fetch affiliate links
    db.vaultAffiliateLink.findMany({
      where: {
        course: { studioId }
      },
      include: {
        course: { select: { title: true } },
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { totalEarnings: "desc" },
      take: 20
    })
  ])

  // Calculate stats
  const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0)
  const publishedCourses = courses.filter(c => c.isPublished).length
  const activeStudents = await db.vaultEnrollment.count({
    where: {
      course: { studioId },
      status: "ACTIVE"
    }
  })

  // Calculate total revenue (sum of all enrollment payments)
  const revenueAgg = await db.vaultEnrollment.aggregate({
    where: {
      course: { studioId },
      paidAmount: { not: null }
    },
    _sum: {
      paidAmount: true
    }
  })
  const totalRevenue = revenueAgg._sum.paidAmount || 0

  // Get unique categories
  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))] as string[]

  // Get courses that are included in subscription for each plan
  const subscriptionCourses = courses.filter(c => c.includeInSubscription)

  const vaultData: VaultData = {
    stats: {
      totalCourses: courses.length,
      publishedCourses,
      totalEnrollments,
      totalRevenue: Number(totalRevenue),
      activeStudents
    },
    courses: courses.map((c): Course => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      subtitle: c.subtitle,
      description: c.description || "",
      thumbnailUrl: c.thumbnailUrl,
      audience: c.audience as "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS" | "ALL",
      category: c.category,
      difficulty: c.difficulty,
      pricingType: c.pricingType as "FREE" | "ONE_TIME" | "SUBSCRIPTION" | "BUNDLE",
      price: Number(c.price),
      subscriptionPrice: c.subscriptionPrice ? Number(c.subscriptionPrice) : null,
      subscriptionInterval: c.subscriptionInterval,
      isPublished: c.isPublished,
      isFeatured: c.isFeatured,
      includeInSubscription: c.includeInSubscription,
      enrollmentCount: c.enrollmentCount,
      averageRating: Number(c.averageRating),
      _count: c._count
    })),
    subscriptionPlans: subscriptionPlans.map((p): SubscriptionPlan => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      audience: p.audience as "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS",
      monthlyPrice: Number(p.monthlyPrice),
      quarterlyPrice: p.quarterlyPrice ? Number(p.quarterlyPrice) : null,
      yearlyPrice: p.yearlyPrice ? Number(p.yearlyPrice) : null,
      features: (p.features as string[]) || [],
      includesClasses: p.includesClasses,
      classCreditsPerMonth: p.classCreditsPerMonth,
      isActive: p.isActive,
      activeSubscribers: p._count.subscribers,
      // Get courses that match this plan's audience and are included in subscription
      includedCourses: subscriptionCourses
        .filter(c => c.audience === p.audience || c.audience === "ALL")
        .map(c => ({ id: c.id, title: c.title })),
      communityChat: p.communityChat
    })),
    enrollments: enrollments
      .filter(e => e.client) // Only include enrollments with valid client
      .map((e): Enrollment => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        progressPercent: e.progressPercent,
        paidAmount: e.paidAmount ? Number(e.paidAmount) : null,
        course: {
          id: e.course.id,
          title: e.course.title,
          price: Number(e.course.price)
        },
        clientName: e.client ? `${e.client.firstName} ${e.client.lastName}` : "Unknown"
      })),
    affiliateLinks: affiliateLinks.map((l): AffiliateLink => ({
      id: l.id,
      code: l.code,
      clicks: l.clicks,
      conversions: l.conversions,
      totalEarnings: Number(l.totalEarnings),
      teacherName: `${l.teacher.user.firstName} ${l.teacher.user.lastName}`,
      courseName: l.course.title
    })),
    categories
  }

  return <VaultView data={vaultData} linkPrefix="/demo" />
}




