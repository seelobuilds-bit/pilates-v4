import { useCallback, useEffect, useMemo, useState } from "react"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import { getWorkspaceFeatures, toWorkspaceUrl, type WorkspaceFeature } from "@/src/lib/workspace-links"

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

function formatMetricLabel(key: string) {
  return METRIC_LABELS[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
}

function buildQuickActions(features: WorkspaceFeature[]) {
  if (features.length === 0) {
    return []
  }

  return features.slice(0, 4)
}

export default function HomeScreen() {
  const { user, bootstrap, refreshBootstrap, loading } = useAuth()
  const [openingActionId, setOpeningActionId] = useState<string | null>(null)
  const primaryColor = getStudioPrimaryColor()

  useEffect(() => {
    void refreshBootstrap()
  }, [refreshBootstrap])

  const subdomain = (bootstrap?.studio?.subdomain || user?.studio?.subdomain || "").trim().toLowerCase()
  const roleFeatures = useMemo(() => getWorkspaceFeatures(user?.role, subdomain), [subdomain, user?.role])
  const quickActions = useMemo(() => buildQuickActions(roleFeatures), [roleFeatures])

  const handleOpenAction = useCallback(async (action: WorkspaceFeature) => {
    setOpeningActionId(action.id)
    try {
      await Linking.openURL(toWorkspaceUrl(action.href))
    } finally {
      setOpeningActionId(null)
    }
  }, [])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshBootstrap()} />}
    >
      <View style={[styles.heroCard, { borderColor: withOpacity(primaryColor, 0.28), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.heroTitle}>Hello {user?.firstName ?? "there"}</Text>
        <Text style={styles.heroSubtitle}>
          {bootstrap?.studio?.name ?? user?.studio?.name ?? "Studio"} - {user?.role ?? "-"}
        </Text>
      </View>

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
          <Text style={styles.hintText}>Need more? Open the `Workspace` tab for full feature access.</Text>
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
  heroCard: {
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  heroSubtitle: {
    color: mobileTheme.colors.textMuted,
  },
  metricsGrid: {
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
  hintText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  note: {
    marginTop: 14,
    color: mobileTheme.colors.textSubtle,
  },
})
