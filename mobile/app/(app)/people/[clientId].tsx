import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileClientDetailBooking, MobileClientDetailResponse } from "@/src/types/mobile"

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatCurrency(value: number, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value)
}

function statusTone(status: MobileClientDetailBooking["status"]) {
  if (status === "COMPLETED") {
    return { backgroundColor: "#dcfce7", color: "#166534" }
  }
  if (status === "CANCELLED") {
    return { backgroundColor: "#fee2e2", color: "#991b1b" }
  }
  if (status === "NO_SHOW") {
    return { backgroundColor: "#ffedd5", color: "#9a3412" }
  }
  if (status === "PENDING") {
    return { backgroundColor: "#e0f2fe", color: "#075985" }
  }
  return { backgroundColor: "#e2e8f0", color: "#334155" }
}

function BookingCard({ booking, currency }: { booking: MobileClientDetailBooking; currency: string }) {
  const tone = statusTone(booking.status)
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingTitle}>{booking.classSession.classType.name}</Text>
        <Text style={[styles.statusBadge, { backgroundColor: tone.backgroundColor, color: tone.color }]}>{booking.status}</Text>
      </View>
      <Text style={styles.metaText}>{formatDateTime(booking.classSession.startTime)} - {formatDateTime(booking.classSession.endTime)}</Text>
      <Text style={styles.metaText}>Teacher: {booking.classSession.teacher.firstName} {booking.classSession.teacher.lastName}</Text>
      <Text style={styles.metaText}>Location: {booking.classSession.location.name}</Text>
      <Text style={styles.metaText}>Value: {formatCurrency(booking.paidAmount, currency)}</Text>
    </View>
  )
}

export default function ClientDetailScreen() {
  const { token, user } = useAuth()
  const router = useRouter()
  const { clientId } = useLocalSearchParams<{ clientId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileClientDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedClientId = useMemo(() => String(clientId || "").trim(), [clientId])

  const loadClientDetail = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedClientId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.clientDetail(token, resolvedClientId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load client"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedClientId, token]
  )

  useEffect(() => {
    void loadClientDetail()
  }, [loadClientDetail])

  const currency = data?.studio.currency || user?.studio.currency || "usd"

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadClientDetail(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Client Detail</Text>
        {data?.client ? (
          <>
            <Text style={styles.nameText}>{data.client.firstName} {data.client.lastName}</Text>
            <Text style={styles.metaText}>{data.client.email}</Text>
            <Text style={styles.metaText}>{data.client.phone || "No phone"}</Text>
            <Text style={styles.metaText}>Credits {data.client.credits}</Text>
            <Text style={styles.metaText}>Created {new Date(data.client.createdAt).toLocaleDateString()}</Text>
            <Text style={[styles.activePill, data.client.isActive ? styles.activeYes : styles.activeNo]}>
              {data.client.isActive ? "Active" : "Inactive"}
            </Text>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading client details...</Text>
        </View>
      ) : data?.client ? (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <Text style={styles.statValue}>{data.client.stats.totalBookings}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{data.client.stats.completedBookings}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Cancelled</Text>
              <Text style={styles.statValue}>{data.client.stats.cancelledBookings}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>No Shows</Text>
              <Text style={styles.statValue}>{data.client.stats.noShowBookings}</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>{formatCurrency(data.client.stats.totalSpent, currency)}</Text>
              <Text style={styles.metaText}>Last booking {data.client.lastBookingAt ? formatDateTime(data.client.lastBookingAt) : "-"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Credits</Text>
              <Text style={styles.statValue}>{data.client.credits}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {data.recentBookings.length === 0 ? (
              <Text style={styles.emptyText}>No bookings yet for this client scope.</Text>
            ) : (
              data.recentBookings.map((booking) => <BookingCard key={booking.id} booking={booking} currency={currency} />)
            )}
          </View>

          <Pressable
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push({ pathname: "/(app)/inbox", params: { clientId: data.client.id } })}
          >
            <Text style={styles.actionButtonText}>Message Client</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Client not found</Text>
          <Text style={styles.emptyText}>This client may not be available in your account scope.</Text>
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
    gap: 4,
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
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  activePill: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  activeYes: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  activeNo: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  statsGrid: {
    gap: 8,
  },
  statCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radius.lg,
    padding: 12,
    gap: 3,
  },
  statCardWide: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radius.lg,
    padding: 12,
    gap: 3,
  },
  statLabel: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
  },
  statValue: {
    color: mobileTheme.colors.text,
    fontSize: 22,
    fontWeight: "700",
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
  bookingCard: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 4,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  bookingTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
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
