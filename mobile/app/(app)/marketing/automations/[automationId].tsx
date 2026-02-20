import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileMarketingAutomationDetailResponse } from "@/src/types/mobile"

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

function formatDelay(minutes: number) {
  if (minutes % (60 * 24 * 7) === 0) return `${minutes / (60 * 24 * 7)} week(s)`
  if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)} day(s)`
  if (minutes % 60 === 0) return `${minutes / 60} hour(s)`
  return `${minutes} minute(s)`
}

export default function MarketingAutomationDetailScreen() {
  const { token } = useAuth()
  const { automationId } = useLocalSearchParams<{ automationId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileMarketingAutomationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedAutomationId = useMemo(() => String(automationId || "").trim(), [automationId])

  const loadAutomation = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedAutomationId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.marketingAutomationDetail(token, resolvedAutomationId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load automation detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedAutomationId, token]
  )

  useEffect(() => {
    void loadAutomation()
  }, [loadAutomation])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadAutomation(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Automation Detail</Text>
        {data?.automation ? (
          <>
            <Text style={styles.nameText}>{data.automation.name}</Text>
            <Text style={styles.metaText}>{data.automation.channel} • {data.automation.trigger}</Text>
            <Text style={styles.metaText}>{data.automation.status} • Updated {formatDateTime(data.automation.updatedAt)}</Text>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading automation details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Overview</Text>
            {data.automation.subject ? <Text style={styles.rowLabel}>{data.automation.subject}</Text> : null}
            <Text style={styles.metaText}>{data.automation.body}</Text>
            <Text style={styles.metaText}>Stop when booked: {data.automation.stopOnBooking ? "Yes" : "No"}</Text>
            <Text style={styles.metaText}>Base trigger delay: {formatDelay(data.automation.triggerDelay)}</Text>
            {data.automation.triggerDays !== null ? <Text style={styles.metaText}>Trigger days: {data.automation.triggerDays}</Text> : null}
            {data.automation.reminderHours !== null ? <Text style={styles.metaText}>Reminder hours: {data.automation.reminderHours}</Text> : null}
            {data.automation.location ? <Text style={styles.metaText}>Location: {data.automation.location.name}</Text> : null}
            {data.automation.template ? <Text style={styles.metaText}>Template: {data.automation.template.name} ({data.automation.template.type})</Text> : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Sent</Text><Text style={styles.rowValue}>{data.automation.totalSent}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Delivered</Text><Text style={styles.rowValue}>{data.automation.totalDelivered}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Opened</Text><Text style={styles.rowValue}>{data.automation.totalOpened}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Clicked</Text><Text style={styles.rowValue}>{data.automation.totalClicked}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Delivery Rate</Text><Text style={styles.rowValue}>{data.stats.deliveryRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Open Rate</Text><Text style={styles.rowValue}>{data.stats.openRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Click Rate</Text><Text style={styles.rowValue}>{data.stats.clickRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Failure Rate</Text><Text style={styles.rowValue}>{data.stats.failureRate}%</Text></View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sequence Steps</Text>
            {data.steps.length === 0 ? (
              <Text style={styles.metaText}>No explicit steps saved yet.</Text>
            ) : (
              data.steps.map((step) => (
                <View key={step.id} style={styles.stepRow}>
                  <Text style={styles.rowLabel}>Step {step.stepOrder + 1} • {step.channel}</Text>
                  {step.subject ? <Text style={styles.metaText}>{step.subject}</Text> : null}
                  <Text style={styles.metaText}>{step.body}</Text>
                  <Text style={styles.metaText}>Delay: {formatDelay(step.delayMinutes)}</Text>
                </View>
              ))
            )}
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
          <Text style={styles.emptyTitle}>Automation not found</Text>
          <Text style={styles.metaText}>This automation is not available in your account scope.</Text>
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
  stepRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
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
