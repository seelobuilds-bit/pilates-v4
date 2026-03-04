import { buildTeacherPerformanceSummary } from "../../src/lib/reporting/teacher-performance"

const sessions = [
  {
    capacity: 10,
    classType: { name: "Reformer Beginner" },
    bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }, { status: "CANCELLED" }],
  },
  {
    capacity: 8,
    classType: { name: "Reformer Beginner" },
    bookings: [{ status: "NO_SHOW" }, { status: "COMPLETED" }],
  },
  {
    capacity: 6,
    classType: { name: "Mens Only Class" },
    bookings: [],
  },
]

const bookings = [
  { status: "COMPLETED", clientId: "a", paidAmount: 20, classSession: { classType: { price: 17 } } },
  { status: "CONFIRMED", clientId: "b", paidAmount: null, classSession: { classType: { price: 17 } } },
  { status: "CANCELLED", clientId: "c", paidAmount: 0, classSession: { classType: { price: 17 } } },
  { status: "NO_SHOW", clientId: "a", paidAmount: 17, classSession: { classType: { price: 17 } } },
  { status: "COMPLETED", clientId: "d", paidAmount: 18, classSession: { classType: { price: 17 } } },
]

const summary = buildTeacherPerformanceSummary(sessions, bookings, 1)

if (summary.totalClasses !== 3) throw new Error("Expected 3 classes")
if (summary.totalStudents !== 3) throw new Error(`Expected 3 unique students, got ${summary.totalStudents}`)
if (summary.revenue !== 72) throw new Error(`Expected revenue 72, got ${summary.revenue}`)
if (summary.avgClassSize !== 1.3) throw new Error(`Expected avg class size 1.3, got ${summary.avgClassSize}`)
if (summary.avgFillRate !== 15) throw new Error(`Expected avg fill 15, got ${summary.avgFillRate}`)
if (summary.completionRate !== 50) throw new Error(`Expected completion 50, got ${summary.completionRate}`)
if (summary.retentionRate !== 33.3) throw new Error(`Expected retention 33.3, got ${summary.retentionRate}`)
if (summary.topClasses[0]?.name !== "Reformer Beginner" || summary.topClasses[0]?.count !== 2) {
  throw new Error("Top class aggregation failed")
}

console.log("Reporting teacher performance logic passed")
