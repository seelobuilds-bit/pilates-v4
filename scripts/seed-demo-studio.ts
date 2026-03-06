import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import bcrypt from "bcryptjs"
import {
  BookingStatus,
  CampaignStatus,
  ContentType,
  DifficultyLevel,
  InvoiceStatus,
  MessageChannel,
  MessageDirection,
  MessageStatus,
  PayRateType,
  PaymentStatus,
  Prisma,
  PrismaClient,
  Role,
  TeacherEngagementType,
  TimeOffRequestStatus,
  TimeOffRequestType,
  VaultAccessType,
  VaultAudience,
  VaultEnrollmentStatus,
  VaultPricingType,
  WebsiteEventType,
} from "@prisma/client"

const prisma = new PrismaClient()

const STUDIO_NAME = "Atelier Current"
const STUDIO_SUBDOMAIN = process.env.DEMO_STUDIO_SUBDOMAIN || "current-demo-admin"
const OWNER_EMAIL = process.env.DEMO_STUDIO_OWNER_EMAIL || "demo@thecurrent.app"
const OWNER_PASSWORD = "CURRENTDemoOwner!2026"
const TEACHER_PASSWORD = "CURRENTDemoTeacher!2026"
const CLIENT_PASSWORD = "CURRENTDemoClient!2026"
const BATCH_ID = "demo-studio-v1"

const LOCATION_SEEDS = [
  {
    name: "Marylebone Studio",
    address: "18 Paddington Street",
    city: "London",
    state: "Greater London",
    zipCode: "W1U 5AS",
    phone: "+442079460100",
  },
  {
    name: "Notting Hill Studio",
    address: "54 Westbourne Grove",
    city: "London",
    state: "Greater London",
    zipCode: "W2 5SH",
    phone: "+442079460101",
  },
  {
    name: "Richmond Studio",
    address: "9 Hill Rise",
    city: "Richmond",
    state: "Greater London",
    zipCode: "TW10 6UQ",
    phone: "+442079460102",
  },
] as const

const CLASS_TYPE_SEEDS = [
  {
    name: "Reformer Foundations",
    description: "Foundational reformer class focused on tempo, control, and consistent progress.",
    duration: 50,
    capacity: 10,
    price: 34,
  },
  {
    name: "Athletic Reformer",
    description: "Dynamic reformer programming for stronger, more athletic clients.",
    duration: 50,
    capacity: 10,
    price: 36,
  },
  {
    name: "Tower Restore",
    description: "Tower-based mobility and restoration class for recovery-driven clients.",
    duration: 45,
    capacity: 8,
    price: 32,
  },
  {
    name: "Mat Strength",
    description: "High-energy mat programming with props and layered progressions.",
    duration: 50,
    capacity: 16,
    price: 24,
  },
  {
    name: "Prenatal Reformer",
    description: "Safe, confidence-building reformer work for prenatal clients.",
    duration: 45,
    capacity: 8,
    price: 34,
  },
  {
    name: "Private Intro Session",
    description: "One-to-one introduction for first-time clients before joining group classes.",
    duration: 55,
    capacity: 1,
    price: 75,
  },
] as const

const TEACHER_SEEDS = [
  {
    firstName: "Amelia",
    lastName: "Ross",
    engagementType: TeacherEngagementType.EMPLOYEE,
    payType: PayRateType.PER_HOUR,
    payRate: 34,
    specialties: ["Reformer Foundations", "Prenatal Reformer"],
  },
  {
    firstName: "Sophie",
    lastName: "Bennett",
    engagementType: TeacherEngagementType.EMPLOYEE,
    payType: PayRateType.PER_CLASS,
    payRate: 31,
    specialties: ["Athletic Reformer", "Mat Strength"],
  },
  {
    firstName: "Freya",
    lastName: "Coleman",
    engagementType: TeacherEngagementType.EMPLOYEE,
    payType: PayRateType.PER_CLASS,
    payRate: 30,
    specialties: ["Tower Restore", "Reformer Foundations"],
  },
  {
    firstName: "Isla",
    lastName: "May",
    engagementType: TeacherEngagementType.CONTRACTOR,
    payType: PayRateType.PER_CLASS,
    payRate: 36,
    specialties: ["Athletic Reformer", "Private Intro Session"],
  },
  {
    firstName: "Martha",
    lastName: "Reid",
    engagementType: TeacherEngagementType.CONTRACTOR,
    payType: PayRateType.PER_CLASS,
    payRate: 33,
    specialties: ["Prenatal Reformer", "Tower Restore"],
  },
  {
    firstName: "Eleanor",
    lastName: "Hart",
    engagementType: TeacherEngagementType.CONTRACTOR,
    payType: PayRateType.PER_CLASS,
    payRate: 32,
    specialties: ["Mat Strength", "Reformer Foundations"],
  },
] as const

const FIRST_NAMES = [
  "Charlotte", "Lucy", "Grace", "Harriet", "Poppy", "Matilda", "Alice", "Eva", "Lila", "Ruby",
  "Mia", "Olivia", "Amelia", "Iris", "Molly", "Anna", "Sienna", "Mabel", "Zara", "Rosie",
  "James", "Harry", "Tom", "Ben", "Oliver", "George", "Max", "Theo", "Jack", "Sam",
  "Finn", "Archie", "Noah", "Henry", "Leo", "Will", "Charlie", "Oscar", "Hugo", "Arthur",
] as const

const LAST_NAMES = [
  "Parker", "Taylor", "Wright", "Morgan", "Hughes", "Murphy", "Johnson", "Bailey", "Cooper", "Kelly",
  "Barnes", "Foster", "Price", "Dawson", "Howard", "Lawson", "Lane", "Brooks", "Ellis", "Hayes",
] as const

const HEALTH_NOTES = [
  "Mild lower-back sensitivity. Prefers slower extension work.",
  "Postnatal returner. Avoids high abdominal pressure.",
  "Left wrist discomfort during extended plank loading.",
  "Recovering from runner's knee. Favors glute med and hip stability work.",
  "No injuries noted. Likes challenge progressions and jumpboard work.",
  "Shoulder instability history. Cue scapular control before overhead positions.",
] as const

const STAFF_NOTES = [
  "Excellent retention candidate. Usually books two weeks in advance.",
  "Responds quickly to SMS reminders and friend-referral offers.",
  "Likely upgrade to a larger pack before month-end.",
  "Prefers early-morning classes and Amelia's sessions.",
  "Great fit for at-home vault subscription follow-up.",
  "Often asks for private sessions after long work travel.",
] as const

const CLASS_NOTES = [
  "Needs confident spring-change cues during transitions.",
  "Watch pelvic alignment in unilateral sequences.",
  "Progressed well with standing balance series last month.",
  "Prefers verbal cues before tactile corrections.",
  "Ready for longer reformer flow blocks and tempo changes.",
] as const

function createRng(seed: string) {
  let state = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    state ^= seed.charCodeAt(i)
    state = Math.imul(state, 16777619)
  }

  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(rng: () => number, values: readonly T[]): T[] {
  const copy = [...values]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function startOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

function sanitizeEmailLocalPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

async function resetExistingDemoStudio() {
  const existingStudio = await prisma.studio.findFirst({
    where: {
      OR: [
        { subdomain: STUDIO_SUBDOMAIN },
        {
          owner: {
            email: OWNER_EMAIL,
          },
        },
      ],
    },
    include: {
      teachers: {
        select: {
          userId: true,
        },
      },
      owner: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!existingStudio) return

  const teacherUserIds = existingStudio.teachers.map((teacher) => teacher.userId)
  const ownerId = existingStudio.owner.id

  await prisma.studio.delete({
    where: { id: existingStudio.id },
  })

  await prisma.user.deleteMany({
    where: {
      id: { in: [ownerId, ...teacherUserIds] },
    },
  })
}

async function ensureClassFlowLibrary(studioId: string) {
  const seeds = [
    {
      name: "Reformer",
      description: "Signature reformer programming, sequencing ideas, and teaching cues.",
      icon: "✨",
      color: "#ef4444",
      contents: [
        { title: "Reformer Strength Ladder", type: ContentType.VIDEO, difficulty: DifficultyLevel.INTERMEDIATE },
        { title: "Cueing The Hundred On Reformer", type: ContentType.ARTICLE, difficulty: DifficultyLevel.BEGINNER },
        { title: "Progressive Footwork Block", type: ContentType.PDF, difficulty: DifficultyLevel.BEGINNER },
        { title: "Advanced Long Stretch Flow", type: ContentType.VIDEO, difficulty: DifficultyLevel.ADVANCED },
      ],
    },
    {
      name: "Mat",
      description: "Mat-based flows, class structures, and prop-driven formats.",
      icon: "📖",
      color: "#0f766e",
      contents: [
        { title: "45-Minute Mat Burner", type: ContentType.VIDEO, difficulty: DifficultyLevel.INTERMEDIATE },
        { title: "Mat Warm-Up Formula", type: ContentType.ARTICLE, difficulty: DifficultyLevel.BEGINNER },
        { title: "Core And Glute Prop Circuit", type: ContentType.PDF, difficulty: DifficultyLevel.INTERMEDIATE },
        { title: "Mat Class Finisher Ideas", type: ContentType.VIDEO, difficulty: DifficultyLevel.BEGINNER },
      ],
    },
    {
      name: "Tower",
      description: "Tower sequences and coaching patterns for smaller-group formats.",
      icon: "🎯",
      color: "#2563eb",
      contents: [
        { title: "Tower Mobility Sequence", type: ContentType.VIDEO, difficulty: DifficultyLevel.BEGINNER },
        { title: "Teaching Push-Through Progressions", type: ContentType.ARTICLE, difficulty: DifficultyLevel.INTERMEDIATE },
        { title: "Tower Restore Flow Sheet", type: ContentType.PDF, difficulty: DifficultyLevel.BEGINNER },
      ],
    },
    {
      name: "Programming",
      description: "Programming systems for attendance, progression, and experience design.",
      icon: "📈",
      color: "#7c3aed",
      contents: [
        { title: "4-Week Attendance Reset", type: ContentType.ARTICLE, difficulty: DifficultyLevel.INTERMEDIATE },
        { title: "Progressive Overload For Pilates Classes", type: ContentType.VIDEO, difficulty: DifficultyLevel.ADVANCED },
        { title: "New Client Teaching Checklist", type: ContentType.PDF, difficulty: DifficultyLevel.BEGINNER },
      ],
    },
  ]

  for (let categoryIndex = 0; categoryIndex < seeds.length; categoryIndex += 1) {
    const categorySeed = seeds[categoryIndex]
    let category = await prisma.classFlowCategory.findFirst({
      where: {
        studioId,
        name: categorySeed.name,
      },
      select: { id: true },
    })

    if (!category) {
      category = await prisma.classFlowCategory.create({
        data: {
          name: categorySeed.name,
          description: categorySeed.description,
          icon: categorySeed.icon,
          color: categorySeed.color,
          order: categoryIndex,
          isActive: true,
          studioId,
        },
        select: { id: true },
      })
    }

    for (let contentIndex = 0; contentIndex < categorySeed.contents.length; contentIndex += 1) {
      const contentSeed = categorySeed.contents[contentIndex]
      const existing = await prisma.classFlowContent.findFirst({
        where: {
          categoryId: category.id,
          title: contentSeed.title,
        },
        select: { id: true },
      })

      if (existing) continue

      await prisma.classFlowContent.create({
        data: {
          categoryId: category.id,
          title: contentSeed.title,
          description: `${contentSeed.title} for CURRENT demo studio teachers.`,
          type: contentSeed.type,
          difficulty: contentSeed.difficulty,
          videoUrl: contentSeed.type === ContentType.VIDEO ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : null,
          pdfUrl: contentSeed.type === ContentType.PDF ? "https://example.com/demo-resource.pdf" : null,
          articleContent:
            contentSeed.type === ContentType.ARTICLE
              ? `${contentSeed.title}\n\nUse this framework to keep cueing sharp, consistent, and commercially strong.`
              : null,
          duration: contentSeed.type === ContentType.VIDEO ? 18 + contentIndex * 4 : null,
          tags: [categorySeed.name.toLowerCase(), "demo", "current"],
          order: contentIndex,
          isPublished: true,
          isFeatured: contentIndex === 0,
        },
      })
    }
  }
}

async function seedWebsiteAnalytics(studioId: string, clientIds: string[]) {
  const rng = createRng(`website:${studioId}`)

  await prisma.websiteAnalyticsConfig.create({
    data: {
      studioId,
      websiteUrl: "https://ateliercurrent.com",
      platform: "custom",
      isEnabled: true,
      trackPageViews: true,
      trackClicks: true,
      trackForms: true,
      trackScrollDepth: true,
      trackOutboundLinks: true,
      conversionGoals: JSON.stringify(["Book class", "Buy intro pack", "Join waitlist"]),
    },
  })

  for (let index = 0; index < 48; index += 1) {
    const firstVisit = new Date(Date.now() - (5 + index) * 24 * 60 * 60 * 1000)
    const converted = index % 4 === 0
    const visitor = await prisma.websiteVisitor.create({
      data: {
        studioId,
        visitorId: `demo-visitor-${index + 1}`,
        firstVisit,
        lastVisit: new Date(firstVisit.getTime() + (3 + (index % 4)) * 60 * 60 * 1000),
        totalVisits: 1 + (index % 5),
        totalPageViews: 3 + (index % 6),
        browser: index % 3 === 0 ? "Safari" : "Chrome",
        os: index % 2 === 0 ? "iOS" : "macOS",
        device: index % 3 === 0 ? "mobile" : "desktop",
        country: "United Kingdom",
        city: index % 3 === 0 ? "Richmond" : "London",
        firstSource: index % 4 === 0 ? "instagram" : index % 3 === 0 ? "google" : "direct",
        firstMedium: index % 4 === 0 ? "social" : index % 3 === 0 ? "organic" : "direct",
        firstCampaign: index % 4 === 0 ? "spring-reformer" : null,
        hasConverted: converted,
        convertedAt: converted ? new Date(firstVisit.getTime() + 2 * 60 * 60 * 1000) : null,
        clientId: converted ? clientIds[index % clientIds.length] : null,
      },
    })

    await prisma.websiteEvent.createMany({
      data: [
        {
          studioId,
          visitorId: visitor.id,
          type: WebsiteEventType.PAGE_VIEW,
          pageUrl: "https://ateliercurrent.com/",
          pageTitle: "Atelier Current | Reformer Pilates in London",
          pagePath: "/",
          utmSource: visitor.firstSource,
          utmMedium: visitor.firstMedium,
          utmCampaign: visitor.firstCampaign,
          createdAt: firstVisit,
        },
        {
          studioId,
          visitorId: visitor.id,
          type: WebsiteEventType.PAGE_VIEW,
          pageUrl: "https://ateliercurrent.com/book",
          pageTitle: "Book A Class",
          pagePath: "/book",
          createdAt: new Date(firstVisit.getTime() + 8 * 60 * 1000),
        },
        {
          studioId,
          visitorId: visitor.id,
          type: converted ? WebsiteEventType.CONVERSION : WebsiteEventType.CLICK,
          pageUrl: "https://ateliercurrent.com/book",
          pageTitle: "Book A Class",
          pagePath: "/book",
          eventName: converted ? "booking_started" : "viewed_pricing",
          elementText: converted ? "Complete Booking" : "View Intro Offer",
          utmSource: visitor.firstSource,
          utmMedium: visitor.firstMedium,
          utmCampaign: visitor.firstCampaign,
          createdAt: new Date(firstVisit.getTime() + (20 + Math.floor(rng() * 60)) * 60 * 1000),
        },
      ],
    })
  }
}

async function seedVault(
  studioId: string,
  ownerId: string,
  teacherIds: string[],
  teacherRows: Array<{ id: string; firstName: string; lastName: string }>,
  clients: Array<{ id: string }>,
) {
  const now = new Date()

  const plans = await Promise.all([
    prisma.vaultSubscriptionPlan.create({
      data: {
        studioId,
        name: "Studio Vault",
        description: "Operations, reporting, hiring, and growth systems for studio owners.",
        audience: VaultAudience.STUDIO_OWNERS,
        monthlyPrice: 149,
        quarterlyPrice: 399,
        yearlyPrice: 1490,
        currency: "GBP",
        includesAllCourses: true,
        includesClasses: false,
        features: ["Owner playbooks", "Weekly Q&A", "Hiring templates", "Launch checklists"],
        isActive: true,
      },
    }),
    prisma.vaultSubscriptionPlan.create({
      data: {
        studioId,
        name: "Teacher Vault",
        description: "Programming, cueing, confidence, and commercial development for instructors.",
        audience: VaultAudience.TEACHERS,
        monthlyPrice: 49,
        quarterlyPrice: 129,
        yearlyPrice: 450,
        currency: "GBP",
        includesAllCourses: true,
        includesClasses: false,
        features: ["New class flows", "Monthly challenges", "Mentor sessions"],
        isActive: true,
      },
    }),
    prisma.vaultSubscriptionPlan.create({
      data: {
        studioId,
        name: "At-Home Vault",
        description: "Client-facing on-demand platform with progressive at-home programming.",
        audience: VaultAudience.CLIENTS,
        monthlyPrice: 29,
        quarterlyPrice: 75,
        yearlyPrice: 260,
        currency: "GBP",
        includesAllCourses: true,
        includesClasses: false,
        features: ["At-home library", "Community chat", "Beginner roadmaps"],
        isActive: true,
      },
    }),
  ])

  const chats = [] as Array<{ id: string; planId: string }>
  for (const plan of plans) {
    chats.push(
      await prisma.vaultSubscriptionChat.create({
        data: {
          planId: plan.id,
          name: `${plan.name} Community`,
          description: `Live chat for ${plan.name.toLowerCase()} members.`,
          isEnabled: true,
        },
      })
    )
  }

  const courseSeeds = [
    {
      title: "Studio Growth Sprint",
      audience: VaultAudience.STUDIO_OWNERS,
      category: "Business Growth",
      price: 249,
      creatorId: teacherIds[0] || null,
      includeInSubscription: true,
    },
    {
      title: "Reformer Programming Lab",
      audience: VaultAudience.TEACHERS,
      category: "Teaching Skills",
      price: 129,
      creatorId: teacherIds[1] || teacherIds[0] || null,
      includeInSubscription: true,
    },
    {
      title: "Client Consistency Blueprint",
      audience: VaultAudience.CLIENTS,
      category: "At-Home",
      price: 59,
      creatorId: teacherIds[2] || teacherIds[0] || null,
      includeInSubscription: true,
    },
    {
      title: "Leadership For Head Coaches",
      audience: VaultAudience.STUDIO_OWNERS,
      category: "Leadership",
      price: 189,
      creatorId: teacherIds[0] || null,
      includeInSubscription: false,
    },
  ]

  const courses = [] as Array<{ id: string; audience: VaultAudience }>

  for (let courseIndex = 0; courseIndex < courseSeeds.length; courseIndex += 1) {
    const seed = courseSeeds[courseIndex]
    const course = await prisma.vaultCourse.create({
      data: {
        studioId,
        creatorId: seed.creatorId,
        title: seed.title,
        slug: `${STUDIO_SUBDOMAIN}-${seed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        subtitle: `${seed.category} system`,
        description: `${seed.title} gives CURRENT demo users a complete, realistic content surface.`,
        thumbnailUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        audience: seed.audience,
        category: seed.category,
        tags: [seed.category.toLowerCase(), "current", "demo"],
        difficulty: courseIndex % 2 === 0 ? "Intermediate" : "Advanced",
        pricingType: VaultPricingType.ONE_TIME,
        price: seed.price,
        currency: "GBP",
        accessType: VaultAccessType.LIFETIME,
        hasLiveEvents: true,
        hasCertificate: courseIndex % 2 === 1,
        affiliateEnabled: true,
        affiliateCommission: 20,
        includeInSubscription: seed.includeInSubscription,
        isPublished: true,
        isFeatured: courseIndex < 2,
        publishedAt: new Date(now.getTime() - (10 - courseIndex) * 24 * 60 * 60 * 1000),
      },
    })

    courses.push({ id: course.id, audience: seed.audience })

    if (seed.creatorId) {
      await prisma.vaultCourseInstructor.create({
        data: {
          courseId: course.id,
          teacherId: seed.creatorId,
          role: "lead",
          bio: `${teacherRows.find((teacher) => teacher.id === seed.creatorId)?.firstName || "Lead"} guides this course.`,
        },
      })
    }

    for (let moduleIndex = 0; moduleIndex < 3; moduleIndex += 1) {
      const vaultModule = await prisma.vaultModule.create({
        data: {
          courseId: course.id,
          title: `Module ${moduleIndex + 1}`,
          description: `${seed.title} module ${moduleIndex + 1}.`,
          order: moduleIndex,
          subscriptionAudience: seed.audience,
          isPublished: true,
        },
      })

      for (let lessonIndex = 0; lessonIndex < 4; lessonIndex += 1) {
        const lesson = await prisma.vaultLesson.create({
          data: {
            moduleId: vaultModule.id,
            title: `Lesson ${lessonIndex + 1}`,
            description: `Practical lesson ${lessonIndex + 1} inside ${seed.title}.`,
            order: lessonIndex,
            contentType: lessonIndex % 3 === 0 ? "pdf" : lessonIndex % 2 === 0 ? "text" : "video",
            videoUrl: lessonIndex % 2 === 1 ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : null,
            videoDuration: lessonIndex % 2 === 1 ? 780 + lessonIndex * 90 : null,
            textContent:
              lessonIndex % 2 === 0
                ? `This is a realistic content block for ${seed.title}, module ${moduleIndex + 1}, lesson ${lessonIndex + 1}.`
                : null,
            pdfUrl: lessonIndex % 3 === 0 ? "https://example.com/demo-vault.pdf" : null,
            isPreview: moduleIndex === 0 && lessonIndex === 0,
            isPublished: true,
          },
        })

        if (lessonIndex === 0) {
          await prisma.vaultLessonResource.create({
            data: {
              lessonId: lesson.id,
              title: "Workbook",
              type: "pdf",
              url: "https://example.com/demo-workbook.pdf",
            },
          })
        }
      }
    }
  }

  const ownerSubscription = await prisma.vaultSubscriber.create({
    data: {
      planId: plans[0].id,
      interval: "yearly",
      status: "active",
      currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      paidAmount: 1490,
      userId: ownerId,
    },
  })

  await prisma.vaultSubscriptionChatMember.create({
    data: {
      chatId: chats[0].id,
      subscriberId: ownerSubscription.id,
      role: "admin",
      notificationsEnabled: true,
      lastReadAt: new Date(),
    },
  })

  const teacherSubscriptions = [] as Array<{ id: string; teacherId: string }>
  for (let index = 0; index < teacherIds.length; index += 1) {
    const subscription = await prisma.vaultSubscriber.create({
      data: {
        planId: plans[1].id,
        interval: "monthly",
        status: "active",
        currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        paidAmount: 49,
        teacherId: teacherIds[index],
      },
    })
    teacherSubscriptions.push({ id: subscription.id, teacherId: teacherIds[index] })
    await prisma.vaultSubscriptionChatMember.create({
      data: {
        chatId: chats[1].id,
        subscriberId: subscription.id,
        role: index === 0 ? "moderator" : "member",
        notificationsEnabled: true,
        lastReadAt: new Date(),
      },
    })
  }

  const clientSubscriptions = [] as string[]
  for (let index = 0; index < Math.min(18, clients.length); index += 1) {
    const subscription = await prisma.vaultSubscriber.create({
      data: {
        planId: plans[2].id,
        interval: "monthly",
        status: index < 14 ? "active" : "cancelled",
        currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        cancelledAt: index < 14 ? null : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        paidAmount: 29,
        clientId: clients[index].id,
      },
    })
    clientSubscriptions.push(subscription.id)
    await prisma.vaultSubscriptionChatMember.create({
      data: {
        chatId: chats[2].id,
        subscriberId: subscription.id,
        role: "member",
        notificationsEnabled: index % 3 !== 0,
        lastReadAt: new Date(now.getTime() - index * 60 * 60 * 1000),
      },
    })
  }

  const enrollments = [] as Array<{ id: string }>
  for (let courseIndex = 0; courseIndex < courses.length; courseIndex += 1) {
    const course = courses[courseIndex]
    if (course.audience === VaultAudience.STUDIO_OWNERS) {
      enrollments.push(
        await prisma.vaultEnrollment.create({
          data: {
            courseId: course.id,
            userId: ownerId,
            status: courseIndex === 0 ? VaultEnrollmentStatus.ACTIVE : VaultEnrollmentStatus.COMPLETED,
            enrolledAt: new Date(now.getTime() - (12 + courseIndex) * 24 * 60 * 60 * 1000),
            completedAt: courseIndex === 0 ? null : new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            progressPercent: courseIndex === 0 ? 64 : 100,
            lessonsCompleted: courseIndex === 0 ? 5 : 12,
            paidAmount: 0,
            paymentMethod: "subscription",
          },
        })
      )
    } else if (course.audience === VaultAudience.TEACHERS) {
      for (let index = 0; index < Math.min(3, teacherIds.length); index += 1) {
        enrollments.push(
          await prisma.vaultEnrollment.create({
            data: {
              courseId: course.id,
              teacherId: teacherIds[index],
              status: index === 0 ? VaultEnrollmentStatus.COMPLETED : VaultEnrollmentStatus.ACTIVE,
              enrolledAt: new Date(now.getTime() - (18 + index) * 24 * 60 * 60 * 1000),
              completedAt: index === 0 ? new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) : null,
              progressPercent: index === 0 ? 100 : 38 + index * 11,
              lessonsCompleted: index === 0 ? 12 : 3 + index,
              paidAmount: 0,
              paymentMethod: "subscription",
            },
          })
        )
      }
    } else {
      for (let index = 0; index < Math.min(10, clients.length); index += 1) {
        enrollments.push(
          await prisma.vaultEnrollment.create({
            data: {
              courseId: course.id,
              clientId: clients[index].id,
              status: index < 3 ? VaultEnrollmentStatus.COMPLETED : VaultEnrollmentStatus.ACTIVE,
              enrolledAt: new Date(now.getTime() - (20 + index) * 24 * 60 * 60 * 1000),
              completedAt: index < 3 ? new Date(now.getTime() - (8 - index) * 24 * 60 * 60 * 1000) : null,
              progressPercent: index < 3 ? 100 : 18 + index * 6,
              lessonsCompleted: index < 3 ? 12 : 2 + index,
              paidAmount: 29,
              paymentMethod: "card",
            },
          })
        )
      }
    }
  }

  const lessons = await prisma.vaultLesson.findMany({
    where: {
      module: {
        course: {
          studioId,
        },
      },
    },
    select: { id: true, moduleId: true },
  })

  for (const enrollment of enrollments.slice(0, 10)) {
    for (const lesson of lessons.slice(0, 6)) {
      await prisma.vaultProgress.create({
        data: {
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          isCompleted: true,
          completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          watchedSeconds: 620,
          lastPosition: 620,
        },
      })
    }
  }

  const teacherReviewSource = teacherIds[0] || null
  if (teacherReviewSource) {
    for (let index = 0; index < Math.min(8, clients.length); index += 1) {
      await prisma.vaultReview.create({
        data: {
          courseId: courses[2].id,
          clientId: clients[index].id,
          rating: 4 + (index % 2),
          content: "Practical, polished, and easy to follow.",
        },
      })
    }
  }

  const chatMembers = await prisma.vaultSubscriptionChatMember.findMany({
    where: {
      chatId: {
        in: chats.map((chat) => chat.id),
      },
    },
    select: {
      id: true,
      chatId: true,
      role: true,
    },
    orderBy: { id: "asc" },
  })

  const membersByChat = new Map<string, Array<{ id: string; role: string }>>()
  for (const member of chatMembers) {
    const current = membersByChat.get(member.chatId) ?? []
    current.push({ id: member.id, role: member.role })
    membersByChat.set(member.chatId, current)
  }

  const pickMember = (chatId: string, index: number) => {
    const members = membersByChat.get(chatId) ?? []
    if (members.length === 0) {
      throw new Error(`No chat members found for chat ${chatId}`)
    }
    return members[index % members.length]!.id
  }

  const ownerChat = chats[0]!
  const teacherChat = chats[1]!
  const clientChat = chats[2]!

  await prisma.vaultSubscriptionChatMessage.createMany({
    data: [
      {
        chatId: ownerChat.id,
        memberId: pickMember(ownerChat.id, 0),
        content: "Weekly ops review: retention is strongest in the Marylebone evening block. Friday 7am is still our weakest class to fill.",
      },
      {
        chatId: ownerChat.id,
        memberId: pickMember(ownerChat.id, 0),
        content: "Action for this week: push the intro-offer follow-up to all new leads who viewed pricing but did not book within 48 hours.",
      },
      {
        chatId: ownerChat.id,
        memberId: pickMember(ownerChat.id, 0),
        content: "The Tower Restore launch page is converting better than expected. Worth extending the campaign for one more week.",
      },
      {
        chatId: teacherChat.id,
        memberId: pickMember(teacherChat.id, 0),
        content: "New reformer challenge idea: finish every class with a standing balance block and compare client confidence after 4 weeks.",
      },
      {
        chatId: teacherChat.id,
        memberId: pickMember(teacherChat.id, 1),
        content: "Tried the shoulder stability flow from the library this morning. Landed really well in the 7am class.",
      },
      {
        chatId: teacherChat.id,
        memberId: pickMember(teacherChat.id, 2),
        content: "Could someone share a stronger prenatal finisher? I want something that still feels athletic without loading the wrong areas.",
      },
      {
        chatId: teacherChat.id,
        memberId: pickMember(teacherChat.id, 0),
        content: "Uploaded a cleaner cueing sequence for jumpboard transitions in Reformer. It should be easier for the team to teach from now.",
      },
      {
        chatId: teacherChat.id,
        memberId: pickMember(teacherChat.id, 3),
        content: "I’m stealing the 3-round glute ladder from today’s programming lab. Clients were obsessed with it.",
      },
      {
        chatId: teacherChat.id,
        memberId: pickMember(teacherChat.id, 1),
        content: "Reminder: film one reel after your best-attended class this week and drop it into the growth thread for feedback.",
      },
      {
        chatId: clientChat.id,
        memberId: pickMember(clientChat.id, 0),
        content: "Loved the shoulder mobility lesson from this week’s drop. It made my desk posture feel way better.",
      },
      {
        chatId: clientChat.id,
        memberId: pickMember(clientChat.id, 1),
        content: "Has anyone tried pairing the at-home mat core session with the Sunday restore class? Great combo.",
      },
      {
        chatId: clientChat.id,
        memberId: pickMember(clientChat.id, 2),
        content: "Finished the beginner roadmap today. The pacing was perfect and I actually feel confident booking intermediate now.",
      },
      {
        chatId: clientChat.id,
        memberId: pickMember(clientChat.id, 3),
        content: "Request for next month: more 20-minute travel-friendly sequences please.",
      },
      {
        chatId: clientChat.id,
        memberId: pickMember(clientChat.id, 4),
        content: "The hip opener mini-session has become my pre-run ritual. Would love more like that.",
      },
      {
        chatId: clientChat.id,
        memberId: pickMember(clientChat.id, 5),
        content: "Question for the team: which at-home lesson pairs best with Tower Restore when my lower back is tight?",
      },
    ],
  })
}

async function main() {
  await resetExistingDemoStudio()

  const rng = createRng(`demo:${STUDIO_SUBDOMAIN}`)
  const ownerHash = await bcrypt.hash(OWNER_PASSWORD, 10)
  const teacherHash = await bcrypt.hash(TEACHER_PASSWORD, 10)
  const clientHash = await bcrypt.hash(CLIENT_PASSWORD, 10)

  const owner = await prisma.user.create({
    data: {
      email: OWNER_EMAIL,
      password: ownerHash,
      firstName: "Demo",
      lastName: "Owner",
      role: Role.OWNER,
    },
  })

  const studio = await prisma.studio.create({
    data: {
      name: STUDIO_NAME,
      subdomain: STUDIO_SUBDOMAIN,
      ownerId: owner.id,
      primaryColor: "#E3120B",
      stripeCurrency: "gbp",
      country: "UK",
      invoicesEnabled: true,
      employeesEnabled: true,
      timeOffEnabled: true,
      requiresClassSwapApproval: true,
    },
  })

  await ensureClassFlowLibrary(studio.id)

  await prisma.studioEmailConfig.create({
    data: {
      studioId: studio.id,
      fromName: STUDIO_NAME,
      fromEmail: "hello",
      replyToEmail: "support@demo.com",
      domain: "demo.com",
      domainStatus: "verified",
      useFallback: false,
      verifiedAt: new Date(),
    },
  })

  await prisma.studioSmsConfig.create({
    data: {
      studioId: studio.id,
      provider: "twilio",
      fromNumber: "+447700900100",
      isVerified: true,
      verifiedAt: new Date(),
      monthlyLimit: 12000,
      currentMonthUsage: 684,
    },
  })

  const locations = await Promise.all(
    LOCATION_SEEDS.map((location) =>
      prisma.location.create({
        data: {
          ...location,
          studioId: studio.id,
        },
      })
    )
  )

  const classTypes = await Promise.all(
    CLASS_TYPE_SEEDS.map((classType) =>
      prisma.classType.create({
        data: {
          ...classType,
          studioId: studio.id,
        },
      })
    )
  )

  const teacherRows: Array<{ id: string; userId: string; firstName: string; lastName: string; email: string; engagementType: TeacherEngagementType }> = []

  for (const teacher of TEACHER_SEEDS) {
    const user = await prisma.user.create({
      data: {
        email: `${sanitizeEmailLocalPart(`${teacher.firstName}.${teacher.lastName}`)}@demo.com`,
        password: teacherHash,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: Role.TEACHER,
      },
    })

    const teacherRow = await prisma.teacher.create({
      data: {
        userId: user.id,
        studioId: studio.id,
        bio: `${teacher.firstName} leads ${teacher.specialties.join(" and ").toLowerCase()} sessions for ${STUDIO_NAME}.`,
        specialties: [...teacher.specialties],
        engagementType: teacher.engagementType,
      },
    })

    await prisma.teacherPayRate.create({
      data: {
        teacherId: teacherRow.id,
        type: teacher.payType,
        rate: teacher.payRate,
        currency: "GBP",
      },
    })

    teacherRows.push({
      id: teacherRow.id,
      userId: user.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: user.email,
      engagementType: teacher.engagementType,
    })
  }

  const clients: Array<{ id: string; firstName: string; lastName: string; email: string; phone: string }> = []
  for (let index = 0; index < 64; index += 1) {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]
    const lastName = LAST_NAMES[Math.floor(index / 2) % LAST_NAMES.length]
    const client = await prisma.client.create({
      data: {
        studioId: studio.id,
        email: `${sanitizeEmailLocalPart(`${firstName}.${lastName}`)}${index + 1}@demo.com`,
        password: clientHash,
        firstName,
        lastName,
        phone: `+4475${String(10000000 + index * 173).slice(0, 8)}`,
        healthIssues: HEALTH_NOTES[index % HEALTH_NOTES.length],
        classNotes: CLASS_NOTES[index % CLASS_NOTES.length],
        staffNotes: STAFF_NOTES[index % STAFF_NOTES.length],
        credits: index % 5 === 0 ? 8 : index % 3 === 0 ? 3 : 0,
        stripeCustomerId: `cus_${randomUUID().replace(/-/g, "").slice(0, 18)}`,
        createdAt: new Date(Date.now() - (12 + index * 2) * 24 * 60 * 60 * 1000),
      },
    })
    clients.push({
      id: client.id,
      firstName,
      lastName,
      email: client.email,
      phone: client.phone || "",
    })
  }

  const today = startOfDay(new Date())
  const historyDays = 120
  const futureDays = 180
  const scheduleTemplate: Record<number, Array<{ hour: number; minute: number; location: number; classType: number; teacher: number }>> = {
    1: [
      { hour: 6, minute: 30, location: 0, classType: 0, teacher: 0 },
      { hour: 12, minute: 15, location: 1, classType: 3, teacher: 1 },
      { hour: 18, minute: 0, location: 0, classType: 1, teacher: 3 },
      { hour: 19, minute: 15, location: 2, classType: 2, teacher: 2 },
    ],
    2: [
      { hour: 7, minute: 0, location: 1, classType: 0, teacher: 4 },
      { hour: 9, minute: 30, location: 2, classType: 5, teacher: 3 },
      { hour: 17, minute: 45, location: 0, classType: 1, teacher: 1 },
      { hour: 19, minute: 0, location: 1, classType: 3, teacher: 5 },
    ],
    3: [
      { hour: 6, minute: 30, location: 0, classType: 0, teacher: 0 },
      { hour: 10, minute: 0, location: 2, classType: 2, teacher: 2 },
      { hour: 18, minute: 30, location: 1, classType: 1, teacher: 4 },
      { hour: 19, minute: 30, location: 0, classType: 3, teacher: 5 },
    ],
    4: [
      { hour: 7, minute: 15, location: 1, classType: 0, teacher: 1 },
      { hour: 12, minute: 30, location: 0, classType: 5, teacher: 3 },
      { hour: 18, minute: 0, location: 2, classType: 1, teacher: 0 },
      { hour: 19, minute: 15, location: 1, classType: 4, teacher: 4 },
    ],
    5: [
      { hour: 6, minute: 30, location: 0, classType: 0, teacher: 2 },
      { hour: 9, minute: 0, location: 2, classType: 5, teacher: 3 },
      { hour: 17, minute: 30, location: 0, classType: 1, teacher: 1 },
      { hour: 18, minute: 45, location: 1, classType: 3, teacher: 5 },
    ],
    6: [
      { hour: 8, minute: 30, location: 0, classType: 0, teacher: 4 },
      { hour: 9, minute: 45, location: 1, classType: 1, teacher: 0 },
      { hour: 11, minute: 0, location: 2, classType: 2, teacher: 2 },
    ],
  }

  const contractorTeacherIds = teacherRows.filter((teacher) => teacher.engagementType === TeacherEngagementType.CONTRACTOR).map((teacher) => teacher.id)
  const employeeTeacherIds = teacherRows.filter((teacher) => teacher.engagementType === TeacherEngagementType.EMPLOYEE).map((teacher) => teacher.id)
  const classSessionRows: Prisma.ClassSessionCreateManyInput[] = []
  const paymentRows: Prisma.PaymentCreateManyInput[] = []
  const bookingRows: Prisma.BookingCreateManyInput[] = []

  for (let dayOffset = -historyDays; dayOffset <= futureDays; dayOffset += 1) {
    const day = new Date(today)
    day.setDate(day.getDate() + dayOffset)
    const dayOfWeek = day.getDay()
    const template = scheduleTemplate[dayOfWeek]
    if (!template) continue

    for (const slot of template) {
      const classType = classTypes[slot.classType]
      const location = locations[slot.location]
      const teacher = teacherRows[slot.teacher]
      const startTime = new Date(day)
      startTime.setHours(slot.hour, slot.minute, 0, 0)
      const endTime = new Date(startTime.getTime() + classType.duration * 60 * 1000)
      const sessionId = `demo_session_${randomUUID().replace(/-/g, "")}`
      classSessionRows.push({
        id: sessionId,
        studioId: studio.id,
        classTypeId: classType.id,
        teacherId: teacher.id,
        locationId: location.id,
        startTime,
        endTime,
        capacity: classType.capacity,
        notes: `${classType.name} at ${location.name}`,
        recurringGroupId: `${STUDIO_SUBDOMAIN}:${slot.location}:${slot.classType}:${slot.hour}:${slot.minute}`,
        createdAt: startTime,
        updatedAt: startTime,
      })

      const isPast = startTime.getTime() < Date.now()
      const capacityFloor = classType.capacity > 1 ? 2 : 1
      const desiredOccupancy = classType.capacity === 1
        ? 1
        : isPast
          ? Math.max(capacityFloor, Math.min(classType.capacity - 1, Math.round(classType.capacity * (0.58 + rng() * 0.26))))
          : Math.max(capacityFloor, Math.min(classType.capacity - 1, Math.round(classType.capacity * (0.34 + rng() * 0.24))))

      const selectedClients = shuffle(rng, clients).slice(0, desiredOccupancy)

      for (const client of selectedClients) {
        const roll = rng()
        let status: BookingStatus
        if (isPast) {
          if (roll < 0.68) status = BookingStatus.COMPLETED
          else if (roll < 0.82) status = BookingStatus.CONFIRMED
          else if (roll < 0.92) status = BookingStatus.CANCELLED
          else status = BookingStatus.NO_SHOW
        } else {
          status = roll < 0.9 ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED
        }

        const bookingCreatedAt = new Date(startTime.getTime() - (10 + Math.floor(rng() * 72)) * 60 * 60 * 1000)
        const safeCreatedAt = bookingCreatedAt.getTime() > Date.now() ? new Date() : bookingCreatedAt
        const shouldCreatePayment =
          status === BookingStatus.CONFIRMED ||
          status === BookingStatus.COMPLETED ||
          status === BookingStatus.NO_SHOW

        let paymentId: string | null = null
        if (shouldCreatePayment) {
          const amountMinor = Math.round(classType.price * 100)
          const feeMinor = Math.round(amountMinor * 0.029)
          paymentId = `demo_payment_${randomUUID().replace(/-/g, "")}`
          paymentRows.push({
            id: paymentId,
            studioId: studio.id,
            clientId: client.id,
            amount: amountMinor,
            currency: "gbp",
            status: PaymentStatus.SUCCEEDED,
            description: `${classType.name} booking - ${isoDate(startTime)}`,
            stripePaymentIntentId: `pi_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
            stripeChargeId: `ch_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
            stripeFee: feeMinor,
            netAmount: amountMinor - feeMinor,
            createdAt: safeCreatedAt,
            updatedAt: safeCreatedAt,
          })
        }

        bookingRows.push({
          id: `demo_booking_${randomUUID().replace(/-/g, "")}`,
          studioId: studio.id,
          clientId: client.id,
          classSessionId: sessionId,
          status,
          paidAmount: shouldCreatePayment ? classType.price : null,
          paymentId,
          cancelledAt: status === BookingStatus.CANCELLED ? new Date(Math.min(startTime.getTime() - 3 * 60 * 60 * 1000, Date.now())) : null,
          cancellationReason: status === BookingStatus.CANCELLED ? "Schedule conflict" : null,
          notes: status === BookingStatus.NO_SHOW ? "Marked no-show during seeded demo load." : null,
          createdAt: safeCreatedAt,
          updatedAt: safeCreatedAt,
        })
      }
    }
  }

  for (const chunk of chunkArray(classSessionRows, 250)) {
    await prisma.classSession.createMany({ data: chunk })
  }
  for (const chunk of chunkArray(paymentRows, 500)) {
    await prisma.payment.createMany({ data: chunk })
  }
  for (const chunk of chunkArray(bookingRows, 500)) {
    await prisma.booking.createMany({ data: chunk })
  }

  await prisma.clientBookingPlan.createMany({
    data: clients.slice(0, 18).map((client, index) => ({
      studioId: studio.id,
      clientId: client.id,
      kind: index % 3 === 0 ? "CLASS_PACK" : index % 2 === 0 ? "WEEKLY" : "VAULT",
      status: index < 14 ? "active" : "cancelled",
      title: index % 3 === 0 ? "10-Class Pack" : index % 2 === 0 ? "Weekly Reformer Membership" : "At-Home Vault",
      description: index % 3 === 0 ? "10 classes to use flexibly across the schedule." : index % 2 === 0 ? "Weekly auto-renewing membership." : "On-demand home movement subscription.",
      autoRenew: index % 3 !== 1,
      creditsPerRenewal: index % 3 === 0 ? 10 : index % 2 === 0 ? 8 : null,
      pricePerCycle: index % 3 === 0 ? 150 : index % 2 === 0 ? 110 : 29,
      currency: "gbp",
      nextChargeAt: index < 14 ? new Date(Date.now() + (6 + index) * 24 * 60 * 60 * 1000) : null,
      classTypeName: index % 2 === 0 ? "Reformer Foundations" : null,
      teacherName: index % 2 === 0 ? `${teacherRows[0].firstName} ${teacherRows[0].lastName}` : null,
      locationName: index % 2 === 0 ? locations[0].name : null,
      lastRenewedAt: new Date(Date.now() - (3 + index) * 24 * 60 * 60 * 1000),
      cancelledAt: index < 14 ? null : new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    })),
  })

  for (let index = 0; index < 18; index += 1) {
    const client = clients[index]
    const channel = index % 3 === 0 ? MessageChannel.CHAT : index % 2 === 0 ? MessageChannel.SMS : MessageChannel.EMAIL
    const threadId = `s_${studio.id}_c_${client.id}`
    const createdAt = new Date(Date.now() - (index + 2) * 24 * 60 * 60 * 1000)
    await prisma.message.createMany({
      data: [
        {
          studioId: studio.id,
          clientId: client.id,
          threadId,
          channel,
          direction: MessageDirection.OUTBOUND,
          status: MessageStatus.DELIVERED,
          subject: channel === MessageChannel.EMAIL ? "We saved your spot this week" : null,
          body:
            channel === MessageChannel.CHAT
              ? "We held a spot for you in this week’s evening reformer class. Let us know if you want us to move anything."
              : "We have your best-fit class options ready for this week. Reply here if you want us to hold one.",
          fromAddress: `hello@${STUDIO_SUBDOMAIN}.studio`,
          toAddress: client.email,
          fromName: STUDIO_NAME,
          toName: `${client.firstName} ${client.lastName}`,
          sentAt: createdAt,
          deliveredAt: new Date(createdAt.getTime() + 60 * 1000),
          openedAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
          createdAt,
          updatedAt: createdAt,
        },
        {
          studioId: studio.id,
          clientId: client.id,
          threadId,
          channel: MessageChannel.CHAT,
          direction: MessageDirection.INBOUND,
          status: MessageStatus.DELIVERED,
          body: "Perfect, thank you. I can do Thursday at 6:30pm.",
          fromAddress: client.email,
          toAddress: `hello@${STUDIO_SUBDOMAIN}.studio`,
          fromName: `${client.firstName} ${client.lastName}`,
          toName: STUDIO_NAME,
          sentAt: new Date(createdAt.getTime() + 18 * 60 * 1000),
          deliveredAt: new Date(createdAt.getTime() + 19 * 60 * 1000),
          createdAt: new Date(createdAt.getTime() + 18 * 60 * 1000),
          updatedAt: new Date(createdAt.getTime() + 18 * 60 * 1000),
        },
      ],
    })
  }

  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        studioId: studio.id,
        name: "Spring Reformer Reset",
        channel: MessageChannel.EMAIL,
        status: CampaignStatus.SENT,
        subject: "Your next reformer block is ready",
        body: "Book your spring reset block with the best evening classes before they go.",
        targetAll: false,
        totalRecipients: 42,
        sentCount: 42,
        deliveredCount: 41,
        openedCount: 26,
        clickedCount: 11,
        failedCount: 1,
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.campaign.create({
      data: {
        studioId: studio.id,
        name: "Lapsed Client SMS Winback",
        channel: MessageChannel.SMS,
        status: CampaignStatus.SENT,
        body: "We saved a pair of evening classes for returning clients this week. Reply YES for details.",
        targetAll: false,
        totalRecipients: 18,
        sentCount: 18,
        deliveredCount: 18,
        openedCount: 0,
        clickedCount: 0,
        failedCount: 0,
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  await prisma.message.createMany({
    data: clients.slice(0, 12).map((client, index) => ({
      studioId: studio.id,
      clientId: client.id,
      campaignId: campaigns[index % campaigns.length].id,
      channel: campaigns[index % campaigns.length].channel,
      direction: MessageDirection.OUTBOUND,
      status: MessageStatus.DELIVERED,
      subject: campaigns[index % campaigns.length].subject,
      body: campaigns[index % campaigns.length].body,
      fromAddress: "marketing@demo.com",
      toAddress: client.email,
      fromName: STUDIO_NAME,
      toName: `${client.firstName} ${client.lastName}`,
      sentAt: new Date(Date.now() - (3 + index) * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - (3 + index) * 60 * 60 * 1000 + 60 * 1000),
      openedAt: index % 2 === 0 ? new Date(Date.now() - (2 + index) * 60 * 60 * 1000) : null,
      clickedAt: index % 3 === 0 ? new Date(Date.now() - (90 + index) * 60 * 1000) : null,
      threadId: `campaign_${campaigns[index % campaigns.length].id}_${client.id}`,
      createdAt: new Date(Date.now() - (3 + index) * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - (3 + index) * 60 * 60 * 1000),
    })),
  })

  const currentYear = new Date().getFullYear()
  for (const teacher of teacherRows) {
    const isEmployee = teacher.engagementType === TeacherEngagementType.EMPLOYEE
    await prisma.timeOffBalance.create({
      data: {
        studioId: studio.id,
        teacherId: teacher.id,
        year: currentYear,
        annualLeaveEntitledDays: isEmployee ? 20 : 0,
        annualLeaveUsedDays: isEmployee ? 4 + Math.floor(rng() * 4) : 0,
        sickPaidEntitledDays: isEmployee ? 5 : 0,
        sickPaidUsedDays: isEmployee ? Math.floor(rng() * 2) : 0,
        lastRecalculatedAt: new Date(),
      },
    })
  }

  for (let index = 0; index < teacherRows.length; index += 1) {
    const teacher = teacherRows[index]
    const approvedStart = new Date(today)
    approvedStart.setDate(approvedStart.getDate() + 14 + index * 4)
    const approvedEnd = new Date(approvedStart)
    approvedEnd.setDate(approvedEnd.getDate() + 2)
    await prisma.timeOffRequest.create({
      data: {
        studioId: studio.id,
        teacherId: teacher.id,
        type: teacher.engagementType === TeacherEngagementType.EMPLOYEE ? TimeOffRequestType.HOLIDAY : TimeOffRequestType.UNPAID,
        startDate: approvedStart,
        endDate: approvedEnd,
        reasonText: teacher.engagementType === TeacherEngagementType.EMPLOYEE ? "Summer travel booked with family." : "External workshop and private client commitments.",
        status: TimeOffRequestStatus.APPROVED,
        adminNotes: "Approved during seeded demo load.",
        approvedByUserId: owner.id,
        approvedAt: new Date(),
      },
    })

    if (index < 3) {
      const pendingStart = new Date(today)
      pendingStart.setDate(pendingStart.getDate() + 32 + index * 3)
      await prisma.timeOffRequest.create({
        data: {
          studioId: studio.id,
          teacherId: teacher.id,
          type: index === 1 ? TimeOffRequestType.SICK : TimeOffRequestType.HOLIDAY,
          startDate: pendingStart,
          endDate: new Date(pendingStart.getTime() + 24 * 60 * 60 * 1000),
          isHalfDayStart: index === 2,
          reasonText: index === 1 ? "Scheduled minor medical procedure." : "Requested long weekend after intensive block.",
          status: TimeOffRequestStatus.PENDING,
        },
      })
    }
  }

  for (let index = 0; index < employeeTeacherIds.length; index += 1) {
    const teacherId = employeeTeacherIds[index]
    const start = new Date(today)
    start.setDate(start.getDate() + 9 + index * 10)
    start.setHours(12, 0, 0, 0)
    const end = new Date(start)
    end.setHours(16, 0, 0, 0)
    await prisma.teacherBlockedTime.create({
      data: {
        teacherId,
        startTime: start,
        endTime: end,
        reason: "Internal Training: Demo coaching intensive",
        isRecurring: false,
        recurringDays: [],
      },
    })
  }

  for (let index = 0; index < contractorTeacherIds.length; index += 1) {
    const teacherId = contractorTeacherIds[index]
    const taughtClasses = 28 + index * 5
    const rate = TEACHER_SEEDS.find((teacher) => teacherRows.find((row) => row.id === teacherId && row.firstName === teacher.firstName))?.payRate || 32
    const total = taughtClasses * rate
    const periodStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const periodEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
    await prisma.teacherInvoice.create({
      data: {
        studioId: studio.id,
        teacherId,
        invoiceNumber: `DEMO-${String(index + 1).padStart(3, "0")}`,
        status: index === 0 ? InvoiceStatus.PAID : InvoiceStatus.SENT,
        periodStart,
        periodEnd,
        lineItems: JSON.stringify([
          {
            description: "Classes taught",
            quantity: taughtClasses,
            rate,
            amount: total,
          },
        ]),
        subtotal: total,
        tax: 0,
        taxRate: 0,
        total,
        currency: "GBP",
        sentAt: new Date(Date.now() - (12 - index) * 24 * 60 * 60 * 1000),
        paidAt: index === 0 ? new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) : null,
        paidAmount: index === 0 ? total : null,
        paymentMethod: index === 0 ? "bank_transfer" : null,
        paymentReference: index === 0 ? `ref_${randomUUID().replace(/-/g, "").slice(0, 10)}` : null,
        notes: "Seeded contractor invoice for demo studio.",
      },
    })
  }

  const categories = await prisma.classFlowCategory.findMany({
    where: {
      studioId: studio.id,
    },
    include: {
      contents: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  for (const teacher of teacherRows) {
    for (const category of categories.slice(0, 3)) {
      for (const content of category.contents.slice(0, 3)) {
        await prisma.classFlowProgress.create({
          data: {
            studioId: studio.id,
            teacherId: teacher.id,
            contentId: content.id,
            isCompleted: rng() > 0.35,
            completedAt: rng() > 0.35 ? new Date(Date.now() - (2 + Math.floor(rng() * 20)) * 24 * 60 * 60 * 1000) : null,
            progressPercent: 55 + Math.floor(rng() * 45),
            notes: rng() > 0.6 ? "Useful sequencing note captured during demo seed." : null,
          },
        })
      }
    }
  }

  await prisma.trainingRequest.createMany({
    data: [
      {
        studioId: studio.id,
        requestedById: teacherRows[0].id,
        title: "Advanced Reformer Training Day",
        description: "Team wants a stronger progressions workshop for the autumn launch block.",
        trainingType: "teacher-training-request",
        preferredDate1: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        preferredDate2: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: "APPROVED",
        contactName: "Demo Owner",
        contactEmail: OWNER_EMAIL,
        attendeeCount: 6,
        notes: "Approved for HQ-led delivery.",
      },
      {
        studioId: studio.id,
        requestedById: teacherRows[2].id,
        title: "Jumpboard Interval Flow",
        description: "Request for a new class flow block focused on jumpboard sequencing.",
        trainingType: "class-flow-request",
        status: "PENDING",
        contactName: "Demo Owner",
        contactEmail: OWNER_EMAIL,
        attendeeCount: 1,
        notes: "Teacher wants a category add-on before the next launch cycle.",
      },
    ],
  })

  await seedWebsiteAnalytics(studio.id, clients.map((client) => client.id))
  await seedVault(studio.id, owner.id, teacherRows.map((teacher) => teacher.id), teacherRows, clients)

  await prisma.leaderboardEntry.deleteMany({
    where: {
      OR: [
        { studioId: studio.id },
        { teacherId: { in: teacherRows.map((teacher) => teacher.id) } },
      ],
    },
  })

  const batchesDir = join(process.cwd(), "prisma", "synthetic-batches")
  mkdirSync(batchesDir, { recursive: true })
  const manifestPath = join(batchesDir, `${STUDIO_SUBDOMAIN}.json`)
  const loginCsvPath = join(batchesDir, `${STUDIO_SUBDOMAIN}-logins.csv`)

  const loginRows = [
    ["Studio", "Subdomain", "Role", "First Name", "Last Name", "Email", "Password"],
    [STUDIO_NAME, STUDIO_SUBDOMAIN, "OWNER", "Demo", "Owner", OWNER_EMAIL, OWNER_PASSWORD],
    ...teacherRows.map((teacher) => [
      STUDIO_NAME,
      STUDIO_SUBDOMAIN,
      "TEACHER",
      teacher.firstName,
      teacher.lastName,
      teacher.email,
      TEACHER_PASSWORD,
    ]),
    ...clients.slice(0, 20).map((client) => [
      STUDIO_NAME,
      STUDIO_SUBDOMAIN,
      "CLIENT",
      client.firstName,
      client.lastName,
      client.email,
      CLIENT_PASSWORD,
    ]),
  ]

  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        batchId: BATCH_ID,
        studioId: studio.id,
        studioName: STUDIO_NAME,
        subdomain: STUDIO_SUBDOMAIN,
        ownerEmail: OWNER_EMAIL,
        ownerPassword: OWNER_PASSWORD,
        teacherPassword: TEACHER_PASSWORD,
        clientPassword: CLIENT_PASSWORD,
        teachers: teacherRows,
        clients: clients.map((client) => ({
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
        })),
      },
      null,
      2
    )
  )
  writeFileSync(loginCsvPath, loginRows.map((row) => row.join(",")).join("\n"))

  console.log(`Seeded ${STUDIO_NAME} (${STUDIO_SUBDOMAIN})`)
  console.log(`Owner email: ${OWNER_EMAIL}`)
  console.log(`Future class horizon: ${futureDays} days`)
  console.log(`Manifest: ${manifestPath}`)
  console.log(`Logins: ${loginCsvPath}`)
}

main()
  .catch(async (error) => {
    console.error("Demo studio seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
