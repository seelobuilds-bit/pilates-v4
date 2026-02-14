import { PrismaClient } from "@prisma/client"
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

function loadEnvFile(pathname) {
  if (!existsSync(pathname)) return
  const raw = readFileSync(pathname, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue

    const key = trimmed.slice(0, idx).trim()
    if (!key || process.env[key] !== undefined) continue

    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function bootstrapEnv() {
  const cwd = process.cwd()
  loadEnvFile(join(cwd, ".env.local"))
  loadEnvFile(join(cwd, ".env"))
}

bootstrapEnv()

const prisma = new PrismaClient()

const APPLY = process.argv.includes("--apply")
const VERBOSE = process.argv.includes("--verbose")
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads"
const SOURCE_HOST_PATTERNS = (
  process.env.MIGRATION_SOURCE_HOSTS || "blob.vercel-storage.com,vercel-storage.com"
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

function qident(name) {
  return `"${String(name).replace(/"/g, '""')}"`
}

function encodePath(path) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/")
}

function parseUrlsFromString(text) {
  const out = []
  const regex = /https?:\/\/[^\s"'<>\]\)]+/gi
  let match
  while ((match = regex.exec(text)) !== null) {
    let candidate = match[0]
    while (candidate.length > 0 && /[),.;:]$/.test(candidate)) {
      candidate = candidate.slice(0, -1)
    }
    if (candidate) out.push(candidate)
  }
  return out
}

function isSourceUrl(url) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    return SOURCE_HOST_PATTERNS.some((pattern) => host === pattern || host.endsWith(`.${pattern}`) || host.includes(pattern))
  } catch {
    return false
  }
}

function collectSourceUrls(value, collector = new Set()) {
  if (value == null) return collector

  if (typeof value === "string") {
    for (const url of parseUrlsFromString(value)) {
      if (isSourceUrl(url)) collector.add(url)
    }
    return collector
  }

  if (Array.isArray(value)) {
    for (const item of value) collectSourceUrls(item, collector)
    return collector
  }

  if (typeof value === "object") {
    for (const item of Object.values(value)) collectSourceUrls(item, collector)
  }

  return collector
}

function replaceUrlsInString(text, mapping) {
  let next = text
  const entries = [...mapping.entries()].sort((a, b) => b[0].length - a[0].length)
  for (const [oldUrl, newUrl] of entries) {
    if (next.includes(oldUrl)) {
      next = next.split(oldUrl).join(newUrl)
    }
  }
  return next
}

function replaceValueUrls(value, mapping) {
  if (value == null) return value

  if (typeof value === "string") {
    return replaceUrlsInString(value, mapping)
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceValueUrls(item, mapping))
  }

  if (typeof value === "object") {
    const output = {}
    for (const [k, v] of Object.entries(value)) {
      output[k] = replaceValueUrls(v, mapping)
    }
    return output
  }

  return value
}

function safeHost(hostname) {
  return hostname.replace(/[^a-zA-Z0-9.-]/g, "_")
}

function safeSegment(segment) {
  return segment.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function buildObjectPath(sourceUrl) {
  const parsed = new URL(sourceUrl)
  const hash = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 12)
  const originalPath = parsed.pathname.replace(/^\/+/, "")

  const segments = originalPath
    .split("/")
    .map((segment) => safeSegment(segment))
    .filter(Boolean)

  let filename = segments.pop() || "file"
  const dot = filename.lastIndexOf(".")
  if (dot > 0) {
    filename = `${filename.slice(0, dot)}-${hash}${filename.slice(dot)}`
  } else {
    filename = `${filename}-${hash}`
  }

  return ["migrated", safeHost(parsed.hostname), ...segments, filename].join("/")
}

async function uploadToSupabase(sourceUrl) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  const sourceRes = await fetch(sourceUrl)
  if (!sourceRes.ok) {
    throw new Error(`Source download failed (${sourceRes.status})`)
  }

  const contentType = sourceRes.headers.get("content-type")?.split(";")[0] || "application/octet-stream"
  const bytes = Buffer.from(await sourceRes.arrayBuffer())
  const objectPath = buildObjectPath(sourceUrl)
  const encoded = encodePath(objectPath)

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${encoded}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "x-upsert": "true",
        "content-type": contentType,
      },
      body: bytes,
    }
  )

  if (!uploadRes.ok) {
    const body = await uploadRes.text()
    throw new Error(`Supabase upload failed (${uploadRes.status}): ${body}`)
  }

  const publicUrl =
    `${SUPABASE_URL}/storage/v1/object/public/` +
    `${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${encoded}`

  return { publicUrl, objectPath, size: bytes.length, contentType }
}

function inferKind(column) {
  if (column.data_type === "json" || column.data_type === "jsonb") return "json"
  if (column.udt_name === "_text" || column.udt_name === "_varchar") return "array"
  return "string"
}

async function loadCandidateColumns() {
  const sql = `
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name <> '_prisma_migrations'
      AND (
        data_type IN ('text', 'character varying', 'json', 'jsonb')
        OR udt_name IN ('_text', '_varchar')
      )
    ORDER BY table_name, column_name
  `

  return prisma.$queryRawUnsafe(sql)
}

async function loadCandidateRows(tableName, columnName, kind) {
  const tq = qident(tableName)
  const cq = qident(columnName)
  const likeParams = SOURCE_HOST_PATTERNS.map((host) => `%${host}%`)
  const likeSql = likeParams.map((_, i) => `$${i + 1}`).join(", ")

  let sql
  if (kind === "string") {
    sql = `SELECT ctid::text AS __ctid, ${cq} AS value FROM ${tq} WHERE ${cq} IS NOT NULL AND ${cq} ILIKE ANY (ARRAY[${likeSql}])`
  } else if (kind === "array") {
    sql = `SELECT ctid::text AS __ctid, ${cq} AS value FROM ${tq} WHERE ${cq} IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(${cq}) AS entry WHERE entry ILIKE ANY (ARRAY[${likeSql}]))`
  } else {
    sql = `SELECT ctid::text AS __ctid, ${cq} AS value FROM ${tq} WHERE ${cq} IS NOT NULL AND ${cq}::text ILIKE ANY (ARRAY[${likeSql}])`
  }

  return prisma.$queryRawUnsafe(sql, ...likeParams)
}

async function updateRow(tableName, columnName, kind, dataType, udtName, ctid, value) {
  const tq = qident(tableName)
  const cq = qident(columnName)

  if (kind === "json") {
    const cast = dataType === "jsonb" ? "jsonb" : "json"
    const sql = `UPDATE ${tq} SET ${cq} = $1::${cast} WHERE ctid = $2::tid`
    await prisma.$executeRawUnsafe(sql, JSON.stringify(value), ctid)
    return
  }

  if (kind === "array") {
    const cast = udtName === "_varchar" ? "varchar[]" : "text[]"
    const sql = `UPDATE ${tq} SET ${cq} = $1::${cast} WHERE ctid = $2::tid`
    await prisma.$executeRawUnsafe(sql, value, ctid)
    return
  }

  const sql = `UPDATE ${tq} SET ${cq} = $1 WHERE ctid = $2::tid`
  await prisma.$executeRawUnsafe(sql, value, ctid)
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`)
  console.log(`Source host patterns: ${SOURCE_HOST_PATTERNS.join(", ")}`)
  console.log(`Target bucket: ${SUPABASE_STORAGE_BUCKET}`)

  if (APPLY && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error("--apply requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  }

  const columns = await loadCandidateColumns()
  const urlMap = new Map()
  const failures = []

  let scannedRows = 0
  let touchedRows = 0
  let updatedRows = 0
  let discoveredUrls = 0
  let migratedUrls = 0

  for (const column of columns) {
    const { table_name: tableName, column_name: columnName, data_type: dataType, udt_name: udtName } = column
    const kind = inferKind(column)

    const rows = await loadCandidateRows(tableName, columnName, kind)
    if (rows.length === 0) continue

    if (VERBOSE) {
      console.log(`Scanning ${tableName}.${columnName} (${rows.length} candidate rows)`)
    }

    for (const row of rows) {
      scannedRows += 1
      const currentValue = row.value
      const ctid = row.__ctid

      const sourceUrls = [...collectSourceUrls(currentValue)]
      if (sourceUrls.length === 0) continue

      touchedRows += 1
      discoveredUrls += sourceUrls.length

      if (APPLY) {
        for (const sourceUrl of sourceUrls) {
          if (urlMap.has(sourceUrl)) continue

          try {
            const result = await uploadToSupabase(sourceUrl)
            urlMap.set(sourceUrl, result.publicUrl)
            migratedUrls += 1
            if (VERBOSE) {
              console.log(`Uploaded ${sourceUrl} -> ${result.publicUrl}`)
            }
          } catch (error) {
            failures.push({ sourceUrl, error: String(error) })
            console.error(`Failed to migrate ${sourceUrl}: ${String(error)}`)
          }
        }

        const nextValue = replaceValueUrls(currentValue, urlMap)
        const changed = JSON.stringify(nextValue) !== JSON.stringify(currentValue)

        if (changed) {
          await updateRow(tableName, columnName, kind, dataType, udtName, ctid, nextValue)
          updatedRows += 1
          if (VERBOSE) {
            console.log(`Updated ${tableName}.${columnName} row ${ctid}`)
          }
        }
      }
    }
  }

  console.log("\nMigration summary")
  console.log(`- scanned rows: ${scannedRows}`)
  console.log(`- rows containing source URLs: ${touchedRows}`)
  console.log(`- source URL references found: ${discoveredUrls}`)
  console.log(`- unique source URLs migrated: ${migratedUrls}`)
  console.log(`- rows updated: ${updatedRows}`)
  console.log(`- failed URL migrations: ${failures.length}`)

  if (failures.length > 0) {
    console.log("\nFailed URLs")
    for (const f of failures) {
      console.log(`- ${f.sourceUrl} :: ${f.error}`)
    }
    process.exitCode = 1
  }

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to copy files and rewrite DB URLs.")
  }
}

main()
  .catch((error) => {
    console.error("Migration failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
