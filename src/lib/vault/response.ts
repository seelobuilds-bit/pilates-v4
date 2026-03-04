import { summarizeVaultCourseEnrollments, summarizeVaultCourses } from "./analytics"

type MobileStudioSummary = {
  id: string
  name: string
  subdomain: string
  primaryColor: string | null
  currency: string | null
}

type MobileRole = "OWNER" | "TEACHER"

type VaultCourseListRow = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string | null
  thumbnailUrl: string | null
  audience: string
  category: string | null
  difficulty: string | null
  pricingType: string
  price: number | null
  currency: string | null
  isPublished: boolean
  isFeatured: boolean
  includeInSubscription: boolean
  enrollmentCount: number
  averageRating: number | null
  createdAt: Date
  creator: {
    user: {
      firstName: string | null
      lastName: string | null
    }
  } | null
  _count: {
    modules: number
    reviews: number
  }
}

type VaultCourseCategoryRow = { category: string | null }

type VaultCourseEnrollmentRow = {
  id: string
  status: string
  enrolledAt: Date
  expiresAt: Date | null
  completedAt: Date | null
  progressPercent: number | null
  lessonsCompleted: number | null
  lastAccessedAt: Date | null
  paidAmount: number | null
  client: {
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
  teacher: {
    user: {
      firstName: string | null
      lastName: string | null
      email: string | null
    }
  } | null
  user: {
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
}

type VaultCourseDetailRow = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string | null
  thumbnailUrl: string | null
  promoVideoUrl: string | null
  audience: string
  category: string | null
  tags: string[] | null
  difficulty: string | null
  pricingType: string
  price: number | null
  currency: string | null
  subscriptionInterval: string | null
  subscriptionPrice: number | null
  accessType: string
  accessDays: number | null
  dripIntervalDays: number | null
  hasLiveEvents: boolean
  hasCertificate: boolean
  includeInSubscription: boolean
  isPublished: boolean
  isFeatured: boolean
  enrollmentCount: number
  reviewCount: number
  averageRating: number | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  creator: {
    id: string
    user: {
      firstName: string | null
      lastName: string | null
      email: string | null
    }
  } | null
  instructors: {
    id: string
    role: string
    teacher: {
      id: string
      user: {
        firstName: string | null
        lastName: string | null
        email: string | null
      }
    }
  }[]
  modules: {
    id: string
    title: string
    description: string | null
    order: number
    dripDelay: number | null
    subscriptionAudience: string | null
    isPublished: boolean
    _count: {
      lessons: number
    }
    lessons: {
      id: string
      title: string
      order: number
      contentType: string
      isPreview: boolean
      isPublished: boolean
      videoDuration: number | null
      _count: {
        resources: number
      }
    }[]
  }[]
  enrollments: VaultCourseEnrollmentRow[]
}

function firstName(value: string | null | undefined) {
  return value || ""
}

function lastName(value: string | null | undefined) {
  return value || ""
}

function toParticipant(enrollment: VaultCourseEnrollmentRow) {
  if (enrollment.client) {
    return {
      type: "CLIENT" as const,
      firstName: firstName(enrollment.client.firstName),
      lastName: lastName(enrollment.client.lastName),
      email: enrollment.client.email || "",
    }
  }

  if (enrollment.teacher?.user) {
    return {
      type: "TEACHER" as const,
      firstName: firstName(enrollment.teacher.user.firstName),
      lastName: lastName(enrollment.teacher.user.lastName),
      email: enrollment.teacher.user.email || "",
    }
  }

  if (enrollment.user) {
    return {
      type: "OWNER" as const,
      firstName: firstName(enrollment.user.firstName),
      lastName: lastName(enrollment.user.lastName),
      email: enrollment.user.email || "",
    }
  }

  return {
    type: "UNKNOWN" as const,
    firstName: "Unknown",
    lastName: "User",
    email: "",
  }
}

export function buildMobileVaultCatalogResponse(args: {
  role: MobileRole
  studio: MobileStudioSummary
  filters: {
    search: string
    audience: string
    status: "all" | "published" | "draft"
  }
  categories: VaultCourseCategoryRow[]
  courses: VaultCourseListRow[]
}) {
  const courseStats = summarizeVaultCourses(args.courses)

  return {
    role: args.role,
    studio: args.studio,
    filters: args.filters,
    categories: args.categories
      .map((item) => item.category)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => a.localeCompare(b)),
    courses: args.courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      audience: course.audience,
      category: course.category,
      difficulty: course.difficulty,
      pricingType: course.pricingType,
      price: course.price,
      currency: course.currency,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured,
      includeInSubscription: course.includeInSubscription,
      enrollmentCount: course.enrollmentCount,
      averageRating: course.averageRating,
      moduleCount: course._count.modules,
      reviewCount: course._count.reviews,
      createdAt: course.createdAt.toISOString(),
      creatorName: course.creator?.user
        ? `${firstName(course.creator.user.firstName)} ${lastName(course.creator.user.lastName)}`.trim() || null
        : null,
    })),
    stats: {
      totalCourses: courseStats.totalCourses,
      publishedCourses: courseStats.publishedCourses,
      featuredCourses: courseStats.featuredCourses,
      totalEnrollments: courseStats.totalEnrollments,
    },
  }
}

export function buildMobileVaultCourseDetailResponse(args: {
  role: MobileRole
  studio: MobileStudioSummary
  course: VaultCourseDetailRow
}) {
  const enrollmentStats = summarizeVaultCourseEnrollments(args.course.enrollments)
  const totalLessons = args.course.modules.reduce((sum, module) => sum + module._count.lessons, 0)
  const publishedModules = args.course.modules.filter((module) => module.isPublished).length
  const publishedLessons = args.course.modules.reduce(
    (sum, module) => sum + module.lessons.filter((lesson) => lesson.isPublished).length,
    0
  )

  return {
    role: args.role,
    studio: args.studio,
    course: {
      id: args.course.id,
      title: args.course.title,
      slug: args.course.slug,
      subtitle: args.course.subtitle,
      description: args.course.description,
      thumbnailUrl: args.course.thumbnailUrl,
      promoVideoUrl: args.course.promoVideoUrl,
      audience: args.course.audience,
      category: args.course.category,
      tags: args.course.tags || [],
      difficulty: args.course.difficulty,
      pricingType: args.course.pricingType,
      price: args.course.price,
      currency: args.course.currency,
      subscriptionInterval: args.course.subscriptionInterval,
      subscriptionPrice: args.course.subscriptionPrice,
      accessType: args.course.accessType,
      accessDays: args.course.accessDays,
      dripIntervalDays: args.course.dripIntervalDays,
      hasLiveEvents: args.course.hasLiveEvents,
      hasCertificate: args.course.hasCertificate,
      includeInSubscription: args.course.includeInSubscription,
      isPublished: args.course.isPublished,
      isFeatured: args.course.isFeatured,
      enrollmentCount: args.course.enrollmentCount,
      reviewCount: args.course.reviewCount,
      averageRating: args.course.averageRating,
      createdAt: args.course.createdAt.toISOString(),
      updatedAt: args.course.updatedAt.toISOString(),
      publishedAt: args.course.publishedAt?.toISOString() || null,
      creator: args.course.creator
        ? {
            id: args.course.creator.id,
            firstName: firstName(args.course.creator.user.firstName),
            lastName: lastName(args.course.creator.user.lastName),
            email: args.course.creator.user.email || "",
          }
        : null,
    },
    stats: {
      totalEnrollments: enrollmentStats.totalEnrollments,
      activeEnrollments: enrollmentStats.activeEnrollments,
      completedEnrollments: enrollmentStats.completedEnrollments,
      completionRate: enrollmentStats.completionRate,
      averageProgress: enrollmentStats.averageProgress,
      totalModules: args.course.modules.length,
      publishedModules,
      totalLessons,
      publishedLessons,
    },
    instructors: args.course.instructors.map((instructor) => ({
      id: instructor.id,
      role: instructor.role,
      teacher: {
        id: instructor.teacher.id,
        firstName: firstName(instructor.teacher.user.firstName),
        lastName: lastName(instructor.teacher.user.lastName),
        email: instructor.teacher.user.email || "",
      },
    })),
    modules: args.course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      order: module.order,
      dripDelay: module.dripDelay,
      subscriptionAudience: module.subscriptionAudience,
      isPublished: module.isPublished,
      lessonCount: module._count.lessons,
      publishedLessons: module.lessons.filter((lesson) => lesson.isPublished).length,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        contentType: lesson.contentType,
        isPreview: lesson.isPreview,
        isPublished: lesson.isPublished,
        videoDuration: lesson.videoDuration,
        resourceCount: lesson._count.resources,
      })),
    })),
    recentEnrollments: args.course.enrollments.slice(0, 50).map((enrollment) => ({
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      expiresAt: enrollment.expiresAt?.toISOString() || null,
      completedAt: enrollment.completedAt?.toISOString() || null,
      progressPercent: enrollment.progressPercent,
      lessonsCompleted: enrollment.lessonsCompleted,
      lastAccessedAt: enrollment.lastAccessedAt?.toISOString() || null,
      paidAmount: enrollment.paidAmount,
      participant: toParticipant(enrollment),
    })),
  }
}
