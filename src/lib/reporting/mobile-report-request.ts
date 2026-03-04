import type { ReportRangeInput } from "./date-range"

export function resolveMobileReportRangeInputFromSearchParams(searchParams: URLSearchParams): ReportRangeInput {
  return {
    days: searchParams.get("days"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
  }
}

export function resolveMobileReportRangeInputFromBody(body: unknown): ReportRangeInput {
  const candidate = body && typeof body === "object" ? (body as Record<string, unknown>) : null
  return {
    days: candidate?.days != null ? String(candidate.days) : null,
    startDate: candidate?.startDate != null ? String(candidate.startDate) : null,
    endDate: candidate?.endDate != null ? String(candidate.endDate) : null,
  }
}
