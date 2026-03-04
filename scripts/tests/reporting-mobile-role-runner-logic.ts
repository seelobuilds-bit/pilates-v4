import assert from "node:assert/strict"
import { runMobileReportByRole } from "../../src/lib/reporting/mobile-report-role-runner"

type TestPayload = {
  role: "owner" | "teacher" | "client"
}

async function runOwnerCase() {
  let ownerCalled = false
  const payload = await runMobileReportByRole({
    decoded: {
      role: "OWNER",
      sub: "owner_1",
    },
    runOwner: async () => {
      ownerCalled = true
      return { role: "owner" } as TestPayload as never
    },
    runTeacher: async () => ({ role: "teacher" } as TestPayload as never),
    runClient: async () => ({ role: "client" } as TestPayload as never),
  })

  assert.equal(ownerCalled, true)
  assert.equal((payload as unknown as TestPayload).role, "owner")
}

async function runTeacherCase() {
  let capturedTeacherId: string | null = null
  const payload = await runMobileReportByRole({
    decoded: {
      role: "TEACHER",
      sub: "teacher_user",
      teacherId: "teacher_1",
    },
    runOwner: async () => ({ role: "owner" } as TestPayload as never),
    runTeacher: async (teacherId) => {
      capturedTeacherId = teacherId
      return { role: "teacher" } as TestPayload as never
    },
    runClient: async () => ({ role: "client" } as TestPayload as never),
  })

  assert.equal(capturedTeacherId, "teacher_1")
  assert.equal((payload as unknown as TestPayload).role, "teacher")
}

async function runClientCase() {
  let capturedClientId: string | null = null
  const payload = await runMobileReportByRole({
    decoded: {
      role: "CLIENT",
      sub: "client_sub",
      clientId: null,
    },
    runOwner: async () => ({ role: "owner" } as TestPayload as never),
    runTeacher: async () => ({ role: "teacher" } as TestPayload as never),
    runClient: async (clientId) => {
      capturedClientId = clientId
      return { role: "client" } as TestPayload as never
    },
  })

  assert.equal(capturedClientId, "client_sub")
  assert.equal((payload as unknown as TestPayload).role, "client")
}

async function runTeacherErrorCase() {
  let rejected = false
  try {
    await runMobileReportByRole({
      decoded: {
        role: "TEACHER",
        sub: "teacher_user",
        teacherId: null,
      },
      runOwner: async () => ({ role: "owner" } as TestPayload as never),
      runTeacher: async () => ({ role: "teacher" } as TestPayload as never),
      runClient: async () => ({ role: "client" } as TestPayload as never),
    })
  } catch {
    rejected = true
  }
  assert.equal(rejected, true)
}

Promise.resolve()
  .then(runOwnerCase)
  .then(runTeacherCase)
  .then(runClientCase)
  .then(runTeacherErrorCase)
  .then(() => {
    console.log("Reporting mobile role runner logic passed")
  })
