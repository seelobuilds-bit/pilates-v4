import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileReportMetric, MobileReportsResponse } from "@/src/types/mobile"

const PERIOD_OPTIONS = [7, 30, 90] as const

function formatMetricValue(metric: MobileReportMetric, currency = "usd") {
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

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Math.abs(delta))
    return `${sign}${formatted}`
  }
  if (metric.format === "percent") {
    return `${sign}${Math.abs(delta).toFixed(1)}%`
  }
  return `${sign}${Math.abs(Math.round(delta))}`
}

export default function ReportMetricDetailScreen() {
  const { token, user } = useAuth()
  const { metricId, days: daysParam } = useLocalSearchParams<{ metricId?: string; days?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const initialDays = useMemo(() => {
    const parsed = Number(daysParam || 30)
    return parsed === 7 || parsed === 90 ? parsed : 30
  }, [daysParam])

  const [days, setDays] = useState<7 | 30 | 90>(initialDays)
  const [showAllTrendPoints, setShowAllTrendPoints] = useState(false)
  const [data, setData] = useState<MobileReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedMetricId = useMemo(() => String(metricId || "").trim(), [metricId])

  const loadReports = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.reports(token, { days })
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load metric detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [days, token]
  )

  useEffect(() => {
    void loadReports()
  }, [loadReports])

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
  const metricSeriesMax = useMemo(
    () => Math.max(1, ...metricSeries.map((point) => Math.abs(point.value))),
    [metricSeries]
  )
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadReports(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Metric Detail</Text>
        <Text style={styles.subtitle}>Current performance for selected period</Text>
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((option) => {
            const selected = option === days
            return (
              <Pressable
                key={option}
                style={[
                  styles.periodButton,
                  selected ? { borderColor: withOpacity(primaryColor, 0.5), backgroundColor: withOpacity(primaryColor, 0.16) } : null,
                ]}
                onPress={() => setDays(option)}
              >
                <Text style={[styles.periodButtonText, selected ? { color: primaryColor } : null]}>{option}d</Text>
              </Pressable>
            )
          })}
        </View>
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
            <Text style={styles.metaText}>Window: {formatDate(data.range.start)} - {formatDate(data.range.end)}</Text>
            <Text style={styles.metaText}>Generated: {formatDate(data.generatedAt)}</Text>
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
                    <View key={item.label} style={styles.trendSummaryChip}>
                      <Text style={styles.trendSummaryLabel}>{item.label}</Text>
                      <Text style={styles.trendSummaryValue}>{formatMetricValue({ ...metric, value: item.value }, currency)}</Text>
                    </View>
                  ))}
                </View>
                {visibleMetricSeries.map((point, index) => {
                  const previousValue = index === 0 ? null : visibleMetricSeries[index - 1]?.value ?? null
                  const delta = previousValue === null ? null : point.value - previousValue
                  const deltaTone = delta === null ? "muted" : delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral"

                  return (
                    <View key={`${point.label}-${index}`} style={styles.trendRow}>
                      <Text style={styles.trendLabel}>{point.label}</Text>
                      <View style={styles.trendTrack}>
                        <View
                          style={[
                            styles.trendFill,
                            {
                              width: `${Math.max(4, Math.round((Math.abs(point.value) / metricSeriesMax) * 100))}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.trendValueGroup}>
                        <Text style={styles.trendValue}>
                          {formatMetricValue({ ...metric, value: point.value }, currency)}
                        </Text>
                        {delta === null ? (
                          <Text style={[styles.trendDeltaText, styles.trendDeltaTextMuted]}>Start</Text>
                        ) : (
                          <Text
                            style={[
                              styles.trendDeltaText,
                              deltaTone === "positive"
                                ? styles.trendDeltaTextPositive
                                : deltaTone === "negative"
                                  ? styles.trendDeltaTextNegative
                                  : styles.trendDeltaTextNeutral,
                            ]}
                          >
                            {formatDeltaValue(delta, metric, currency)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            {data.highlights.length === 0 ? (
              <Text style={styles.metaText}>No highlights yet for this period.</Text>
            ) : (
              data.highlights.map((item, index) => (
                <View key={`${item.label}-${index}`} style={styles.highlightRow}>
                  <Text style={styles.highlightLabel}>{item.label}</Text>
                  <Text style={styles.highlightValue}>{item.value}</Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Metric not found</Text>
          <Text style={styles.metaText}>This metric is not available for the selected period.</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
    backgroundColor: mobileTheme.colors.canvas,
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
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
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
  metricCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 6,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  metricLabel: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 13,
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
  trendRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trendLabel: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
    width: 58,
  },
  trendSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 2,
  },
  trendToggleButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trendToggleButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },
  trendSummaryChip: {
    width: "48%",
    minWidth: 132,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    backgroundColor: mobileTheme.colors.canvas,
  },
  trendSummaryLabel: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
  },
  trendSummaryValue: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  trendTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },
  trendFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#0f766e",
  },
  trendValue: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
    minWidth: 76,
    textAlign: "right",
  },
  trendValueGroup: {
    minWidth: 76,
    alignItems: "flex-end",
    gap: 2,
  },
  trendDeltaText: {
    fontSize: 10,
    fontWeight: "700",
  },
  trendDeltaTextPositive: {
    color: "#166534",
  },
  trendDeltaTextNegative: {
    color: "#991b1b",
  },
  trendDeltaTextNeutral: {
    color: "#334155",
  },
  trendDeltaTextMuted: {
    color: mobileTheme.colors.textMuted,
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
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
  errorText: {
    color: mobileTheme.colors.danger,
  },
})
