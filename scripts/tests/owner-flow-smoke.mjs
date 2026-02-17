import { printSuiteStart, request } from "./_http.mjs"

const OWNER_ROUTES = [
  "/studio",
  "/studio/schedule",
  "/studio/inbox",
  "/studio/marketing",
  "/studio/settings",
]

const UNAUTHORIZED_STATUSES = [302, 303, 307, 308, 401]
const TEST_OWNER_COOKIE = process.env.TEST_OWNER_COOKIE

function pass(label, status) {
  console.log(`PASS ${label} -> ${status}`)
}

function fail(label, expected, status) {
  const expectedText = Array.isArray(expected) ? expected.join(" or ") : String(expected)
  console.log(`FAIL ${label} expected ${expectedText} but got ${status}`)
}

async function check({ label, path, expectedStatus, options }) {
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

  printSuiteStart("Owner Flow Smoke")

  // Required unauthorized check
  {
    const result = await check({
      label: "Anonymous user is blocked from /studio",
      path: "/studio",
      expectedStatus: UNAUTHORIZED_STATUSES,
    })
    if (result.ok) passed += 1
    else failed += 1
  }

  // Required auth check(s)
  if (!TEST_OWNER_COOKIE) {
    skipped += OWNER_ROUTES.length
    console.log("SKIP Authenticated owner route checks (set TEST_OWNER_COOKIE to run)")
  } else {
    for (const path of OWNER_ROUTES) {
      const result = await check({
        label: `Authenticated owner can load ${path}`,
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

  console.log("\n--- Owner Flow Smoke Summary ---")
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

await run()
