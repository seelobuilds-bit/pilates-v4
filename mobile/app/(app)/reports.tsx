import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "expo-router"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import {
  buildReportRequestParams,
  defaultCustomRange,
  formatDateInput,
  parseDateInput,
  resolveReportRange,
  type MobileReportRangePreset,
} from "@/src/lib/report-range"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileReportMetric, MobileReportsResponse } from "@/src/types/mobile"

function formatRangeDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function formatAsCurrency(value: number, currency = "usd") {
  const rounded = Math.abs(value % 1) > 0 ? value : Math.round(value)
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: Math.abs(value % 1) > 0 ? 2 : 0,
  }).format(rounded)
}

function formatMetricValue(metric: MobileReportMetric, currency = "usd") {
  if (metric.format === "currency") {
    return formatAsCurrency(metric.value, currency)
  }

  if (metric.format === "percent") {
    return `${metric.value}%`
  }

  return new Intl.NumberFormat().format(metric.value)
}

function formatPreviousValue(metric: MobileReportMetric, currency = "usd") {
  if (metric.format === "currency") {
    return formatAsCurrency(metric.previousValue, currency)
  }

  if (metric.format === "percent") {
    return `${metric.previousValue}%`
  }

  return new Intl.NumberFormat().format(metric.previousValue)
}

function changeBadge(metric: MobileReportMetric) {
  if (metric.changePct > 0) {
    return { label: `+${metric.changePct}%`, backgroundColor: "#dcfce7", color: "#166534" }
  }
  if (metric.changePct < 0) {
    return { label: `${metric.changePct}%`, backgroundColor: "#fee2e2", color: "#991b1b" }
  }
  return { label: "0%", backgroundColor: "#e2e8f0", color: "#334155" }
}

function trendDirectionLabel(startValue: number, endValue: number, metric: MobileReportMetric, currency = "usd") {
  const delta = endValue - startValue
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : ""
  if (metric.format === "currency") {
    const formattedAbs = formatAsCurrency(Math.abs(delta), currency)
    return `${sign}${formattedAbs}`
  }
  if (metric.format === "percent") {
    return `${sign}${Math.abs(delta).toFixed(1)}%`
  }
  return `${sign}${Math.abs(Math.round(delta))}`
}

const RANGE_SHORTCUTS: { id: Exclude<MobileReportRangePreset, "CUSTOM">; label: string }[] = [
  { id: "TODAY", label: "Today" },
  { id: "THIS_MONTH", label: "This month" },
  { id: "LAST_30", label: "Last 30d" },
]

export default function ReportsScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const { width } = useWindowDimensions()
  const primaryColor = getStudioPrimaryColor()
  const isNarrowScreen = width <= 360

  const [rangePreset, setRangePreset] = useState<MobileReportRangePreset>("THIS_MONTH")
  const [customRange, setCustomRange] = useState(() => defaultCustomRange())
  const [activeRangePicker, setActiveRangePicker] = useState<"start" | "end" | null>(null)
  const [data, setData] = useState<MobileReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeRange = useMemo(
    () => resolveReportRange(rangePreset, customRange.start, customRange.end),
    [customRange.end, customRange.start, rangePreset]
  )

  const loadReports = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setReportLoading(true)
      setError(null)
      try {
        const response = await mobileApi.reports(token, buildReportRequestParams(rangePreset, customRange.start, customRange.end))
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load reports"
        setError(message)
      } finally {
        setReportLoading(false)
        setLoading(false)
        setRefreshing(false)
      }
    },
    [customRange.end, customRange.start, rangePreset, token]
  )

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const subtitle = useMemo(() => {
    if (user?.role === "OWNER") return "Track studio performance, growth, and operations."
    if (user?.role === "TEACHER") return "Track classes, clients, and teaching performance."
    return "Track your class activity and attendance trends."
  }, [user?.role])

  const currency = data?.studio.currency || user?.studio.currency || "usd"
  const reportSummary = useMemo(() => {
    if (!data) return null
    return [
      { label: "Window", value: activeRange.label },
      { label: "Range", value: `${formatRangeDate(data.range.start)} - ${formatRangeDate(data.range.end)}` },
      {
        label: "Updated",
        value: reportLoading
          ? "Updating..."
          : new Date(data.generatedAt).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            }),
      },
    ]
  }, [activeRange.label, data, reportLoading])
  const visibleMetrics = data?.metrics ?? []
  const topMetric = visibleMetrics[0] || data?.metrics?.[0] || null

  const handleRangePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "dismissed" || !selectedDate || !activeRangePicker) {
        setActiveRangePicker(null)
        return
      }

      const safeDate = parseDateInput(formatDateInput(selectedDate)) || selectedDate
      setCustomRange((current) => ({
        start: activeRangePicker === "start" ? safeDate : current.start,
        end: activeRangePicker === "end" ? safeDate : current.end,
      }))
      setRangePreset("CUSTOM")
      setActiveRangePicker(null)
    },
    [activeRangePicker]
  )

  const currentRangeParams = useMemo(() => buildReportRequestParams(rangePreset, customRange.start, customRange.end), [customRange.end, customRange.start, rangePreset])

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadReports(true)} />}
      >
        <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.26), backgroundColor: withOpacity(primaryColor, 0.1) }]}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {reportSummary ? (
            <View style={styles.summaryRow}>
              {reportSummary.map((item) => (
                <View key={item.label} style={styles.summaryPill}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={[styles.summaryValue, { color: primaryColor }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.shortcutRow}>
            {RANGE_SHORTCUTS.map((option) => {
              const selected = option.id === rangePreset
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.shortcutButton,
                    selected
                      ? { borderColor: withOpacity(primaryColor, 0.5), backgroundColor: withOpacity(primaryColor, 0.16) }
                      : null,
                  ]}
                  onPress={() => setRangePreset(option.id)}
                >
                  <Text style={[styles.shortcutButtonText, selected ? { color: primaryColor } : null]}>{option.label}</Text>
                </Pressable>
              )
            })}
          </View>
          <View style={styles.customRangeRow}>
            <Pressable
              style={styles.customDateButton}
              onPress={() => {
                if (rangePreset !== "CUSTOM") {
                  setCustomRange({ start: activeRange.start, end: activeRange.end })
                }
                setActiveRangePicker("start")
              }}
            >
              <Text style={styles.customDateLabel}>From</Text>
              <Text style={styles.customDateValue}>
                {(rangePreset === "CUSTOM" ? customRange.start : activeRange.start).toLocaleDateString()}
              </Text>
            </Pressable>
            <Pressable
              style={styles.customDateButton}
              onPress={() => {
                if (rangePreset !== "CUSTOM") {
                  setCustomRange({ start: activeRange.start, end: activeRange.end })
                }
                setActiveRangePicker("end")
              }}
            >
              <Text style={styles.customDateLabel}>To</Text>
              <Text style={styles.customDateValue}>
                {(rangePreset === "CUSTOM" ? customRange.end : activeRange.end).toLocaleDateString()}
              </Text>
            </Pressable>
          </View>
          {activeRangePicker ? (
            <DateTimePicker
              value={activeRangePicker === "start" ? customRange.start : customRange.end}
              mode="date"
              display={Platform.OS === "ios" ? "compact" : "default"}
              maximumDate={activeRangePicker === "start" ? customRange.end : new Date()}
              minimumDate={activeRangePicker === "end" ? customRange.start : undefined}
              onChange={handleRangePickerChange}
            />
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading && !data ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Loading reports...</Text>
          </View>
        ) : data ? (
          <>
            <View style={styles.metricGrid}>
              {visibleMetrics.map((metric) => {
                const badge = changeBadge(metric)
                const trendValues = data.series
                  .map((point) => point.metrics[metric.id])
                  .filter((value): value is number => typeof value === "number")
                const trendStart = trendValues[0]
                const trendEnd = trendValues[trendValues.length - 1]
                const hasTrend = typeof trendStart === "number" && typeof trendEnd === "number"
                const sparklineValues = trendValues.slice(-8)
                const sparklineMax = Math.max(1, ...sparklineValues.map((value) => Math.abs(value)))
                return (
                  <Pressable
                    key={metric.id}
                    style={[styles.metricCard, isNarrowScreen ? styles.metricCardNarrow : null]}
                    onPress={() =>
                      router.push(
                        `/(app)/reports/${metric.id}?preset=${rangePreset}&startDate=${encodeURIComponent(currentRangeParams.startDate)}&endDate=${encodeURIComponent(currentRangeParams.endDate)}` as never
                      )
                    }
                  >
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                      <Text style={[styles.changeBadge, { backgroundColor: badge.backgroundColor, color: badge.color }]}>{badge.label}</Text>
                    </View>
                    <Text style={styles.metricValue}>{formatMetricValue(metric, currency)}</Text>
                    <Text style={styles.metricPrevious}>Prev {formatPreviousValue(metric, currency)}</Text>
                    {hasTrend ? (
                      <Text style={styles.metricTrend}>Trend {trendDirectionLabel(trendStart, trendEnd, metric, currency)}</Text>
                    ) : null}
                    {sparklineValues.length > 1 ? (
                      <View style={styles.sparklineRow}>
                        {sparklineValues.map((value, index) => {
                          const normalizedHeight = Math.round((Math.abs(value) / sparklineMax) * 100)
                          const barHeight = value === 0 ? 0 : Math.max(12, normalizedHeight)
                          return (
                            <View key={`${metric.id}-spark-${index}`} style={[styles.sparklineBarTrack, { backgroundColor: withOpacity(primaryColor, 0.16) }]}>
                              <View
                                style={[
                                  styles.sparklineBarFill,
                                  {
                                    backgroundColor: withOpacity(primaryColor, 0.72),
                                    height: `${barHeight}%`,
                                  },
                                ]}
                              />
                            </View>
                          )
                        })}
                      </View>
                    ) : null}
                    <Text style={styles.metricHint}>View detail</Text>
                  </Pressable>
                )
              })}
            </View>
            {visibleMetrics.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No metrics available</Text>
                <Text style={styles.emptyText}>Metrics will appear here once there is enough data in the selected range.</Text>
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              {data.highlights.length === 0 ? (
                <Text style={styles.emptyText}>No highlights yet for this period.</Text>
              ) : (
                data.highlights.map((item, index) => (
                  <View key={`${item.label}-${index}`} style={styles.highlightRow}>
                    <Text style={styles.highlightLabel}>{item.label}</Text>
                    <Text style={styles.highlightValue}>{item.value}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Snapshot</Text>
              <Text style={styles.emptyText}>
                {topMetric
                  ? `Leading metric: ${topMetric.label} at ${formatMetricValue(topMetric, currency)}. Tap any metric card for the detailed trend view.`
                  : "Tap any metric card for the detailed trend view."}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No report data yet</Text>
            <Text style={styles.emptyText}>As bookings and class activity come in, your metrics will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
  },
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  headerCard: {
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  title: {
    color: mobileTheme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: mobileTheme.colors.textMuted,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  summaryPill: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  summaryLabel: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  shortcutRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  shortcutButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
    alignItems: "center",
  },
  shortcutButtonText: {
    color: mobileTheme.colors.textSubtle,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  customRangeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
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
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    minWidth: 152,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 4,
  },
  metricCardNarrow: {
    width: "100%",
    minWidth: 0,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  metricLabel: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
    flex: 1,
  },
  changeBadge: {
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metricValue: {
    color: mobileTheme.colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  metricPrevious: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
  },
  metricHint: {
    marginTop: 4,
    color: mobileTheme.colors.textSubtle,
    fontSize: 11,
    fontWeight: "700",
  },
  metricTrend: {
    marginTop: 2,
    color: mobileTheme.colors.textSubtle,
    fontSize: 11,
  },
  sparklineRow: {
    flexDirection: "row",
    gap: 4,
    height: 22,
    marginTop: 4,
  },
  sparklineBarTrack: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  sparklineBarFill: {
    width: "100%",
    borderRadius: 999,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
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
    fontWeight: "600",
    fontSize: 13,
  },
  errorText: {
    color: mobileTheme.colors.danger,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 14,
    gap: 4,
  },
  emptyTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  emptyText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
})
