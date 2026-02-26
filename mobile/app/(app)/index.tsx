import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "expo-router"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import { getWorkspaceFeatures, type WorkspaceFeature } from "@/src/lib/workspace-links"
import type { MobileReportMetric, MobileReportsResponse } from "@/src/types/mobile"

const METRIC_LABELS: Record<string, string> = {
  activeClients: "Active Clients",
  todayBookings: "Bookings Today",
  upcomingClasses: "Upcoming Classes",
  todayClasses: "Classes Today",
  activeStudents: "Active Students",
  upcomingBookings: "Upcoming Bookings",
  completedBookings: "Completed Bookings",
}

const PERIOD_OPTIONS = [7, 30, 90] as const

function formatMetricLabel(key: string) {
  return METRIC_LABELS[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
}

function buildQuickActions(features: WorkspaceFeature[]) {
  if (features.length === 0) return []
  return features.slice(0, 4)
}

function buildMetricPriority(role: string | undefined) {
  if (role === "OWNER") {
    return ["revenue", "bookings", "classes", "fill-rate", "new-clients"]
  }
  if (role === "TEACHER") {
    return ["classes", "students", "fill-rate", "completion-rate", "revenue"]
  }
  return ["booked", "completed", "completion-rate", "cancelled"]
}

function formatTrendValue(metric: MobileReportMetric, currency = "usd") {
  if (metric.format === "currency") {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(metric.value)
  }

  if (metric.format === "percent") {
    return `${metric.value}%`
  }

  return new Intl.NumberFormat().format(metric.value)
}

function TrendMetricCard({ metric, currency }: { metric: MobileReportMetric; currency: string }) {
  const isPositive = metric.changePct > 0
  const isNegative = metric.changePct < 0

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text
          style={[
            styles.metricDelta,
            isPositive ? styles.metricDeltaPositive : null,
            isNegative ? styles.metricDeltaNegative : null,
          ]}
        >
          {metric.changePct > 0 ? "+" : ""}
          {metric.changePct}%
        </Text>
      </View>
      <Text style={styles.metricValue}>{formatTrendValue(metric, currency)}</Text>
    </View>
  )
}

function BootstrapMetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const { user, token, bootstrap, refreshBootstrap, loading } = useAuth()
  const router = useRouter()
  const primaryColor = getStudioPrimaryColor()

  const [openingActionId, setOpeningActionId] = useState<string | null>(null)
  const [reportsData, setReportsData] = useState<MobileReportsResponse | null>(null)
  const [reportPeriod, setReportPeriod] = useState<7 | 30 | 90>(7)
  const [reportError, setReportError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const subdomain = (bootstrap?.studio?.subdomain || user?.studio?.subdomain || "").trim().toLowerCase()
  const roleFeatures = useMemo(() => getWorkspaceFeatures(user?.role, subdomain), [subdomain, user?.role])
  const quickActions = useMemo(() => buildQuickActions(roleFeatures), [roleFeatures])

  const roleMetricPriority = useMemo(() => buildMetricPriority(user?.role), [user?.role])

  const displayedTrendMetrics = useMemo(() => {
    if (!reportsData) return []

    const byId = new Map(reportsData.metrics.map((metric) => [metric.id, metric]))
    const ordered = roleMetricPriority.map((id) => byId.get(id)).filter((metric): metric is MobileReportMetric => Boolean(metric))

    const fallback = reportsData.metrics.filter((metric) => !roleMetricPriority.includes(metric.id))
    return [...ordered, ...fallback].slice(0, 4)
  }, [reportsData, roleMetricPriority])

  const loadHomeData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      }

      setReportError(null)

      try {
        await refreshBootstrap()
        if (token) {
          const response = await mobileApi.reports(token, { days: reportPeriod })
          setReportsData(response)
        } else {
          setReportsData(null)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load dashboard trends"
        setReportError(message)
      } finally {
        setRefreshing(false)
      }
    },
    [refreshBootstrap, reportPeriod, token]
  )

  useEffect(() => {
    void loadHomeData()
  }, [loadHomeData])

  const handleOpenAction = useCallback(
    async (action: WorkspaceFeature) => {
      setOpeningActionId(action.id)
      try {
        if (action.target === "native" && action.nativeRoute) {
          router.push(action.nativeRoute as never)
          return
        }
        router.push("/(app)/workspace" as never)
      } finally {
        setOpeningActionId(null)
      }
    },
    [router]
  )

  const fallbackBootstrapMetrics = Object.entries(bootstrap?.metrics || {}).slice(0, 4)
  const currency = reportsData?.studio.currency || bootstrap?.studio.currency || user?.studio.currency || "usd"

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={() => void loadHomeData(true)} />}
    >
      <View style={[styles.heroCard, { borderColor: withOpacity(primaryColor, 0.28), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.heroTitle}>Hello {user?.firstName ?? "there"}</Text>
        <Text style={styles.heroSubtitle}>
          {bootstrap?.studio?.name ?? user?.studio?.name ?? "Studio"} - {user?.role ?? "-"}
        </Text>

        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((option) => {
            const selected = option === reportPeriod
            return (
              <Pressable
                key={option}
                style={[
                  styles.periodButton,
                  selected
                    ? { borderColor: withOpacity(primaryColor, 0.56), backgroundColor: withOpacity(primaryColor, 0.18) }
                    : null,
                ]}
                onPress={() => setReportPeriod(option)}
              >
                <Text style={[styles.periodButtonText, selected ? { color: primaryColor } : null]}>{option}d</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.snapshotHeader}>
        <Text style={styles.sectionTitle}>Performance Snapshot</Text>
        <Text style={styles.snapshotHint}>Period: last {reportPeriod} days</Text>
      </View>

      <View style={styles.metricsGrid}>
        {displayedTrendMetrics.length > 0
          ? displayedTrendMetrics.map((metric) => <TrendMetricCard key={metric.id} metric={metric} currency={currency} />)
          : fallbackBootstrapMetrics.map(([key, value]) => (
              <BootstrapMetricCard key={key} label={formatMetricLabel(key)} value={Number(value) || 0} />
            ))}
      </View>

      {reportError ? <Text style={styles.errorText}>{reportError}</Text> : null}

      {reportsData?.highlights && reportsData.highlights.length > 0 ? (
        <View style={styles.highlightCard}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          {reportsData.highlights.slice(0, 3).map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>{item.label}</Text>
              <Text style={styles.highlightValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

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
                <Text style={styles.actionButtonText}>{openingActionId === action.id ? "Opening..." : action.label}</Text>
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
    gap: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  heroSubtitle: {
    color: mobileTheme.colors.textMuted,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  periodButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  periodButtonText: {
    color: mobileTheme.colors.textSubtle,
    fontWeight: "700",
    fontSize: 12,
  },
  snapshotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  snapshotHint: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
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
    gap: 4,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  metricLabel: {
    color: mobileTheme.colors.textSubtle,
    textTransform: "capitalize",
    fontSize: 12,
    flex: 1,
  },
  metricDelta: {
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metricDeltaPositive: {
    color: "#166534",
    backgroundColor: "#dcfce7",
  },
  metricDeltaNegative: {
    color: "#991b1b",
    backgroundColor: "#fee2e2",
  },
  metricValue: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  highlightCard: {
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 6,
  },
  highlightRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  highlightLabel: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
  },
  highlightValue: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "600",
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
  errorText: {
    color: mobileTheme.colors.danger,
    fontSize: 12,
  },
})
