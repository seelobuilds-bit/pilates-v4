import { useCallback, useEffect, useMemo, useState } from "react"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import { toWorkspaceUrl } from "@/src/lib/workspace-links"
import type { MobileMarketingAutomationSummary, MobileMarketingCampaignSummary, MobileMarketingResponse } from "@/src/types/mobile"

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

function CampaignCard({
  item,
  onViewDetails,
}: {
  item: MobileMarketingCampaignSummary
  onViewDetails: (campaignId: string) => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.statusBadge}>{item.status}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.channel}</Text>
        <Text style={styles.metaPill}>Recipients {item.totalRecipients}</Text>
        <Text style={styles.metaPill}>Sent {item.sentCount}</Text>
        <Text style={styles.metaPill}>Delivered {item.deliveredCount}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>Opened {item.openedCount}</Text>
        <Text style={styles.metaPill}>Clicked {item.clickedCount}</Text>
        <Text style={styles.metaPill}>Failed {item.failedCount}</Text>
      </View>
      <Text style={styles.metaText}>Scheduled {formatDate(item.scheduledAt)} · Sent {formatDate(item.sentAt)}</Text>
      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

function AutomationCard({
  item,
  onViewDetails,
}: {
  item: MobileMarketingAutomationSummary
  onViewDetails: (automationId: string) => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.statusBadge}>{item.status}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.channel}</Text>
        <Text style={styles.metaPill}>{item.trigger}</Text>
        <Text style={styles.metaPill}>Steps {item.stepCount}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>Sent {item.totalSent}</Text>
        <Text style={styles.metaPill}>Delivered {item.totalDelivered}</Text>
        <Text style={styles.metaPill}>Opened {item.totalOpened}</Text>
        <Text style={styles.metaPill}>Clicked {item.totalClicked}</Text>
      </View>
      <Text style={styles.metaText}>Updated {formatDate(item.updatedAt)}</Text>
      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

export default function MarketingScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileMarketingResponse | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER"
  const trimmedSearch = search.trim()

  const loadMarketing = useCallback(
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
        const response = await mobileApi.marketing(token, {
          search: trimmedSearch || undefined,
        })
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load marketing"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAllowedRole, token, trimmedSearch]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadMarketing()
    }, 220)

    return () => clearTimeout(timeout)
  }, [loadMarketing])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Marketing is available for studio owner accounts only."
    if (trimmedSearch) return "No campaigns or automations matched your search."
    return "No marketing activity yet."
  }, [isAllowedRole, trimmedSearch])

  const handleViewCampaignDetails = useCallback(
    (campaignId: string) => {
      router.push(`/(app)/marketing/${campaignId}` as never)
    },
    [router]
  )

  const handleViewAutomationDetails = useCallback(
    (automationId: string) => {
      router.push(`/(app)/marketing/automations/${automationId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Marketing</Text>
        <Text style={styles.subtitle}>Campaign and automation performance overview</Text>
        {data ? (
          <View style={styles.statsRow}>
            <Text style={styles.statPill}>Campaigns {data.stats.campaignsTotal}</Text>
            <Text style={styles.statPill}>Scheduled {data.stats.campaignsScheduled}</Text>
            <Text style={styles.statPill}>Sent {data.stats.campaignsSent}</Text>
            <Text style={styles.statPill}>Automations {data.stats.automationsTotal}</Text>
            <Text style={styles.statPill}>Active {data.stats.automationsActive}</Text>
            <Text style={styles.statPill}>Draft {data.stats.automationsDraft}</Text>
          </View>
        ) : null}
      </View>

      <TextInput value={search} onChangeText={setSearch} placeholder="Search campaigns and automations..." style={styles.searchInput} />

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadMarketing(true)} />}
        >
          {loading ? null : data && (data.campaigns.length > 0 || data.automations.length > 0) ? (
            <>
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Recent Campaigns</Text>
                {data.campaigns.length > 0 ? data.campaigns.map((campaign) => <CampaignCard key={campaign.id} item={campaign} onViewDetails={handleViewCampaignDetails} />) : <Text style={styles.metaText}>No campaigns found.</Text>}
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Recent Automations</Text>
                {data.automations.length > 0 ? data.automations.map((automation) => <AutomationCard key={automation.id} item={automation} onViewDetails={handleViewAutomationDetails} />) : <Text style={styles.metaText}>No automations found.</Text>}
              </View>
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )}

          <View style={styles.footerSection}>
            <Text style={styles.metaText}>Need full editing and campaign builder controls? Open Marketing on web.</Text>
            <Pressable
              style={[styles.actionButton, { backgroundColor: primaryColor }]}
              onPress={() => {
                void Linking.openURL(toWorkspaceUrl("/studio/marketing"))
              }}
            >
              <Text style={styles.actionButtonText}>Open Web Marketing</Text>
            </Pressable>
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
