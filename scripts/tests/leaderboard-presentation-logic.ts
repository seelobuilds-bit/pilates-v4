import { strict as assert } from "assert"
import {
  attachParticipantsToEntries,
  attachParticipantToEntry,
  buildUserRanksByLeaderboardId,
  compareLeaderboardEntries,
  collectEntryParticipantIds,
  collectCurrentPeriodIds,
  createStudioParticipantMap,
  createTeacherParticipantMap,
  groupLeaderboardsByDisplayCategory,
  LEADERBOARD_DISPLAY_CATEGORIES,
  resolveLeaderboardDisplayCategoryId,
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

const singleAttached = attachParticipantToEntry(
  { id: "e1", studioId: "s1", teacherId: null, score: 10 },
  { studioById, teacherById }
)
assert.equal(singleAttached.participant?.name, "Studio One")

const participantIds = collectEntryParticipantIds([
  { id: "e1", studioId: "s1", teacherId: null },
  { id: "e2", studioId: "s1", teacherId: "t1" },
  { id: "e3", studioId: null, teacherId: "t2" },
])
assert.deepEqual(participantIds.studioIds, ["s1"])
assert.deepEqual(participantIds.teacherIds, ["t1", "t2"])

assert.equal(resolveLeaderboardDisplayCategoryId("TOP_REVENUE"), "bookings")
assert.equal(resolveLeaderboardDisplayCategoryId("MOST_COURSE_ENROLLMENTS"), "courses")

const grouped = groupLeaderboardsByDisplayCategory([
  { id: "l1", category: "TOP_REVENUE" as const },
  { id: "l2", category: "HIGHEST_RETENTION" as const },
])
assert.equal(grouped.length, 2)
assert.equal(grouped[0].leaderboards.length, 1)
assert.equal(grouped[1].leaderboards.length, 1)
assert.equal(LEADERBOARD_DISPLAY_CATEGORIES.length, 6)

const periodIds = collectCurrentPeriodIds([
  { id: "l1", currentPeriod: { id: "p1" } },
  { id: "l2", currentPeriod: null },
  { id: "l3", currentPeriod: { id: "p3" } },
])
assert.deepEqual(periodIds, ["p1", "p3"])

const userRanks = buildUserRanksByLeaderboardId(
  [
    { id: "l1", currentPeriod: { id: "p1" } },
    { id: "l2", currentPeriod: null },
    { id: "l3", currentPeriod: { id: "p3" } },
    { id: "l4", currentPeriod: { id: "p4" } },
  ],
  new Map([
    ["p1", { rank: 2, score: 99.5 }],
    ["p3", { rank: 0, score: 20 }],
    ["p4", { rank: null, score: 0 }],
  ])
)
assert.deepEqual(userRanks, {
  l1: { rank: 2, score: 99.5 },
  l2: null,
  l3: null,
  l4: null,
})

console.log("Leaderboard presentation logic passed")
