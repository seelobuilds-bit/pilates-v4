import { resolveDefaultMobileReportRange, type ReportRangeInput } from "./date-range"
import { type MobileStudioAuthContext } from "../mobile-auth-context"

type MobileStudioAuthSuccess = Extract<MobileStudioAuthContext, { ok: true }>

export function buildMobileReportContext(auth: MobileStudioAuthSuccess, input: ReportRangeInput) {
  const studio = auth.studio
  const studioSummary = {
    id: studio.id,
    name: studio.name,
    subdomain: studio.subdomain,
    primaryColor: studio.primaryColor,
    currency: studio.stripeCurrency,
  }

  const {
    days: periodDays,
    reportEndDate: periodEnd,
    startDate: currentStart,
    previousStartDate: previousStart,
    responseEndDate: responseEnd,
  } = resolveDefaultMobileReportRange(input)

  return {
    decoded: auth.decoded,
    studio,
    studioSummary,
    periodDays,
    periodEnd,
    currentStart,
    previousStart,
    responseEnd,
  }
}
