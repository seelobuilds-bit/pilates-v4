import * as SecureStore from "expo-secure-store"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { mobileApi } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"
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

  const refreshBootstrap = useCallback(async () => {
    if (!token) {
      setBootstrap(null)
      return
    }
    const nextBootstrap = await mobileApi.bootstrap(token)
    setBootstrap(nextBootstrap)
  }, [token])

  const signOut = useCallback(async () => {
    const currentToken = token
    setToken(null)
    setUser(null)
    setBootstrap(null)
    await persistToken(null)

    if (currentToken) {
      try {
        await mobileApi.logout(currentToken)
      } catch {
        // Token is deleted locally regardless of network result.
      }
    }
  }, [token])

  const hydrateFromToken = useCallback(async (sessionToken: string) => {
    const profile = await mobileApi.me(sessionToken)
    setToken(sessionToken)
    setUser(profile)
    const nextBootstrap = await mobileApi.bootstrap(sessionToken)
    setBootstrap(nextBootstrap)
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

    const nextBootstrap = await mobileApi.bootstrap(response.token)
    setBootstrap(nextBootstrap)
  }, [])

  useEffect(() => {
    async function boot() {
      try {
        const storedToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY)
        if (!storedToken) return
        await hydrateFromToken(storedToken)
      } catch {
        await persistToken(null)
      } finally {
        setLoading(false)
      }
    }

    void boot()
  }, [hydrateFromToken])

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
