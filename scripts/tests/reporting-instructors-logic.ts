import assert from "node:assert/strict"
import { buildInstructorRows } from "../../src/lib/reporting/instructors"

const rows = buildInstructorRows({
  classSessions: [
    {
      teacherId: "t1",
      capacity: 10,
      bookings: [
        { status: "COMPLETED", clientId: "c1", paidAmount: 20 },
        { status: "CONFIRMED", clientId: "c1", paidAmount: null },
        { status: "NO_SHOW", clientId: "c2", paidAmount: 15 },
        { status: "CANCELLED", clientId: "c3", paidAmount: 999 },
      ],
      classType: { price: 25 },
      teacher: { user: { firstName: "Amelia", lastName: "Wilson" } },
    },
    {
      teacherId: "t2",
      capacity: 8,
      bookings: [{ status: "COMPLETED", clientId: "c4", paidAmount: 30 }],
      classType: { price: 30 },
      teacher: { user: { firstName: "Grace", lastName: "Jones" } },
    },
  ],
  studioTeachers: [
    {
      id: "t1",
      isActive: true,
      specialties: ["Reformer"],
      user: { firstName: "Amelia", lastName: "Wilson" },
    },
    {
      id: "t2",
      isActive: true,
      specialties: ["Tower"],
      user: { firstName: "Grace", lastName: "Jones" },
    },
    {
      id: "t3",
      isActive: true,
      specialties: ["Prenatal"],
      user: { firstName: "Hannah", lastName: "Ewing" },
    },
  ],
  previousClassCountByTeacherId: new Map([
    ["t1", 0],
    ["t2", 2],
    ["t3", 0],
  ]),
})

assert.equal(rows.length, 3)
assert.equal(rows[0].id, "t1")
assert.equal(rows[0].classes, 1)
assert.equal(rows[0].avgFill, 30)
assert.equal(rows[0].revenue, 60)
assert.equal(rows[0].retention, 50)
assert.equal(rows[0].trend, "up")
assert.deepEqual(rows[0].specialties, ["Reformer"])

assert.equal(rows[1].id, "t2")
assert.equal(rows[1].trend, "down")
assert.equal(rows[1].revenue, 30)

assert.equal(rows[2].id, "t3")
assert.equal(rows[2].classes, 0)
assert.equal(rows[2].avgFill, 0)
assert.equal(rows[2].trend, "stable")

console.log("Reporting instructors logic passed")
