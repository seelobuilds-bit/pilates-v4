import { useCallback, useEffect, useMemo, useState } from "react"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileSocialAccountSummary, MobileSocialFlowSummary, MobileSocialResponse, MobileSocialTrackingLinkSummary } from "@/src/types/mobile"

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

function formatCurrency(value: number, currencyCode: string) {
  const normalized = String(currencyCode || "USD").toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value}`
  }
}

function formatDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function AccountCard({ item }: { item: MobileSocialAccountSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>@{item.username}</Text>
        <Text style={styles.statusBadge}>{item.platform}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.isActive ? "Active" : "Inactive"}</Text>
        <Text style={styles.metaPill}>Followers {formatNumber(item.followerCount)}</Text>
        <Text style={styles.metaPill}>Flows {item.flowCount}</Text>
        <Text style={styles.metaPill}>Messages {item.messageCount}</Text>
      </View>
      <Text style={styles.metaText}>Last sync {formatDate(item.lastSyncedAt)}</Text>
    </View>
  )
}

function FlowCard({
  item,
  onViewDetails,
  onToggleFlowStatus,
  isUpdating,
  primaryColor,
}: {
  item: MobileSocialFlowSummary
  onViewDetails: (flowId: string) => void
  onToggleFlowStatus: (flowId: string, action: "activate" | "pause") => void
  isUpdating: boolean
  primaryColor: string
}) {
  const action = item.isActive ? "pause" : "activate"
  const actionLabel = item.isActive ? "Pause Flow" : "Activate Flow"

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.statusBadge}>{item.isActive ? "ACTIVE" : "PAUSED"}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.account.platform}</Text>
        <Text style={styles.metaPill}>@{item.account.username}</Text>
        <Text style={styles.metaPill}>{item.triggerType}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>Triggered {formatNumber(item.totalTriggered)}</Text>
        <Text style={styles.metaPill}>Booked {formatNumber(item.totalBooked)}</Text>
      </View>
      <Text style={styles.metaText}>Updated {formatDate(item.updatedAt)}</Text>
      <Pressable
        disabled={isUpdating}
        style={[styles.inlineActionButton, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.12) }]}
        onPress={() => onToggleFlowStatus(item.id, action)}
      >
        <Text style={[styles.inlineActionText, { color: primaryColor }]}>{isUpdating ? "Updating..." : actionLabel}</Text>
      </Pressable>
      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

function TrackingCard({ item, currency }: { item: MobileSocialTrackingLinkSummary; currency: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.campaign || item.code}</Text>
        <Text style={styles.statusBadge}>{item.source}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.medium}</Text>
        <Text style={styles.metaPill}>Clicks {formatNumber(item.clicks)}</Text>
        <Text style={styles.metaPill}>Conversions {formatNumber(item.conversions)}</Text>
        <Text style={styles.metaPill}>Revenue {formatCurrency(item.revenue, currency)}</Text>
      </View>
      <Text style={styles.metaText}>Created {formatDate(item.createdAt)}</Text>
    </View>
  )
}

export default function SocialScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileSocialResponse | null>(null)
  const [search, setSearch] = useState("")
  const [flowStatusFilter, setFlowStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingFlowId, setUpdatingFlowId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const trimmedSearch = search.trim()
  const searchNormalized = trimmedSearch.toLowerCase()

  const loadSocial = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.social(token, {})
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load social overview"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAllowedRole, token]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadSocial()
    }, 220)

    return () => clearTimeout(timeout)
  }, [loadSocial])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Social workspace is available for owner and teacher accounts only."
    if (trimmedSearch) return "No social records matched your search."
    return "No social data available yet."
  }, [isAllowedRole, trimmedSearch])

  const currency = data?.studio.currency || "USD"
  const handleViewFlowDetails = useCallback(
    (flowId: string) => {
      router.push(`/(app)/social/flows/${flowId}` as never)
    },
    [router]
  )

  const handleToggleFlowStatus = useCallback(
    async (flowId: string, action: "activate" | "pause") => {
      if (!token) return
      setUpdatingFlowId(flowId)
      setError(null)
      try {
        await mobileApi.socialFlowStatus(token, flowId, action)
        await loadSocial(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update flow status"
        setError(message)
      } finally {
        setUpdatingFlowId(null)
      }
    },
    [loadSocial, token]
  )

  const searchScopedAccounts = useMemo(() => {
    const accounts = data?.accounts || []
    if (!searchNormalized) return accounts
    return accounts.filter((account) => {
      const haystack = `${account.username} ${account.displayName || ""} ${account.platform}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [data?.accounts, searchNormalized])

  const searchScopedFlows = useMemo(() => {
    const flows = data?.flows || []
    if (!searchNormalized) return flows
    return flows.filter((flow) => {
      const haystack = `${flow.name} ${flow.triggerType} ${flow.account.username} ${flow.account.platform}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [data?.flows, searchNormalized])

  const searchScopedTrackingLinks = useMemo(() => {
    const links = data?.trackingLinks || []
    if (!searchNormalized) return links
    return links.filter((link) => {
      const haystack = `${link.code} ${link.campaign || ""} ${link.source} ${link.medium}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [data?.trackingLinks, searchNormalized])

  const flowStatusCounts = useMemo(() => {
    const flows = searchScopedFlows
    const active = flows.filter((flow) => flow.isActive).length
    const paused = flows.length - active
    return {
      ALL: flows.length,
      ACTIVE: active,
      PAUSED: paused,
    } as const
  }, [searchScopedFlows])

  const filteredFlows = useMemo(() => {
    const flows = searchScopedFlows
    if (flowStatusFilter === "ALL") return flows
    if (flowStatusFilter === "ACTIVE") return flows.filter((flow) => flow.isActive)
    return flows.filter((flow) => !flow.isActive)
  }, [flowStatusFilter, searchScopedFlows])

  const hasVisibleSocialRecords = searchScopedAccounts.length > 0 || searchScopedFlows.length > 0 || searchScopedTrackingLinks.length > 0

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Social Media</Text>
        <Text style={styles.subtitle}>Accounts, flows, DMs, and tracking performance</Text>
        {data ? (
          <View style={styles.statsRow}>
            <Text style={styles.statPill}>Accounts {data.stats.totalAccounts}</Text>
            <Text style={styles.statPill}>Active Flows {data.stats.activeFlows}</Text>
            <Text style={styles.statPill}>Unread Msgs {data.stats.unreadMessages}</Text>
            <Text style={styles.statPill}>Unread Chats {data.stats.unreadConversations}</Text>
            <Text style={styles.statPill}>Clicks {formatNumber(data.stats.totalTrackingClicks)}</Text>
            <Text style={styles.statPill}>Conversions {formatNumber(data.stats.totalTrackingConversions)}</Text>
          </View>
        ) : null}
      </View>

      <TextInput value={search} onChangeText={setSearch} placeholder="Search accounts, flows, campaigns..." style={styles.searchInput} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isAllowedRole ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => router.push("/(app)/workspace")}>
            <Text style={styles.actionButtonText}>Go to workspace</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadSocial(true)} />}
        >
          {loading ? null : data && hasVisibleSocialRecords ? (
            <>
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Connected Accounts</Text>
                {searchScopedAccounts.length > 0 ? (
                  searchScopedAccounts.slice(0, 6).map((account) => <AccountCard key={account.id} item={account} />)
                ) : (
                  <Text style={styles.metaText}>No accounts matched your search.</Text>
                )}
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Active Flows</Text>
                <View style={styles.filterRow}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      flowStatusFilter === "ALL" && {
                        borderColor: primaryColor,
                        backgroundColor: withOpacity(primaryColor, 0.14),
                      },
                    ]}
                    onPress={() => setFlowStatusFilter("ALL")}
                  >
                    <Text style={[styles.filterChipText, flowStatusFilter === "ALL" && { color: primaryColor, fontWeight: "700" }]}>
                      {`All (${flowStatusCounts.ALL})`}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.filterChip,
                      flowStatusFilter === "ACTIVE" && {
                        borderColor: primaryColor,
                        backgroundColor: withOpacity(primaryColor, 0.14),
                      },
                    ]}
                    onPress={() => setFlowStatusFilter("ACTIVE")}
                  >
                    <Text style={[styles.filterChipText, flowStatusFilter === "ACTIVE" && { color: primaryColor, fontWeight: "700" }]}>
                      {`Active (${flowStatusCounts.ACTIVE})`}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.filterChip,
                      flowStatusFilter === "PAUSED" && {
                        borderColor: primaryColor,
                        backgroundColor: withOpacity(primaryColor, 0.14),
                      },
                    ]}
                    onPress={() => setFlowStatusFilter("PAUSED")}
                  >
                    <Text style={[styles.filterChipText, flowStatusFilter === "PAUSED" && { color: primaryColor, fontWeight: "700" }]}>
                      {`Paused (${flowStatusCounts.PAUSED})`}
                    </Text>
                  </Pressable>
                </View>
                {filteredFlows.length > 0 ? (
                  filteredFlows.slice(0, 8).map((flow) => (
                    <FlowCard
                      key={flow.id}
                      item={flow}
                      onViewDetails={handleViewFlowDetails}
                      onToggleFlowStatus={(id, action) => void handleToggleFlowStatus(id, action)}
                      isUpdating={updatingFlowId === flow.id}
                      primaryColor={primaryColor}
                    />
                  ))
                ) : (
                  <Text style={styles.metaText}>No social flows match this filter.</Text>
                )}
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Tracking Links</Text>
                {searchScopedTrackingLinks.length > 0 ? (
                  searchScopedTrackingLinks.slice(0, 8).map((link) => <TrackingCard key={link.id} item={link} currency={currency} />)
                ) : (
                  <Text style={styles.metaText}>No tracking links matched your search.</Text>
                )}
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Homework Progress</Text>
                {data.homework.active ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{data.homework.active.homework.title}</Text>
                    <Text style={styles.metaText}>{data.homework.active.homework.moduleTitle} · {data.homework.active.homework.categoryName}</Text>
                    <View style={styles.pillRow}>
                      <Text style={styles.metaPill}>Status {data.homework.active.status}</Text>
                      <Text style={styles.metaPill}>Started {formatDate(data.homework.active.startedAt)}</Text>
                      <Text style={styles.metaPill}>Points {data.homework.active.homework.points}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.metaText}>No active homework.</Text>
                )}
                <View style={styles.pillRow}>
                  <Text style={styles.metaPill}>Submissions {data.homework.totals.submissions}</Text>
                  <Text style={styles.metaPill}>Active {data.homework.totals.active}</Text>
                  <Text style={styles.metaPill}>Completed {data.homework.totals.completed}</Text>
                  <Text style={styles.metaPill}>Training {data.training.completedModules}/{data.training.totalModules}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )}

          <View style={styles.footerSection}>
            <Text style={styles.metaText}>Social flow controls, tracking, and homework progress are available in mobile.</Text>
          </View>
        </ScrollView>
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
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  statPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: "#f8fafc",
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  scrollContent: {
    gap: 10,
    paddingBottom: 24,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
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
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#e2e8f0",
    color: mobileTheme.colors.textMuted,
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
  detailsButton: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: mobileTheme.colors.surface,
  },
  inlineActionButton: {
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  inlineActionText: {
    fontWeight: "700",
    fontSize: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterChipText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
  },
  detailsButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  footerSection: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
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
