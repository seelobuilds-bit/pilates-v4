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

/**
 * Verify client JWT token from cookies
 * Returns null if token is invalid or JWT_SECRET is not configured
 */
export async function verifyClientToken(subdomain: string): Promise<ClientTokenPayload | null> {
  if (!JWT_SECRET) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set")
    return null
  }

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${subdomain}`)?.value

    if (!token) {
      return null
    }

    const decoded = verify(token, JWT_SECRET) as ClientTokenPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
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
