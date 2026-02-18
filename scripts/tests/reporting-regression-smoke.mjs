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
    route: (id) => `/studio/clients/${id}?tab=reports`,
    expectedTexts: ["Reports", "No data in selected period", "Total Sessions", "Attendance Rate"],
  },
  {
    label: "Teacher reports tab",
    envName: "TEST_STUDIO_TEACHER_ID",
    id: TEST_STUDIO_TEACHER_ID,
    route: (id) => `/studio/teachers/${id}?tab=reports`,
    expectedTexts: ["Reports", "No data in selected period", "Classes Taught", "Avg Class Size"],
  },
  {
    label: "Class reports tab",
    envName: "TEST_STUDIO_CLASS_ID",
    id: TEST_STUDIO_CLASS_ID,
    route: (id) => `/studio/classes/${id}?tab=reports`,
    expectedTexts: ["Reports", "No data in selected period", "Total Sessions", "Attendance Rate"],
  },
  {
    label: "Location reports tab",
    envName: "TEST_STUDIO_LOCATION_ID",
    id: TEST_STUDIO_LOCATION_ID,
    route: (id) => `/studio/locations/${id}?tab=reports`,
    expectedTexts: ["Reports", "No data in selected period", "Total Sessions", "Fill Rate"],
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

  const contains = assertContainsAll(html, expectedTexts)
  if (!contains.ok) {
    fail(label, `missing expected text: ${contains.missing.join(", ")}`)
    return { ok: false }
  }

  pass(label, "200 + expected sections + no known runtime error markers")
  return { ok: true }
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function studioHasData(payload) {
  return (
    toNumber(payload?.overview?.revenue?.total) > 0 ||
    toNumber(payload?.overview?.bookings?.total) > 0 ||
    toNumber(payload?.overview?.newClients?.total) > 0 ||
    toNumber(payload?.overview?.activeMembers?.total) > 0
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

async function run() {
  printSuiteStart("Reporting Regression Smoke")

  let passed = 0
  let failed = 0
  let skipped = 0

  if (!TEST_OWNER_COOKIE) {
    console.log("SKIP Studio and entity route checks (set TEST_OWNER_COOKIE to run)")
    skipped += 1 + ENTITY_ROUTES.length
  } else {
    const studioResult = await runRouteCheck({
      label: "Studio reports page loads with empty-state + tab sections",
      path: "/studio/reports",
      cookie: TEST_OWNER_COOKIE,
      expectedTexts: [
        "Reports & Analytics",
        "No data for this period",
        "Overview",
        "Marketing",
        "Website",
        "Social Media",
      ],
    })

    if (studioResult.ok) passed += 1
    else failed += 1

    for (const entityRoute of ENTITY_ROUTES) {
      if (!entityRoute.id) {
        console.log(`SKIP ${entityRoute.label} (set ${entityRoute.envName})`)
        skipped += 1
        continue
      }

      const routeResult = await runRouteCheck({
        label: entityRoute.label,
        path: entityRoute.route(entityRoute.id),
        cookie: TEST_OWNER_COOKIE,
        expectedTexts: entityRoute.expectedTexts,
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
      expectedTexts: [
        "My Reports",
        "Track your performance and growth",
        "Classes This Month",
        "Students Taught",
        "No class data yet for this month.",
      ],
    })

    if (teacherResult.ok) passed += 1
    else failed += 1
  }

  const dataPresence = await runDataPresenceChecks(TEST_OWNER_COOKIE, TEST_TEACHER_COOKIE)
  passed += dataPresence.passed
  failed += dataPresence.failed
  skipped += dataPresence.skipped

  console.log("\n--- Reporting Regression Smoke Summary ---")
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

await run()
