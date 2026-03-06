import { encode } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
import { DEMO_STUDIO_OWNER_EMAIL, getDemoStudioContext } from "@/lib/demo-studio"

const DEMO_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function getNextAuthSessionCookieName(useSecureCookie: boolean) {
  return useSecureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token"
}

export function shouldUseSecureNextAuthCookie(protocol?: string | null) {
  return (
    protocol === "https:" ||
    process.env.NEXTAUTH_URL?.startsWith("https://") ||
    Boolean(process.env.VERCEL)
  )
}

export async function buildDemoOwnerJwtToken(): Promise<JWT | null> {
  const demoStudio = await getDemoStudioContext()
  if (!demoStudio) return null

  return {
    sub: demoStudio.ownerId,
    id: demoStudio.ownerId,
    email: demoStudio.ownerEmail,
    name: `${demoStudio.ownerFirstName} ${demoStudio.ownerLastName}`.trim(),
    role: "OWNER",
    firstName: demoStudio.ownerFirstName,
    lastName: demoStudio.ownerLastName,
    studioId: demoStudio.studioId,
    studioName: demoStudio.studioName,
    teacherId: null,
    isDemoSession: true,
  }
}

export async function createDemoOwnerSessionCookieValue() {
  const token = await buildDemoOwnerJwtToken()
  const secret = process.env.NEXTAUTH_SECRET

  if (!token || !secret) {
    return null
  }

  return encode({
    token,
    secret,
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
  })
}

export function isDemoOwnerEmail(email: string | null | undefined) {
  if (!email) return false
  return email.trim().toLowerCase() === DEMO_STUDIO_OWNER_EMAIL.toLowerCase()
}
