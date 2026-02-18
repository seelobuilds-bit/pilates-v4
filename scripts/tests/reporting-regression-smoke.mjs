import { printSuiteStart, request } from "./_http.mjs"

const TEST_OWNER_COOKIE = process.env.TEST_OWNER_COOKIE
const TEST_TEACHER_COOKIE = process.env.TEST_TEACHER_COOKIE || TEST_OWNER_COOKIE

const TEST_STUDIO_CLIENT_ID = process.env.TEST_STUDIO_CLIENT_ID
const TEST_STUDIO_TEACHER_ID = process.env.TEST_STUDIO_TEACHER_ID
const TEST_STUDIO_CLASS_ID = process.env.TEST_STUDIO_CLASS_ID
const TEST_STUDIO_LOCATION_ID = process.env.TEST_STUDIO_LOCATION_ID

const REQUIRE_DATA = process.env.TEST_REQUIRE_REPORT_DATA === "1"

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
  },
  {
    label: "Teacher reports tab",
    envName: "TEST_STUDIO_TEACHER_ID",
    id: TEST_STUDIO_TEACHER_ID,
    listRoute: "/api/studio/teachers",
    route: (id) => `/studio/teachers/${id}?tab=reports`,
    apiRoute: (id) => `/api/studio/teachers/${id}`,
    apiIdPath: ["id"],
  },
  {
    label: "Class reports tab",
    envName: "TEST_STUDIO_CLASS_ID",
    id: TEST_STUDIO_CLASS_ID,
    listRoute: "/api/studio/class-types",
    route: (id) => `/studio/classes/${id}?tab=reports`,
    apiRoute: (id) => `/api/studio/class-types/${id}`,
    apiIdPath: ["id"],
  },
  {
    label: "Location reports tab",
    envName: "TEST_STUDIO_LOCATION_ID",
    id: TEST_STUDIO_LOCATION_ID,
    listRoute: "/api/studio/locations",
    route: (id) => `/studio/locations/${id}?tab=reports`,
    apiRoute: (id) => `/api/studio/locations/${id}`,
    apiIdPath: ["id"],
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

  const teacherConsistency = await runTeacherReportConsistencyChecks(TEST_TEACHER_COOKIE)
  passed += teacherConsistency.passed
  failed += teacherConsistency.failed
  skipped += teacherConsistency.skipped

  const entityApiChecks = await runEntityApiChecks(TEST_OWNER_COOKIE, resolvedEntityRoutes)
  passed += entityApiChecks.passed
  failed += entityApiChecks.failed
  skipped += entityApiChecks.skipped

  console.log("\n--- Reporting Regression Smoke Summary ---")
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

await run()
