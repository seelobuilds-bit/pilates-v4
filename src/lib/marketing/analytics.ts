import { ratioPercentage } from "../reporting/metrics"

function summarizeDeliveryRates(args: {
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  failedCount: number
  failureDenominator: number
}) {
  const { sentCount, deliveredCount, openedCount, clickedCount, failedCount, failureDenominator } = args

  return {
    deliveryRate: ratioPercentage(deliveredCount, sentCount, 1),
    openRate: ratioPercentage(openedCount, deliveredCount, 1),
    clickRate: ratioPercentage(clickedCount, deliveredCount, 1),
    failureRate: ratioPercentage(failedCount, failureDenominator, 1),
  }
}

export function summarizeDeliveryMetrics(
  sentCount: number,
  deliveredCount: number,
  openedCount: number,
  clickedCount: number,
  failedCount: number
) {
  return summarizeDeliveryRates({
    sentCount,
    deliveredCount,
    openedCount,
    clickedCount,
    failedCount,
    failureDenominator: sentCount,
  })
}

export function summarizeAutomationDeliveryMetrics(
  totalSent: number,
  totalDelivered: number,
  totalOpened: number,
  totalClicked: number,
  failedMessages: number,
  totalMessages: number
) {
  return summarizeDeliveryRates({
    sentCount: totalSent,
    deliveredCount: totalDelivered,
    openedCount: totalOpened,
    clickedCount: totalClicked,
    failedCount: failedMessages,
    failureDenominator: totalMessages,
  })
}
