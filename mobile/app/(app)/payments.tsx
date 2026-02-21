import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobilePaymentStatus, MobilePaymentSummary, MobilePaymentsStats } from "@/src/types/mobile"

type PaymentFilter = "all" | "SUCCEEDED" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED"

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

function statusTone(status: MobilePaymentStatus) {
  if (status === "SUCCEEDED") return styles.statusSucceeded
  if (status === "PENDING" || status === "PROCESSING") return styles.statusPending
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") return styles.statusRefunded
  return styles.statusFailed
}

function statusLabel(status: MobilePaymentStatus) {
  if (status === "PARTIALLY_REFUNDED") return "Partially Refunded"
  if (status === "PROCESSING") return "Processing"
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function StatsCards({ stats, currency }: { stats: MobilePaymentsStats; currency: string }) {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.pending}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.succeeded}</Text>
        <Text style={styles.statLabel}>Succeeded</Text>
      </View>
      <View style={styles.statCardWide}>
        <Text style={styles.statValue}>{formatCurrency(stats.grossProcessed, currency)}</Text>
        <Text style={styles.statLabel}>Gross Processed</Text>
      </View>
      <View style={styles.statCardWide}>
        <Text style={styles.statValue}>{formatCurrency(stats.refundedTotal, currency)}</Text>
        <Text style={styles.statLabel}>Refunded</Text>
      </View>
    </View>
  )
}

function PaymentCard({ item }: { item: MobilePaymentSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.amountText}>{formatCurrency(item.amount, item.currency)}</Text>
        <Text style={[styles.statusBadge, statusTone(item.status)]}>{statusLabel(item.status)}</Text>
      </View>
      <Text style={styles.metaText}>
        {item.client.firstName} {item.client.lastName} • {item.client.email}
      </Text>
      <Text style={styles.metaText}>
        {new Date(item.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Text>
      {item.description ? <Text style={styles.descriptionText}>{item.description}</Text> : null}
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>Bookings {item.bookingCount}</Text>
        {item.refundedAmount ? <Text style={styles.metaPill}>Refunded {formatCurrency(item.refundedAmount, item.currency)}</Text> : null}
      </View>
      {item.failureMessage ? <Text style={styles.failureText}>{item.failureMessage}</Text> : null}
      {item.receiptUrl ? (
        <Pressable style={styles.receiptButton} onPress={() => void Linking.openURL(item.receiptUrl!)}>
          <Text style={styles.receiptButtonText}>Open receipt</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export default function PaymentsScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [payments, setPayments] = useState<MobilePaymentSummary[]>([])
  const [stats, setStats] = useState<MobilePaymentsStats>({
    total: 0,
    pending: 0,
    succeeded: 0,
    failed: 0,
    refunded: 0,
    grossProcessed: 0,
    refundedTotal: 0,
  })
  const [currency, setCurrency] = useState("USD")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER"
  const trimmedSearch = search.trim()

  const loadPayments = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setPayments([])
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.payments(token, {
          search: trimmedSearch || undefined,
          status: "all",
        })
        setPayments(response.payments || [])
        setStats(
          response.stats || {
            total: 0,
            pending: 0,
            succeeded: 0,
            failed: 0,
            refunded: 0,
            grossProcessed: 0,
            refundedTotal: 0,
          }
        )
        setCurrency(response.studio?.currency || "USD")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load payments"
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
      void loadPayments()
    }, 220)
    return () => clearTimeout(timeout)
  }, [loadPayments, trimmedSearch])

  const statusCounts = useMemo(() => {
    const counts: Record<PaymentFilter, number> = {
      all: payments.length,
      SUCCEEDED: 0,
      PENDING: 0,
      PROCESSING: 0,
      FAILED: 0,
      REFUNDED: 0,
    }

    for (const payment of payments) {
      if (payment.status in counts) {
        counts[payment.status as PaymentFilter] += 1
      }
    }

    return counts
  }, [payments])

  const filteredPayments = useMemo(() => {
    if (statusFilter === "all") return payments
    return payments.filter((payment) => payment.status === statusFilter)
  }, [payments, statusFilter])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Payments are available for studio owner accounts only."
    if (trimmedSearch) {
      if (statusFilter !== "all") return `No ${statusLabel(statusFilter).toLowerCase()} payments matched your search.`
      return "No payments matched your search."
    }
    if (statusFilter !== "all") return `No ${statusLabel(statusFilter).toLowerCase()} payments yet.`
    return "No payments available yet."
  }, [isAllowedRole, statusFilter, trimmedSearch])

  const handleViewPayment = useCallback(
    (paymentId: string) => {
      router.push(`/(app)/payments/${paymentId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>Track transactions and payment outcomes</Text>
      </View>

      {isAllowedRole ? <StatsCards stats={stats} currency={currency} /> : null}

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search payments..."
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {(["all", "SUCCEEDED", "PENDING", "PROCESSING", "FAILED", "REFUNDED"] as PaymentFilter[]).map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterButton,
              statusFilter === filter && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text style={[styles.filterButtonText, statusFilter === filter && [styles.filterButtonTextActive, { color: primaryColor }]]}>
              {`${filter === "all" ? "All" : statusLabel(filter)} (${statusCounts[filter]})`}
            </Text>
          </Pressable>
        ))}
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
          data={filteredPayments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.paymentRowWrap}>
              <PaymentCard item={item} />
              <Pressable
                style={[styles.viewButton, { borderColor: withOpacity(primaryColor, 0.35), backgroundColor: withOpacity(primaryColor, 0.1) }]}
                onPress={() => handleViewPayment(item.id)}
              >
                <Text style={[styles.viewButtonText, { color: primaryColor }]}>View Details</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadPayments(true)} />}
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 10,
    minWidth: 84,
  },
  statCardWide: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 10,
    minWidth: 150,
  },
  statValue: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  statLabel: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
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
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterButtonActive: {
    borderWidth: 1,
  },
  filterButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  paymentRowWrap: {
    gap: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  amountText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusSucceeded: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusFailed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  statusRefunded: {
    backgroundColor: "#e2e8f0",
    color: "#334155",
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  descriptionText: {
    color: mobileTheme.colors.textMuted,
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
  failureText: {
    color: mobileTheme.colors.danger,
    fontSize: 11,
  },
  receiptButton: {
    alignSelf: "flex-start",
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  receiptButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  viewButton: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  viewButtonText: {
    fontWeight: "700",
    fontSize: 13,
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
