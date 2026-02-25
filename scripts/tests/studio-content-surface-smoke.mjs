import { printSuiteStart, request } from "./_http.mjs"

const UNAUTHORIZED_STATUSES = [302, 303, 307, 308, 401]
const TEST_OWNER_COOKIE = process.env.TEST_OWNER_COOKIE

const OWNER_PAGE_ROUTES = [
  "/studio/class-flows",
  "/studio/marketing/social",
  "/studio/vault",
]

const OWNER_API_ROUTES = [
  "/api/class-flows",
  "/api/social-media/training",
  "/api/vault/courses",
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

    for (const path of OWNER_API_ROUTES) {
      const result = await runRouteCheck({
        label: `Owner API ${path} responds`,
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
