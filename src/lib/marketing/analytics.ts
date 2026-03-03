import { ratioPercentage } from "../reporting/metrics"

export function summarizeDeliveryMetrics(
  sentCount: number,
  deliveredCount: number,
  openedCount: number,
  clickedCount: number,
  failedCount: number
) {
  return {
    deliveryRate: ratioPercentage(deliveredCount, sentCount, 1),
    openRate: ratioPercentage(openedCount, deliveredCount, 1),
    clickRate: ratioPercentage(clickedCount, deliveredCount, 1),
    failureRate: ratioPercentage(failedCount, sentCount, 1),
  }
}

export function summarizeAutomationDeliveryMetrics(
  totalSent: number,
  totalDelivered: number,
  totalOpened: number,
  totalClicked: number,
  failedMessages: number,
  totalMessages: number
) {
  return {
    deliveryRate: ratioPercentage(totalDelivered, totalSent, 1),
    openRate: ratioPercentage(totalOpened, totalDelivered, 1),
    clickRate: ratioPercentage(totalClicked, totalDelivered, 1),
    failureRate: ratioPercentage(failedMessages, totalMessages, 1),
  }
}
