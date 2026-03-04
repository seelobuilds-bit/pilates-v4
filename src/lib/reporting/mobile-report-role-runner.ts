import { type MobileRole } from "@/lib/mobile-auth"
import { type MobileReportsPayload } from "./mobile-report-payload"
import { resolveMobileClientReportId, resolveMobileTeacherReportId } from "./mobile-report-role-context"

type RoleRunnerDecoded = {
  role: MobileRole
  sub: string
  teacherId?: string | null
  clientId?: string | null
}

export async function runMobileReportByRole(args: {
  decoded: RoleRunnerDecoded
  runOwner: () => Promise<MobileReportsPayload>
  runTeacher: (teacherId: string) => Promise<MobileReportsPayload>
  runClient: (clientId: string) => Promise<MobileReportsPayload>
}): Promise<MobileReportsPayload> {
  const { decoded, runOwner, runTeacher, runClient } = args

  if (decoded.role === "OWNER") {
    return runOwner()
  }

  if (decoded.role === "TEACHER") {
    return runTeacher(resolveMobileTeacherReportId(decoded))
  }

  return runClient(resolveMobileClientReportId(decoded))
}
