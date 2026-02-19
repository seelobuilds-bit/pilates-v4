import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileClassTypeDetailResponse } from "@/src/types/mobile"

function formatCurrency(value: number, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value)
}

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

export default function ClassTypeDetailScreen() {
  const { token, user } = useAuth()
  const router = useRouter()
  const { classTypeId } = useLocalSearchParams<{ classTypeId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileClassTypeDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedClassTypeId = useMemo(() => String(classTypeId || "").trim(), [classTypeId])

  const loadClassType = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedClassTypeId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.classTypeDetail(token, resolvedClassTypeId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load class type"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedClassTypeId, token]
  )

  useEffect(() => {
    void loadClassType()
  }, [loadClassType])

  const currency = data?.studio.currency || user?.studio.currency || "usd"

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadClassType(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Class Detail</Text>
        {data?.classType ? (
          <>
            <Text style={styles.nameText}>{data.classType.name}</Text>
            {data.classType.description ? <Text style={styles.metaText}>{data.classType.description}</Text> : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaPill}>{data.classType.duration} mins</Text>
              <Text style={styles.metaPill}>Capacity {data.classType.capacity}</Text>
              <Text style={styles.metaPill}>{data.classType.price > 0 ? formatCurrency(data.classType.price, currency) : "Free"}</Text>
            </View>
            <Text style={[styles.statusPill, data.classType.isActive ? styles.statusActive : styles.statusInactive]}>
              {data.classType.isActive ? "Active" : "Inactive"}
            </Text>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading class details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Sessions</Text>
                <Text style={styles.statValue}>{data.stats.totalSessions}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Upcoming</Text>
                <Text style={styles.statValue}>{data.stats.upcomingSessions}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Bookings</Text>
                <Text style={styles.statValue}>{data.stats.totalBookings}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{data.stats.completedBookings}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fill Rate</Text>
                <Text style={styles.statValue}>{data.stats.fillRate}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Completion</Text>
                <Text style={styles.statValue}>{data.stats.completionRate}%</Text>
              </View>
              <View style={styles.statItemWide}>
                <Text style={styles.statLabel}>Revenue</Text>
                <Text style={styles.statValue}>{formatCurrency(data.stats.totalRevenue, currency)}</Text>
                <Text style={styles.metaText}>Avg/session {formatCurrency(data.stats.averageRevenuePerSession, currency)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top Locations</Text>
            {data.topLocations.length === 0 ? (
              <Text style={styles.emptyText}>No location distribution yet.</Text>
            ) : (
              data.topLocations.map((location) => (
                <View key={location.location} style={styles.locationRow}>
                  <Text style={styles.locationName}>{location.location}</Text>
                  <Text style={styles.locationCount}>{location.count} sessions</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {data.recentSessions.length === 0 ? (
              <Text style={styles.emptyText}>No sessions yet.</Text>
            ) : (
              data.recentSessions.map((session) => (
                <View key={session.id} style={styles.sessionRow}>
                  <Text style={styles.sessionTitle}>{formatDateTime(session.startTime)}</Text>
                  <Text style={styles.metaText}>{session.teacher.firstName} {session.teacher.lastName} - {session.location.name}</Text>
                  <Text style={styles.metaText}>{session.bookedCount}/{session.capacity} booked</Text>
                </View>
              ))
            )}
          </View>

          <Pressable
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push("/(app)/schedule")}
          >
            <Text style={styles.actionButtonText}>Open Schedule</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Class type not found</Text>
          <Text style={styles.emptyText}>This class type is not available in your account scope.</Text>
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
  metaRow: {
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
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusActive: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusInactive: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
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
  statsGrid: {
    gap: 6,
  },
  statItem: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  statItemWide: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
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
  locationRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationName: {
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  locationCount: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
  },
  sessionRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  sessionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
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
