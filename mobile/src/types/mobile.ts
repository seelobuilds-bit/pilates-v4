export type MobileRole = "OWNER" | "TEACHER" | "CLIENT"

export interface StudioSummary {
  id: string
  name: string
  subdomain: string
  primaryColor?: string | null
}

export interface MobileSessionUser {
  id: string
  role: MobileRole
  email: string
  firstName: string
  lastName: string
  teacherId?: string | null
  clientId?: string | null
  studio: StudioSummary
}

export interface MobileLoginResponse {
  token: string
  expiresIn: number
  user: MobileSessionUser
}

export interface MobileBootstrapResponse {
  role: MobileRole
  studio: StudioSummary
  metrics: Record<string, number>
}
