import { MobileReportsError } from "./mobile-report-errors"

export function resolveMobileTeacherReportId(decoded: { teacherId?: string | null }) {
  if (!decoded.teacherId) {
    throw new MobileReportsError("Teacher session invalid", 401)
  }
  return decoded.teacherId
}

export function resolveMobileClientReportId(decoded: { clientId?: string | null; sub: string }) {
  return decoded.clientId || decoded.sub
}
