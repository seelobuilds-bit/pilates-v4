import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocalSearchParams } from "expo-router"
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
} from "@/src/lib/report-range"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileReportMetric, MobileReportsResponse } from "@/src/types/mobile"

function formatAsCurrency(value: number, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: Math.abs(value % 1) > 0 ? 2 : 0,
  }).format(value)
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

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
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

function formatDeltaValue(delta: number, metric: MobileReportMetric, currency = "usd") {
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : ""
  if (metric.format === "currency") {
    const formatted = formatAsCurrency(Math.abs(delta), currency)
    return `${sign}${formatted}`
  }
  if (metric.format === "percent") {
    return `${sign}${Math.abs(delta).toFixed(1)}%`
  }
  return `${sign}${Math.abs(Math.round(delta))}`
}

function buildInitialRange(startDateParam?: string, endDateParam?: string) {
  const fallback = defaultCustomRange()
  const thisMonth = resolveReportRange("THIS_MONTH", fallback.start, fallback.end)
  return {
    start: parseDateInput(startDateParam) || thisMonth.start,
    end: parseDateInput(endDateParam) || thisMonth.end,
  }
}

export default function ReportMetricDetailScreen() {
  const { token, user } = useAuth()
  const { width } = useWindowDimensions()
  const {
    metricId,
    startDate: startDateParam,
    endDate: endDateParam,
  } = useLocalSearchParams<{ metricId?: string; startDate?: string; endDate?: string }>()
  const primaryColor = getStudioPrimaryColor()
  const isNarrowScreen = width <= 360

  const [customRange, setCustomRange] = useState(() => buildInitialRange(startDateParam, endDateParam))
  const [activeRangePicker, setActiveRangePicker] = useState<"start" | "end" | null>(null)
  const [pickerDraftDate, setPickerDraftDate] = useState<Date | null>(null)
  const [showAllTrendPoints, setShowAllTrendPoints] = useState(false)
  const [data, setData] = useState<MobileReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedInitially = useRef(false)

  const activeRange = useMemo(() => resolveReportRange("CUSTOM", customRange.start, customRange.end), [customRange.end, customRange.start])
  const reportRequestParams = useMemo(
    () => buildReportRequestParams("CUSTOM", customRange.start, customRange.end),
    [customRange.end, customRange.start]
  )

  const resolvedMetricId = useMemo(() => String(metricId || "").trim(), [metricId])

  const loadReports = useCallback(
    async (range: { start: Date; end: Date }, isRefresh = false) => {
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
        const response = await mobileApi.reports(token, buildReportRequestParams("CUSTOM", range.start, range.end))
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load metric detail"
        setError(message)
      } finally {
        setReportLoading(false)
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token]
  )

  useEffect(() => {
    if (hasLoadedInitially.current) return
    hasLoadedInitially.current = true
    void loadReports(customRange)
  }, [customRange, loadReports])

  const currency = data?.studio.currency || user?.studio.currency || "usd"
  const metric = useMemo(() => data?.metrics.find((item) => item.id === resolvedMetricId) || null, [data?.metrics, resolvedMetricId])
  const badge = metric ? changeBadge(metric) : null
  const metricSeries = useMemo(() => {
    if (!data || !metric) return []
    return data.series.map((point) => {
      const value = point.metrics[metric.id] ?? 0
      return {
        label: point.label,
        value,
      }
    })
  }, [data, metric])
  const visibleMetricSeries = useMemo(() => {
    if (showAllTrendPoints || metricSeries.length <= 8) return metricSeries
    return metricSeries.slice(-8)
  }, [metricSeries, showAllTrendPoints])
  const trendSummary = useMemo(() => {
    if (!metric || metricSeries.length === 0) return []
    const values = metricSeries.map((point) => point.value)
    const start = values[0] ?? 0
    const latest = values[values.length - 1] ?? 0
    let peak = values[0] ?? 0
    let low = values[0] ?? 0
    for (const value of values) {
      if (value > peak) peak = value
      if (value < low) low = value
    }
    return [
      { label: "Start", value: start },
      { label: "Latest", value: latest },
      { label: "Peak", value: peak },
      { label: "Low", value: low },
    ]
  }, [metric, metricSeries])
  const detailSummary = useMemo(() => {
    if (!data || !metric) return []
    return [
      { label: "Window", value: activeRange.label },
      { label: "Metric", value: metric.label },
      {
        label: "Updated",
        value: reportLoading
          ? "Updating..."
          : new Date(data.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      },
    ]
  }, [activeRange.label, data, metric, reportLoading])

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
      if (!activeRangePicker) {
        closeRangePicker()
        return
      }

      const safeDate = parseDateInput(formatDateInput(selectedDate)) || selectedDate
      const nextRange = {
        start: activeRangePicker === "start" ? safeDate : customRange.start,
        end: activeRangePicker === "end" ? safeDate : customRange.end,
      }
      setCustomRange(nextRange)
      closeRangePicker()
      void loadReports(nextRange)
    },
    [activeRangePicker, closeRangePicker, customRange.end, customRange.start, loadReports]
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadReports(customRange, true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Metric Detail</Text>
        <Text style={styles.subtitle}>Current performance for the selected range</Text>
        {detailSummary.length > 0 ? (
          <View style={styles.summaryRow}>
            {detailSummary.map((item) => (
              <View key={item.label} style={styles.summaryPill}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={[styles.summaryValue, { color: primaryColor }]} numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading metric...</Text>
        </View>
      ) : metric && data ? (
        <>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              {badge ? <Text style={[styles.changeBadge, { backgroundColor: badge.backgroundColor, color: badge.color }]}>{badge.label}</Text> : null}
            </View>
            <Text style={styles.metricValue}>{formatMetricValue(metric, currency)}</Text>
            <Text style={styles.metricPrevious}>Previous period: {formatMetricValue({ ...metric, value: metric.previousValue }, currency)}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Period Context</Text>
            <Text style={styles.metaText}>Window: {formatDate(reportRequestParams.startDate)} - {formatDate(reportRequestParams.endDate)}</Text>
            <Text style={styles.metaText}>Generated: {formatDateTime(data.generatedAt)}</Text>
            <Text style={styles.metaText}>Role: {data.role}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Trend</Text>
            {metricSeries.length === 0 ? (
              <Text style={styles.metaText}>No trend points available for this period.</Text>
            ) : (
              <>
                {metricSeries.length > 8 ? (
                  <Pressable style={styles.trendToggleButton} onPress={() => setShowAllTrendPoints((current) => !current)}>
                    <Text style={[styles.trendToggleButtonText, { color: primaryColor }]}>
                      {showAllTrendPoints ? "Show recent 8 points" : `Show all ${metricSeries.length} points`}
                    </Text>
                  </Pressable>
                ) : null}
                <View style={styles.trendSummaryGrid}>
                  {trendSummary.map((item) => (
                    <View key={item.label} style={[styles.trendSummaryChip, isNarrowScreen ? styles.trendSummaryChipNarrow : null]}>
                      <Text style={styles.trendSummaryLabel}>{item.label}</Text>
                      <Text style={styles.trendSummaryValue}>{formatMetricValue({ ...metric, value: item.value }, currency)}</Text>
                    </View>
                  ))}
                </View>
                {visibleMetricSeries.map((point, index) => {
                  const previousValue = index === 0 ? null : visibleMetricSeries[index - 1]?.value ?? null
                  const delta = previousValue === null ? null : point.value - previousValue
                  return (
                    <View key={`${point.label}-${index}`} style={styles.trendRow}>
                      <View style={styles.trendRowHeader}>
                        <Text style={styles.trendLabel}>{point.label}</Text>
                        <Text style={styles.trendValue}>{formatMetricValue({ ...metric, value: point.value }, currency)}</Text>
                      </View>
                      <View style={[styles.trendBarTrack, { backgroundColor: withOpacity(primaryColor, 0.12) }]}>
                        <View
                          style={[
                            styles.trendBarFill,
                            {
                              backgroundColor: withOpacity(primaryColor, 0.76),
                              width: `${Math.max(6, Math.round((Math.abs(point.value) / Math.max(1, ...metricSeries.map((seriesPoint) => Math.abs(seriesPoint.value)))) * 100))}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.trendMeta}>
                        {delta === null ? "Starting point" : `vs previous ${formatDeltaValue(delta, metric, currency)}`}
                      </Text>
                    </View>
                  )
                })}
              </>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Metric unavailable</Text>
          <Text style={styles.emptyText}>The selected metric could not be found for this range.</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
    backgroundColor: mobileTheme.colors.canvas,
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
    maxWidth: "48%",
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
  pickerCard: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 12,
    padding: 8,
    gap: 8,
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
  metricCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.xl,
    backgroundColor: mobileTheme.colors.surface,
    padding: 14,
    gap: 4,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metricValue: {
    color: mobileTheme.colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  metricPrevious: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.xl,
    backgroundColor: mobileTheme.colors.surface,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  metaText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 13,
  },
  trendToggleButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trendToggleButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },
  trendSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trendSummaryChip: {
    width: "48%",
    minWidth: 140,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  trendSummaryChipNarrow: {
    width: "100%",
    minWidth: 0,
  },
  trendSummaryLabel: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  trendSummaryValue: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  trendRow: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 10,
  },
  trendRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  trendLabel: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  trendValue: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  trendBarTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  trendBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  trendMeta: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 11,
  },
  errorText: {
    color: mobileTheme.colors.danger,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.xl,
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
