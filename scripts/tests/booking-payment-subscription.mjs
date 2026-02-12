import { printSuiteStart, request, assertStatus, runChecks } from "./_http.mjs"

printSuiteStart("Booking + Payment + Subscription")

const subdomain = process.env.TEST_BOOKING_SUBDOMAIN || "demo"
const basePath = `/api/booking/${subdomain}`

const catalogCheck = await request(`${basePath}/data`)
assertStatus("Booking catalog data is reachable", catalogCheck, [200, 404])
console.log(`PASS Booking catalog data is reachable -> ${catalogCheck.status}`)

if (catalogCheck.status === 404) {
  console.log(
    `SKIP booking/payment/subscription assertions because subdomain '${subdomain}' was not found. ` +
      "Set TEST_BOOKING_SUBDOMAIN to a valid booking tenant to run full coverage."
  )
  process.exit(0)
}

await runChecks([
  {
    name: "Create payment intent validates payload",
    path: `${basePath}/create-payment-intent`,
    options: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
    expectedStatus: [400, 401],
  },
  {
    name: "Confirm payment validates required payload",
    path: `${basePath}/confirm-payment`,
    options: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
    expectedStatus: 400,
  },
  {
    name: "Subscription intent requires client auth",
    path: `${basePath}/create-subscription-intent`,
    options: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
    expectedStatus: 401,
  },
  {
    name: "Confirm subscription requires client auth",
    path: `${basePath}/confirm-subscription`,
    options: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
    expectedStatus: 401,
  },
  {
    name: "Cancel subscription validates payload or auth",
    path: `${basePath}/cancel-subscription`,
    options: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
    expectedStatus: [400, 401],
  },
  {
    name: "Renew subscription validates payload or auth",
    path: `${basePath}/renew-subscription`,
    options: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
    expectedStatus: [400, 401],
  },
  {
    name: "Booking cancellation endpoint requires client auth",
    path: `${basePath}/my-bookings/example-booking-id`,
    options: {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
    expectedStatus: 401,
  },
  {
    name: "My orders endpoint requires client auth",
    path: `${basePath}/my-orders`,
    expectedStatus: 401,
  },
])

console.log("Booking/payment/subscription checks completed.")
