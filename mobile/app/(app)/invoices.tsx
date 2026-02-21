import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileInvoiceStats, MobileInvoiceStatus, MobileInvoiceSummary } from "@/src/types/mobile"

type InvoiceFilter = "all" | "PENDING" | "SENT" | "PAID" | "DRAFT" | "CANCELLED"

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

function formatRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
}

function statusStyle(status: MobileInvoiceStatus) {
  if (status === "PAID") {
    return styles.statusPaid
  }
  if (status === "PENDING" || status === "SENT") {
    return styles.statusPending
  }
  if (status === "DRAFT") {
    return styles.statusDraft
  }
  return styles.statusCancelled
}

function statusLabel(status: MobileInvoiceStatus) {
  if (status === "PENDING") return "Pending"
  if (status === "SENT") return "Sent"
  if (status === "PAID") return "Paid"
  if (status === "DRAFT") return "Draft"
  return "Cancelled"
}

function StatsCards({ stats, currency, isNarrowScreen }: { stats: MobileInvoiceStats; currency: string; isNarrowScreen: boolean }) {
  return (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, isNarrowScreen ? styles.statCardNarrow : null]}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={[styles.statCard, isNarrowScreen ? styles.statCardNarrow : null]}>
        <Text style={styles.statValue}>{stats.pending}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={[styles.statCard, isNarrowScreen ? styles.statCardNarrow : null]}>
        <Text style={styles.statValue}>{stats.paid}</Text>
        <Text style={styles.statLabel}>Paid</Text>
      </View>
      <View style={[styles.statCardWide, isNarrowScreen ? styles.statCardWideNarrow : null]}>
        <Text style={styles.statValue}>{formatCurrency(stats.totalPending, currency)}</Text>
        <Text style={styles.statLabel}>Pending Amount</Text>
      </View>
      <View style={[styles.statCardWide, isNarrowScreen ? styles.statCardWideNarrow : null]}>
        <Text style={styles.statValue}>{formatCurrency(stats.totalPaid, currency)}</Text>
        <Text style={styles.statLabel}>Paid Amount</Text>
      </View>
    </View>
  )
}

function InvoiceCard({ item, role }: { item: MobileInvoiceSummary; role: "OWNER" | "TEACHER" }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
        <Text style={[styles.statusBadge, statusStyle(item.status)]}>{statusLabel(item.status)}</Text>
      </View>
      <Text style={styles.metaText}>{formatRange(item.periodStart, item.periodEnd)}</Text>
      {role === "OWNER" && item.teacher ? (
        <Text style={styles.metaText}>
          {item.teacher.firstName} {item.teacher.lastName}
        </Text>
      ) : null}
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>Total {formatCurrency(item.total, item.currency)}</Text>
        {item.paidAmount ? <Text style={styles.metaPill}>Paid {formatCurrency(item.paidAmount, item.currency)}</Text> : null}
      </View>
      <Text style={styles.createdText}>
        Created{" "}
        {new Date(item.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Text>
    </View>
  )
}

export default function InvoicesScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const { width } = useWindowDimensions()
  const primaryColor = getStudioPrimaryColor()
  const isNarrowScreen = width <= 380
  const [invoices, setInvoices] = useState<MobileInvoiceSummary[]>([])
  const [stats, setStats] = useState<MobileInvoiceStats>({
    total: 0,
    pending: 0,
    paid: 0,
    totalPending: 0,
    totalPaid: 0,
  })
  const [currency, setCurrency] = useState("USD")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const trimmedSearch = search.trim()

  const loadInvoices = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setInvoices([])
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      try {
        const response = await mobileApi.invoices(token, {
          search: trimmedSearch || undefined,
          status: "all",
        })
        setInvoices(response.invoices || [])
        setStats(
          response.stats || {
            total: 0,
            pending: 0,
            paid: 0,
            totalPending: 0,
            totalPaid: 0,
          }
        )
        setCurrency(response.studio?.currency || "USD")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load invoices"
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
      void loadInvoices()
    }, 220)
    return () => clearTimeout(timeout)
  }, [loadInvoices, trimmedSearch])

  const statusCounts = useMemo(() => {
    const counts: Record<InvoiceFilter, number> = {
      all: invoices.length,
      PENDING: 0,
      SENT: 0,
      PAID: 0,
      DRAFT: 0,
      CANCELLED: 0,
    }

    for (const invoice of invoices) {
      if (invoice.status in counts) {
        counts[invoice.status as InvoiceFilter] += 1
      }
    }

    return counts
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") return invoices
    return invoices.filter((invoice) => invoice.status === statusFilter)
  }, [invoices, statusFilter])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Invoices view is available for studio owner and teacher accounts."
    if (trimmedSearch) {
      if (statusFilter !== "all") return `No ${statusLabel(statusFilter).toLowerCase()} invoices matched your search.`
      return "No invoices matched your search."
    }
    if (statusFilter !== "all") return `No ${statusLabel(statusFilter).toLowerCase()} invoices yet.`
    return "No invoices available yet."
  }, [isAllowedRole, statusFilter, trimmedSearch])

  const handleViewInvoice = useCallback(
    (invoiceId: string) => {
      router.push(`/(app)/invoices/${invoiceId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Invoices</Text>
        <Text style={styles.subtitle}>Track invoice status and payouts</Text>
      </View>

      {isAllowedRole ? <StatsCards stats={stats} currency={currency} isNarrowScreen={isNarrowScreen} /> : null}

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search invoices..."
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {(["all", "PENDING", "SENT", "PAID", "DRAFT", "CANCELLED"] as InvoiceFilter[]).map((filter) => (
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
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.invoiceRowWrap}>
              <InvoiceCard item={item} role={user!.role as "OWNER" | "TEACHER"} />
              <Pressable
                style={[styles.viewButton, { borderColor: withOpacity(primaryColor, 0.35), backgroundColor: withOpacity(primaryColor, 0.1) }]}
                onPress={() => handleViewInvoice(item.id)}
              >
                <Text style={[styles.viewButtonText, { color: primaryColor }]}>View Details</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadInvoices(true)} />}
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
  statCardNarrow: {
    minWidth: 0,
    flexBasis: "31%",
  },
  statCardWide: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 10,
    minWidth: 150,
  },
  statCardWideNarrow: {
    minWidth: 0,
    flexBasis: "100%",
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
  invoiceRowWrap: {
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
  invoiceNumber: {
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
  statusPaid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusDraft: {
    backgroundColor: "#e2e8f0",
    color: "#334155",
  },
  statusCancelled: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
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
  createdText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 11,
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
