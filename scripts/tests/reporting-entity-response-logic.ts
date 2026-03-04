import assert from "node:assert/strict"
import {
  buildClassTypeEntityResponse,
  buildClientEntityResponse,
  buildLocationEntityResponse,
  buildTeacherEntityResponse,
} from "../../src/lib/reporting/entity-response"

function run() {
  const teacherBase = {
    id: "teacher_1",
    user: { firstName: "Ava", lastName: "Lee" },
  }

  const teacherWithSchedule = buildTeacherEntityResponse({
    teacher: teacherBase,
    upcomingClasses: [{ id: "c1" }],
    scheduleClasses: [{ id: "c2" }],
    stats: { sessions: 10 },
    extendedStats: { completionRate: 82 },
  })

  assert.equal(teacherWithSchedule.id, "teacher_1")
  assert.equal(Array.isArray((teacherWithSchedule as { scheduleClasses?: unknown[] }).scheduleClasses), true)

  const teacherWithoutSchedule = buildTeacherEntityResponse({
    teacher: teacherBase,
    upcomingClasses: [{ id: "c1" }],
    stats: { sessions: 10 },
    extendedStats: { completionRate: 82 },
  })

  assert.equal("scheduleClasses" in teacherWithoutSchedule, false)

  const clientPayload = buildClientEntityResponse({
    client: { id: "client_1" },
    bookings: [{ id: "b1" }],
    stats: { attendanceRate: 90 },
    communications: [{ id: "m1" }],
  })

  assert.equal((clientPayload.client as { id: string }).id, "client_1")
  assert.equal(clientPayload.bookings.length, 1)

  const classTypePayload = buildClassTypeEntityResponse({
    classType: { id: "ct_1", name: "Reformer" },
    stats: { fillRate: 76 },
    locationIds: ["l1", "l2"],
    teacherIds: ["t1"],
  })

  assert.equal(classTypePayload.name, "Reformer")
  assert.equal(classTypePayload.locationIds.length, 2)

  const locationPayload = buildLocationEntityResponse({
    location: { id: "loc_1", name: "Downtown" },
    stats: { occupancy: 66 },
  })

  assert.equal(locationPayload.name, "Downtown")
  assert.deepEqual(locationPayload.stats, { occupancy: 66 })

  console.log("Reporting entity response logic passed")
}

run()
