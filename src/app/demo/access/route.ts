import { NextRequest, NextResponse } from "next/server"
import {
  createDemoOwnerSessionCookieValue,
  getNextAuthSessionCookieName,
  shouldUseSecureNextAuthCookie,
} from "@/lib/demo-session"
import { getDemoStudioContext } from "@/lib/demo-studio"

function sanitizeNextPath(rawNext: string | null) {
  if (!rawNext) return "/studio"
  if (!rawNext.startsWith("/")) return "/studio"
  if (!rawNext.startsWith("/studio")) return "/studio"
  return rawNext
}

export async function GET(request: NextRequest) {
  const demoStudio = await getDemoStudioContext()
  if (!demoStudio) {
    return NextResponse.redirect(new URL("/login?error=demo-unavailable", request.url))
  }

  const cookieValue = await createDemoOwnerSessionCookieValue()
  if (!cookieValue) {
    return NextResponse.redirect(new URL("/login?error=demo-unavailable", request.url))
  }

  const useSecureCookie = shouldUseSecureNextAuthCookie(request.nextUrl.protocol)
  const cookieName = getNextAuthSessionCookieName(useSecureCookie)
  const alternateCookieName = getNextAuthSessionCookieName(!useSecureCookie)
  const target = sanitizeNextPath(request.nextUrl.searchParams.get("next"))
  const response = NextResponse.redirect(new URL(target, request.url))

  response.cookies.set({
    name: cookieName,
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  response.cookies.delete(alternateCookieName)

  return response
}
