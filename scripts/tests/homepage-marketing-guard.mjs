#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const file = path.resolve(process.cwd(), "src/components/marketing/home-page.tsx")
const source = fs.readFileSync(file, "utf8")

const required = [
  "id=\"why\"",
  "id=\"features\"",
  "id=\"testimonials\"",
  "id=\"faq\"",
  "Book a Demo",
  "See It in Action",
  "motion-hero-title",
  "marketing-motion-shell",
]

const missing = required.filter((needle) => !source.includes(needle))

if (missing.length > 0) {
  console.error("Homepage guard failed. Missing required markers:")
  for (const needle of missing) {
    console.error(`- ${needle}`)
  }
  process.exit(1)
}

console.log("Homepage guard passed")
