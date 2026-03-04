import { MobileReportsError } from "./mobile-report-errors"

export function resolveMobileReportRouteError(error: unknown): { status: number; message: string; log: boolean } {
  if (error instanceof MobileReportsError) {
    return {
      status: error.status,
      message: error.message,
      log: false,
    }
  }

  return {
    status: 500,
    message: "Failed to load reports",
    log: true,
  }
}
