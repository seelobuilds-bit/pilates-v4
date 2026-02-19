import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileTeacherDetailResponse } from "@/src/types/mobile"

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

function formatPayRate(
  payRate: MobileTeacherDetailResponse["teacher"]["payRate"]
) {
  if (!payRate) return "No pay rate set"

  const amount = formatCurrency(payRate.rate, payRate.currency)
  if (payRate.type === "PER_HOUR") return `${amount} / hr`
  if (payRate.type === "PER_STUDENT") return `${amount} / student`
  if (payRate.type === "PERCENTAGE") return `${payRate.rate}% revenue`
  return `${amount} / class`
}

export default function TeacherDetailScreen() {
  const { token, user } = useAuth()
  const { teacherId } = useLocalSearchParams<{ teacherId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileTeacherDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedTeacherId = useMemo(() => String(teacherId || "").trim(), [teacherId])

  const loadTeacher = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedTeacherId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.teacherDetail(token, resolvedTeacherId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load teacher"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedTeacherId, token]
  )

  useEffect(() => {
    void loadTeacher()
  }, [loadTeacher])

  const currency = data?.studio.currency || user?.studio.currency || "usd"

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadTeacher(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Teacher Detail</Text>
        {data?.teacher ? (
          <>
            <Text style={styles.nameText}>{data.teacher.firstName} {data.teacher.lastName}</Text>
            <Text style={styles.metaText}>{data.teacher.email}</Text>
            {data.teacher.bio ? <Text style={styles.metaText}>{data.teacher.bio}</Text> : null}
            {data.teacher.specialties.length > 0 ? <Text style={styles.metaText}>Specialties: {data.teacher.specialties.join(", ")}</Text> : null}
            <Text style={styles.metaText}>{formatPayRate(data.teacher.payRate)}</Text>
            <Text style={[styles.statusPill, data.teacher.isActive ? styles.statusActive : styles.statusInactive]}>
              {data.teacher.isActive ? "Active" : "Inactive"}
            </Text>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading teacher details...</Text>
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
            <Text style={styles.sectionTitle}>Top Class Types</Text>
            {data.topClassTypes.length === 0 ? (
              <Text style={styles.emptyText}>No class type history yet.</Text>
            ) : (
              data.topClassTypes.map((item) => (
                <View key={item.classType} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>{item.classType}</Text>
                  <Text style={styles.rowValue}>{item.count} sessions</Text>
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
                  <Text style={styles.sessionTitle}>{session.classType.name} - {formatDateTime(session.startTime)}</Text>
                  <Text style={styles.metaText}>{session.location.name} - {session.bookedCount}/{session.capacity} booked</Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Teacher not found</Text>
          <Text style={styles.emptyText}>This teacher is not available in your account scope.</Text>
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
