#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

function getArg(name) {
  const token = `--${name}`
  const idx = process.argv.indexOf(token)
  if (idx === -1) return ""
  const next = process.argv[idx + 1]
  if (!next || next.startsWith("--")) return ""
  return next
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

function sanitize(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function ensureNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0
}

function buildChecklistContent({ studioName, slug, iosBundle, androidPackage, apiBaseUrl }) {
  return `# ${studioName} Mobile Release Checklist

## Studio Variant

- Studio name: ${studioName}
- Studio slug: ${slug}
- iOS bundle identifier: ${iosBundle}
- Android package: ${androidPackage}
- API base URL: ${apiBaseUrl}

## Required Metadata (fill before release)

- App Store Connect App ID: <REQUIRED>
- Apple Team ID: <REQUIRED>
- Apple Business Manager Organization ID(s): <REQUIRED>
- Google Play Developer Account ID: <REQUIRED>
- Managed Google Play Organization / Enterprise ID: <REQUIRED>
- Support URL: <REQUIRED>
- Privacy Policy URL: <REQUIRED>
- Terms of Use URL: <REQUIRED>
- App contact email: <REQUIRED>
- Release owner: <REQUIRED>
- QA approver: <REQUIRED>

## Pre-Release Checks

- [ ] Variant env file reviewed
- [ ] iOS build completed and smoke tested
- [ ] Android build completed and smoke tested
- [ ] Login/bootstrap flow verified
- [ ] Private distribution assignment confirmed
`
}

const dryRun = hasFlag("dry-run")
const slugInput = getArg("slug")
const nameInput = getArg("name")
const primaryColor = getArg("primaryColor") || process.env.EXPO_PUBLIC_BRAND_PRIMARY || "#2563eb"
const apiBaseUrl = getArg("apiBaseUrl") || process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.thecurrent.app"

if (!slugInput || !nameInput) {
  console.error("Usage: pnpm prepare:studio --slug <studio-subdomain> --name \"Studio Name\" [--primaryColor #2563eb] [--apiBaseUrl https://www.thecurrent.app] [--iosBundleIdentifier app.current.studio.slug] [--androidPackage app.current.studio.slug] [--dry-run]")
  process.exit(1)
}

const slug = sanitize(slugInput)
if (!slug) {
  console.error("Invalid slug")
  process.exit(1)
}

const iosBundle = getArg("iosBundleIdentifier") || `app.current.studio.${slug.replace(/-/g, "")}`
const androidPackage = getArg("androidPackage") || `app.current.studio.${slug.replace(/-/g, "")}`

const validationErrors = []
if (!ensureNonEmpty(nameInput)) validationErrors.push("Studio name is required")
if (!ensureNonEmpty(slug)) validationErrors.push("Studio slug is required")
if (!isHexColor(primaryColor)) validationErrors.push("primaryColor must be a hex color like #2563eb")
if (!isHttpUrl(apiBaseUrl)) validationErrors.push("apiBaseUrl must be a valid http/https URL")
if (!ensureNonEmpty(iosBundle)) validationErrors.push("iosBundleIdentifier is required")
if (!ensureNonEmpty(androidPackage)) validationErrors.push("androidPackage is required")

if (validationErrors.length > 0) {
  console.error("Input validation failed:")
  for (const error of validationErrors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

const envFile = path.join(process.cwd(), `.env.studio.${slug}`)
const envContent = [
  `EXPO_PUBLIC_STUDIO_SUBDOMAIN=${slug}`,
  `EXPO_PUBLIC_STUDIO_NAME=${nameInput}`,
  `EXPO_PUBLIC_BRAND_PRIMARY=${primaryColor}`,
  `EXPO_PUBLIC_API_BASE_URL=${apiBaseUrl}`,
  `IOS_BUNDLE_IDENTIFIER=${iosBundle}`,
  `ANDROID_PACKAGE=${androidPackage}`,
  ""
].join("\n")

const checklistPath = path.join(process.cwd(), "releases", slug, "release-checklist.md")
const checklistContent = buildChecklistContent({
  studioName: nameInput,
  slug,
  iosBundle,
  androidPackage,
  apiBaseUrl
})

const plannedWrites = [
  { path: envFile, content: envContent },
  { path: checklistPath, content: checklistContent }
]

if (dryRun) {
  console.log("[dry-run] No files written. Planned outputs:")
  for (const item of plannedWrites) {
    console.log(`- ${item.path}`)
  }
  process.exit(0)
}

for (const item of plannedWrites) {
  fs.mkdirSync(path.dirname(item.path), { recursive: true })
  fs.writeFileSync(item.path, item.content)
  console.log(`Created ${item.path}`)
}

console.log("\nNext steps:")
console.log(`1. cp ${path.basename(envFile)} .env.local`)
console.log("2. pnpm start")
console.log("3. pnpm build:ios:production && pnpm build:android:production")
console.log(`4. Complete ${path.relative(process.cwd(), checklistPath)}`)
