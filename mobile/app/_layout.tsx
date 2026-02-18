import { Stack, useRouter, useSegments } from "expo-router"
import { useEffect } from "react"
import { ActivityIndicator, View } from "react-native"
import { AuthProvider, useAuth } from "@/src/context/auth-context"

function RootNavigator() {
  const router = useRouter()
  const segments = useSegments()
  const { loading, user } = useAuth()

  useEffect(() => {
    if (loading) return

    const firstSegment = segments[0]
    const inAuthGroup = firstSegment === "(auth)"

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login")
      return
    }

    if (user && inAuthGroup) {
      router.replace("/(app)")
    }
  }, [loading, router, segments, user])

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
