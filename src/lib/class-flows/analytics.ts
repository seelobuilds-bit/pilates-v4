type CategorySummaryInput = {
  contentCount: number
  featuredContentCount?: number
}

type ProgressSummaryInput = {
  isCompleted: boolean
}

type TrainingRequestSummaryInput = {
  status: string
}

type ProgressGroupSummaryInput = {
  viewCount: number
}

export function summarizeClassFlowCatalog(
  categories: CategorySummaryInput[],
  progressRows: ProgressSummaryInput[],
  trainingRequests: TrainingRequestSummaryInput[]
) {
  return {
    categories: categories.length,
    totalContent: categories.reduce((sum, category) => sum + category.contentCount, 0),
    featuredContent: categories.reduce((sum, category) => sum + (category.featuredContentCount || 0), 0),
    completedContent: progressRows.filter((progress) => progress.isCompleted).length,
    pendingTrainingRequests: trainingRequests.filter((request) =>
      ["PENDING", "APPROVED", "SCHEDULED"].includes(request.status)
    ).length,
  }
}

export function summarizeClassFlowAdminOverview(
  progressGroups: ProgressGroupSummaryInput[],
  completedCount: number,
  trainingRequests: TrainingRequestSummaryInput[]
) {
  return {
    totalViews: progressGroups.reduce((sum, group) => sum + group.viewCount, 0),
    completedCount,
    pendingTrainingRequests: trainingRequests.filter((request) => request.status === "PENDING").length,
  }
}

export function summarizeClassFlowDetail(requests: TrainingRequestSummaryInput[], relatedContentCount: number, categoryContentCount: number) {
  return {
    categoryContentCount,
    relatedContentCount,
    requestCount: requests.length,
  }
}
