import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const SAFE_PREFIXES = ["/api/auth", "/api/monitoring/frontend-error"]
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (SAFE_METHODS.has(request.method)) {
    return NextResponse.next()
  }

  if (SAFE_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (token?.isDemoSession) {
    return NextResponse.json(
      {
        error: "Demo account is read-only",
      },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
