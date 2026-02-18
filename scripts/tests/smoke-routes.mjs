import { printSuiteStart, runChecks } from "./_http.mjs"

printSuiteStart("Core Smoke")

await runChecks([
  {
    name: "Landing page loads",
    path: "/",
    expectedStatus: 200,
  },
  {
    name: "Login page loads",
    path: "/login",
    expectedStatus: 200,
  },
  {
    name: "Book demo page loads",
    path: "/book-demo",
    expectedStatus: 200,
  },
  {
    name: "Demo store page loads",
    path: "/demo/store",
    expectedStatus: 200,
  },
  {
    name: "Debug stripe endpoint remains protected",
    path: "/api/debug-stripe",
    expectedStatus: [401, 404],
  },
])

console.log("Smoke checks completed.")
