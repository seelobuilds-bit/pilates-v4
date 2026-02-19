import { useCallback, useEffect, useMemo, useState } from "react"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileConfig } from "@/src/lib/config"
import { getStudioPrimaryColor, mobileTheme } from "@/src/lib/theme"
import type { MobileRole } from "@/src/types/mobile"

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

const METRIC_LABELS: Record<string, string> = {
  activeClients: "Active Clients",
  todayBookings: "Bookings Today",
  upcomingClasses: "Upcoming Classes",
  todayClasses: "Classes Today",
  activeStudents: "Active Students",
  upcomingBookings: "Upcoming Bookings",
  completedBookings: "Completed Bookings",
}

type QuickAction = {
  id: string
  label: string
  url: string
}

function formatMetricLabel(key: string) {
  return METRIC_LABELS[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
}

function buildQuickActions(role: MobileRole | undefined, base: string, subdomain: string): QuickAction[] {
  if (!role) return []

  if (role === "OWNER") {
    return [
      { id: "owner-dashboard", label: "Open Dashboard", url: `${base}/studio?source=mobile` },
      { id: "owner-schedule", label: "Open Schedule", url: `${base}/studio/schedule?source=mobile` },
      { id: "owner-reports", label: "Open Reports", url: `${base}/studio/reports?source=mobile` },
    ]
  }

  if (role === "TEACHER") {
    return [
      { id: "teacher-dashboard", label: "Open Dashboard", url: `${base}/teacher?source=mobile` },
      { id: "teacher-schedule", label: "Open Schedule", url: `${base}/teacher/schedule?source=mobile` },
      { id: "teacher-reports", label: "Open Reports", url: `${base}/teacher/reports?source=mobile` },
    ]
  }

  if (!subdomain) return []
  return [
    { id: "client-account", label: "My Account", url: `${base}/${subdomain}/account?source=mobile` },
    { id: "client-book", label: "Book a Class", url: `${base}/${subdomain}/book?source=mobile` },
  ]
}

export default function HomeScreen() {
  const { user, bootstrap, refreshBootstrap, loading } = useAuth()
  const [openingActionId, setOpeningActionId] = useState<string | null>(null)
  const primaryColor = getStudioPrimaryColor()

  useEffect(() => {
    void refreshBootstrap()
  }, [refreshBootstrap])

  const subdomain = (bootstrap?.studio?.subdomain || user?.studio?.subdomain || mobileConfig.studioSubdomain || "")
    .trim()
    .toLowerCase()
  const webBase = mobileConfig.apiBaseUrl.replace(/\/$/, "")
  const quickActions = useMemo(() => buildQuickActions(user?.role, webBase, subdomain), [subdomain, user?.role, webBase])

  const handleOpenAction = useCallback(async (action: QuickAction) => {
    setOpeningActionId(action.id)
    try {
      await Linking.openURL(action.url)
    } finally {
      setOpeningActionId(null)
    }
  }, [])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshBootstrap()} />}
    >
      <Text style={styles.heading}>Hello {user?.firstName ?? "there"}</Text>
      <Text style={styles.subheading}>Role: {user?.role ?? "-"}</Text>
      <Text style={styles.subheading}>Studio: {bootstrap?.studio?.name ?? user?.studio?.name ?? "-"}</Text>

      <View style={styles.metricsGrid}>
        {Object.entries(bootstrap?.metrics || {}).map(([key, value]) => (
          <MetricCard key={key} label={formatMetricLabel(key)} value={Number(value) || 0} />
        ))}
      </View>

      {quickActions.length > 0 ? (
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={[
                  styles.actionButton,
                  { backgroundColor: primaryColor },
                  openingActionId === action.id && styles.actionButtonDisabled,
                ]}
                onPress={() => void handleOpenAction(action)}
                disabled={openingActionId === action.id}
              >
                <Text style={styles.actionButtonText}>
                  {openingActionId === action.id ? "Opening..." : action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {!bootstrap ? <Text style={styles.note}>No bootstrap data yet. Pull to refresh.</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
    backgroundColor: mobileTheme.colors.canvas,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  subheading: {
    color: mobileTheme.colors.textMuted,
  },
  metricsGrid: {
    marginTop: 10,
    gap: 10,
  },
  metricCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: mobileTheme.colors.textSubtle,
    textTransform: "capitalize",
  },
  metricValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  actionSection: {
    marginTop: 6,
    gap: 8,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  actionGrid: {
    gap: 8,
  },
  actionButton: {
    backgroundColor: mobileTheme.colors.text,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
  },
  note: {
    marginTop: 14,
    color: mobileTheme.colors.textSubtle,
  },
})
