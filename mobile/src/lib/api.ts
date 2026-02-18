import { mobileConfig } from "@/src/lib/config"
import type {
  MobileBootstrapResponse,
  MobileInboxResponse,
  MobileLoginResponse,
  MobileScheduleResponse,
  MobileSessionUser,
} from "@/src/types/mobile"

interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options

  const response = await fetch(`${mobileConfig.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "Request failed"
    throw new Error(message)
  }

  return payload as T
}

export const mobileApi = {
  login(params: { email: string; password: string; studioSubdomain: string }) {
    return request<MobileLoginResponse>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify(params),
    })
  },

  me(token: string) {
    return request<MobileSessionUser>("/api/mobile/auth/me", {
      method: "GET",
      token,
    })
  },

  bootstrap(token: string) {
    return request<MobileBootstrapResponse>("/api/mobile/bootstrap", {
      method: "GET",
      token,
    })
  },

  schedule(token: string, params?: { from?: string; to?: string }) {
    const search = new URLSearchParams()
    if (params?.from) search.set("from", params.from)
    if (params?.to) search.set("to", params.to)
    const path = search.size ? `/api/mobile/schedule?${search.toString()}` : "/api/mobile/schedule"

    return request<MobileScheduleResponse>(path, {
      method: "GET",
      token,
    })
  },

  inbox(token: string) {
    return request<MobileInboxResponse>("/api/mobile/inbox", {
      method: "GET",
      token,
    })
  },

  logout(token: string) {
    return request<{ success: boolean }>("/api/mobile/auth/logout", {
      method: "POST",
      token,
    })
  },
}
