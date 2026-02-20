import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "expo-router"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import { toWorkspaceUrl } from "@/src/lib/workspace-links"
import type { MobileReportMetric, MobileReportsResponse } from "@/src/types/mobile"

const PERIOD_OPTIONS = [7, 30, 90] as const
const METRIC_ORDER_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "movers", label: "Top Movers" },
] as const

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

function formatPreviousValue(metric: MobileReportMetric, currency = "usd") {
  if (metric.format === "currency") {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(metric.previousValue)
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
    const formattedAbs = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Math.abs(delta))
    return `${sign}${formattedAbs}`
  }
  if (metric.format === "percent") {
    return `${sign}${Math.abs(delta).toFixed(1)}%`
  }
  return `${sign}${Math.abs(Math.round(delta))}`
}

export default function ReportsScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [metricOrder, setMetricOrder] = useState<(typeof METRIC_ORDER_OPTIONS)[number]["id"]>("default")
  const [data, setData] = useState<MobileReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        const message = err instanceof Error ? err.message : "Failed to load reports"
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

  const subtitle = useMemo(() => {
    if (user?.role === "OWNER") return "Track studio performance, growth, and operations."
    if (user?.role === "TEACHER") return "Track classes, clients, and teaching performance."
    return "Track your class activity and attendance trends."
  }, [user?.role])

  const currency = data?.studio.currency || user?.studio.currency || "usd"
  const canOpenWeb = user?.role === "OWNER" || user?.role === "TEACHER"
  const visibleMetrics = useMemo(() => {
    if (!data?.metrics) return []
    if (metricOrder === "default") return data.metrics
    return [...data.metrics].sort((left, right) => Math.abs(right.changePct) - Math.abs(left.changePct))
  }, [data?.metrics, metricOrder])

  const openWebReports = useCallback(async () => {
    const target = user?.role === "TEACHER" ? "/teacher/reports" : "/studio/reports"
    await Linking.openURL(toWorkspaceUrl(target))
  }, [user?.role])

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadReports(true)} />}
      >
        <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.26), backgroundColor: withOpacity(primaryColor, 0.1) }]}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((option) => {
              const selected = option === days
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.periodButton,
                    selected
                      ? { borderColor: withOpacity(primaryColor, 0.5), backgroundColor: withOpacity(primaryColor, 0.16) }
                      : null,
                  ]}
                  onPress={() => setDays(option)}
                >
                  <Text style={[styles.periodButtonText, selected ? { color: primaryColor } : null]}>{option}d</Text>
                </Pressable>
              )
            })}
          </View>
          <View style={styles.orderRow}>
            {METRIC_ORDER_OPTIONS.map((option) => {
              const selected = option.id === metricOrder
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.orderButton,
                    selected ? { borderColor: withOpacity(primaryColor, 0.5), backgroundColor: withOpacity(primaryColor, 0.14) } : null,
                  ]}
                  onPress={() => setMetricOrder(option.id)}
                >
                  <Text style={[styles.orderButtonText, selected ? { color: primaryColor } : null]}>{option.label}</Text>
                </Pressable>
              )
            })}
          </View>
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
                    style={styles.metricCard}
                    onPress={() => router.push(`/(app)/reports/${metric.id}?days=${days}` as never)}
                  >
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                      <Text style={[styles.changeBadge, { backgroundColor: badge.backgroundColor, color: badge.color }]}>{badge.label}</Text>
                    </View>
                    <Text style={styles.metricValue}>{formatMetricValue(metric, currency)}</Text>
                    <Text style={styles.metricPrevious}>Prev {formatPreviousValue(metric, currency)}</Text>
                    {hasTrend ? (
                      <Text style={styles.metricTrend}>
                        Trend {trendDirectionLabel(trendStart, trendEnd, metric, currency)}
                      </Text>
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

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Highlights ({days}d)</Text>
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

            {canOpenWeb ? (
              <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => void openWebReports()}>
                <Text style={styles.actionButtonText}>Open full web reports</Text>
              </Pressable>
            ) : null}
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
  periodRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  orderRow: {
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
  orderButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orderButtonText: {
    color: mobileTheme.colors.textSubtle,
    fontWeight: "700",
    fontSize: 11,
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
  actionButton: {
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
  },
  errorText: {
    color: mobileTheme.colors.danger,
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
})
