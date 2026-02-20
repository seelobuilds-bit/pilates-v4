import { existsSync, rmSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

type CliOptions = {
  batchId: string
  yes: boolean
  keepManifest: boolean
}

type BatchManifest = {
  batchId: string
  studios: Array<{
    id: string
    ownerId: string
    teacherIds: string[]
    teacherUserIds: string[]
  }>
}

function parseArgs(argv: string[]): CliOptions {
  const map = new Map<string, string>()
  let yes = false
  let keepManifest = false

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === "--yes") {
      yes = true
      continue
    }
    if (token === "--keep-manifest") {
      keepManifest = true
      continue
    }
    if (token.startsWith("--")) {
      const key = token.slice(2)
      const value = argv[index + 1]
      if (value && !value.startsWith("--")) {
        map.set(key, value)
        index += 1
      } else {
        map.set(key, "1")
      }
    }
  }

  return {
    batchId: (map.get("batch") || "").toLowerCase().replace(/[^a-z0-9-]/g, ""),
    yes,
    keepManifest,
  }
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function loadManifest(batchId: string): BatchManifest | null {
  const manifestPath = join(process.cwd(), "prisma", "synthetic-batches", `${batchId}.json`)
  if (!existsSync(manifestPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(manifestPath, "utf8")) as BatchManifest
  } catch {
    return null
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.batchId) {
    throw new Error("Missing --batch <id>.")
  }
  if (!options.yes) {
    throw new Error("Refusing to run without --yes.")
  }

  const batchTag = options.batchId
  const manifestPath = join(process.cwd(), "prisma", "synthetic-batches", `${batchTag}.json`)
  const manifest = loadManifest(batchTag)

  console.log(`Cleaning synthetic studio batch '${batchTag}'...`)

  const studios = await prisma.studio.findMany({
    where: { subdomain: { endsWith: `-${batchTag}` } },
    select: { id: true, ownerId: true, subdomain: true },
  })

  const studioIds = unique([
    ...studios.map((entry) => entry.id),
    ...(manifest?.studios ?? []).map((entry) => entry.id),
  ])

  if (studioIds.length === 0) {
    console.log("No matching studios found for this batch. Nothing to delete.")
    if (existsSync(manifestPath) && !options.keepManifest) {
      rmSync(manifestPath)
      console.log(`Removed stale manifest ${manifestPath}`)
    }
    await prisma.$disconnect()
    return
  }

  const teachers = await prisma.teacher.findMany({
    where: { studioId: { in: studioIds } },
    select: { id: true, userId: true },
  })

  const ownerIds = unique([
    ...studios.map((entry) => entry.ownerId),
    ...(manifest?.studios ?? []).map((entry) => entry.ownerId),
  ])

  const teacherIds = unique([
    ...teachers.map((entry) => entry.id),
    ...(manifest?.studios ?? []).flatMap((entry) => entry.teacherIds ?? []),
  ])

  const teacherUserIds = unique([
    ...teachers.map((entry) => entry.userId),
    ...(manifest?.studios ?? []).flatMap((entry) => entry.teacherUserIds ?? []),
  ])

  const winnerResult = await prisma.leaderboardWinner.deleteMany({
    where: {
      OR: [
        { studioId: { in: studioIds } },
        { teacherId: { in: teacherIds } },
      ],
    },
  })

  const entryResult = await prisma.leaderboardEntry.deleteMany({
    where: {
      OR: [
        { studioId: { in: studioIds } },
        { teacherId: { in: teacherIds } },
      ],
    },
  })

  const studioResult = await prisma.studio.deleteMany({
    where: { id: { in: studioIds } },
  })

  const ownerResult = await prisma.user.deleteMany({
    where: {
      id: { in: ownerIds },
      role: "OWNER",
      ownedStudio: null,
    },
  })

  const teacherUserResult = await prisma.user.deleteMany({
    where: {
      id: { in: teacherUserIds },
      role: "TEACHER",
      teacher: null,
    },
  })

  if (existsSync(manifestPath) && !options.keepManifest) {
    rmSync(manifestPath)
  }

  console.log(`Deleted studios: ${studioResult.count}`)
  console.log(`Deleted leaderboard entries: ${entryResult.count}`)
  console.log(`Deleted leaderboard winners: ${winnerResult.count}`)
  console.log(`Deleted owner users: ${ownerResult.count}`)
  console.log(`Deleted teacher users: ${teacherUserResult.count}`)
  if (!options.keepManifest) {
    console.log(`Deleted manifest: ${manifestPath}`)
  }

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error("Synthetic cleanup failed:", error)
  await prisma.$disconnect()
  process.exitCode = 1
})
