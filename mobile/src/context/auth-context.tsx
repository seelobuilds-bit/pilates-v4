import * as SecureStore from "expo-secure-store"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { mobileApi, setMobileApiUnauthorizedHandler } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"
import { registerForPushNotificationsAsync } from "@/src/lib/push"
import type { MobileBootstrapResponse, MobileSessionUser } from "@/src/types/mobile"

const SESSION_TOKEN_KEY = "current_mobile_session_token"

interface AuthContextValue {
  user: MobileSessionUser | null
  token: string | null
  loading: boolean
  bootstrap: MobileBootstrapResponse | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshBootstrap: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function persistToken(token: string | null) {
  if (!token) {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY)
    return
  }
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<MobileSessionUser | null>(null)
  const [bootstrap, setBootstrap] = useState<MobileBootstrapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const registeredPushTokenRef = useRef<string | null>(null)

  const clearSession = useCallback(async () => {
    setToken(null)
    setUser(null)
    setBootstrap(null)
    registeredPushTokenRef.current = null
    await persistToken(null)
  }, [])

  useEffect(() => {
    setMobileApiUnauthorizedHandler(() => {
      void clearSession()
    })

    return () => {
      setMobileApiUnauthorizedHandler(null)
    }
  }, [clearSession])

  const refreshBootstrap = useCallback(async () => {
    if (!token) {
      setBootstrap(null)
      return
    }
    try {
      const nextBootstrap = await mobileApi.bootstrap(token)
      setBootstrap(nextBootstrap)
    } catch {
      // Keep the last known bootstrap; auth handler will clear session on 401.
    }
  }, [token])

  const signOut = useCallback(async () => {
    const currentToken = token
    const registeredPushToken = registeredPushTokenRef.current
    await clearSession()

    if (currentToken) {
      if (registeredPushToken) {
        try {
          await mobileApi.unregisterPushToken(currentToken, { expoPushToken: registeredPushToken })
        } catch {
          // Best-effort cleanup only.
        }
      }

      try {
        await mobileApi.logout(currentToken)
      } catch {
        // Token is deleted locally regardless of network result.
      }
    }
  }, [clearSession, token])

  const hydrateFromToken = useCallback(async (sessionToken: string) => {
    const profile = await mobileApi.me(sessionToken)
    setToken(sessionToken)
    setUser(profile)
    try {
      const nextBootstrap = await mobileApi.bootstrap(sessionToken)
      setBootstrap(nextBootstrap)
    } catch {
      setBootstrap(null)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const studioSubdomain = mobileConfig.studioSubdomain
    if (!studioSubdomain) {
      throw new Error("Studio subdomain is not configured for this app")
    }

    const response = await mobileApi.login({
      email,
      password,
      studioSubdomain,
    })

    setToken(response.token)
    setUser(response.user)
    await persistToken(response.token)

    try {
      const nextBootstrap = await mobileApi.bootstrap(response.token)
      setBootstrap(nextBootstrap)
    } catch {
      setBootstrap(null)
    }
  }, [])

  useEffect(() => {
    async function boot() {
      try {
        const storedToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY)
        if (!storedToken) return
        await hydrateFromToken(storedToken)
      } catch {
        await clearSession()
      } finally {
        setLoading(false)
      }
    }

    void boot()
  }, [clearSession, hydrateFromToken])

  useEffect(() => {
    if (!token) return
    const currentToken = token

    let cancelled = false

    async function syncPushRegistration() {
      try {
        const registration = await registerForPushNotificationsAsync()
        if (!registration.enabled || !registration.params || cancelled) {
          return
        }

        if (registeredPushTokenRef.current === registration.params.expoPushToken) {
          return
        }

        await mobileApi.registerPushToken(currentToken, registration.params)
        if (!cancelled) {
          registeredPushTokenRef.current = registration.params.expoPushToken
        }
      } catch {
        // Push registration should never block auth/session.
      }
    }

    void syncPushRegistration()

    return () => {
      cancelled = true
    }
  }, [token])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      bootstrap,
      signIn,
      signOut,
      refreshBootstrap,
    }),
    [bootstrap, loading, refreshBootstrap, signIn, signOut, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
