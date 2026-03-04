import { fetchMarketingAndSocialInputs } from "./marketing-social-query"
import { fetchStudioReportBaseData } from "./studio-report-base-query"
import { fetchActiveClientVisitRows } from "./retention-composition"

export async function loadStudioReportData(args: {
  studioId: string
  startDate: Date
  reportEndDate: Date
  previousStartDate: Date
}) {
  const { studioId, startDate, reportEndDate, previousStartDate } = args

  const base = await fetchStudioReportBaseData({
    studioId,
    startDate,
    reportEndDate,
    previousStartDate,
  })

  const marketingSocial = await fetchMarketingAndSocialInputs({
    studioId,
    startDate,
    reportEndDate,
    previousStartDate,
  })

  const activityLookbackStart = new Date(reportEndDate)
  activityLookbackStart.setDate(activityLookbackStart.getDate() - 365)

  const activeClientVisitRows = await fetchActiveClientVisitRows({
    studioId,
    activityLookbackStart,
    reportEndDate,
  })

  return {
    ...base,
    ...marketingSocial,
    activeClientVisitRows,
  }
}
