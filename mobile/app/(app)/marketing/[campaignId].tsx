import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileMarketingCampaignDetailResponse } from "@/src/types/mobile"

function formatDateTime(value: string | null) {
  if (!value) return "-"
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

export default function MarketingCampaignDetailScreen() {
  const { token } = useAuth()
  const { campaignId } = useLocalSearchParams<{ campaignId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileMarketingCampaignDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedCampaignId = useMemo(() => String(campaignId || "").trim(), [campaignId])

  const loadCampaign = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedCampaignId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.marketingCampaignDetail(token, resolvedCampaignId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load campaign detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedCampaignId, token]
  )

  useEffect(() => {
    void loadCampaign()
  }, [loadCampaign])

  const statusAction = useMemo(() => {
    if (!data?.campaign) return null
    if (data.campaign.status === "SCHEDULED") {
      return {
        action: "cancel" as const,
        label: "Cancel Scheduled Campaign",
        hint: "Stops this scheduled send before delivery starts.",
      }
    }
    return null
  }, [data?.campaign])

  const handleStatusAction = useCallback(async () => {
    if (!token || !resolvedCampaignId || !statusAction) {
      return
    }

    setUpdatingStatus(true)
    setError(null)
    try {
      const response = await mobileApi.marketingCampaignStatus(token, resolvedCampaignId, statusAction.action)
      setData((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          campaign: {
            ...previous.campaign,
            status: response.campaign.status,
            updatedAt: response.campaign.updatedAt,
          },
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update campaign status"
      setError(message)
    } finally {
      setUpdatingStatus(false)
    }
  }, [resolvedCampaignId, statusAction, token])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadCampaign(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Campaign Detail</Text>
        {data?.campaign ? (
          <>
            <Text style={styles.nameText}>{data.campaign.name}</Text>
            <Text style={styles.metaText}>{data.campaign.channel} • {data.campaign.status}</Text>
            <Text style={styles.metaText}>Created {formatDateTime(data.campaign.createdAt)}</Text>
            {statusAction ? (
              <View style={styles.actionWrap}>
                <Pressable
                  disabled={updatingStatus}
                  style={[styles.actionButton, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.12) }]}
                  onPress={() => void handleStatusAction()}
                >
                  <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                    {updatingStatus ? "Updating..." : statusAction.label}
                  </Text>
                </Pressable>
                <Text style={styles.actionHint}>{statusAction.hint}</Text>
              </View>
            ) : data.campaign.status === "CANCELLED" ? (
              <Text style={styles.metaText}>This campaign has been cancelled.</Text>
            ) : null}
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading campaign details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Overview</Text>
            {data.campaign.subject ? <Text style={styles.rowLabel}>{data.campaign.subject}</Text> : null}
            <Text style={styles.metaText}>{data.campaign.body}</Text>
            <Text style={styles.metaText}>Scheduled: {formatDateTime(data.campaign.scheduledAt)}</Text>
            <Text style={styles.metaText}>Sent: {formatDateTime(data.campaign.sentAt)}</Text>
            <Text style={styles.metaText}>Target: {data.campaign.targetAll ? "All clients" : "Segmented"}</Text>
            {data.campaign.segment ? <Text style={styles.metaText}>Segment: {data.campaign.segment.name}</Text> : null}
            {data.campaign.location ? <Text style={styles.metaText}>Location: {data.campaign.location.name}</Text> : null}
            {data.campaign.template ? <Text style={styles.metaText}>Template: {data.campaign.template.name} ({data.campaign.template.type})</Text> : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Recipients</Text><Text style={styles.rowValue}>{data.campaign.totalRecipients}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Sent</Text><Text style={styles.rowValue}>{data.campaign.sentCount}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Delivered</Text><Text style={styles.rowValue}>{data.campaign.deliveredCount}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Opened</Text><Text style={styles.rowValue}>{data.campaign.openedCount}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Clicked</Text><Text style={styles.rowValue}>{data.campaign.clickedCount}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Failed</Text><Text style={styles.rowValue}>{data.campaign.failedCount}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Delivery Rate</Text><Text style={styles.rowValue}>{data.stats.deliveryRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Open Rate</Text><Text style={styles.rowValue}>{data.stats.openRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Click Rate</Text><Text style={styles.rowValue}>{data.stats.clickRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Failure Rate</Text><Text style={styles.rowValue}>{data.stats.failureRate}%</Text></View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>
            {data.recentMessages.length === 0 ? (
              <Text style={styles.metaText}>No message delivery history yet.</Text>
            ) : (
              data.recentMessages.map((message) => (
                <View key={message.id} style={styles.messageRow}>
                  <Text style={styles.rowLabel}>{message.channel} • {message.status}</Text>
                  <Text style={styles.metaText}>{message.toName || message.toAddress}</Text>
                  <Text style={styles.metaText}>Sent: {formatDateTime(message.sentAt)}</Text>
                  {message.deliveredAt ? <Text style={styles.metaText}>Delivered: {formatDateTime(message.deliveredAt)}</Text> : null}
                  {message.openedAt ? <Text style={styles.metaText}>Opened: {formatDateTime(message.openedAt)}</Text> : null}
                  {message.clickedAt ? <Text style={styles.metaText}>Clicked: {formatDateTime(message.clickedAt)}</Text> : null}
                  {message.failedReason ? <Text style={styles.failureText}>Failed: {message.failedReason}</Text> : null}
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Campaign not found</Text>
          <Text style={styles.metaText}>This campaign is not available in your account scope.</Text>
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
  actionWrap: {
    marginTop: 6,
    gap: 6,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonText: {
    fontWeight: "700",
    fontSize: 13,
  },
  actionHint: {
    color: mobileTheme.colors.textSubtle,
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
  rowItem: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  rowLabel: {
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  rowValue: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  failureText: {
    color: mobileTheme.colors.danger,
    fontSize: 12,
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
