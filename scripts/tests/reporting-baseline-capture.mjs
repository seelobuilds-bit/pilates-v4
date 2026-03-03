import fs from "node:fs/promises"
import path from "node:path"
import { printSuiteStart, request } from "./_http.mjs"

const TEST_OWNER_COOKIE = process.env.TEST_OWNER_COOKIE
const TEST_TEACHER_COOKIE = process.env.TEST_TEACHER_COOKIE || TEST_OWNER_COOKIE
const TEST_STUDIO_CLIENT_ID = process.env.TEST_STUDIO_CLIENT_ID
const TEST_STUDIO_TEACHER_ID = process.env.TEST_STUDIO_TEACHER_ID
const TEST_STUDIO_CLASS_ID = process.env.TEST_STUDIO_CLASS_ID
const TEST_STUDIO_LOCATION_ID = process.env.TEST_STUDIO_LOCATION_ID
const OUTPUT_PATH = process.env.REPORTING_BASELINE_OUTPUT

function authHeaders(cookie) {
  return cookie
    ? {
        headers: {
          cookie,
        },
      }
    : {}
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

async function fetchJson(pathname, cookie) {
  const response = await request(pathname, authHeaders(cookie))
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    const body = await response.text()
    return {
      ok: false,
      status: response.status,
      error: `Expected JSON but received ${contentType || "unknown content type"}`,
      bodyPreview: body.slice(0, 160),
      path: pathname,
    }
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error || "Request failed",
      path: pathname,
    }
  }

  return {
    ok: true,
    status: response.status,
    payload,
    path: pathname,
  }
}

function extractStudioSummary(payload) {
  return {
    revenueTotal: toNumber(payload?.revenue?.total),
    revenuePrevious: toNumber(payload?.revenue?.previousTotal),
    activeClients: toNumber(payload?.clients?.active),
    newClients: toNumber(payload?.clients?.new),
    churnRate: toNumber(payload?.clients?.churnRate),
    atRiskClients: toNumber(payload?.clients?.atRisk),
    totalBookings: toNumber(payload?.bookings?.total),
    uniqueClients: toNumber(payload?.bookings?.uniqueClients),
    newClientBookings: toNumber(payload?.bookings?.newClientBookings),
    avgBookingsPerClient: toNumber(payload?.bookings?.averageBookingsPerClient),
    totalClasses: toNumber(payload?.classes?.total),
    avgFillRate: toNumber(payload?.classes?.averageFill),
    websiteVisitors: toNumber(payload?.website?.visitors),
    websiteConversionRate: toNumber(payload?.website?.conversionRate),
    socialBooked: toNumber(payload?.social?.totalBooked),
    socialConversionRate: toNumber(payload?.social?.conversionRate),
  }
}

function extractTeacherStatsSummary(payload) {
  return {
    totalClasses: toNumber(payload?.totalClasses),
    totalStudents: toNumber(payload?.totalStudents),
    revenue: toNumber(payload?.revenue),
    avgClassSize: toNumber(payload?.avgClassSize),
    avgFillRate: toNumber(payload?.avgFillRate),
    completionRate: toNumber(payload?.completionRate),
    retentionRate: toNumber(payload?.retentionRate),
    upcomingClasses: Array.isArray(payload?.upcomingClasses) ? payload.upcomingClasses.length : 0,
  }
}

function extractEntitySummary(kind, payload) {
  if (kind === "client") {
    return {
      totalBookings: toNumber(payload?.stats?.totalBookings),
      completedClasses: toNumber(payload?.stats?.completedClasses),
      totalSpent: toNumber(payload?.stats?.totalSpent),
      credits: toNumber(payload?.client?.credits),
    }
  }

  if (kind === "teacher") {
    return {
      totalClasses: toNumber(payload?.stats?.totalClasses),
      totalStudents: toNumber(payload?.stats?.totalStudents),
      revenue: toNumber(payload?.extendedStats?.revenue),
      averageClassFill: toNumber(payload?.extendedStats?.averageClassFill),
    }
  }

  if (kind === "classType") {
    return {
      totalBookings: toNumber(payload?.stats?.totalBookings),
      totalRevenue: toNumber(payload?.stats?.totalRevenue),
      avgAttendance: toNumber(payload?.stats?.avgAttendance),
      classCount: toNumber(payload?.stats?.classCount),
    }
  }

  if (kind === "location") {
    return {
      totalBookings: toNumber(payload?.stats?.totalBookings),
      totalRevenue: toNumber(payload?.stats?.totalRevenue),
      activeClients: toNumber(payload?.stats?.activeClients),
      classCount: toNumber(payload?.stats?.classCount),
    }
  }

  return {}
}

function extractWebsiteSummary(payload) {
  const overview = payload?.analytics?.overview || {}
  return {
    totalPageViews: toNumber(overview?.totalPageViews),
    uniqueVisitors: toNumber(overview?.uniqueVisitors),
    totalConversions: toNumber(overview?.totalConversions),
    conversionRate: toNumber(overview?.conversionRate),
    avgPagesPerVisit: toNumber(overview?.avgPagesPerVisit),
  }
}

function extractLeaderboardSummary(payload) {
  const leaderboards = Array.isArray(payload?.leaderboards) ? payload.leaderboards : []
  const withPeriods = leaderboards.filter((entry) => entry?.currentPeriod)
  return {
    count: leaderboards.length,
    activePeriods: withPeriods.length,
    topNames: withPeriods.slice(0, 3).map((entry) => entry.name),
    topEntryCounts: withPeriods.slice(0, 3).map((entry) => toNumber(entry?.currentPeriod?.entries?.length)),
  }
}

async function maybeCaptureEntity(result, key, id, routeFactory, summaryKind) {
  if (!id) {
    result[key] = { skipped: true, reason: `Missing ${key} id` }
    return
  }

  const response = await fetchJson(routeFactory(id), TEST_OWNER_COOKIE)
  result[key] = response.ok
    ? {
        route: response.path,
        summary: extractEntitySummary(summaryKind, response.payload),
      }
    : response
}

async function writeOutput(payload) {
  const content = `${JSON.stringify(payload, null, 2)}\n`
  if (!OUTPUT_PATH) {
    console.log(content)
    return
  }

  const resolved = path.resolve(process.cwd(), OUTPUT_PATH)
  await fs.mkdir(path.dirname(resolved), { recursive: true })
  await fs.writeFile(resolved, content, "utf8")
  console.log(`Wrote reporting baseline to ${resolved}`)
}

async function main() {
  printSuiteStart("Reporting baseline capture")

  const baseline = {
    capturedAt: new Date().toISOString(),
    baseUrl: process.env.TEST_BASE_URL || "http://localhost:3000",
    context: {
      hasOwnerCookie: Boolean(TEST_OWNER_COOKIE),
      hasTeacherCookie: Boolean(TEST_TEACHER_COOKIE),
      clientId: TEST_STUDIO_CLIENT_ID || null,
      teacherId: TEST_STUDIO_TEACHER_ID || null,
      classId: TEST_STUDIO_CLASS_ID || null,
      locationId: TEST_STUDIO_LOCATION_ID || null,
    },
    studioReports: {},
    teacherStats: null,
    entities: {},
    websiteAnalytics: {},
    leaderboards: {},
  }

  if (!TEST_OWNER_COOKIE) {
    baseline.warning =
      "TEST_OWNER_COOKIE is not set. Protected reporting routes were not captured. Set env vars to capture a real baseline."
    await writeOutput(baseline)
    return
  }

  const studioPeriods = {
    today: "/api/studio/reports?startDate=2026-03-03&endDate=2026-03-03",
    last7: "/api/studio/reports?days=7",
    last30: "/api/studio/reports?days=30",
  }

  for (const [label, route] of Object.entries(studioPeriods)) {
    const response = await fetchJson(route, TEST_OWNER_COOKIE)
    baseline.studioReports[label] = response.ok
      ? {
          route: response.path,
          summary: extractStudioSummary(response.payload),
        }
      : response
  }

  const teacherStatsResponse = await fetchJson("/api/teacher/stats", TEST_TEACHER_COOKIE)
  baseline.teacherStats = teacherStatsResponse.ok
    ? {
        route: teacherStatsResponse.path,
        summary: extractTeacherStatsSummary(teacherStatsResponse.payload),
      }
    : teacherStatsResponse

  await maybeCaptureEntity(
    baseline.entities,
    "client",
    TEST_STUDIO_CLIENT_ID,
    (id) => `/api/studio/clients/${id}`,
    "client"
  )
  await maybeCaptureEntity(
    baseline.entities,
    "teacher",
    TEST_STUDIO_TEACHER_ID,
    (id) => `/api/studio/teachers/${id}`,
    "teacher"
  )
  await maybeCaptureEntity(
    baseline.entities,
    "classType",
    TEST_STUDIO_CLASS_ID,
    (id) => `/api/studio/class-types/${id}`,
    "classType"
  )
  await maybeCaptureEntity(
    baseline.entities,
    "location",
    TEST_STUDIO_LOCATION_ID,
    (id) => `/api/studio/locations/${id}`,
    "location"
  )

  for (const [label, route] of Object.entries({
    "7d": "/api/studio/website-analytics?period=7d",
    "30d": "/api/studio/website-analytics?period=30d",
  })) {
    const response = await fetchJson(route, TEST_OWNER_COOKIE)
    baseline.websiteAnalytics[label] = response.ok
      ? {
          route: response.path,
          summary: extractWebsiteSummary(response.payload),
        }
      : response
  }

  for (const [label, route] of Object.entries({
    studio: "/api/leaderboards?type=STUDIO",
    teacher: "/api/leaderboards?type=TEACHER",
  })) {
    const response = await fetchJson(route, TEST_OWNER_COOKIE)
    baseline.leaderboards[label] = response.ok
      ? {
          route: response.path,
          summary: extractLeaderboardSummary(response.payload),
        }
      : response
  }

  await writeOutput(baseline)
}

main().catch((error) => {
  console.error("Failed to capture reporting baseline:", error)
  process.exit(1)
})
