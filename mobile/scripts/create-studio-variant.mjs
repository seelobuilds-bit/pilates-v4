#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

function getArg(name) {
  const token = `--${name}`
  const idx = process.argv.indexOf(token)
  if (idx === -1) return ""
  return process.argv[idx + 1] || ""
}

function sanitize(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

const slugInput = getArg("slug")
const nameInput = getArg("name")
const primaryColor = getArg("primaryColor") || "#2563eb"
const apiBaseUrl = getArg("apiBaseUrl") || "https://www.thecurrent.app"

if (!slugInput || !nameInput) {
  console.error("Usage: pnpm prepare:studio --slug <studio-subdomain> --name \"Studio Name\" [--primaryColor #2563eb] [--apiBaseUrl https://www.thecurrent.app]")
  process.exit(1)
}

const slug = sanitize(slugInput)
if (!slug) {
  console.error("Invalid slug")
  process.exit(1)
}

const iosBundle = getArg("iosBundleIdentifier") || `app.current.studio.${slug.replace(/-/g, "")}`
const androidPackage = getArg("androidPackage") || `app.current.studio.${slug.replace(/-/g, "")}`

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

fs.writeFileSync(envFile, envContent)

console.log(`Created ${envFile}`)
console.log("\nNext steps:")
console.log(`1. cp ${path.basename(envFile)} .env.local`)
console.log("2. pnpm start")
console.log("3. pnpm build:ios:production && pnpm build:android:production")
