import fs from "node:fs/promises"
import path from "node:path"
import { printSuiteStart, request } from "./_http.mjs"

const TEST_OWNER_COOKIE = process.env.TEST_OWNER_COOKIE
const TEST_TEACHER_COOKIE = process.env.TEST_TEACHER_COOKIE || TEST_OWNER_COOKIE
const TEST_STUDIO_CLIENT_ID = process.env.TEST_STUDIO_CLIENT_ID
const TEST_STUDIO_TEACHER_ID = process.env.TEST_STUDIO_TEACHER_ID
const TEST_STUDIO_CLASS_ID = process.env.TEST_STUDIO_CLASS_ID
const TEST_STUDIO_LOCATION_ID = process.env.TEST_STUDIO_LOCATION_ID
const INPUT_PATH = process.env.REPORTING_BASELINE_INPUT

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
    throw new Error(`Expected JSON for ${pathname}, got ${contentType || "unknown"} (${body.slice(0, 120)})`)
  }

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}: ${payload?.error || "Request failed"}`)
  }

  return payload
}

function approxEqual(a, b, epsilon = 0.01) {
  return Math.abs(toNumber(a) - toNumber(b)) <= epsilon
}

function collectDiffs(expected, actual, prefix = "") {
  const diffs = []
  const keys = Array.from(new Set([...Object.keys(expected || {}), ...Object.keys(actual || {})])).sort()
  for (const key of keys) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    const expectedValue = expected?.[key]
    const actualValue = actual?.[key]

    const expectedIsObject =
      expectedValue && typeof expectedValue === "object" && !Array.isArray(expectedValue)
    const actualIsObject =
      actualValue && typeof actualValue === "object" && !Array.isArray(actualValue)

    if (expectedIsObject || actualIsObject) {
      diffs.push(...collectDiffs(expectedValue || {}, actualValue || {}, nextPrefix))
      continue
    }

    if (typeof expectedValue === "number" || typeof actualValue === "number") {
      if (!approxEqual(expectedValue, actualValue)) {
        diffs.push(`${nextPrefix}: expected ${expectedValue} got ${actualValue}`)
      }
      continue
    }

    if (JSON.stringify(expectedValue) !== JSON.stringify(actualValue)) {
      diffs.push(`${nextPrefix}: expected ${JSON.stringify(expectedValue)} got ${JSON.stringify(actualValue)}`)
    }
  }

  return diffs
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

async function loadBaseline() {
  if (!INPUT_PATH) {
    return null
  }
  const resolved = path.resolve(process.cwd(), INPUT_PATH)
  const raw = await fs.readFile(resolved, "utf8")
  return JSON.parse(raw)
}

async function main() {
  printSuiteStart("Reporting baseline compare")

  const baseline = await loadBaseline()
  if (!baseline) {
    console.log("SKIP Reporting baseline compare (set REPORTING_BASELINE_INPUT to run)")
    return
  }

  if (!TEST_OWNER_COOKIE) {
    console.log("SKIP Reporting baseline compare (set TEST_OWNER_COOKIE to run)")
    return
  }

  const failures = []

  for (const [label, entry] of Object.entries(baseline.studioReports || {})) {
    if (!entry?.route || !entry?.summary) continue
    const payload = await fetchJson(entry.route, TEST_OWNER_COOKIE)
    const diffs = collectDiffs(entry.summary, extractStudioSummary(payload), `studioReports.${label}`)
    failures.push(...diffs)
  }

  if (baseline.teacherStats?.route && baseline.teacherStats?.summary && TEST_TEACHER_COOKIE) {
    const payload = await fetchJson(baseline.teacherStats.route, TEST_TEACHER_COOKIE)
    failures.push(...collectDiffs(baseline.teacherStats.summary, extractTeacherStatsSummary(payload), "teacherStats"))
  }

  const entityRoutes = [
    { key: "client", id: TEST_STUDIO_CLIENT_ID, summaryKind: "client", route: (id) => `/api/studio/clients/${id}` },
    { key: "teacher", id: TEST_STUDIO_TEACHER_ID, summaryKind: "teacher", route: (id) => `/api/studio/teachers/${id}` },
    { key: "classType", id: TEST_STUDIO_CLASS_ID, summaryKind: "classType", route: (id) => `/api/studio/class-types/${id}` },
    { key: "location", id: TEST_STUDIO_LOCATION_ID, summaryKind: "location", route: (id) => `/api/studio/locations/${id}` },
  ]

  for (const entry of entityRoutes) {
    const expected = baseline.entities?.[entry.key]?.summary
    if (!expected || !entry.id) continue
    const payload = await fetchJson(entry.route(entry.id), TEST_OWNER_COOKIE)
    failures.push(...collectDiffs(expected, extractEntitySummary(entry.summaryKind, payload), `entities.${entry.key}`))
  }

  for (const [label, entry] of Object.entries(baseline.websiteAnalytics || {})) {
    if (!entry?.route || !entry?.summary) continue
    const payload = await fetchJson(entry.route, TEST_OWNER_COOKIE)
    failures.push(...collectDiffs(entry.summary, extractWebsiteSummary(payload), `websiteAnalytics.${label}`))
  }

  for (const [label, entry] of Object.entries(baseline.leaderboards || {})) {
    if (!entry?.route || !entry?.summary) continue
    const payload = await fetchJson(entry.route, TEST_OWNER_COOKIE)
    failures.push(...collectDiffs(entry.summary, extractLeaderboardSummary(payload), `leaderboards.${label}`))
  }

  if (failures.length > 0) {
    console.log("FAIL Reporting baseline compare")
    for (const failure of failures) {
      console.log(` - ${failure}`)
    }
    process.exit(1)
  }

  console.log("PASS Reporting baseline compare")
}

main().catch((error) => {
  console.error("Failed to compare reporting baseline:", error)
  process.exit(1)
})
