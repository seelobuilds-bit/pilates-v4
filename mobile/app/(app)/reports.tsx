import { useEffect } from "react"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileConfig } from "@/src/lib/config"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"

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

export default function ReportsScreen() {
  const { user, bootstrap, refreshBootstrap, loading } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const metrics = bootstrap?.metrics || {}

  useEffect(() => {
    void refreshBootstrap()
  }, [refreshBootstrap])

  const openWebReports = async () => {
    const base = mobileConfig.apiBaseUrl.replace(/\/$/, "")
    const target = user?.role === "TEACHER" ? `${base}/teacher/reports` : `${base}/studio/reports`
    await Linking.openURL(target)
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshBootstrap()} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.26), backgroundColor: withOpacity(primaryColor, 0.1) }]}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Live snapshot from your studio metrics.</Text>
      </View>

      {Object.keys(metrics).length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No report data yet</Text>
          <Text style={styles.emptyText}>As bookings and activity come in, metrics will appear here.</Text>
        </View>
      ) : (
        <View style={styles.metricGrid}>
          {Object.entries(metrics).map(([key, value]) => (
            <View key={key} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{formatMetricLabel(key)}</Text>
              <Text style={styles.metricValue}>{Number(value) || 0}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => void openWebReports()}>
        <Text style={styles.actionButtonText}>Open full web reports</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: mobileTheme.colors.canvas,
  },
  headerCard: {
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  title: {
    color: mobileTheme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: mobileTheme.colors.textMuted,
  },
  metricGrid: {
    gap: 10,
  },
  metricCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  metricValue: {
    color: mobileTheme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    padding: 12,
    gap: 3,
  },
  emptyTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  emptyText: {
    color: mobileTheme.colors.textSubtle,
  },
  actionButton: {
    marginTop: 2,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
  },
})
