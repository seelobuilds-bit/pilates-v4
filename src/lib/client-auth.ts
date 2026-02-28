import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { verify, sign } from "jsonwebtoken"

// SECURITY: JWT_SECRET must be set in production
const JWT_SECRET = process.env.JWT_SECRET

export interface ClientTokenPayload {
  clientId: string
  studioId: string
  email: string
  iat?: number
  exp?: number
}

function decodeClientToken(token: string): ClientTokenPayload | null {
  if (!JWT_SECRET) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set")
    return null
  }

  try {
    return verify(token, JWT_SECRET) as ClientTokenPayload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

/**
 * Verify client JWT token from cookies
 * Returns null if token is invalid or JWT_SECRET is not configured
 */
export async function verifyClientToken(subdomain: string): Promise<ClientTokenPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${subdomain}`)?.value

    if (!token) {
      return null
    }

    return decodeClientToken(token)
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function verifyClientTokenValue(token: string | null | undefined): ClientTokenPayload | null {
  if (!token) return null
  return decodeClientToken(token)
}

export async function verifyClientTokenFromRequest(
  request: NextRequest | Request,
  subdomain: string
): Promise<ClientTokenPayload | null> {
  const authHeader =
    "headers" in request && typeof request.headers?.get === "function"
      ? request.headers.get("authorization")
      : null
  const bearerToken =
    typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null

  if (bearerToken) {
    const decodedBearer = verifyClientTokenValue(bearerToken)
    if (decodedBearer) return decodedBearer
  }

  return verifyClientToken(subdomain)
}

/**
 * Create a client JWT token
 */
export function createClientToken(payload: Omit<ClientTokenPayload, 'iat' | 'exp'>): string | null {
  if (!JWT_SECRET) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set")
    return null
  }

  return sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

/**
 * Check if JWT_SECRET is configured
 */
export function isJWTConfigured(): boolean {
  return !!JWT_SECRET
}
