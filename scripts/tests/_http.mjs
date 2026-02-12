const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000"

function toUrl(path) {
  return path.startsWith("http") ? path : `${BASE_URL}${path}`
}

export async function request(path, options = {}) {
  const response = await fetch(toUrl(path), options)
  return response
}

export function assertStatus(name, response, expected) {
  const expectedSet = Array.isArray(expected) ? expected : [expected]
  if (!expectedSet.includes(response.status)) {
    throw new Error(`${name} expected status ${expectedSet.join(" or ")} but got ${response.status}`)
  }
}

export async function runChecks(checks) {
  for (const check of checks) {
    const response = await request(check.path, check.options)
    assertStatus(check.name, response, check.expectedStatus)
    console.log(`PASS ${check.name} -> ${response.status}`)
  }
}

export function printSuiteStart(name) {
  console.log(`\n=== ${name} (${BASE_URL}) ===`)
}
