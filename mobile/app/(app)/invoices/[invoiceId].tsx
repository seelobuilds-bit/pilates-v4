import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileInvoiceDetailResponse } from "@/src/types/mobile"

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

function statusStyle(status: string) {
  if (status === "PAID") return { backgroundColor: "#dcfce7", color: "#166534" }
  if (status === "PENDING" || status === "SENT") return { backgroundColor: "#fef3c7", color: "#92400e" }
  if (status === "DRAFT") return { backgroundColor: "#e2e8f0", color: "#334155" }
  return { backgroundColor: "#fee2e2", color: "#991b1b" }
}

export default function InvoiceDetailScreen() {
  const { token, user } = useAuth()
  const { invoiceId } = useLocalSearchParams<{ invoiceId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileInvoiceDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedInvoiceId = useMemo(() => String(invoiceId || "").trim(), [invoiceId])

  const loadInvoice = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedInvoiceId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.invoiceDetail(token, resolvedInvoiceId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load invoice"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedInvoiceId, token]
  )

  useEffect(() => {
    void loadInvoice()
  }, [loadInvoice])

  const currency = data?.invoice.currency || user?.studio.currency || "usd"

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadInvoice(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Invoice Detail</Text>
        {data?.invoice ? (
          <>
            <Text style={styles.invoiceNumber}>{data.invoice.invoiceNumber}</Text>
            <Text style={[styles.statusBadge, statusStyle(data.invoice.status)]}>{data.invoice.status}</Text>
            <Text style={styles.metaText}>Period {formatDateTime(data.invoice.periodStart)} to {formatDateTime(data.invoice.periodEnd)}</Text>
            <Text style={styles.metaText}>Teacher: {data.invoice.teacher.firstName} {data.invoice.teacher.lastName}</Text>
            <Text style={styles.metaText}>{data.invoice.teacher.email}</Text>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading invoice...</Text>
        </View>
      ) : data?.invoice ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Totals</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Subtotal</Text><Text style={styles.rowValue}>{formatCurrency(data.invoice.subtotal, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Tax ({data.invoice.taxRate}%)</Text><Text style={styles.rowValue}>{formatCurrency(data.invoice.tax, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Total</Text><Text style={styles.rowValue}>{formatCurrency(data.invoice.total, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Paid</Text><Text style={styles.rowValue}>{formatCurrency(data.invoice.paidAmount || 0, currency)}</Text></View>
            {data.invoice.paymentMethod ? <Text style={styles.metaText}>Payment method: {data.invoice.paymentMethod}</Text> : null}
            {data.invoice.paymentReference ? <Text style={styles.metaText}>Reference: {data.invoice.paymentReference}</Text> : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            {data.invoice.lineItems.length === 0 ? (
              <Text style={styles.emptyText}>No line items available.</Text>
            ) : (
              data.invoice.lineItems.map((item, index) => (
                <View key={`${item.description || "item"}-${index}`} style={styles.lineItemRow}>
                  <Text style={styles.rowLabel}>{item.description || "Line item"}</Text>
                  <Text style={styles.rowValue}>{formatCurrency(item.amount || 0, currency)}</Text>
                  <Text style={styles.metaText}>Qty {item.quantity || 1} • Rate {formatCurrency(item.rate || 0, currency)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <Text style={styles.metaText}>Created: {formatDateTime(data.invoice.createdAt)}</Text>
            <Text style={styles.metaText}>Sent: {formatDateTime(data.invoice.sentAt)}</Text>
            <Text style={styles.metaText}>Paid: {formatDateTime(data.invoice.paidAt)}</Text>
            <Text style={styles.metaText}>Updated: {formatDateTime(data.invoice.updatedAt)}</Text>
          </View>

          {data.invoice.notes ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.metaText}>{data.invoice.notes}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Invoice not found</Text>
          <Text style={styles.emptyText}>This invoice is not available in your account scope.</Text>
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
  invoiceNumber: {
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
  lineItemRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
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
