import { NextRequest, NextResponse } from "next/server"
import { resolveDefaultEntityReportDateRange } from "./date-range"
import { getSession } from "@/lib/session"

export type OwnerEntityReportContext =
  | {
      ok: true
      studioId: string
      startDate: Date
      endDate: Date
    }
  | {
      ok: false
      response: NextResponse
    }

export async function resolveOwnerEntityReportContext(
  request: NextRequest
): Promise<OwnerEntityReportContext> {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { startDate, endDate } = resolveDefaultEntityReportDateRange(request.nextUrl.searchParams)

  return {
    ok: true,
    studioId: session.user.studioId,
    startDate,
    endDate,
  }
}
