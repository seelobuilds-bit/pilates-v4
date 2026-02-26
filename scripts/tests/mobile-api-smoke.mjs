import { printSuiteStart, request } from "./_http.mjs"

const TEST_REQUIRE_MOBILE_SMOKE = String(process.env.TEST_REQUIRE_MOBILE_SMOKE || "").trim() === "1"
const TEST_MOBILE_CHECK_BRANDING_ROUTE = String(process.env.TEST_MOBILE_CHECK_BRANDING_ROUTE || "").trim() === "1"
const TEST_MOBILE_STUDIO_SUBDOMAIN = String(process.env.TEST_MOBILE_STUDIO_SUBDOMAIN || "").trim().toLowerCase()
const TEST_MOBILE_OWNER_EMAIL = String(process.env.TEST_MOBILE_OWNER_EMAIL || "").trim().toLowerCase()
const TEST_MOBILE_OWNER_PASSWORD = String(process.env.TEST_MOBILE_OWNER_PASSWORD || "")
const TEST_MOBILE_TEACHER_EMAIL = String(process.env.TEST_MOBILE_TEACHER_EMAIL || "").trim().toLowerCase()
const TEST_MOBILE_TEACHER_PASSWORD = String(process.env.TEST_MOBILE_TEACHER_PASSWORD || "")
const TEST_MOBILE_CLIENT_EMAIL = String(process.env.TEST_MOBILE_CLIENT_EMAIL || "").trim().toLowerCase()
const TEST_MOBILE_CLIENT_PASSWORD = String(process.env.TEST_MOBILE_CLIENT_PASSWORD || "")

let passed = 0
let failed = 0
let skipped = 0

function pass(label, detail) {
  console.log(`PASS ${label}${detail ? ` -> ${detail}` : ""}`)
  passed += 1
}

function fail(label, expected, actual) {
  console.log(`FAIL ${label} expected ${expected} but got ${actual}`)
  failed += 1
}

function skip(label, reason) {
  console.log(`SKIP ${label}${reason ? ` (${reason})` : ""}`)
  skipped += 1
}

async function parseJsonSafe(response) {
  return response.json().catch(() => ({}))
}

async function preflight() {
  try {
    const response = await request("/api/mobile/bootstrap", {
      headers: {
        Authorization: "Bearer __preflight__",
      },
    })
    return response.status === 401 || response.status === 403
  } catch {
    return false
  }
}

async function login(label, email, password) {
  if (!TEST_MOBILE_STUDIO_SUBDOMAIN || !email || !password) {
    if (TEST_REQUIRE_MOBILE_SMOKE) {
      fail(`${label} login env`, "credentials + studio subdomain present", "missing required env vars")
      return null
    }
    skip(`${label} login`, "missing credentials/subdomain env vars")
    return null
  }

  const response = await request("/api/mobile/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      studioSubdomain: TEST_MOBILE_STUDIO_SUBDOMAIN,
    }),
  })

  if (response.status !== 200) {
    fail(`${label} login`, "200", response.status)
    const payload = await parseJsonSafe(response)
    console.log(`  ${label} login payload:`, payload)
    return null
  }

  const payload = await parseJsonSafe(response)
  if (!payload?.token || !payload?.user?.role) {
    fail(`${label} login payload`, "token + user.role", "missing fields")
    return null
  }

  pass(`${label} login`, `${response.status} (${payload.user.role})`)
  return payload.token
}

async function checkAuthorized({ label, token, path, expectedStatus = 200 }) {
  if (!token) {
    skip(label, "missing token")
    return
  }

  const response = await request(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === expectedStatus) {
    pass(label, response.status)
    return
  }

  fail(label, expectedStatus, response.status)
  const payload = await parseJsonSafe(response)
  console.log(`  ${label} payload:`, payload)
}

async function run() {
  printSuiteStart("Mobile API Smoke")
  const reachable = await preflight()
  if (!reachable) {
    if (TEST_REQUIRE_MOBILE_SMOKE) {
      fail("Mobile API preflight", "reachable API base with /api/mobile routes", "network unreachable")
      process.exitCode = 1
      return
    }
    skip("Mobile API preflight", "API base URL unreachable; set TEST_BASE_URL or start local dev server")
    console.log("\n--- Mobile API Smoke Summary ---")
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Skipped: ${skipped}`)
    return
  }

  const ownerToken = await login("Owner", TEST_MOBILE_OWNER_EMAIL, TEST_MOBILE_OWNER_PASSWORD)

  await checkAuthorized({
    label: "Invalid bearer token is rejected",
    token: "__invalid__",
    path: "/api/mobile/bootstrap",
    expectedStatus: 401,
  })

  const ownerChecks = [
    ["/api/mobile/bootstrap", "Owner bootstrap"],
    ["/api/mobile/reports?days=30", "Owner reports"],
    ["/api/mobile/schedule", "Owner schedule"],
    ["/api/mobile/inbox", "Owner inbox"],
    ["/api/mobile/clients", "Owner clients"],
    ["/api/mobile/class-types", "Owner class types"],
    ["/api/mobile/teachers", "Owner teachers"],
    ["/api/mobile/locations", "Owner locations"],
    ["/api/mobile/invoices", "Owner invoices"],
    ["/api/mobile/payments", "Owner payments"],
    ["/api/mobile/leaderboards", "Owner studio leaderboards"],
    ["/api/mobile/leaderboards?type=TEACHER", "Owner teacher leaderboards"],
    ["/api/mobile/marketing", "Owner marketing"],
    ["/api/mobile/social", "Owner social"],
    ["/api/mobile/vault", "Owner vault"],
    ["/api/mobile/community", "Owner community"],
    ["/api/mobile/store", "Owner store"],
  ]
  if (TEST_MOBILE_CHECK_BRANDING_ROUTE) {
    ownerChecks.push(["/api/mobile/studio/branding", "Owner studio branding"])
  }

  for (const [path, label] of ownerChecks) {
    await checkAuthorized({ label, token: ownerToken, path })
  }

  const teacherToken = await login("Teacher", TEST_MOBILE_TEACHER_EMAIL, TEST_MOBILE_TEACHER_PASSWORD)
  if (teacherToken) {
    await checkAuthorized({ label: "Teacher bootstrap", token: teacherToken, path: "/api/mobile/bootstrap" })
    await checkAuthorized({ label: "Teacher reports", token: teacherToken, path: "/api/mobile/reports?days=30" })
    await checkAuthorized({ label: "Teacher social", token: teacherToken, path: "/api/mobile/social" })
    await checkAuthorized({ label: "Teacher vault", token: teacherToken, path: "/api/mobile/vault" })
    await checkAuthorized({ label: "Teacher community", token: teacherToken, path: "/api/mobile/community" })
    await checkAuthorized({ label: "Teacher marketing is blocked", token: teacherToken, path: "/api/mobile/marketing", expectedStatus: 403 })
  }

  const clientToken = await login("Client", TEST_MOBILE_CLIENT_EMAIL, TEST_MOBILE_CLIENT_PASSWORD)
  if (clientToken) {
    await checkAuthorized({ label: "Client bootstrap", token: clientToken, path: "/api/mobile/bootstrap" })
    await checkAuthorized({ label: "Client schedule", token: clientToken, path: "/api/mobile/schedule" })
    await checkAuthorized({ label: "Client inbox", token: clientToken, path: "/api/mobile/inbox" })
    await checkAuthorized({ label: "Client reports", token: clientToken, path: "/api/mobile/reports?days=30" })
    await checkAuthorized({ label: "Client social is blocked", token: clientToken, path: "/api/mobile/social", expectedStatus: 403 })
    await checkAuthorized({ label: "Client marketing is blocked", token: clientToken, path: "/api/mobile/marketing", expectedStatus: 403 })
  }

  console.log("\n--- Mobile API Smoke Summary ---")
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

await run()
