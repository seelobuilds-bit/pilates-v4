import assert from "node:assert/strict"
import {
  resolveMobileClientReportId,
  resolveMobileTeacherReportId,
} from "../../src/lib/reporting/mobile-report-role-context"

assert.equal(resolveMobileTeacherReportId({ teacherId: "teacher_1" }), "teacher_1")
assert.throws(() => resolveMobileTeacherReportId({ teacherId: null }), /Teacher session invalid/)

assert.equal(resolveMobileClientReportId({ clientId: "client_1", sub: "user_1" }), "client_1")
assert.equal(resolveMobileClientReportId({ clientId: null, sub: "user_1" }), "user_1")

console.log("Reporting mobile role context logic passed")
