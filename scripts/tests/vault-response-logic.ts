import assert from "node:assert/strict"
import {
  buildMobileVaultCatalogResponse,
  buildMobileVaultCourseDetailResponse,
} from "../../src/lib/vault/response"

function run() {
  const studio = {
    id: "studio_1",
    name: "Studio One",
    subdomain: "studio-one",
    primaryColor: "#111111",
    currency: "USD",
  }

  const catalog = buildMobileVaultCatalogResponse({
    role: "OWNER",
    studio,
    filters: {
      search: "reformer",
      audience: "all",
      status: "published",
    },
    categories: [{ category: "Pilates" }, { category: null }],
    courses: [
      {
        id: "course_1",
        title: "Core Basics",
        slug: "core-basics",
        subtitle: null,
        description: null,
        thumbnailUrl: null,
        audience: "ALL",
        category: "Pilates",
        difficulty: "BEGINNER",
        pricingType: "ONE_TIME",
        price: 49,
        currency: "USD",
        isPublished: true,
        isFeatured: true,
        includeInSubscription: false,
        enrollmentCount: 10,
        averageRating: 4.8,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        creator: {
          user: {
            firstName: "Alex",
            lastName: "Smith",
          },
        },
        _count: {
          modules: 4,
          reviews: 8,
        },
      },
    ],
  })

  assert.equal(catalog.categories.length, 1)
  assert.equal(catalog.stats.totalCourses, 1)
  assert.equal(catalog.stats.totalEnrollments, 10)
  assert.equal(catalog.courses[0].creatorName, "Alex Smith")

  const detail = buildMobileVaultCourseDetailResponse({
    role: "OWNER",
    studio,
    course: {
      id: "course_1",
      title: "Core Basics",
      slug: "core-basics",
      subtitle: null,
      description: null,
      thumbnailUrl: null,
      promoVideoUrl: null,
      audience: "ALL",
      category: "Pilates",
      tags: ["core"],
      difficulty: "BEGINNER",
      pricingType: "ONE_TIME",
      price: 49,
      currency: "USD",
      subscriptionInterval: null,
      subscriptionPrice: null,
      accessType: "LIFETIME",
      accessDays: null,
      dripIntervalDays: null,
      hasLiveEvents: false,
      hasCertificate: false,
      includeInSubscription: false,
      isPublished: true,
      isFeatured: true,
      enrollmentCount: 10,
      reviewCount: 8,
      averageRating: 4.8,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      publishedAt: new Date("2026-03-02T00:00:00.000Z"),
      creator: {
        id: "teacher_1",
        user: {
          firstName: "Alex",
          lastName: "Smith",
          email: "alex@example.com",
        },
      },
      instructors: [
        {
          id: "instructor_1",
          role: "LEAD",
          teacher: {
            id: "teacher_1",
            user: {
              firstName: "Alex",
              lastName: "Smith",
              email: "alex@example.com",
            },
          },
        },
      ],
      modules: [
        {
          id: "module_1",
          title: "Foundations",
          description: null,
          order: 1,
          dripDelay: null,
          subscriptionAudience: null,
          isPublished: true,
          _count: { lessons: 2 },
          lessons: [
            {
              id: "lesson_1",
              title: "Intro",
              order: 1,
              contentType: "VIDEO",
              isPreview: true,
              isPublished: true,
              videoDuration: 300,
              _count: { resources: 1 },
            },
            {
              id: "lesson_2",
              title: "Warmup",
              order: 2,
              contentType: "VIDEO",
              isPreview: false,
              isPublished: false,
              videoDuration: 200,
              _count: { resources: 0 },
            },
          ],
        },
      ],
      enrollments: [
        {
          id: "enrollment_1",
          status: "ACTIVE",
          enrolledAt: new Date("2026-03-03T00:00:00.000Z"),
          expiresAt: null,
          completedAt: null,
          progressPercent: 50,
          lessonsCompleted: 1,
          lastAccessedAt: null,
          paidAmount: 49,
          client: {
            firstName: "Jamie",
            lastName: "Doe",
            email: "jamie@example.com",
          },
          teacher: null,
          user: null,
        },
      ],
    },
  })

  assert.equal(detail.stats.totalEnrollments, 1)
  assert.equal(detail.stats.totalLessons, 2)
  assert.equal(detail.stats.publishedLessons, 1)
  assert.equal(detail.modules[0].publishedLessons, 1)
  assert.equal(detail.recentEnrollments[0].participant.type, "CLIENT")

  console.log("Vault response logic passed")
}

run()
