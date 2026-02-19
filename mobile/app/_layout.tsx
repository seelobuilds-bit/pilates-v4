import { Stack, useRouter, useSegments } from "expo-router"
import * as Notifications from "expo-notifications"
import { useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { AuthProvider, useAuth } from "@/src/context/auth-context"
import { configurePushPresentation, routeFromPushPayload } from "@/src/lib/push"

type AppRoute = "/(app)" | "/(app)/schedule" | "/(app)/inbox" | "/(app)/workspace" | "/(app)/profile"

const APP_ROUTE_ALLOWLIST = new Set<AppRoute>(["/(app)", "/(app)/schedule", "/(app)/inbox", "/(app)/workspace", "/(app)/profile"])

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
  const [pendingPushRoute, setPendingPushRoute] = useState<AppRoute | null>(null)
  const handledNotificationIdRef = useRef<string | null>(null)
  const requestedAppRoute = useMemo(() => parseRequestedAppRoute(segments), [segments])

  useEffect(() => {
    if (loading) return

    const firstSegment = segments[0]
    const inAuthGroup = firstSegment === "(auth)"

    if (!user && !inAuthGroup) {
      setPostLoginRoute((existing) => existing ?? pendingPushRoute ?? requestedAppRoute)
      if (pendingPushRoute) {
        setPendingPushRoute(null)
      }
      router.replace("/(auth)/login")
      return
    }

    if (user && inAuthGroup) {
      const target = pendingPushRoute || (postLoginRoute && APP_ROUTE_ALLOWLIST.has(postLoginRoute) ? postLoginRoute : "/(app)")
      setPostLoginRoute(null)
      setPendingPushRoute(null)
      router.replace(target)
    }
  }, [loading, pendingPushRoute, postLoginRoute, requestedAppRoute, router, segments, user])

  useEffect(() => {
    const firstSegment = segments[0]
    const inAuthGroup = firstSegment === "(auth)"

    if (loading || !user || !pendingPushRoute || inAuthGroup) {
      return
    }

    router.replace(pendingPushRoute)
    setPendingPushRoute(null)
  }, [loading, pendingPushRoute, router, segments, user])

  useEffect(() => {
    configurePushPresentation()

    function queueRouteFromResponse(response: Notifications.NotificationResponse | null) {
      if (!response?.notification) return

      const notificationId = response.notification.request.identifier
      if (handledNotificationIdRef.current === notificationId) return

      const route = routeFromPushPayload(response.notification.request.content.data)
      if (!route || !APP_ROUTE_ALLOWLIST.has(route)) return

      handledNotificationIdRef.current = notificationId
      setPendingPushRoute(route)
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(queueRouteFromResponse)

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        queueRouteFromResponse(response)
      })
      .catch(() => {
        // Ignore startup notification lookup failures.
      })

    return () => {
      subscription.remove()
    }
  }, [])

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
