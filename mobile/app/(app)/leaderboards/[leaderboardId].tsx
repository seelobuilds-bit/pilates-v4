import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileLeaderboardDetailResponse } from "@/src/types/mobile"

function formatDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function formatScore(score: number, unit: string | null) {
  if (unit === "%") return `${score.toFixed(1)}%`
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`
  return score.toLocaleString()
}

export default function LeaderboardDetailScreen() {
  const { token } = useAuth()
  const { leaderboardId } = useLocalSearchParams<{ leaderboardId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileLeaderboardDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedLeaderboardId = useMemo(() => String(leaderboardId || "").trim(), [leaderboardId])

  const loadDetail = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedLeaderboardId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.leaderboardDetail(token, resolvedLeaderboardId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load leaderboard detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedLeaderboardId, token]
  )

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const metricUnit = data?.leaderboard.metricUnit ?? null

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadDetail(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Leaderboard Detail</Text>
        {data?.leaderboard ? (
          <>
            <Text style={styles.nameText}>{data.leaderboard.name}</Text>
            <Text style={styles.metaText}>
              {data.leaderboard.metricName} • {data.leaderboard.timeframe} • {data.leaderboard.participantType}
            </Text>
            {data.leaderboard.description ? <Text style={styles.metaText}>{data.leaderboard.description}</Text> : null}
            <View style={styles.pillRow}>
              <Text style={styles.metaPill}>{data.leaderboard.category}</Text>
              <Text style={styles.metaPill}>{data.leaderboard.higherIsBetter ? "Higher is better" : "Lower is better"}</Text>
              <Text style={styles.metaPill}>Min entries {data.leaderboard.minimumEntries}</Text>
            </View>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading leaderboard...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>My Standing</Text>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Rank</Text>
              <Text style={styles.rowValue}>{data.stats.myRank ? `#${data.stats.myRank}` : "Not ranked"}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Score</Text>
              <Text style={styles.rowValue}>{data.stats.myScore !== null ? formatScore(data.stats.myScore, metricUnit) : "-"}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Top score</Text>
              <Text style={styles.rowValue}>{data.stats.activeTopScore !== null ? formatScore(data.stats.activeTopScore, metricUnit) : "-"}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Average score</Text>
              <Text style={styles.rowValue}>
                {data.stats.activeAverageScore !== null ? formatScore(data.stats.activeAverageScore, metricUnit) : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Active Period</Text>
            {data.activePeriod ? (
              <>
                <Text style={styles.metaText}>{data.activePeriod.name}</Text>
                <Text style={styles.metaText}>{formatDateRange(data.activePeriod.startDate, data.activePeriod.endDate)}</Text>
                <Text style={styles.metaText}>Entries {data.activePeriod.totalEntries}</Text>
                {data.activePeriod.entries.length === 0 ? (
                  <Text style={styles.metaText}>No rankings yet.</Text>
                ) : (
                  data.activePeriod.entries.map((entry, index) => (
                    <View key={entry.id} style={styles.rankRow}>
                      <Text style={styles.rankValue}>#{entry.rank ?? index + 1}</Text>
                      <Text style={styles.rankName} numberOfLines={1}>
                        {entry.participant?.name || "Unknown participant"}
                      </Text>
                      <Text style={styles.rankScore}>{formatScore(entry.score, metricUnit)}</Text>
                    </View>
                  ))
                )}
              </>
            ) : (
              <Text style={styles.metaText}>No active period currently running.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Periods</Text>
            {data.recentPeriods.length === 0 ? (
              <Text style={styles.metaText}>No period history yet.</Text>
            ) : (
              data.recentPeriods.map((period) => (
                <View key={period.id} style={styles.periodBlock}>
                  <Text style={styles.rowLabel}>{period.name}</Text>
                  <Text style={styles.metaText}>{period.status} • {formatDateRange(period.startDate, period.endDate)}</Text>
                  <Text style={styles.metaText}>Entries {period.totalEntries}</Text>
                  {period.entries.length ? (
                    <Text style={styles.metaText}>
                      Top: {period.entries.map((entry) => `${entry.participant?.name || "Unknown"} (${formatScore(entry.score, metricUnit)})`).join(" · ")}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Prizes</Text>
            {data.leaderboard.prizes.length === 0 ? (
              <Text style={styles.metaText}>No prizes configured.</Text>
            ) : (
              data.leaderboard.prizes.map((prize) => (
                <View key={prize.id} style={styles.periodBlock}>
                  <Text style={styles.rowLabel}>#{prize.position} {prize.name}</Text>
                  {prize.description ? <Text style={styles.metaText}>{prize.description}</Text> : null}
                  <Text style={styles.metaText}>{prize.prizeType}{prize.prizeValue !== null ? ` • ${prize.prizeValue}${prize.prizeCurrency ? ` ${prize.prizeCurrency}` : ""}` : ""}</Text>
                  {prize.sponsorName ? <Text style={styles.metaText}>Sponsor: {prize.sponsorName}</Text> : null}
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Leaderboard not found</Text>
          <Text style={styles.metaText}>This leaderboard is not available in your account scope.</Text>
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
    borderWidth: 1,
    borderRadius: mobileTheme.radius.xl,
    padding: 14,
    gap: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  nameText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 16,
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
  rowItem: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  rowValue: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  rankRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankValue: {
    width: 36,
    color: mobileTheme.colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  rankName: {
    flex: 1,
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  rankScore: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  periodBlock: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: "#f8fafc",
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
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
