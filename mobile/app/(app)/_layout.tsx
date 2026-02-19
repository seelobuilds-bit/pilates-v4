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
        name="schedule/[sessionId]"
        options={{
          title: "Session",
          href: null,
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
        name="people/[clientId]"
        options={{
          title: "Client",
          href: null,
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
        name="classes/[classTypeId]"
        options={{
          title: "Class",
          href: null,
        }}
      />
      <Tabs.Screen
        name="class-flows"
        options={{
          title: "Class Flows",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" color={color} size={size} />,
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
        name="teachers/[teacherId]"
        options={{
          title: "Teacher",
          href: null,
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
        name="locations/[locationId]"
        options={{
          title: "Location",
          href: null,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="invoices/[invoiceId]"
        options={{
          title: "Invoice",
          href: null,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="card" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="payments/[paymentId]"
        options={{
          title: "Payment",
          href: null,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "Store",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "The Vault",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="marketing"
        options={{
          title: "Marketing",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="images" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="leaderboards"
        options={{
          title: "Leaderboards",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" color={color} size={size} />,
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
