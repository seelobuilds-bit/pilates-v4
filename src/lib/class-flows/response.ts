import { summarizeClassFlowCatalog, summarizeClassFlowDetail } from "./analytics"

type MobileStudioSummary = {
  id: string
  name: string
  subdomain: string
  primaryColor: string | null
  currency: string | null
}

type MobileRole = "OWNER" | "TEACHER"

type ContentProgressRow = {
  contentId: string
  isCompleted: boolean
  progressPercent: number | null
  lastViewedAt: Date | null
  completedAt: Date | null
  notes: string | null
}

type ClassFlowContentRow = {
  id: string
  title: string
  description: string | null
  type: string
  difficulty: string
  duration: number | null
  videoUrl: string | null
  pdfUrl: string | null
  thumbnailUrl: string | null
  isFeatured: boolean
  tags: string[] | null
}

type ClassFlowCategoryRow = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  contents: ClassFlowContentRow[]
}

type TrainingRequestSummaryRow = {
  id: string
  title: string
  status: string
  createdAt: Date
  preferredDate1: Date | null
  scheduledDate: Date | null
}

type RelatedContentRow = {
  id: string
  title: string
  type: string
  difficulty: string
  duration: number | null
  thumbnailUrl: string | null
  isFeatured: boolean
}

type DetailContentRow = ClassFlowContentRow & {
  articleContent: string | null
  createdAt: Date
  updatedAt: Date
  category: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string | null
  }
}

function toIsoOrNull(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function toProgressSnapshot(progress: ContentProgressRow | undefined) {
  if (!progress) return null
  return {
    isCompleted: progress.isCompleted,
    progressPercent: progress.progressPercent,
    lastViewedAt: toIsoOrNull(progress.lastViewedAt),
    completedAt: toIsoOrNull(progress.completedAt),
    notes: progress.notes,
  }
}

function mapContentWithProgress(content: ClassFlowContentRow, progressByContentId: Map<string, ContentProgressRow>) {
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    type: content.type,
    difficulty: content.difficulty,
    duration: content.duration,
    videoUrl: content.videoUrl,
    pdfUrl: content.pdfUrl,
    thumbnailUrl: content.thumbnailUrl,
    isFeatured: content.isFeatured,
    tags: content.tags || [],
    progress: toProgressSnapshot(progressByContentId.get(content.id)),
  }
}

export function mapTrainingRequestSummaries(requests: TrainingRequestSummaryRow[]) {
  return requests.map((request) => ({
    id: request.id,
    title: request.title,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    preferredDate1: toIsoOrNull(request.preferredDate1),
    scheduledDate: toIsoOrNull(request.scheduledDate),
  }))
}

export function articlePreview(value: string | null, maxLength = 420) {
  if (!value) return null
  const normalized = value.replace(/\s+/g, " ").trim()
  if (!normalized) return null
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}...`
}

export function buildMobileClassFlowsCatalogResponse(args: {
  role: MobileRole
  studio: MobileStudioSummary
  filters: {
    categoryId: string | null
    type: string | null
    difficulty: string | null
    featuredOnly: boolean
    search: string
  }
  categories: ClassFlowCategoryRow[]
  featured: ClassFlowContentRow[]
  progressRows: ContentProgressRow[]
  recentRequests: TrainingRequestSummaryRow[]
}) {
  const progressByContentId = new Map(args.progressRows.map((row) => [row.contentId, row]))

  const mappedCategories = args.categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      contentCount: category.contents.length,
      contents: category.contents.map((content) => mapContentWithProgress(content, progressByContentId)),
    }))
    .filter((category) => category.contents.length > 0)

  const mappedFeatured = args.featured.map((content) => mapContentWithProgress(content, progressByContentId))

  const catalogStats = summarizeClassFlowCatalog(
    mappedCategories.map((category) => ({
      contentCount: category.contentCount,
      featuredContentCount: category.contents.filter((content) => content.isFeatured).length,
    })),
    args.progressRows,
    args.recentRequests
  )

  return {
    role: args.role,
    studio: args.studio,
    filters: args.filters,
    stats: {
      categories: catalogStats.categories,
      totalContent: catalogStats.totalContent,
      featuredContent: catalogStats.featuredContent,
      completedContent: catalogStats.completedContent,
      pendingTrainingRequests: catalogStats.pendingTrainingRequests,
    },
    categories: mappedCategories,
    featured: mappedFeatured,
    recentRequests: mapTrainingRequestSummaries(args.recentRequests),
  }
}

export function buildMobileClassFlowDetailResponse(args: {
  role: MobileRole
  studio: MobileStudioSummary
  content: DetailContentRow
  categoryContentCount: number
  relatedRows: RelatedContentRow[]
  progressRows: ContentProgressRow[]
  recentRequests: TrainingRequestSummaryRow[]
  canUpdateProgress: boolean
}) {
  const progressByContentId = new Map(args.progressRows.map((row) => [row.contentId, row]))
  const currentProgress = progressByContentId.get(args.content.id)
  const detailStats = summarizeClassFlowDetail(
    args.recentRequests,
    args.relatedRows.length,
    args.categoryContentCount
  )

  return {
    role: args.role,
    studio: args.studio,
    content: {
      id: args.content.id,
      title: args.content.title,
      description: args.content.description,
      type: args.content.type,
      difficulty: args.content.difficulty,
      duration: args.content.duration,
      videoUrl: args.content.videoUrl,
      pdfUrl: args.content.pdfUrl,
      thumbnailUrl: args.content.thumbnailUrl,
      articlePreview: articlePreview(args.content.articleContent),
      isFeatured: args.content.isFeatured,
      tags: args.content.tags || [],
      createdAt: args.content.createdAt.toISOString(),
      updatedAt: args.content.updatedAt.toISOString(),
      category: args.content.category,
      resourceAvailability: {
        video: Boolean(args.content.videoUrl),
        pdf: Boolean(args.content.pdfUrl),
        article: Boolean(args.content.articleContent?.trim()),
      },
    },
    progress: toProgressSnapshot(currentProgress),
    relatedContent: args.relatedRows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      difficulty: row.difficulty,
      duration: row.duration,
      thumbnailUrl: row.thumbnailUrl,
      isFeatured: row.isFeatured,
      progress: toProgressSnapshot(progressByContentId.get(row.id)),
    })),
    recentRequests: mapTrainingRequestSummaries(args.recentRequests),
    stats: {
      categoryContentCount: detailStats.categoryContentCount,
      relatedContentCount: detailStats.relatedContentCount,
      requestCount: detailStats.requestCount,
    },
    permissions: {
      canUpdateProgress: args.canUpdateProgress,
    },
  }
}
