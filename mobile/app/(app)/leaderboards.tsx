import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileLeaderboardParticipantType, MobileLeaderboardSummary } from "@/src/types/mobile"

function formatScore(score: number, unit: string | null) {
  if (unit === "%") return `${score.toFixed(1)}%`
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`
  return score.toLocaleString()
}

function LeaderboardCard({
  leaderboard,
  myRank,
  onViewDetails,
}: {
  leaderboard: MobileLeaderboardSummary
  myRank: { rank: number; score: number } | null
  onViewDetails: (leaderboardId: string) => void
}) {
  const topEntries = leaderboard.currentPeriod?.entries?.slice(0, 3) || []

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{leaderboard.name}</Text>
        {leaderboard.isFeatured ? <Text style={styles.featuredBadge}>Featured</Text> : null}
      </View>
      <Text style={styles.metaText}>
        {leaderboard.metricName} • {leaderboard.timeframe}
      </Text>
      {myRank ? (
        <Text style={styles.myRankText}>
          My Rank #{myRank.rank} • {formatScore(myRank.score, leaderboard.metricUnit)}
        </Text>
      ) : (
        <Text style={styles.metaText}>Not ranked yet</Text>
      )}

      {topEntries.length > 0 ? (
        <View style={styles.topEntriesWrap}>
          {topEntries.map((entry, index) => (
            <View key={entry.id} style={styles.entryRow}>
              <Text style={styles.entryRank}>#{entry.rank ?? index + 1}</Text>
              <Text style={styles.entryName} numberOfLines={1}>
                {entry.participant?.name || "Unknown"}
              </Text>
              <Text style={styles.entryScore}>{formatScore(entry.score, leaderboard.metricUnit)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.metaText}>No active leaderboard period yet.</Text>
      )}

      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(leaderboard.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

export default function LeaderboardsScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [participantType, setParticipantType] = useState<MobileLeaderboardParticipantType>(user?.role === "TEACHER" ? "TEACHER" : "STUDIO")
  const [leaderboards, setLeaderboards] = useState<MobileLeaderboardSummary[]>([])
  const [myRanks, setMyRanks] = useState<Record<string, { rank: number; score: number } | null>>({})
  const [search, setSearch] = useState("")
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const trimmedSearch = search.trim().toLowerCase()

  useEffect(() => {
    if (user?.role === "TEACHER") {
      setParticipantType("TEACHER")
    }
  }, [user?.role])

  const loadLeaderboards = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setLeaderboards([])
        setMyRanks({})
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      try {
        const response = await mobileApi.leaderboards(token, { type: participantType })
        setLeaderboards(response.leaderboards || [])
        setMyRanks(response.myRanks || {})
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load leaderboards"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAllowedRole, participantType, token]
  )

  useEffect(() => {
    void loadLeaderboards()
  }, [loadLeaderboards])

  const searchedLeaderboards = useMemo(() => {
    if (!trimmedSearch) return leaderboards
    return leaderboards.filter((leaderboard) => {
      const haystack = `${leaderboard.name} ${leaderboard.metricName} ${leaderboard.timeframe}`.toLowerCase()
      return haystack.includes(trimmedSearch)
    })
  }, [leaderboards, trimmedSearch])

  const featuredCounts = useMemo(() => {
    const featured = searchedLeaderboards.filter((item) => item.isFeatured).length
    return {
      all: searchedLeaderboards.length,
      featured,
    } as const
  }, [searchedLeaderboards])

  const filteredLeaderboards = useMemo(
    () => (featuredOnly ? searchedLeaderboards.filter((item) => item.isFeatured) : searchedLeaderboards),
    [featuredOnly, searchedLeaderboards]
  )

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Leaderboards are available for studio owner and teacher accounts."
    if (trimmedSearch && featuredOnly) return "No featured leaderboards matched your search."
    if (trimmedSearch) return "No leaderboards matched your search."
    if (featuredOnly) return "No featured leaderboards available right now."
    return "No leaderboards available right now."
  }, [featuredOnly, isAllowedRole, trimmedSearch])

  const handleViewDetails = useCallback(
    (leaderboardId: string) => {
      router.push(`/(app)/leaderboards/${leaderboardId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Leaderboards</Text>
        <Text style={styles.subtitle}>Track rankings and competition results</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search leaderboards..."
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        <Pressable
          style={[
            styles.filterButton,
            participantType === "STUDIO" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setParticipantType("STUDIO")}
          disabled={user?.role === "TEACHER"}
        >
          <Text style={[styles.filterButtonText, participantType === "STUDIO" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            Studio
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterButton,
            participantType === "TEACHER" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setParticipantType("TEACHER")}
        >
          <Text style={[styles.filterButtonText, participantType === "TEACHER" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            Teacher
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterButton,
            !featuredOnly && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setFeaturedOnly(false)}
        >
          <Text style={[styles.filterButtonText, !featuredOnly && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`All (${featuredCounts.all})`}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterButton,
            featuredOnly && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setFeaturedOnly(true)}
        >
          <Text style={[styles.filterButtonText, featuredOnly && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`Featured (${featuredCounts.featured})`}
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isAllowedRole ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => router.push("/(app)/workspace")}>
            <Text style={styles.actionButtonText}>Go to workspace</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredLeaderboards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeaderboardCard leaderboard={item} myRank={myRanks[item.id] || null} onViewDetails={handleViewDetails} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadLeaderboards(true)} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
    padding: 16,
    gap: 10,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.xl,
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
  searchInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    color: mobileTheme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonActive: {
    borderWidth: 1,
  },
  filterButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: mobileTheme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  featuredBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#92400e",
    backgroundColor: "#fef3c7",
    textTransform: "uppercase",
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  myRankText: {
    color: mobileTheme.colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  topEntriesWrap: {
    marginTop: 4,
    gap: 5,
  },
  detailsButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryRank: {
    width: 28,
    color: mobileTheme.colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  entryName: {
    flex: 1,
    color: mobileTheme.colors.text,
    fontSize: 12,
  },
  entryScore: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  errorText: {
    color: mobileTheme.colors.danger,
  },
  emptyWrap: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: mobileTheme.colors.textSubtle,
  },
  actionButton: {
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
})
