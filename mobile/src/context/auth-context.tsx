import * as SecureStore from "expo-secure-store"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { mobileApi, setMobileApiUnauthorizedHandler } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"
import { registerForPushNotificationsAsync } from "@/src/lib/push"
import type { MobileBootstrapResponse, MobilePushCategory, MobileSessionUser } from "@/src/types/mobile"

const SESSION_TOKEN_KEY = "current_mobile_session_token"
const PUSH_ENABLED_KEY = "current_mobile_push_enabled"
const PUSH_CATEGORIES_KEY = "current_mobile_push_categories"
const PUSH_CATEGORY_OPTIONS: MobilePushCategory[] = ["INBOX", "BOOKINGS", "SYSTEM"]

interface AuthContextValue {
  user: MobileSessionUser | null
  token: string | null
  loading: boolean
  bootstrap: MobileBootstrapResponse | null
  pushEnabled: boolean
  pushCategories: MobilePushCategory[]
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshBootstrap: () => Promise<void>
  updatePushEnabled: (next: boolean) => Promise<void>
  updatePushCategoryPreference: (category: MobilePushCategory, next: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function persistToken(token: string | null) {
  if (!token) {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY)
    return
  }
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token)
}

async function persistPushEnabled(next: boolean) {
  await SecureStore.setItemAsync(PUSH_ENABLED_KEY, next ? "1" : "0")
}

async function persistPushCategories(next: MobilePushCategory[]) {
  await SecureStore.setItemAsync(PUSH_CATEGORIES_KEY, JSON.stringify(next))
}

function normalizePushCategories(input: unknown): MobilePushCategory[] {
  if (!Array.isArray(input)) {
    return [...PUSH_CATEGORY_OPTIONS]
  }

  const allowed = new Set(PUSH_CATEGORY_OPTIONS)
  const normalized = Array.from(
    new Set(input.map((value) => String(value || "").trim().toUpperCase()))
  ).filter((value): value is MobilePushCategory => allowed.has(value as MobilePushCategory))

  return PUSH_CATEGORY_OPTIONS.filter((category) => normalized.includes(category))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<MobileSessionUser | null>(null)
  const [bootstrap, setBootstrap] = useState<MobileBootstrapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [pushCategories, setPushCategories] = useState<MobilePushCategory[]>([...PUSH_CATEGORY_OPTIONS])
  const [pushPreferenceReady, setPushPreferenceReady] = useState(false)
  const registeredPushTokenRef = useRef<string | null>(null)
  const registeredPushSignatureRef = useRef<string | null>(null)

  const clearSession = useCallback(async () => {
    setToken(null)
    setUser(null)
    setBootstrap(null)
    registeredPushTokenRef.current = null
    registeredPushSignatureRef.current = null
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

  const registerCurrentPushDevice = useCallback(async (currentToken: string, notificationCategories: MobilePushCategory[]) => {
    const registration = await registerForPushNotificationsAsync()
    if (!registration.enabled || !registration.params) {
      return
    }

    const nextSignature = `${registration.params.expoPushToken}|${notificationCategories.join(",")}`
    if (registeredPushSignatureRef.current === nextSignature) {
      return
    }

    await mobileApi.registerPushToken(currentToken, {
      ...registration.params,
      notificationCategories,
    })
    registeredPushTokenRef.current = registration.params.expoPushToken
    registeredPushSignatureRef.current = nextSignature
  }, [])

  const unregisterCurrentPushDevice = useCallback(async (currentToken: string) => {
    let pushToken = registeredPushTokenRef.current
    if (!pushToken) {
      const registration = await registerForPushNotificationsAsync()
      if (registration.enabled && registration.params?.expoPushToken) {
        pushToken = registration.params.expoPushToken
      }
    }

    if (!pushToken) {
      return
    }

    await mobileApi.unregisterPushToken(currentToken, { expoPushToken: pushToken })
    registeredPushTokenRef.current = null
    registeredPushSignatureRef.current = null
  }, [])

  const updatePushEnabled = useCallback(
    async (next: boolean) => {
      setPushEnabled(next)
      await persistPushEnabled(next)

      if (!token) return

      if (next) {
        await registerCurrentPushDevice(token, pushCategories)
        return
      }

      await unregisterCurrentPushDevice(token)
    },
    [pushCategories, registerCurrentPushDevice, token, unregisterCurrentPushDevice]
  )

  const updatePushCategoryPreference = useCallback(
    async (category: MobilePushCategory, next: boolean) => {
      const nextSet = new Set(pushCategories)
      if (next) {
        nextSet.add(category)
      } else {
        nextSet.delete(category)
      }

      const nextCategories = PUSH_CATEGORY_OPTIONS.filter((item) => nextSet.has(item))
      setPushCategories(nextCategories)
      await persistPushCategories(nextCategories)

      if (!token || !pushEnabled) {
        return
      }

      await registerCurrentPushDevice(token, nextCategories)
    },
    [pushCategories, pushEnabled, registerCurrentPushDevice, token]
  )

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
        const storedPushEnabled = await SecureStore.getItemAsync(PUSH_ENABLED_KEY)
        setPushEnabled(storedPushEnabled !== "0")

        const storedPushCategories = await SecureStore.getItemAsync(PUSH_CATEGORIES_KEY)
        if (!storedPushCategories) {
          setPushCategories([...PUSH_CATEGORY_OPTIONS])
        } else {
          try {
            setPushCategories(normalizePushCategories(JSON.parse(storedPushCategories)))
          } catch {
            setPushCategories([...PUSH_CATEGORY_OPTIONS])
          }
        }

        setPushPreferenceReady(true)

        const storedToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY)
        if (!storedToken) return
        await hydrateFromToken(storedToken)
      } catch {
        await clearSession()
        setPushPreferenceReady(true)
      } finally {
        setLoading(false)
      }
    }

    void boot()
  }, [clearSession, hydrateFromToken])

  useEffect(() => {
    if (!token || !pushEnabled || !pushPreferenceReady) return
    const currentToken = token

    let cancelled = false

    async function syncPushRegistration() {
      try {
        await registerCurrentPushDevice(currentToken, pushCategories)
        if (cancelled) {
          return
        }
      } catch {
        // Push registration should never block auth/session.
      }
    }

    void syncPushRegistration()

    return () => {
      cancelled = true
    }
  }, [pushCategories, pushEnabled, pushPreferenceReady, registerCurrentPushDevice, token])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      bootstrap,
      pushEnabled,
      pushCategories,
      signIn,
      signOut,
      refreshBootstrap,
      updatePushEnabled,
      updatePushCategoryPreference,
    }),
    [
      bootstrap,
      loading,
      pushCategories,
      pushEnabled,
      refreshBootstrap,
      signIn,
      signOut,
      token,
      updatePushCategoryPreference,
      updatePushEnabled,
      user,
    ]
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
