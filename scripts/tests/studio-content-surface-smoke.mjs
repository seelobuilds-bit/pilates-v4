import { printSuiteStart, request } from "./_http.mjs"

const UNAUTHORIZED_STATUSES = [302, 303, 307, 308, 401]
const TEST_OWNER_COOKIE = process.env.TEST_OWNER_COOKIE

const OWNER_PAGE_ROUTES = [
  "/studio/class-flows",
  "/studio/marketing/social",
  "/studio/vault",
  "/studio/leaderboards",
]

const OWNER_API_ROUTES = [
  {
    path: "/api/class-flows",
    label: "Class flows API",
    assertPayload: (payload) =>
      Array.isArray(payload?.categories) &&
      Array.isArray(payload?.featured) &&
      payload?.progress &&
      typeof payload.progress === "object",
  },
  {
    path: "/api/social-media/training",
    label: "Social training API",
    assertPayload: (payload) =>
      Array.isArray(payload?.categories) &&
      Array.isArray(payload?.contentIdeas) &&
      Array.isArray(payload?.upcomingEvents),
  },
  {
    path: "/api/vault/courses",
    label: "Vault courses API",
    assertPayload: (payload) => Array.isArray(payload?.courses) && Array.isArray(payload?.categories),
  },
  {
    path: "/api/leaderboards?type=STUDIO",
    label: "Studio leaderboards API",
    assertPayload: (payload) =>
      Array.isArray(payload?.leaderboards) &&
      ((payload?.myRanks && typeof payload.myRanks === "object") ||
        (payload?.userRanks && typeof payload.userRanks === "object")),
  },
]

function pass(label, status) {
  console.log(`PASS ${label} -> ${status}`)
}

function fail(label, expected, status) {
  const expectedText = Array.isArray(expected) ? expected.join(" or ") : String(expected)
  console.log(`FAIL ${label} expected ${expectedText} but got ${status}`)
}

async function runRouteCheck({ label, path, expectedStatus, options }) {
  const response = await request(path, options)
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
  if (expected.includes(response.status)) {
    pass(label, response.status)
    return { ok: true }
  }

  fail(label, expectedStatus, response.status)
  return { ok: false }
}

async function runApiShapeCheck({ label, path, options, assertPayload }) {
  const response = await request(path, options)

  if (response.status !== 200) {
    fail(label, 200, response.status)
    return { ok: false }
  }

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    fail(label, "application/json", contentType || "unknown")
    return { ok: false }
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    fail(label, "valid JSON payload", "invalid JSON")
    return { ok: false }
  }

  if (typeof assertPayload === "function" && !assertPayload(payload)) {
    fail(label, "expected payload shape", "unexpected payload shape")
    return { ok: false }
  }

  pass(label, "200 + JSON + expected payload shape")
  return { ok: true }
}

async function run() {
  let passed = 0
  let failed = 0
  let skipped = 0

  printSuiteStart("Studio Content Surface Smoke")

  try {
    await request("/")
  } catch {
    console.log("SKIP Base URL is unreachable (set TEST_BASE_URL or run local server)")
    return
  }

  for (const path of OWNER_PAGE_ROUTES) {
    const response = await request(path)
    const finalPath = new URL(response.url).pathname
    const blockedByRedirect = finalPath === "/login"
    const blockedByStatus = UNAUTHORIZED_STATUSES.includes(response.status)

    if (blockedByRedirect || blockedByStatus) {
      pass(`Anonymous blocked from ${path}`, `${response.status}${blockedByRedirect ? " -> /login" : ""}`)
      passed += 1
    } else {
      fail(`Anonymous blocked from ${path}`, [...UNAUTHORIZED_STATUSES, "redirect to /login"], response.status)
      failed += 1
    }
  }

  if (!TEST_OWNER_COOKIE) {
    skipped += OWNER_PAGE_ROUTES.length + OWNER_API_ROUTES.length
    console.log("SKIP Authenticated owner checks (set TEST_OWNER_COOKIE to run)")
  } else {
    for (const path of OWNER_PAGE_ROUTES) {
      const result = await runRouteCheck({
        label: `Owner can load ${path}`,
        path,
        expectedStatus: 200,
        options: {
          headers: {
            cookie: TEST_OWNER_COOKIE,
          },
        },
      })

      if (result.ok) passed += 1
      else failed += 1
    }

    for (const route of OWNER_API_ROUTES) {
      const result = await runApiShapeCheck({
        label: `${route.label} responds`,
        path: route.path,
        options: {
          headers: {
            cookie: TEST_OWNER_COOKIE,
          },
        },
        assertPayload: route.assertPayload,
      })

      if (result.ok) passed += 1
      else failed += 1
    }
  }

  console.log("\n--- Studio Content Surface Smoke Summary ---")
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

await run()
