import { useCallback, useEffect, useMemo, useState } from "react"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobilePaymentDetailResponse } from "@/src/types/mobile"

function formatCurrency(value: number, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(value)
}

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

function statusTone(status: string) {
  if (status === "SUCCEEDED") return { backgroundColor: "#dcfce7", color: "#166534" }
  if (status === "PENDING" || status === "PROCESSING") return { backgroundColor: "#fef3c7", color: "#92400e" }
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") return { backgroundColor: "#e2e8f0", color: "#334155" }
  return { backgroundColor: "#fee2e2", color: "#991b1b" }
}

export default function PaymentDetailScreen() {
  const { token, user } = useAuth()
  const { paymentId } = useLocalSearchParams<{ paymentId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobilePaymentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedPaymentId = useMemo(() => String(paymentId || "").trim(), [paymentId])

  const loadPayment = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedPaymentId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.paymentDetail(token, resolvedPaymentId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load payment"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedPaymentId, token]
  )

  useEffect(() => {
    void loadPayment()
  }, [loadPayment])

  const currency = data?.payment.currency || user?.studio.currency || "usd"

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadPayment(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Payment Detail</Text>
        {data?.payment ? (
          <>
            <Text style={styles.amountText}>{formatCurrency(data.payment.amount, currency)}</Text>
            <Text style={[styles.statusBadge, statusTone(data.payment.status)]}>{data.payment.status}</Text>
            <Text style={styles.metaText}>{data.payment.client.firstName} {data.payment.client.lastName} • {data.payment.client.email}</Text>
            <Text style={styles.metaText}>Created {formatDateTime(data.payment.createdAt)}</Text>
            {data.payment.description ? <Text style={styles.metaText}>{data.payment.description}</Text> : null}
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Loading payment...</Text></View>
      ) : data?.payment ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Settlement</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Amount</Text><Text style={styles.rowValue}>{formatCurrency(data.payment.amount, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Net Amount</Text><Text style={styles.rowValue}>{formatCurrency(data.payment.netAmount || 0, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Stripe Fee</Text><Text style={styles.rowValue}>{formatCurrency(data.payment.stripeFee || 0, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Application Fee</Text><Text style={styles.rowValue}>{formatCurrency(data.payment.applicationFee || 0, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Refunded</Text><Text style={styles.rowValue}>{formatCurrency(data.payment.refundedAmount || 0, currency)}</Text></View>
            <Text style={styles.metaText}>Refunded At: {formatDateTime(data.payment.refundedAt)}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment IDs</Text>
            <Text style={styles.metaText}>Payment Intent: {data.payment.stripePaymentIntentId || "-"}</Text>
            <Text style={styles.metaText}>Charge: {data.payment.stripeChargeId || "-"}</Text>
            <Text style={styles.metaText}>Checkout Session: {data.payment.stripeCheckoutSessionId || "-"}</Text>
            <Text style={styles.metaText}>Refund: {data.payment.stripeRefundId || "-"}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Linked Bookings</Text>
            {data.payment.bookings.length === 0 ? (
              <Text style={styles.emptyText}>No bookings linked.</Text>
            ) : (
              data.payment.bookings.map((booking) => (
                <View key={booking.id} style={styles.bookingRow}>
                  <Text style={styles.rowLabel}>{booking.classSession.classType.name}</Text>
                  <Text style={styles.metaText}>{booking.status} • {formatDateTime(booking.classSession.startTime)}</Text>
                </View>
              ))
            )}
          </View>

          {data.payment.receiptUrl ? (
            <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => void Linking.openURL(data.payment.receiptUrl!)}>
              <Text style={styles.actionButtonText}>Open Receipt</Text>
            </Pressable>
          ) : null}

          {data.payment.failureMessage ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Failure</Text>
              <Text style={styles.failureText}>{data.payment.failureMessage}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Payment not found</Text>
          <Text style={styles.emptyText}>This payment is not available in your account scope.</Text>
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
  amountText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaText: {
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
  rowLabel: {
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  rowValue: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  bookingRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
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
  failureText: {
    color: mobileTheme.colors.danger,
    fontSize: 12,
  },
  errorText: {
    color: mobileTheme.colors.danger,
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
  emptyText: {
    color: mobileTheme.colors.textSubtle,
  },
})
