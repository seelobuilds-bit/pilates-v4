import { printSuiteStart, runChecks } from "./_http.mjs"

printSuiteStart("Authz Boundaries")

await runChecks([
  {
    name: "Owner settings endpoint denies anonymous access",
    path: "/api/studio/settings",
    expectedStatus: 401,
  },
  {
    name: "Studio teachers endpoint denies anonymous access",
    path: "/api/studio/teachers",
    expectedStatus: 401,
  },
  {
    name: "HQ users endpoint denies anonymous access",
    path: "/api/hq/users",
    expectedStatus: 401,
  },
  {
    name: "Debug session endpoint denies anonymous access",
    path: "/api/debug-session",
    expectedStatus: [401, 404],
  },
  {
    name: "Social account connect denies anonymous access",
    path: "/api/social-media/accounts",
    options: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platform: "INSTAGRAM",
        username: "integration-test",
      }),
    },
    expectedStatus: 401,
  },
  {
    name: "Vault enrollments endpoint denies anonymous access",
    path: "/api/vault/enrollments",
    expectedStatus: 401,
  },
])

console.log("Authz boundary checks completed.")
