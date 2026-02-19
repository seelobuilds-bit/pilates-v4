import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { mobileConfig } from "@/src/lib/config"
import { getStudioPrimaryColor, mobileTheme } from "@/src/lib/theme"

export default function AppLayout() {
  const primaryColor = getStudioPrimaryColor()

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: mobileTheme.colors.canvas },
        headerStyle: {
          backgroundColor: mobileTheme.colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: mobileTheme.colors.text,
        headerTitleStyle: {
          fontWeight: "700",
          color: mobileTheme.colors.text,
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: mobileTheme.colors.textSubtle,
        tabBarStyle: {
          backgroundColor: mobileTheme.colors.surface,
          borderTopColor: mobileTheme.colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: mobileConfig.studioName,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
