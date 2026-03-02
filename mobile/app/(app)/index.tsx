import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "expo-router"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import {
  buildReportRequestParams,
  defaultCustomRange,
  formatDateInput,
  parseDateInput,
  resolveReportRange,
} from "@/src/lib/report-range"
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

function buildInitialRange() {
  const fallback = defaultCustomRange()
  const thisMonth = resolveReportRange("THIS_MONTH", fallback.start, fallback.end)
  return {
    start: thisMonth.start,
    end: thisMonth.end,
  }
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
  const [customRange, setCustomRange] = useState(() => buildInitialRange())
  const [activeRangePicker, setActiveRangePicker] = useState<"start" | "end" | null>(null)
  const [pickerDraftDate, setPickerDraftDate] = useState<Date | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)

  const subdomain = (bootstrap?.studio?.subdomain || user?.studio?.subdomain || "").trim().toLowerCase()
  const roleFeatures = useMemo(() => getWorkspaceFeatures(user?.role, subdomain), [subdomain, user?.role])
  const quickActions = useMemo(() => buildQuickActions(roleFeatures), [roleFeatures])

  const roleMetricPriority = useMemo(() => buildMetricPriority(user?.role), [user?.role])
  const activeRange = useMemo(() => resolveReportRange("CUSTOM", customRange.start, customRange.end), [customRange.end, customRange.start])
  const hasLoadedInitially = useRef(false)

  const displayedTrendMetrics = useMemo(() => {
    if (!reportsData) return []

    const byId = new Map(reportsData.metrics.map((metric) => [metric.id, metric]))
    const ordered = roleMetricPriority.map((id) => byId.get(id)).filter((metric): metric is MobileReportMetric => Boolean(metric))

    const fallback = reportsData.metrics.filter((metric) => !roleMetricPriority.includes(metric.id))
    return [...ordered, ...fallback].slice(0, 4)
  }, [reportsData, roleMetricPriority])

  const loadHomeData = useCallback(
    async (range: { start: Date; end: Date }, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      }

      setReportLoading(true)
      setReportError(null)

      try {
        await refreshBootstrap()
        if (token) {
          const response = await mobileApi.reports(token, buildReportRequestParams("CUSTOM", range.start, range.end))
          setReportsData(response)
        } else {
          setReportsData(null)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load dashboard trends"
        setReportError(message)
      } finally {
        setReportLoading(false)
        setRefreshing(false)
      }
    },
    [refreshBootstrap, token]
  )

  useEffect(() => {
    if (hasLoadedInitially.current) return
    hasLoadedInitially.current = true
    void loadHomeData(customRange)
  }, [customRange, loadHomeData])

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

  const openRangePicker = useCallback(
    (field: "start" | "end") => {
      setPickerDraftDate(field === "start" ? customRange.start : customRange.end)
      setActiveRangePicker(field)
    },
    [customRange.end, customRange.start]
  )

  const closeRangePicker = useCallback(() => {
    setPickerDraftDate(null)
    setActiveRangePicker(null)
  }, [])

  const applyPickedDate = useCallback(
    (selectedDate: Date) => {
      const safeDate = parseDateInput(formatDateInput(selectedDate)) || selectedDate
      const nextRange = {
        start: activeRangePicker === "start" ? safeDate : customRange.start,
        end: activeRangePicker === "end" ? safeDate : customRange.end,
      }
      setCustomRange(nextRange)
      closeRangePicker()
      void loadHomeData(nextRange)
    },
    [activeRangePicker, closeRangePicker, customRange.end, customRange.start, loadHomeData]
  )

  const handleRangePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!activeRangePicker) {
        closeRangePicker()
        return
      }

      if (event.type === "dismissed" || !selectedDate) {
        if (Platform.OS !== "ios") {
          closeRangePicker()
        }
        return
      }

      const safeDate = parseDateInput(formatDateInput(selectedDate)) || selectedDate
      if (Platform.OS === "ios") {
        setPickerDraftDate(safeDate)
        return
      }

      applyPickedDate(safeDate)
    },
    [activeRangePicker, applyPickedDate, closeRangePicker]
  )

  const pickerValue = pickerDraftDate || (activeRangePicker === "start" ? customRange.start : customRange.end)

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={() => void loadHomeData(customRange, true)} />}
    >
      <View style={[styles.heroCard, { borderColor: withOpacity(primaryColor, 0.28), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.heroTitle}>Hello {user?.firstName ?? "there"}</Text>
        <Text style={styles.heroSubtitle}>
          {bootstrap?.studio?.name ?? user?.studio?.name ?? "Studio"} - {user?.role ?? "-"}
        </Text>

        <View style={styles.customRangeRow}>
          <Pressable style={styles.customDateButton} onPress={() => openRangePicker("start")}>
            <Text style={styles.customDateLabel}>From</Text>
            <Text style={styles.customDateValue}>{customRange.start.toLocaleDateString()}</Text>
          </Pressable>
          <Pressable style={styles.customDateButton} onPress={() => openRangePicker("end")}>
            <Text style={styles.customDateLabel}>To</Text>
            <Text style={styles.customDateValue}>{customRange.end.toLocaleDateString()}</Text>
          </Pressable>
        </View>

        {activeRangePicker ? (
          <View style={styles.pickerCard}>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={activeRangePicker === "start" ? customRange.end : new Date()}
              minimumDate={activeRangePicker === "end" ? customRange.start : undefined}
              onChange={handleRangePickerChange}
            />
            {Platform.OS === "ios" ? (
              <View style={styles.pickerActions}>
                <Pressable style={styles.pickerSecondaryButton} onPress={closeRangePicker}>
                  <Text style={styles.pickerSecondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.pickerPrimaryButton, { backgroundColor: primaryColor }]} onPress={() => applyPickedDate(pickerValue)}>
                  <Text style={styles.pickerPrimaryButtonText}>Apply</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.snapshotHeader}>
        <Text style={styles.sectionTitle}>Performance Snapshot</Text>
        <Text style={styles.snapshotHint}>{reportLoading ? "Updating..." : activeRange.label}</Text>
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
  customRangeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  pickerCard: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 12,
    padding: 8,
    gap: 8,
  },
  customDateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  customDateLabel: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  customDateValue: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  pickerSecondaryButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: mobileTheme.colors.canvas,
  },
  pickerSecondaryButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  pickerPrimaryButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerPrimaryButtonText: {
    color: "#fff",
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
