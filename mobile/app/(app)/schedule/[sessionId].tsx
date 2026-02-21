import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileScheduleDetailResponse } from "@/src/types/mobile"

function normalizeCurrencyCode(value: string | null | undefined) {
  const normalized = String(value || "").trim().toUpperCase()
  return normalized || "USD"
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: normalizeCurrencyCode(currency),
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value: string) {
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

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

export default function ScheduleSessionDetailScreen() {
  const { token, user, bootstrap } = useAuth()
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileScheduleDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedSessionId = useMemo(() => String(sessionId || "").trim(), [sessionId])
  const resolvedSubdomain = useMemo(
    () => (bootstrap?.studio?.subdomain || user?.studio?.subdomain || mobileConfig.studioSubdomain || "").trim().toLowerCase(),
    [bootstrap?.studio?.subdomain, user?.studio?.subdomain]
  )
  const currency = normalizeCurrencyCode(data?.studio.currency || bootstrap?.studio.currency || user?.studio.currency)
  const isClient = data?.role === "CLIENT"
  const isPaidClass = (data?.session.classType.price || 0) > 0

  const loadDetail = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedSessionId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.scheduleDetail(token, resolvedSessionId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load session detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedSessionId, token]
  )

  const handleBook = useCallback(async () => {
    if (!token || !data?.session?.id) return
    setActionLoading(true)
    setError(null)
    try {
      if (isPaidClass) {
        if (!resolvedSubdomain) {
          setError("Studio subdomain is missing for web checkout")
          return
        }
        const base = mobileConfig.apiBaseUrl.replace(/\/$/, "")
        const url = `${base}/${resolvedSubdomain}/book?source=mobile&classSessionId=${encodeURIComponent(data.session.id)}`
        await Linking.openURL(url)
      } else {
        await mobileApi.bookClass(token, data.session.id)
        await loadDetail(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete booking action"
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }, [data?.session?.id, isPaidClass, loadDetail, resolvedSubdomain, token])

  const handleCancel = useCallback(async () => {
    if (!token || !data?.clientBooking?.id) return
    setActionLoading(true)
    setError(null)
    try {
      await mobileApi.cancelBooking(token, data.clientBooking.id)
      await loadDetail(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel booking"
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }, [data?.clientBooking?.id, loadDetail, token])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadDetail(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Session Detail</Text>
        {data?.session ? (
          <>
            <Text style={styles.nameText}>{data.session.classType.name}</Text>
            <Text style={styles.metaText}>{formatDateTime(data.session.startTime)} - {formatDateTime(data.session.endTime)}</Text>
            <Text style={styles.metaText}>{data.session.teacher.firstName} {data.session.teacher.lastName} - {data.session.location.name}</Text>
            <Text style={styles.metaText}>
              {data.session.bookedCount}/{data.session.capacity} booked • {data.session.remainingSpots} spots left
            </Text>
            <Text style={styles.metaText}>
              {data.session.classType.price > 0 ? formatCurrency(data.session.classType.price, currency) : "Free class"}
            </Text>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading session details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Class Info</Text>
            <Text style={styles.metaText}>Duration: {data.session.classType.duration} mins</Text>
            {data.session.classType.description ? <Text style={styles.metaText}>{data.session.classType.description}</Text> : null}
            <Text style={styles.metaText}>
              Location: {data.session.location.name}, {data.session.location.address}, {data.session.location.city}, {data.session.location.state} {data.session.location.zipCode}
            </Text>
            {data.session.notes ? <Text style={styles.metaText}>Notes: {data.session.notes}</Text> : null}
            <Text style={styles.metaText}>Waitlist: {data.session.waitlistCount}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Booking Breakdown</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Pending</Text><Text style={styles.rowValue}>{data.session.bookingSummary.pending}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Confirmed</Text><Text style={styles.rowValue}>{data.session.bookingSummary.confirmed}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Completed</Text><Text style={styles.rowValue}>{data.session.bookingSummary.completed}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Cancelled</Text><Text style={styles.rowValue}>{data.session.bookingSummary.cancelled}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>No-show</Text><Text style={styles.rowValue}>{data.session.bookingSummary.noShow}</Text></View>
          </View>

          {isClient ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>My Booking</Text>
              {data.clientBooking ? (
                <>
                  <Text style={styles.metaText}>Status: {formatStatus(data.clientBooking.status)}</Text>
                  <Text style={styles.metaText}>Created: {formatDateTime(data.clientBooking.createdAt)}</Text>
                  {data.clientBooking.cancelledAt ? <Text style={styles.metaText}>Cancelled: {formatDateTime(data.clientBooking.cancelledAt)}</Text> : null}
                </>
              ) : (
                <Text style={styles.metaText}>No booking for this session yet.</Text>
              )}

              <View style={styles.clientActions}>
                {data.clientBooking && data.clientBooking.status !== "CANCELLED" && data.clientBooking.status !== "NO_SHOW" ? (
                  <Pressable style={[styles.actionButton, styles.cancelButton, actionLoading && styles.actionButtonDisabled]} onPress={() => void handleCancel()} disabled={actionLoading}>
                    <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : "Cancel Booking"}</Text>
                  </Pressable>
                ) : data.canBook || data.canCheckoutOnWeb ? (
                  <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }, actionLoading && styles.actionButtonDisabled]} onPress={() => void handleBook()} disabled={actionLoading}>
                    <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : isPaidClass ? "Book on Web Checkout" : "Book Class"}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.metaText}>Booking unavailable for this class right now.</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              {data.recentBookings && data.recentBookings.length > 0 ? (
                data.recentBookings.map((booking) => (
                  <View key={booking.id} style={styles.bookingRow}>
                    <Text style={styles.rowLabel}>{booking.client.firstName} {booking.client.lastName}</Text>
                    <Text style={styles.metaText}>{formatStatus(booking.status)} - {formatDateTime(booking.createdAt)}</Text>
                    <Text style={styles.metaText}>{booking.client.email}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.metaText}>No booking activity yet.</Text>
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Session not found</Text>
          <Text style={styles.metaText}>This session is not available in your account scope.</Text>
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
  clientActions: {
    marginTop: 8,
    gap: 8,
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
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonDisabled: {
    opacity: 0.6,
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
