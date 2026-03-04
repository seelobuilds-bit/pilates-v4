import assert from "node:assert/strict"
import {
  articlePreview,
  buildMobileClassFlowDetailResponse,
  buildMobileClassFlowsCatalogResponse,
} from "../../src/lib/class-flows/response"

function run() {
  const studio = {
    id: "studio_1",
    name: "Studio One",
    subdomain: "studio-one",
    primaryColor: "#111111",
    currency: "USD",
  }

  const catalog = buildMobileClassFlowsCatalogResponse({
    role: "TEACHER",
    studio,
    filters: {
      categoryId: null,
      type: "VIDEO",
      difficulty: null,
      featuredOnly: false,
      search: "core",
    },
    categories: [
      {
        id: "cat_1",
        name: "Reformer",
        description: null,
        icon: "dumbbell",
        color: "#7ED321",
        contents: [
          {
            id: "content_1",
            title: "Core Flow",
            description: "Focus on core",
            type: "VIDEO",
            difficulty: "BEGINNER",
            duration: 45,
            videoUrl: "https://example.com/video",
            pdfUrl: null,
            thumbnailUrl: null,
            isFeatured: true,
            tags: ["core"],
          },
        ],
      },
      {
        id: "cat_empty",
        name: "Empty",
        description: null,
        icon: null,
        color: null,
        contents: [],
      },
    ],
    featured: [
      {
        id: "content_1",
        title: "Core Flow",
        description: "Focus on core",
        type: "VIDEO",
        difficulty: "BEGINNER",
        duration: 45,
        videoUrl: "https://example.com/video",
        pdfUrl: null,
        thumbnailUrl: null,
        isFeatured: true,
        tags: ["core"],
      },
    ],
    progressRows: [
      {
        contentId: "content_1",
        isCompleted: true,
        progressPercent: 100,
        lastViewedAt: new Date("2026-03-01T10:00:00.000Z"),
        completedAt: new Date("2026-03-01T11:00:00.000Z"),
        notes: "Great class",
      },
    ],
    recentRequests: [
      {
        id: "request_1",
        title: "Advanced cueing",
        status: "PENDING",
        createdAt: new Date("2026-03-02T00:00:00.000Z"),
        preferredDate1: null,
        scheduledDate: null,
      },
    ],
  })

  assert.equal(catalog.categories.length, 1)
  assert.equal(catalog.stats.totalContent, 1)
  assert.equal(catalog.stats.pendingTrainingRequests, 1)
  assert.equal(catalog.categories[0].contents[0].progress?.progressPercent, 100)

  const detail = buildMobileClassFlowDetailResponse({
    role: "TEACHER",
    studio,
    content: {
      id: "content_1",
      title: "Core Flow",
      description: "Focus on core",
      type: "VIDEO",
      difficulty: "BEGINNER",
      duration: 45,
      videoUrl: "https://example.com/video",
      pdfUrl: null,
      thumbnailUrl: null,
      articleContent: "   " + "A".repeat(500),
      isFeatured: true,
      tags: ["core"],
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-03T00:00:00.000Z"),
      category: {
        id: "cat_1",
        name: "Reformer",
        description: null,
        icon: "dumbbell",
        color: "#7ED321",
      },
    },
    categoryContentCount: 3,
    relatedRows: [
      {
        id: "content_2",
        title: "Power Flow",
        type: "VIDEO",
        difficulty: "INTERMEDIATE",
        duration: 50,
        thumbnailUrl: null,
        isFeatured: false,
      },
    ],
    progressRows: [
      {
        contentId: "content_1",
        isCompleted: true,
        progressPercent: 100,
        lastViewedAt: new Date("2026-03-01T10:00:00.000Z"),
        completedAt: new Date("2026-03-01T11:00:00.000Z"),
        notes: "Great class",
      },
    ],
    recentRequests: [
      {
        id: "request_1",
        title: "Advanced cueing",
        status: "SCHEDULED",
        createdAt: new Date("2026-03-02T00:00:00.000Z"),
        preferredDate1: null,
        scheduledDate: null,
      },
    ],
    canUpdateProgress: true,
  })

  assert.equal(detail.stats.requestCount, 1)
  assert.equal(detail.stats.relatedContentCount, 1)
  assert.equal(detail.permissions.canUpdateProgress, true)
  assert.equal(detail.content.articlePreview?.endsWith("..."), true)
  assert.equal(detail.relatedContent[0].progress, null)

  assert.equal(articlePreview("hello"), "hello")
  assert.equal(articlePreview(""), null)

  console.log("Class flow response logic passed")
}

run()
