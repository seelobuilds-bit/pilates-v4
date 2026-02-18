import { printSuiteStart, request } from "./_http.mjs"

const TEST_OWNER_COOKIE = process.env.TEST_OWNER_COOKIE
const TEST_TEACHER_COOKIE = process.env.TEST_TEACHER_COOKIE || TEST_OWNER_COOKIE

const TEST_STUDIO_CLIENT_ID = process.env.TEST_STUDIO_CLIENT_ID
const TEST_STUDIO_TEACHER_ID = process.env.TEST_STUDIO_TEACHER_ID
const TEST_STUDIO_CLASS_ID = process.env.TEST_STUDIO_CLASS_ID
const TEST_STUDIO_LOCATION_ID = process.env.TEST_STUDIO_LOCATION_ID

const REQUIRE_DATA = process.env.TEST_REQUIRE_REPORT_DATA === "1"
const REQUIRE_INTEGRITY = process.env.TEST_REQUIRE_REPORT_INTEGRITY === "1"
const FAIL_ON_SKIP = process.env.TEST_FAIL_ON_SKIP === "1"

const KNOWN_ERROR_MARKERS = [
  "Application error:",
  "Unhandled Runtime Error",
  "__next_error__",
  "Minified React error",
  "Something went wrong!",
]

const ENTITY_ROUTES = [
  {
    label: "Client reports tab",
    envName: "TEST_STUDIO_CLIENT_ID",
    id: TEST_STUDIO_CLIENT_ID,
    listRoute: "/api/studio/clients",
    route: (id) => `/studio/clients/${id}?tab=reports`,
    apiRoute: (id) => `/api/studio/clients/${id}`,
    apiIdPath: ["client", "id"],
    getSummary: (payload) => ({
      bookings: toNumber(payload?.stats?.totalBookings),
      revenue: toNumber(payload?.stats?.totalSpent),
      completed: toNumber(payload?.stats?.completedClasses),
    }),
    monotonicKeys: ["bookings", "revenue", "completed"],
  },
  {
    label: "Teacher reports tab",
    envName: "TEST_STUDIO_TEACHER_ID",
    id: TEST_STUDIO_TEACHER_ID,
    listRoute: "/api/studio/teachers",
    route: (id) => `/studio/teachers/${id}?tab=reports`,
    apiRoute: (id) => `/api/studio/teachers/${id}`,
    apiIdPath: ["id"],
    getSummary: (payload) => ({
      classes: toNumber(payload?.stats?.totalClasses),
      students: toNumber(payload?.stats?.totalStudents),
      revenue: toNumber(payload?.extendedStats?.revenue),
    }),
    monotonicKeys: ["classes", "students", "revenue"],
  },
  {
    label: "Class reports tab",
    envName: "TEST_STUDIO_CLASS_ID",
    id: TEST_STUDIO_CLASS_ID,
    listRoute: "/api/studio/class-types",
    route: (id) => `/studio/classes/${id}?tab=reports`,
    apiRoute: (id) => `/api/studio/class-types/${id}`,
    apiIdPath: ["id"],
    getSummary: (payload) => ({
      bookings: toNumber(payload?.stats?.totalBookings),
      revenue: toNumber(payload?.stats?.totalRevenue),
      attendance: toNumber(payload?.stats?.avgAttendance),
    }),
    monotonicKeys: ["bookings", "revenue"],
  },
  {
    label: "Location reports tab",
    envName: "TEST_STUDIO_LOCATION_ID",
    id: TEST_STUDIO_LOCATION_ID,
    listRoute: "/api/studio/locations",
    route: (id) => `/studio/locations/${id}?tab=reports`,
    apiRoute: (id) => `/api/studio/locations/${id}`,
    apiIdPath: ["id"],
    getSummary: (payload) => ({
      bookings: toNumber(payload?.stats?.totalBookings),
      revenue: toNumber(payload?.stats?.totalRevenue),
      activeClients: toNumber(payload?.stats?.activeClients),
    }),
    monotonicKeys: ["bookings", "revenue", "activeClients"],
  },
]

function authHeaders(cookie) {
  return cookie
    ? {
        headers: {
          cookie,
        },
      }
    : {}
}

function pass(label, details) {
  console.log(`PASS ${label}${details ? ` -> ${details}` : ""}`)
}

function fail(label, details) {
  console.log(`FAIL ${label}${details ? ` -> ${details}` : ""}`)
}

function hasKnownErrorBody(html) {
  return KNOWN_ERROR_MARKERS.some((marker) => html.includes(marker))
}

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/"
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

function getPathname(value) {
  return normalizePathname(new URL(value, "http://localhost").pathname)
}

function getValueAtPath(obj, path) {
  let current = obj
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return undefined
    current = current[key]
  }
  return current
}

function assertContainsAll(html, expectedTexts) {
  const missing = expectedTexts.filter((text) => !html.includes(text))
  return { ok: missing.length === 0, missing }
}

async function fetchPage(path, cookie) {
  const response = await request(path, authHeaders(cookie))
  const html = await response.text()
  return { response, html }
}

async function runRouteCheck({ label, path, cookie, expectedTexts }) {
  const { response, html } = await fetchPage(path, cookie)

  if (response.status !== 200) {
    fail(label, `expected 200 but got ${response.status}`)
    return { ok: false }
  }

  if (hasKnownErrorBody(html)) {
    fail(label, "page contains known runtime error marker")
    return { ok: false }
  }

  const expectedPath = getPathname(path)
  const finalPath = getPathname(response.url)
  if (expectedPath !== finalPath) {
    fail(label, `unexpected final URL path: expected ${expectedPath} but got ${finalPath}`)
    return { ok: false }
  }

  const textsToCheck = Array.isArray(expectedTexts) ? expectedTexts : []
  if (textsToCheck.length > 0) {
    const contains = assertContainsAll(html, textsToCheck)
    if (!contains.ok) {
      fail(label, `missing expected text: ${contains.missing.join(", ")}`)
      return { ok: false }
    }
  }

  pass(label, "200 + expected route + no known runtime error markers")
  return { ok: true }
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toIsoDate(value) {
  if (typeof value !== "string" || value.length === 0) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isPercentInRange(value) {
  const num = toNumber(value)
  return num >= 0 && num <= 100
}

function approxEqual(a, b, epsilon = 0.1) {
  return Math.abs(toNumber(a) - toNumber(b)) <= epsilon
}

function summaryMatches(a, b, epsilon = 0.01) {
  const keys = Array.from(new Set([...Object.keys(a || {}), ...Object.keys(b || {})]))
  return keys.every((key) => approxEqual(a?.[key], b?.[key], epsilon))
}

function summaryIsNonDecreasing(olderWindow, widerWindow, keys = null, epsilon = 0.01) {
  const keysToCheck =
    Array.isArray(keys) && keys.length > 0
      ? keys
      : Array.from(new Set([...Object.keys(olderWindow || {}), ...Object.keys(widerWindow || {})]))
  return keysToCheck.every((key) => toNumber(widerWindow?.[key]) + epsilon >= toNumber(olderWindow?.[key]))
}

function studioHasData(payload) {
  return (
    toNumber(payload?.revenue?.total) > 0 ||
    toNumber(payload?.bookings?.total) > 0 ||
    toNumber(payload?.clients?.new) > 0 ||
    toNumber(payload?.clients?.active) > 0
  )
}

function teacherHasData(payload) {
  return (
    toNumber(payload?.totalClasses) > 0 ||
    toNumber(payload?.totalStudents) > 0 ||
    toNumber(payload?.revenue) > 0 ||
    (Array.isArray(payload?.topClasses) && payload.topClasses.length > 0)
  )
}

function isNonNegativeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) && num >= 0
}

async function runExtendedSurfaceChecks(ownerCookie) {
  if (!ownerCookie) {
    console.log("SKIP Extended reporting surface checks (set TEST_OWNER_COOKIE to run)")
    return { passed: 0, failed: 0, skipped: 5 }
  }

  let passed = 0
  let failed = 0

  const website7dResponse = await request("/api/studio/website-analytics?period=7d", authHeaders(ownerCookie))
  const websiteInvalidResponse = await request(
    "/api/studio/website-analytics?period=invalid_period",
    authHeaders(ownerCookie)
  )
  if (website7dResponse.status !== 200 || websiteInvalidResponse.status !== 200) {
    fail(
      "Website analytics surface checks",
      `expected 200 responses but got ${website7dResponse.status} and ${websiteInvalidResponse.status}`
    )
    failed += 1
  } else {
    let website7dPayload
    let websiteInvalidPayload
    try {
      website7dPayload = await website7dResponse.json()
      websiteInvalidPayload = await websiteInvalidResponse.json()
    } catch {
      fail("Website analytics surface checks", "response is not valid JSON")
      failed += 1
      website7dPayload = null
      websiteInvalidPayload = null
    }

    if (website7dPayload && websiteInvalidPayload) {
      const overview = website7dPayload?.analytics?.overview
      const conversionRateExpected =
        toNumber(overview?.uniqueVisitors) > 0
          ? ((toNumber(overview?.totalConversions) / toNumber(overview?.uniqueVisitors)) * 100).toFixed(1)
          : "0"
      const avgPagesExpected =
        toNumber(overview?.uniqueVisitors) > 0
          ? (toNumber(overview?.totalPageViews) / toNumber(overview?.uniqueVisitors)).toFixed(1)
          : "0"

      const websiteErrors = []
      if (!isNonNegativeNumber(overview?.totalPageViews)) websiteErrors.push("overview.totalPageViews invalid")
      if (!isNonNegativeNumber(overview?.uniqueVisitors)) websiteErrors.push("overview.uniqueVisitors invalid")
      if (!isNonNegativeNumber(overview?.totalConversions)) websiteErrors.push("overview.totalConversions invalid")
      if (String(overview?.conversionRate ?? "") !== conversionRateExpected) {
        websiteErrors.push(
          `overview.conversionRate mismatch (${overview?.conversionRate} vs expected ${conversionRateExpected})`
        )
      }
      if (String(overview?.avgPagesPerVisit ?? "") !== avgPagesExpected) {
        websiteErrors.push(
          `overview.avgPagesPerVisit mismatch (${overview?.avgPagesPerVisit} vs expected ${avgPagesExpected})`
        )
      }
      if (websiteInvalidPayload?.range?.period !== "7d") {
        console.log(
          `INFO Website analytics period fallback returned ${websiteInvalidPayload?.range?.period ?? "undefined"}`
        )
      }
      if (!Array.isArray(website7dPayload?.analytics?.topPages)) websiteErrors.push("analytics.topPages is not array")
      if (!Array.isArray(website7dPayload?.analytics?.topSources))
        websiteErrors.push("analytics.topSources is not array")
      if (!Array.isArray(website7dPayload?.analytics?.deviceBreakdown))
        websiteErrors.push("analytics.deviceBreakdown is not array")

      if (websiteErrors.length > 0) {
        fail("Website analytics surface checks", websiteErrors.join("; "))
        failed += 1
      } else {
        pass("Website analytics surface checks")
        passed += 1
      }
    }
  }

  const trackingResponse = await request("/api/social-media/tracking", authHeaders(ownerCookie))
  if (trackingResponse.status !== 200) {
    fail("Social tracking surface checks", `expected 200 but got ${trackingResponse.status}`)
    failed += 1
  } else {
    let trackingPayload
    try {
      trackingPayload = await trackingResponse.json()
    } catch {
      fail("Social tracking surface checks", "response is not valid JSON")
      failed += 1
      trackingPayload = null
    }

    if (trackingPayload) {
      const links = Array.isArray(trackingPayload) ? trackingPayload : []
      const badLink = links.find(
        (link) =>
          typeof link?.id !== "string" ||
          typeof link?.code !== "string" ||
          !isNonNegativeNumber(link?.clicks) ||
          !isNonNegativeNumber(link?.conversions) ||
          !isNonNegativeNumber(link?.revenue)
      )
      if (!Array.isArray(trackingPayload) || badLink) {
        fail("Social tracking surface checks", "tracking payload contains invalid link rows")
        failed += 1
      } else {
        pass("Social tracking surface checks")
        passed += 1
      }
    }
  }

  const flowsResponse = await request("/api/social-media/flows", authHeaders(ownerCookie))
  if (flowsResponse.status !== 200) {
    fail("Social flow surface checks", `expected 200 but got ${flowsResponse.status}`)
    failed += 1
  } else {
    let flowsPayload
    try {
      flowsPayload = await flowsResponse.json()
    } catch {
      fail("Social flow surface checks", "response is not valid JSON")
      failed += 1
      flowsPayload = null
    }

    if (flowsPayload) {
      const accounts = Array.isArray(flowsPayload?.accounts) ? flowsPayload.accounts : []
      const flows = Array.isArray(flowsPayload?.flows) ? flowsPayload.flows : []
      const validAccountIds = new Set(accounts.map((account) => account?.id).filter(Boolean))
      const badFlow = flows.find(
        (flow) =>
          typeof flow?.id !== "string" ||
          !isNonNegativeNumber(flow?.totalTriggered) ||
          !isNonNegativeNumber(flow?.totalResponded) ||
          !isNonNegativeNumber(flow?.totalBooked) ||
          (flow?.accountId && validAccountIds.size > 0 && !validAccountIds.has(flow.accountId))
      )
      if (!Array.isArray(flowsPayload?.accounts) || !Array.isArray(flowsPayload?.flows) || badFlow) {
        fail("Social flow surface checks", "flows payload contains invalid account/metric rows")
        failed += 1
      } else {
        pass("Social flow surface checks")
        passed += 1
      }
    }
  }

  const automationsResponse = await request("/api/studio/automations", authHeaders(ownerCookie))
  if (automationsResponse.status !== 200) {
    fail("Automation reporting surface checks", `expected 200 but got ${automationsResponse.status}`)
    failed += 1
  } else {
    let automationsPayload
    try {
      automationsPayload = await automationsResponse.json()
    } catch {
      fail("Automation reporting surface checks", "response is not valid JSON")
      failed += 1
      automationsPayload = null
    }

    if (automationsPayload) {
      const automations = Array.isArray(automationsPayload?.automations) ? automationsPayload.automations : []
      const badAutomation = automations.find(
        (automation) =>
          !Number.isInteger(automation?.stepCount) ||
          automation.stepCount < 1 ||
          !isNonNegativeNumber(automation?.totalSent)
      )
      if (!Array.isArray(automationsPayload?.automations) || badAutomation) {
        fail("Automation reporting surface checks", "automation payload contains invalid metric rows")
        failed += 1
      } else {
        pass("Automation reporting surface checks")
        passed += 1
      }
    }
  }

  const [leaderboardStudioResponse, leaderboardTeacherResponse] = await Promise.all([
    request("/api/leaderboards?type=STUDIO", authHeaders(ownerCookie)),
    request("/api/leaderboards?type=TEACHER", authHeaders(ownerCookie)),
  ])

  if (leaderboardStudioResponse.status !== 200 || leaderboardTeacherResponse.status !== 200) {
    fail(
      "Leaderboards reporting surface checks",
      `expected 200 responses but got ${leaderboardStudioResponse.status} and ${leaderboardTeacherResponse.status}`
    )
    failed += 1
  } else {
    let studioPayload
    let teacherPayload
    try {
      studioPayload = await leaderboardStudioResponse.json()
      teacherPayload = await leaderboardTeacherResponse.json()
    } catch {
      fail("Leaderboards reporting surface checks", "response is not valid JSON")
      failed += 1
      studioPayload = null
      teacherPayload = null
    }

    if (studioPayload && teacherPayload) {
      const allLeaderboards = [
        ...(Array.isArray(studioPayload?.leaderboards) ? studioPayload.leaderboards : []),
        ...(Array.isArray(teacherPayload?.leaderboards) ? teacherPayload.leaderboards : []),
      ]
      const badEntry = allLeaderboards
        .flatMap((lb) => lb?.currentPeriod?.entries || [])
        .find((entry) => entry?.rank != null && toNumber(entry.rank) <= 0)
      const badRank = [...Object.values(studioPayload?.myRanks || {}), ...Object.values(teacherPayload?.myRanks || {})]
        .filter(Boolean)
        .find((rank) => toNumber(rank?.rank) <= 0 || !Number.isFinite(toNumber(rank?.score)))

      if (
        !Array.isArray(studioPayload?.leaderboards) ||
        !Array.isArray(teacherPayload?.leaderboards) ||
        badEntry ||
        badRank
      ) {
        fail("Leaderboards reporting surface checks", "leaderboard payload contains invalid rank data")
        failed += 1
      } else {
        pass("Leaderboards reporting surface checks")
        passed += 1
      }
    }
  }

  return { passed, failed, skipped: 0 }
}

async function runDataPresenceChecks(ownerCookie, teacherCookie) {
  if (!REQUIRE_DATA) {
    console.log("SKIP Data-presence API checks (set TEST_REQUIRE_REPORT_DATA=1 to enforce)")
    return { passed: 0, failed: 0, skipped: 2 }
  }

  let passed = 0
  let failed = 0

  const studioResponse = await request("/api/studio/reports?days=30", authHeaders(ownerCookie))
  if (studioResponse.status !== 200) {
    fail("Studio reports API has seeded data", `expected 200 but got ${studioResponse.status}`)
    failed += 1
  } else {
    const studioPayload = await studioResponse.json()
    if (studioHasData(studioPayload)) {
      pass("Studio reports API has seeded data")
      passed += 1
    } else {
      fail("Studio reports API has seeded data", "all key overview metrics are empty/zero")
      failed += 1
    }
  }

  const teacherResponse = await request("/api/teacher/stats", authHeaders(teacherCookie))
  if (teacherResponse.status !== 200) {
    fail("Teacher reports API has seeded data", `expected 200 but got ${teacherResponse.status}`)
    failed += 1
  } else {
    const teacherPayload = await teacherResponse.json()
    if (teacherHasData(teacherPayload)) {
      pass("Teacher reports API has seeded data")
      passed += 1
    } else {
      fail("Teacher reports API has seeded data", "all key metrics are empty/zero")
      failed += 1
    }
  }

  return { passed, failed, skipped: 0 }
}

async function runStudioReportConsistencyChecks(ownerCookie) {
  if (!ownerCookie) {
    console.log("SKIP Studio reporting consistency checks (set TEST_OWNER_COOKIE)")
    return { passed: 0, failed: 0, skipped: 1 }
  }

  const response = await request("/api/studio/reports?days=30", authHeaders(ownerCookie))
  if (response.status !== 200) {
    fail("Studio reports consistency checks", `expected 200 but got ${response.status}`)
    return { passed: 0, failed: 1, skipped: 0 }
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    fail("Studio reports consistency checks", "response is not valid JSON")
    return { passed: 0, failed: 1, skipped: 0 }
  }

  const errors = []

  const rangeStart = toIsoDate(payload?.range?.startDate)
  const rangeEnd = toIsoDate(payload?.range?.endDate)
  if (!rangeStart || !rangeEnd || rangeStart >= rangeEnd) {
    errors.push("range.startDate/endDate are invalid or not ordered")
  }

  const bookingTotal = toNumber(payload?.bookings?.total)
  const bookingStatusTotal = Array.isArray(payload?.bookings?.byStatus)
    ? payload.bookings.byStatus.reduce((sum, row) => sum + toNumber(row?.count), 0)
    : 0
  if (bookingTotal !== bookingStatusTotal) {
    errors.push(`bookings total mismatch (${bookingTotal} vs byStatus ${bookingStatusTotal})`)
  }

  const revenueTotal = toNumber(payload?.revenue?.total)
  const revenueByClassTypeTotal = Array.isArray(payload?.revenue?.byClassType)
    ? payload.revenue.byClassType.reduce((sum, row) => sum + toNumber(row?.amount), 0)
    : 0
  if (!approxEqual(revenueTotal, revenueByClassTypeTotal, 0.01)) {
    errors.push(`revenue total mismatch (${revenueTotal} vs byClassType ${revenueByClassTypeTotal})`)
  }

  const averageFill = toNumber(payload?.classes?.averageFill)
  if (averageFill < 0 || averageFill > 100) {
    errors.push(`classes.averageFill out of range (${averageFill})`)
  }

  const marketingRates = [
    ["emailOpenRate", payload?.marketing?.emailOpenRate],
    ["emailClickRate", payload?.marketing?.emailClickRate],
    ["previousEmailOpenRate", payload?.marketing?.previousEmailOpenRate],
    ["previousEmailClickRate", payload?.marketing?.previousEmailClickRate],
    ["noShowRate", payload?.marketing?.noShowRate],
    ["previousNoShowRate", payload?.marketing?.previousNoShowRate],
  ]
  for (const [label, value] of marketingRates) {
    if (!isPercentInRange(value)) {
      errors.push(`marketing.${label} out of range (${toNumber(value)})`)
    }
  }

  const socialTriggered = toNumber(payload?.social?.totalTriggered)
  const socialBooked = toNumber(payload?.social?.totalBooked)
  const socialConversionRate = toNumber(payload?.social?.conversionRate)
  const expectedSocialConversionRate =
    socialTriggered > 0 ? Math.round((socialBooked / socialTriggered) * 1000) / 10 : 0
  if (!approxEqual(socialConversionRate, expectedSocialConversionRate, 0.1)) {
    errors.push(
      `social.conversionRate mismatch (${socialConversionRate} vs expected ${expectedSocialConversionRate})`
    )
  }

  const atRiskClients = toNumber(payload?.retention?.atRiskClients)
  const atRiskListCount = Array.isArray(payload?.retention?.atRiskList) ? payload.retention.atRiskList.length : 0
  if (atRiskListCount > atRiskClients) {
    errors.push(`retention.atRiskList length exceeds atRiskClients (${atRiskListCount} > ${atRiskClients})`)
  }

  const membershipBreakdown = Array.isArray(payload?.retention?.membershipBreakdown)
    ? payload.retention.membershipBreakdown
    : []
  const membershipPercentSum = membershipBreakdown.reduce((sum, row) => sum + toNumber(row?.percent), 0)
  if (membershipBreakdown.length > 0 && (membershipPercentSum < 99 || membershipPercentSum > 101)) {
    errors.push(`retention.membershipBreakdown percent sum drift (${membershipPercentSum})`)
  }

  if (errors.length > 0) {
    fail("Studio reports consistency checks", errors.join("; "))
    return { passed: 0, failed: 1, skipped: 0 }
  }

  pass("Studio reports consistency checks")
  return { passed: 1, failed: 0, skipped: 0 }
}

async function runReportIntegrityChecks(ownerCookie) {
  if (!ownerCookie) {
    if (REQUIRE_INTEGRITY) {
      fail("Report write-path integrity checks", "TEST_REQUIRE_REPORT_INTEGRITY=1 but TEST_OWNER_COOKIE is not set")
      return { passed: 0, failed: 1, skipped: 0 }
    }
    console.log("SKIP Report write-path integrity checks (set TEST_OWNER_COOKIE)")
    return { passed: 0, failed: 0, skipped: 1 }
  }

  const [reportResponse, integrityResponse] = await Promise.all([
    request("/api/studio/reports?days=30", authHeaders(ownerCookie)),
    request("/api/studio/reports/integrity?days=30", authHeaders(ownerCookie)),
  ])

  if (integrityResponse.status === 404) {
    if (REQUIRE_INTEGRITY) {
      fail(
        "Report write-path integrity checks",
        "integrity endpoint unavailable on TEST_BASE_URL while TEST_REQUIRE_REPORT_INTEGRITY=1"
      )
      return { passed: 0, failed: 1, skipped: 0 }
    }
    console.log("SKIP Report write-path integrity checks (/api/studio/reports/integrity not available on TEST_BASE_URL)")
    return { passed: 0, failed: 0, skipped: 1 }
  }

  if (reportResponse.status !== 200 || integrityResponse.status !== 200) {
    fail(
      "Report write-path integrity checks",
      `expected 200 responses but got ${reportResponse.status} and ${integrityResponse.status}`
    )
    return { passed: 0, failed: 1, skipped: 0 }
  }

  let reportPayload
  let integrityPayload
  try {
    reportPayload = await reportResponse.json()
    integrityPayload = await integrityResponse.json()
  } catch {
    fail("Report write-path integrity checks", "response is not valid JSON")
    return { passed: 0, failed: 1, skipped: 0 }
  }

  const errors = []
  const expected = integrityPayload?.source || {}
  if (toNumber(reportPayload?.marketing?.remindersSent) !== toNumber(expected?.marketing?.remindersSent)) {
    errors.push(
      `marketing.remindersSent mismatch (${reportPayload?.marketing?.remindersSent} vs ${expected?.marketing?.remindersSent})`
    )
  }
  if (toNumber(reportPayload?.marketing?.winbackSuccess) !== toNumber(expected?.marketing?.winbackSuccess)) {
    errors.push(
      `marketing.winbackSuccess mismatch (${reportPayload?.marketing?.winbackSuccess} vs ${expected?.marketing?.winbackSuccess})`
    )
  }
  if (toNumber(reportPayload?.social?.totalTriggered) !== toNumber(expected?.social?.totalTriggered)) {
    errors.push(
      `social.totalTriggered mismatch (${reportPayload?.social?.totalTriggered} vs ${expected?.social?.totalTriggered})`
    )
  }
  if (toNumber(reportPayload?.social?.totalResponded) !== toNumber(expected?.social?.totalResponded)) {
    errors.push(
      `social.totalResponded mismatch (${reportPayload?.social?.totalResponded} vs ${expected?.social?.totalResponded})`
    )
  }
  if (toNumber(reportPayload?.social?.totalBooked) !== toNumber(expected?.social?.totalBooked)) {
    errors.push(`social.totalBooked mismatch (${reportPayload?.social?.totalBooked} vs ${expected?.social?.totalBooked})`)
  }

  const failedIntegrityChecks = Array.isArray(integrityPayload?.checks)
    ? integrityPayload.checks.filter((check) => check && check.pass === false)
    : []
  if (failedIntegrityChecks.length > 0) {
    errors.push(
      `integrity endpoint failed checks: ${failedIntegrityChecks.map((check) => check.name).join(", ")}`
    )
  }

  if (errors.length > 0) {
    fail("Report write-path integrity checks", errors.join("; "))
    return { passed: 0, failed: 1, skipped: 0 }
  }

  pass("Report write-path integrity checks")
  return { passed: 1, failed: 0, skipped: 0 }
}

async function runTeacherReportConsistencyChecks(teacherCookie) {
  if (!teacherCookie) {
    console.log("SKIP Teacher reporting consistency checks (set TEST_TEACHER_COOKIE or TEST_OWNER_COOKIE)")
    return { passed: 0, failed: 0, skipped: 1 }
  }

  const response = await request("/api/teacher/stats", authHeaders(teacherCookie))
  if (response.status !== 200) {
    fail("Teacher reports consistency checks", `expected 200 but got ${response.status}`)
    return { passed: 0, failed: 1, skipped: 0 }
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    fail("Teacher reports consistency checks", "response is not valid JSON")
    return { passed: 0, failed: 1, skipped: 0 }
  }

  const errors = []

  const totalClasses = toNumber(payload?.totalClasses)
  const totalStudents = toNumber(payload?.totalStudents)
  const revenue = toNumber(payload?.revenue)
  if (totalClasses < 0) errors.push(`totalClasses is negative (${totalClasses})`)
  if (totalStudents < 0) errors.push(`totalStudents is negative (${totalStudents})`)
  if (revenue < 0) errors.push(`revenue is negative (${revenue})`)

  const percentMetrics = [
    ["retentionRate", payload?.retentionRate],
    ["avgFillRate", payload?.avgFillRate],
    ["completionRate", payload?.completionRate],
  ]
  for (const [label, value] of percentMetrics) {
    if (!isPercentInRange(value)) {
      errors.push(`${label} out of range (${toNumber(value)})`)
    }
  }

  const monthlyClasses = Array.isArray(payload?.monthlyClasses) ? payload.monthlyClasses : []
  if (monthlyClasses.length !== 6) {
    errors.push(`monthlyClasses length expected 6 but got ${monthlyClasses.length}`)
  }
  for (const row of monthlyClasses) {
    const count = toNumber(row?.count)
    if (count < 0) {
      errors.push(`monthlyClasses has negative count (${count})`)
      break
    }
  }

  const topClasses = Array.isArray(payload?.topClasses) ? payload.topClasses : []
  const topClassCountSum = topClasses.reduce((sum, row) => sum + toNumber(row?.count), 0)
  if (topClassCountSum > totalClasses) {
    errors.push(`topClasses count exceeds totalClasses (${topClassCountSum} > ${totalClasses})`)
  }

  if (errors.length > 0) {
    fail("Teacher reports consistency checks", errors.join("; "))
    return { passed: 0, failed: 1, skipped: 0 }
  }

  pass("Teacher reports consistency checks")
  return { passed: 1, failed: 0, skipped: 0 }
}

async function resolveEntityRouteIds(ownerCookie, entityRoutes) {
  if (!ownerCookie) return entityRoutes

  const resolvedRoutes = []
  for (const entityRoute of entityRoutes) {
    if (entityRoute.id || !entityRoute.listRoute) {
      resolvedRoutes.push(entityRoute)
      continue
    }

    const response = await request(entityRoute.listRoute, authHeaders(ownerCookie))
    if (response.status !== 200) {
      console.log(
        `SKIP ${entityRoute.label} auto-resolve (${entityRoute.listRoute} returned ${response.status})`
      )
      resolvedRoutes.push(entityRoute)
      continue
    }

    let payload
    try {
      payload = await response.json()
    } catch {
      console.log(`SKIP ${entityRoute.label} auto-resolve (list response was not JSON)`)
      resolvedRoutes.push(entityRoute)
      continue
    }

    const entities = Array.isArray(payload) ? payload : []
    const firstEntity = entities.find((entity) => entity && typeof entity.id === "string")
    if (!firstEntity) {
      console.log(`SKIP ${entityRoute.label} auto-resolve (no entities found in ${entityRoute.listRoute})`)
      resolvedRoutes.push(entityRoute)
      continue
    }

    console.log(`INFO ${entityRoute.label} auto-resolved id from ${entityRoute.listRoute}`)
    resolvedRoutes.push({
      ...entityRoute,
      id: firstEntity.id,
    })
  }

  return resolvedRoutes
}

async function runEntityApiChecks(ownerCookie, entityRoutes) {
  if (!ownerCookie) {
    console.log("SKIP Entity reporting API checks (set TEST_OWNER_COOKIE to run)")
    return { passed: 0, failed: 0, skipped: entityRoutes.length }
  }

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const entityRoute of entityRoutes) {
    if (!entityRoute.id) {
      console.log(`SKIP ${entityRoute.label} API check (set ${entityRoute.envName} or ensure entities exist)`)
      skipped += 1
      continue
    }

    const response = await request(entityRoute.apiRoute(entityRoute.id), authHeaders(ownerCookie))
    if (response.status !== 200) {
      fail(`${entityRoute.label} API responds`, `expected 200 but got ${response.status}`)
      failed += 1
      continue
    }

    let payload
    try {
      payload = await response.json()
    } catch {
      fail(`${entityRoute.label} API responds`, "response is not valid JSON")
      failed += 1
      continue
    }

    const resolvedId = getValueAtPath(payload, entityRoute.apiIdPath)
    if (resolvedId !== entityRoute.id) {
      fail(
        `${entityRoute.label} API responds`,
        `expected id ${entityRoute.id} at ${entityRoute.apiIdPath.join(".")} but got ${resolvedId ?? "undefined"}`
      )
      failed += 1
      continue
    }

    pass(`${entityRoute.label} API responds`)
    passed += 1
  }

  return { passed, failed, skipped }
}

async function fetchEntityPayload(entityRoute, id, ownerCookie, query = "") {
  const path = query ? `${entityRoute.apiRoute(id)}?${query}` : entityRoute.apiRoute(id)
  const response = await request(path, authHeaders(ownerCookie))
  if (response.status !== 200) {
    return { ok: false, reason: `expected 200 for ${path} but got ${response.status}` }
  }
  try {
    const payload = await response.json()
    const resolvedId = getValueAtPath(payload, entityRoute.apiIdPath)
    if (resolvedId !== id) {
      return {
        ok: false,
        reason: `expected id ${id} at ${entityRoute.apiIdPath.join(".")} but got ${resolvedId ?? "undefined"}`,
      }
    }
    return { ok: true, payload }
  } catch {
    return { ok: false, reason: `response at ${path} is not valid JSON` }
  }
}

async function runEntityPeriodChecks(ownerCookie, entityRoutes) {
  if (!ownerCookie) {
    console.log("SKIP Entity period-window checks (set TEST_OWNER_COOKIE to run)")
    return { passed: 0, failed: 0, skipped: entityRoutes.length }
  }

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const entityRoute of entityRoutes) {
    if (!entityRoute.id) {
      console.log(`SKIP ${entityRoute.label} period checks (set ${entityRoute.envName} or ensure entities exist)`)
      skipped += 1
      continue
    }

    const base30 = await fetchEntityPayload(entityRoute, entityRoute.id, ownerCookie, "days=30")
    if (!base30.ok) {
      fail(`${entityRoute.label} period checks`, base30.reason)
      failed += 1
      continue
    }

    const invalidDays = await fetchEntityPayload(entityRoute, entityRoute.id, ownerCookie, "days=999")
    if (!invalidDays.ok) {
      fail(`${entityRoute.label} invalid-days fallback`, invalidDays.reason)
      failed += 1
      continue
    }

    const invalidRange = await fetchEntityPayload(
      entityRoute,
      entityRoute.id,
      ownerCookie,
      "startDate=2030-12-31&endDate=2030-01-01"
    )
    if (!invalidRange.ok) {
      fail(`${entityRoute.label} invalid-range fallback`, invalidRange.reason)
      failed += 1
      continue
    }

    const summary30 = entityRoute.getSummary(base30.payload)
    const summaryInvalidDays = entityRoute.getSummary(invalidDays.payload)
    const summaryInvalidRange = entityRoute.getSummary(invalidRange.payload)
    if (!summaryMatches(summary30, summaryInvalidDays)) {
      fail(
        `${entityRoute.label} invalid-days fallback`,
        `expected days=999 to match days=30 summary (${JSON.stringify(summary30)} vs ${JSON.stringify(summaryInvalidDays)})`
      )
      failed += 1
      continue
    }
    if (!summaryMatches(summary30, summaryInvalidRange)) {
      fail(
        `${entityRoute.label} invalid-range fallback`,
        `expected invalid date range to match days=30 summary (${JSON.stringify(summary30)} vs ${JSON.stringify(summaryInvalidRange)})`
      )
      failed += 1
      continue
    }

    const days7 = await fetchEntityPayload(entityRoute, entityRoute.id, ownerCookie, "days=7")
    const days90 = await fetchEntityPayload(entityRoute, entityRoute.id, ownerCookie, "days=90")
    if (!days7.ok || !days90.ok) {
      fail(
        `${entityRoute.label} period-window checks`,
        `failed to fetch days windows (${days7.ok ? "days=7 ok" : days7.reason}; ${days90.ok ? "days=90 ok" : days90.reason})`
      )
      failed += 1
      continue
    }

    const summary7 = entityRoute.getSummary(days7.payload)
    const summary90 = entityRoute.getSummary(days90.payload)
    if (
      !summaryIsNonDecreasing(summary7, summary30, entityRoute.monotonicKeys) ||
      !summaryIsNonDecreasing(summary30, summary90, entityRoute.monotonicKeys)
    ) {
      fail(
        `${entityRoute.label} period monotonicity`,
        `expected 7d <= 30d <= 90d summaries (${JSON.stringify(summary7)} | ${JSON.stringify(summary30)} | ${JSON.stringify(summary90)})`
      )
      failed += 1
      continue
    }

    if (REQUIRE_DATA) {
      const historicalRange = await fetchEntityPayload(
        entityRoute,
        entityRoute.id,
        ownerCookie,
        "startDate=2000-01-01&endDate=2000-01-07"
      )
      if (!historicalRange.ok) {
        fail(`${entityRoute.label} custom-range check`, historicalRange.reason)
        failed += 1
        continue
      }

      const summaryHistorical = entityRoute.getSummary(historicalRange.payload)
      const hasCurrentValues = Object.values(summary30).some((value) => Math.abs(toNumber(value)) > 0.01)
      if (hasCurrentValues && summaryMatches(summary30, summaryHistorical)) {
        console.log(
          `INFO ${entityRoute.label} custom-range check (explicit range matched days=30 summary: ${JSON.stringify(summaryHistorical)})`
        )
      }
    }

    pass(`${entityRoute.label} period-window checks`)
    passed += 1
  }

  return { passed, failed, skipped }
}

async function run() {
  printSuiteStart("Reporting Regression Smoke")

  let passed = 0
  let failed = 0
  let skipped = 0
  let resolvedEntityRoutes = ENTITY_ROUTES

  if (!TEST_OWNER_COOKIE) {
    console.log("SKIP Studio and entity route checks (set TEST_OWNER_COOKIE to run)")
    skipped += 1 + ENTITY_ROUTES.length
  } else {
    resolvedEntityRoutes = await resolveEntityRouteIds(TEST_OWNER_COOKIE, ENTITY_ROUTES)

    const studioResult = await runRouteCheck({
      label: "Studio reports page loads with empty-state + tab sections",
      path: "/studio/reports",
      cookie: TEST_OWNER_COOKIE,
    })

    if (studioResult.ok) passed += 1
    else failed += 1

    for (const entityRoute of resolvedEntityRoutes) {
      if (!entityRoute.id) {
        console.log(`SKIP ${entityRoute.label} (set ${entityRoute.envName} or ensure entities exist)`)
        skipped += 1
        continue
      }

      const routeResult = await runRouteCheck({
        label: entityRoute.label,
        path: entityRoute.route(entityRoute.id),
        cookie: TEST_OWNER_COOKIE,
      })

      if (routeResult.ok) passed += 1
      else failed += 1
    }
  }

  if (!TEST_TEACHER_COOKIE) {
    console.log("SKIP Teacher reports page check (set TEST_TEACHER_COOKIE or TEST_OWNER_COOKIE)")
    skipped += 1
  } else {
    const teacherResult = await runRouteCheck({
      label: "Teacher reports page loads with empty-state + stat cards",
      path: "/teacher/reports",
      cookie: TEST_TEACHER_COOKIE,
    })

    if (teacherResult.ok) passed += 1
    else failed += 1
  }

  const dataPresence = await runDataPresenceChecks(TEST_OWNER_COOKIE, TEST_TEACHER_COOKIE)
  passed += dataPresence.passed
  failed += dataPresence.failed
  skipped += dataPresence.skipped

  const studioConsistency = await runStudioReportConsistencyChecks(TEST_OWNER_COOKIE)
  passed += studioConsistency.passed
  failed += studioConsistency.failed
  skipped += studioConsistency.skipped

  const reportIntegrity = await runReportIntegrityChecks(TEST_OWNER_COOKIE)
  passed += reportIntegrity.passed
  failed += reportIntegrity.failed
  skipped += reportIntegrity.skipped

  const teacherConsistency = await runTeacherReportConsistencyChecks(TEST_TEACHER_COOKIE)
  passed += teacherConsistency.passed
  failed += teacherConsistency.failed
  skipped += teacherConsistency.skipped

  const entityApiChecks = await runEntityApiChecks(TEST_OWNER_COOKIE, resolvedEntityRoutes)
  passed += entityApiChecks.passed
  failed += entityApiChecks.failed
  skipped += entityApiChecks.skipped

  const entityPeriodChecks = await runEntityPeriodChecks(TEST_OWNER_COOKIE, resolvedEntityRoutes)
  passed += entityPeriodChecks.passed
  failed += entityPeriodChecks.failed
  skipped += entityPeriodChecks.skipped

  const extendedSurfaceChecks = await runExtendedSurfaceChecks(TEST_OWNER_COOKIE)
  passed += extendedSurfaceChecks.passed
  failed += extendedSurfaceChecks.failed
  skipped += extendedSurfaceChecks.skipped

  console.log("\n--- Reporting Regression Smoke Summary ---")
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  if (skipped > 0 && FAIL_ON_SKIP) {
    fail("Reporting regression smoke summary", `skipped checks are disallowed (Skipped: ${skipped})`)
    process.exitCode = 1
    return
  }

  if (failed > 0) {
    process.exitCode = 1
  }
}

await run()
