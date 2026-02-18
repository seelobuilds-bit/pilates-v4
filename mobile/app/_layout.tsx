import { Stack, useRouter, useSegments } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { AuthProvider, useAuth } from "@/src/context/auth-context"

type AppRoute = "/(app)" | "/(app)/schedule" | "/(app)/inbox" | "/(app)/profile"

const APP_ROUTE_ALLOWLIST = new Set<AppRoute>(["/(app)", "/(app)/schedule", "/(app)/inbox", "/(app)/profile"])

function parseRequestedAppRoute(segments: string[]): AppRoute {
  const section = segments[1]
  if (!section || section === "index") return "/(app)"

  const candidate = `/(app)/${section}` as AppRoute
  if (APP_ROUTE_ALLOWLIST.has(candidate)) {
    return candidate
  }

  return "/(app)"
}

function RootNavigator() {
  const router = useRouter()
  const segments = useSegments()
  const { loading, user } = useAuth()
  const [postLoginRoute, setPostLoginRoute] = useState<AppRoute | null>(null)
  const requestedAppRoute = useMemo(() => parseRequestedAppRoute(segments), [segments])

  useEffect(() => {
    if (loading) return

    const firstSegment = segments[0]
    const inAuthGroup = firstSegment === "(auth)"

    if (!user && !inAuthGroup) {
      setPostLoginRoute((existing) => existing ?? requestedAppRoute)
      router.replace("/(auth)/login")
      return
    }

    if (user && inAuthGroup) {
      const target = postLoginRoute && APP_ROUTE_ALLOWLIST.has(postLoginRoute) ? postLoginRoute : "/(app)"
      setPostLoginRoute(null)
      router.replace(target)
    }
  }, [loading, postLoginRoute, requestedAppRoute, router, segments, user])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
