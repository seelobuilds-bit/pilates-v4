import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { mobileConfig } from "@/src/lib/config"
import { getStudioPrimaryColor, mobileTheme } from "@/src/lib/theme"

export default function AppLayout() {
  const primaryColor = getStudioPrimaryColor()
  const insets = useSafeAreaInsets()
  const tabBarBottomPadding = Math.max(8, insets.bottom)

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
          height: 54 + tabBarBottomPadding,
          paddingBottom: tabBarBottomPadding,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
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
        name="workspace"
        options={{
          title: "Workspace",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "Classes",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="teachers"
        options={{
          title: "Teachers",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="school" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Locations",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="location" color={color} size={size} />,
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
