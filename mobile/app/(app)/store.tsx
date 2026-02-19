import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileStoreOrderSummary, MobileStoreOverviewResponse, MobileStoreProductSummary } from "@/src/types/mobile"

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

function ProductCard({
  item,
  currency,
  onViewDetails,
}: {
  item: MobileStoreProductSummary
  currency: string
  onViewDetails: (studioProductId: string) => void
}) {
  const title = item.customTitle || item.product.name
  const image = item.product.images?.[0]

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {image ? <Image source={{ uri: image }} style={styles.productImage} /> : <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>No image</Text></View>}
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.metaText}>{item.product.category}</Text>
          <Text style={styles.priceText}>{formatCurrency(item.price, currency)}</Text>
          {item.compareAtPrice ? <Text style={styles.comparePriceText}>{formatCurrency(item.compareAtPrice, currency)}</Text> : null}
        </View>
        <Text style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
          {item.isActive ? "Active" : "Hidden"}
        </Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.product.inStock ? "In stock" : "Out of stock"}</Text>
        <Text style={styles.metaPill}>Order {item.displayOrder}</Text>
        {item.hasCustomLogo ? <Text style={styles.metaPill}>Custom Logo</Text> : null}
      </View>
      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

function OrderRow({ item, currency }: { item: MobileStoreOrderSummary; currency: string }) {
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderMain}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <Text style={styles.metaText}>{item.customerName}</Text>
      </View>
      <View style={styles.orderMeta}>
        <Text style={styles.orderAmount}>{formatCurrency(item.total, currency)}</Text>
        <Text style={styles.metaText}>{item.status}</Text>
      </View>
    </View>
  )
}

export default function StoreScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileStoreOverviewResponse | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER"
  const trimmedSearch = search.trim()

  const loadStore = useCallback(
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
        const response = await mobileApi.store(token, {
          search: trimmedSearch || undefined,
          status: statusFilter,
        })
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load store"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAllowedRole, statusFilter, token, trimmedSearch]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadStore()
    }, 220)
    return () => clearTimeout(timeout)
  }, [loadStore, statusFilter, trimmedSearch])

  const currency = data?.studio.currency || "USD"

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Store is available for studio owner accounts only."
    if (trimmedSearch) return "No store products matched your search."
    return "No products found for this store."
  }, [isAllowedRole, trimmedSearch])

  const handleViewDetails = useCallback(
    (studioProductId: string) => {
      router.push(`/(app)/store/${studioProductId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.subtitle}>Products, orders, and store performance</Text>
        {data ? (
          <View style={styles.statsRow}>
            <Text style={styles.statPill}>Products {data.stats.totalProducts}</Text>
            <Text style={styles.statPill}>Active {data.stats.activeProducts}</Text>
            <Text style={styles.statPill}>Pending Orders {data.stats.pendingOrders}</Text>
            <Text style={styles.statPill}>Revenue {formatCurrency(data.stats.totalRevenue, currency)}</Text>
          </View>
        ) : null}
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search products..."
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterButton, statusFilter === "active" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setStatusFilter("active")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "active" && [styles.filterButtonTextActive, { color: primaryColor }]]}>Active</Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, statusFilter === "all" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setStatusFilter("all")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "all" && [styles.filterButtonTextActive, { color: primaryColor }]]}>All</Text>
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
          data={data?.store.products || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} currency={currency} onViewDetails={handleViewDetails} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadStore(true)} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            data ? (
              <View style={styles.footerSection}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {data.store.orders.length > 0 ? (
                  data.store.orders.map((order) => <OrderRow key={order.id} item={order} currency={currency} />)
                ) : (
                  <Text style={styles.metaText}>No orders yet.</Text>
                )}
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
  filterRow: {
    flexDirection: "row",
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
    alignItems: "center",
    gap: 10,
  },
  productImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  imagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  imagePlaceholderText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 10,
    textAlign: "center",
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  priceText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  comparePriceText: {
    color: mobileTheme.colors.textSubtle,
    textDecorationLine: "line-through",
    fontSize: 11,
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
  statusActive: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusInactive: {
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
  footerSection: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  orderMain: {
    flex: 1,
  },
  orderMeta: {
    alignItems: "flex-end",
  },
  orderNumber: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  orderAmount: {
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
