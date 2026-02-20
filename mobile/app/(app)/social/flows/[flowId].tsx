import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileSocialFlowDetailResponse } from "@/src/types/mobile"

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

function formatDelay(minutes: number) {
  if (minutes % (60 * 24 * 7) === 0) return `${minutes / (60 * 24 * 7)} week(s)`
  if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)} day(s)`
  if (minutes % 60 === 0) return `${minutes / 60} hour(s)`
  return `${minutes} minute(s)`
}

export default function SocialFlowDetailScreen() {
  const { token, user } = useAuth()
  const { flowId } = useLocalSearchParams<{ flowId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileSocialFlowDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedFlowId = useMemo(() => String(flowId || "").trim(), [flowId])
  const currency = data?.studio.currency || user?.studio.currency || "USD"

  const loadFlow = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedFlowId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.socialFlowDetail(token, resolvedFlowId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load social flow detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedFlowId, token]
  )

  useEffect(() => {
    void loadFlow()
  }, [loadFlow])

  const statusAction = useMemo(() => {
    if (!data?.flow) return null
    return data.flow.isActive
      ? ({
          action: "pause" as const,
          label: "Pause Flow",
          hint: "Stops this flow from auto-responding to new triggers.",
        })
      : ({
          action: "activate" as const,
          label: "Activate Flow",
          hint: "Re-enables this flow for new trigger events.",
        })
  }, [data?.flow])

  const handleStatusAction = useCallback(async () => {
    if (!token || !resolvedFlowId || !statusAction) {
      return
    }

    setUpdatingStatus(true)
    setError(null)
    try {
      const response = await mobileApi.socialFlowStatus(token, resolvedFlowId, statusAction.action)
      setData((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          flow: {
            ...previous.flow,
            isActive: response.flow.isActive,
            updatedAt: response.flow.updatedAt,
          },
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update flow status"
      setError(message)
    } finally {
      setUpdatingStatus(false)
    }
  }, [resolvedFlowId, statusAction, token])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadFlow(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Flow Detail</Text>
        {data?.flow ? (
          <>
            <Text style={styles.nameText}>{data.flow.name}</Text>
            <Text style={styles.metaText}>{data.flow.account.platform} • @{data.flow.account.username}</Text>
            <Text style={styles.metaText}>{data.flow.isActive ? "ACTIVE" : "PAUSED"} • Updated {formatDateTime(data.flow.updatedAt)}</Text>
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
            ) : null}
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading flow details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Trigger & Response</Text>
            <Text style={styles.metaText}>Trigger: {data.flow.triggerType}</Text>
            <Text style={styles.metaText}>Keywords: {data.flow.triggerKeywords.join(", ") || "None"}</Text>
            <Text style={styles.rowLabel}>Response message</Text>
            <Text style={styles.metaText}>{data.flow.responseMessage}</Text>
            <Text style={styles.metaText}>Booking link: {data.flow.includeBookingLink ? "Included" : "Not included"}</Text>
            {data.flow.bookingMessage ? <Text style={styles.metaText}>Booking note: {data.flow.bookingMessage}</Text> : null}
            {data.flow.postUrl ? <Text style={styles.metaText}>Post URL: {data.flow.postUrl}</Text> : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Triggered</Text><Text style={styles.rowValue}>{data.flow.totalTriggered}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Responded</Text><Text style={styles.rowValue}>{data.flow.totalResponded}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Booked</Text><Text style={styles.rowValue}>{data.flow.totalBooked}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Response Rate</Text><Text style={styles.rowValue}>{data.stats.responseRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Booking Rate</Text><Text style={styles.rowValue}>{data.stats.bookingRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Event Click Rate</Text><Text style={styles.rowValue}>{data.stats.clickRateFromEvents}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Event Conversion Rate</Text><Text style={styles.rowValue}>{data.stats.conversionRateFromEvents}%</Text></View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Follow-up Messages</Text>
            {data.flow.followUpMessages.length === 0 ? (
              <Text style={styles.metaText}>No follow-up messages configured.</Text>
            ) : (
              data.flow.followUpMessages.map((followUp, index) => (
                <View key={`${index}-${followUp.delayMinutes}`} style={styles.rowBlock}>
                  <Text style={styles.rowLabel}>Follow-up {index + 1}</Text>
                  <Text style={styles.metaText}>Delay: {formatDelay(followUp.delayMinutes)}</Text>
                  <Text style={styles.metaText}>{followUp.message}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tracking Links</Text>
            {data.trackingLinks.length === 0 ? (
              <Text style={styles.metaText}>No flow-specific tracking links yet.</Text>
            ) : (
              data.trackingLinks.map((link) => (
                <View key={link.id} style={styles.rowBlock}>
                  <Text style={styles.rowLabel}>{link.campaign || link.code}</Text>
                  <Text style={styles.metaText}>{link.source} • {link.medium}</Text>
                  <Text style={styles.metaText}>Clicks {link.clicks} • Conversions {link.conversions} • Revenue {formatCurrency(link.revenue, currency)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            {data.recentEvents.length === 0 ? (
              <Text style={styles.metaText}>No trigger events yet.</Text>
            ) : (
              data.recentEvents.map((event) => (
                <View key={event.id} style={styles.rowBlock}>
                  <Text style={styles.rowLabel}>{event.platformUsername || event.platformUserId}</Text>
                  <Text style={styles.metaText}>{event.triggerType} • {formatDateTime(event.createdAt)}</Text>
                  {event.triggerContent ? <Text style={styles.metaText}>{event.triggerContent}</Text> : null}
                  <Text style={styles.metaText}>Responded {event.responseSent ? "Yes" : "No"} • Clicked {event.clickedLink ? "Yes" : "No"} • Converted {event.converted ? "Yes" : "No"}</Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Flow not found</Text>
          <Text style={styles.metaText}>This social flow is not available in your account scope.</Text>
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
  rowBlock: {
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
