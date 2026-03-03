import { strict as assert } from "assert"
import {
  attachParticipantsToEntries,
  compareLeaderboardEntries,
  createStudioParticipantMap,
  createTeacherParticipantMap,
  resolveExpectedParticipantCount,
} from "../../src/lib/leaderboards/presentation"

assert.equal(compareLeaderboardEntries({ id: "a", score: 10 }, { id: "b", score: 20 }, true), 10)
assert.equal(compareLeaderboardEntries({ id: "a", score: 10 }, { id: "b", score: 20 }, false), -10)
assert.equal(compareLeaderboardEntries({ id: "a", score: 10 }, { id: "b", score: 10 }, true), -1)

assert.equal(resolveExpectedParticipantCount("STUDIO", { studioCount: 8, teacherCount: 55 }), 8)
assert.equal(resolveExpectedParticipantCount("TEACHER", { studioCount: 8, teacherCount: 55 }), 55)

const studioById = createStudioParticipantMap([
  { id: "s1", name: "Studio One", subdomain: "studio-one" },
])
const teacherById = createTeacherParticipantMap([
  { id: "t1", name: "Teacher One", studioId: "s1" },
])

const attached = attachParticipantsToEntries(
  [
    { id: "e1", studioId: "s1", teacherId: null, score: 10 },
    { id: "e2", studioId: null, teacherId: "t1", score: 8 },
    { id: "e3", studioId: "missing", teacherId: null, score: 7 },
  ],
  {
    studioById,
    teacherById,
  }
)

assert.equal(attached.length, 2)
assert.equal(attached[0].participant?.name, "Studio One")
assert.equal(attached[1].participant?.name, "Teacher One")

console.log("Leaderboard presentation logic passed")
