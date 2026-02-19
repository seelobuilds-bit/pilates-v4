import { mobileConfig } from "@/src/lib/config"
import type {
  MobileBootstrapResponse,
  MobileClientsResponse,
  MobileInboxResponse,
  MobileInboxThreadResponse,
  MobileLoginResponse,
  MobilePushRegisterParams,
  MobilePushStatus,
  MobileScheduleResponse,
  MobileSessionUser,
} from "@/src/types/mobile"

interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

let unauthorizedHandler: (() => void) | null = null

export function setMobileApiUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(`${mobileConfig.apiBaseUrl}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = typeof payload?.error === "string" ? payload.error : "Request failed"
      if (response.status === 401) {
        unauthorizedHandler?.()
      }
      throw new ApiError(message, response.status, payload)
    }

    return payload as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out. Check connection and retry.", 408, null)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
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

  schedule(token: string, params?: { from?: string; to?: string; mode?: "booked" | "all" }) {
    const search = new URLSearchParams()
    if (params?.from) search.set("from", params.from)
    if (params?.to) search.set("to", params.to)
    if (params?.mode) search.set("mode", params.mode)
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

  clients(token: string, params?: { search?: string }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    const path = search.size ? `/api/mobile/clients?${search.toString()}` : "/api/mobile/clients"
    return request<MobileClientsResponse>(path, {
      method: "GET",
      token,
    })
  },

  inboxThread(token: string, clientId: string) {
    const search = new URLSearchParams({ clientId })
    return request<MobileInboxThreadResponse>(`/api/mobile/inbox/thread?${search.toString()}`, {
      method: "GET",
      token,
    })
  },

  sendInboxMessage(
    token: string,
    params: { clientId?: string; channel: "EMAIL" | "SMS"; message: string; subject?: string }
  ) {
    return request<{ success: boolean; messageId?: string }>("/api/mobile/inbox/send", {
      method: "POST",
      token,
      body: JSON.stringify(params),
    })
  },

  bookClass(token: string, classSessionId: string) {
    return request<{ success: boolean; bookingId?: string; status?: string }>("/api/mobile/schedule/book", {
      method: "POST",
      token,
      body: JSON.stringify({ classSessionId }),
    })
  },

  cancelBooking(token: string, bookingId: string) {
    return request<{ success: boolean; bookingId?: string; status?: string }>("/api/mobile/schedule/cancel", {
      method: "POST",
      token,
      body: JSON.stringify({ bookingId }),
    })
  },

  logout(token: string) {
    return request<{ success: boolean }>("/api/mobile/auth/logout", {
      method: "POST",
      token,
    })
  },

  registerPushToken(token: string, params: MobilePushRegisterParams) {
    return request<{
      success: boolean
      device?: { id: string; platform: string; isEnabled: boolean; notificationCategories?: string[] }
    }>(
      "/api/mobile/push/register",
      {
        method: "POST",
        token,
        body: JSON.stringify(params),
      }
    )
  },

  unregisterPushToken(token: string, params?: { expoPushToken?: string }) {
    return request<{ success: boolean; disabledCount: number }>("/api/mobile/push/unregister", {
      method: "POST",
      token,
      body: JSON.stringify(params || {}),
    })
  },

  sendPushTest(token: string, params?: { message?: string }) {
    return request<{ success: boolean; attempted: number; sent: number; failed: number; disabled: number }>(
      "/api/mobile/push/test",
      {
        method: "POST",
        token,
        body: JSON.stringify(params || {}),
      }
    )
  },

  pushStatus(token: string) {
    return request<{
      success: boolean
      push: MobilePushStatus
    }>("/api/mobile/push/status", {
      method: "GET",
      token,
    })
  },
}
