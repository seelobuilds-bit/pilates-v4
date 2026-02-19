import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileStoreProductDetailResponse } from "@/src/types/mobile"

function normalizeCurrencyCode(value: string | null | undefined) {
  const normalized = String(value || "").trim().toUpperCase()
  return normalized || "USD"
}

function formatCurrency(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizeCurrencyCode(currencyCode),
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value}`
  }
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

export default function StoreProductDetailScreen() {
  const { token, user } = useAuth()
  const { productId } = useLocalSearchParams<{ productId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileStoreProductDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedProductId = useMemo(() => String(productId || "").trim(), [productId])
  const currency = normalizeCurrencyCode(data?.studio.currency || user?.studio.currency)

  const loadProduct = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedProductId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.storeProductDetail(token, resolvedProductId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load product detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedProductId, token]
  )

  useEffect(() => {
    void loadProduct()
  }, [loadProduct])

  const title = data?.product.customTitle || data?.product.catalog.name || "Store Product"
  const image = data?.product.catalog.images?.[0]

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadProduct(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Store Product</Text>
        {data ? (
          <>
            <Text style={styles.nameText}>{title}</Text>
            <Text style={styles.metaText}>{data.product.catalog.category}</Text>
            <Text style={styles.metaText}>
              {data.product.isActive ? "Active listing" : "Hidden listing"} • Display order {data.product.displayOrder}
            </Text>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading product details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Overview</Text>
            {image ? <Image source={{ uri: image }} style={styles.heroImage} /> : null}
            <Text style={styles.metaText}>Price: {formatCurrency(data.product.price, currency)}</Text>
            {data.product.compareAtPrice ? <Text style={styles.metaText}>Compare at: {formatCurrency(data.product.compareAtPrice, currency)}</Text> : null}
            <Text style={styles.metaText}>Suggested retail: {formatCurrency(data.product.catalog.suggestedRetail, currency)}</Text>
            <Text style={styles.metaText}>Base cost: {formatCurrency(data.product.catalog.baseCost, currency)}</Text>
            <Text style={styles.metaText}>Stock: {data.product.catalog.inStock ? "In stock" : "Out of stock"}</Text>
            <Text style={styles.metaText}>Lead time: {data.product.catalog.leadTimeDays} days</Text>
            {data.product.customDescription ? <Text style={styles.metaText}>{data.product.customDescription}</Text> : null}
            {!data.product.customDescription && data.product.catalog.shortDescription ? <Text style={styles.metaText}>{data.product.catalog.shortDescription}</Text> : null}
            {data.product.hasCustomLogo ? <Text style={styles.metaText}>Custom logo enabled ({data.product.logoPlacement || "placement not set"})</Text> : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Units Sold</Text><Text style={styles.rowValue}>{data.stats.unitsSold}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Gross Sales</Text><Text style={styles.rowValue}>{formatCurrency(data.stats.grossSales, currency)}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Pending Fulfillment Units</Text><Text style={styles.rowValue}>{data.stats.pendingFulfillmentUnits}</Text></View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Variants</Text>
            {data.product.variants.length === 0 ? (
              <Text style={styles.metaText}>No variant overrides configured.</Text>
            ) : (
              data.product.variants.map((item) => (
                <View key={item.id} style={styles.variantRow}>
                  <Text style={styles.rowLabel}>{item.variant.name}</Text>
                  <Text style={styles.metaText}>{item.variant.sku}{item.variant.size ? ` • ${item.variant.size}` : ""}{item.variant.color ? ` • ${item.variant.color}` : ""}</Text>
                  <Text style={styles.metaText}>
                    {item.price !== null ? formatCurrency(item.price, currency) : "Uses product price"} • {item.isActive ? "Active" : "Hidden"}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {data.recentOrders.length === 0 ? (
              <Text style={styles.metaText}>No orders for this product yet.</Text>
            ) : (
              data.recentOrders.map((item) => (
                <View key={item.id} style={styles.orderRow}>
                  <Text style={styles.rowLabel}>#{item.order.orderNumber} • {item.order.customerName}</Text>
                  <Text style={styles.metaText}>{item.order.status} • {item.order.paymentStatus}</Text>
                  <Text style={styles.metaText}>{item.quantity} x {formatCurrency(item.unitPrice, currency)} = {formatCurrency(item.totalPrice, currency)}</Text>
                  <Text style={styles.metaText}>Created {formatDateTime(item.order.createdAt)}</Text>
                  {item.variantName ? <Text style={styles.metaText}>Variant: {item.variantName}</Text> : null}
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Product not found</Text>
          <Text style={styles.metaText}>This store product is not available in your account scope.</Text>
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
  heroImage: {
    width: "100%",
    height: 190,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: "#e2e8f0",
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
  variantRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  orderRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
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
