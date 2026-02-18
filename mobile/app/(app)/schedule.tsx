import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import type { MobileScheduleItem } from "@/src/types/mobile"

function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)

  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const time = `${start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`

  return { date, time }
}

function ScheduleCard({ item }: { item: MobileScheduleItem }) {
  const { date, time } = formatDateRange(item.startTime, item.endTime)
  const teacher = `${item.teacher.firstName} ${item.teacher.lastName}`

  return (
    <View style={styles.card}>
      <Text style={styles.className}>{item.classType.name}</Text>
      <Text style={styles.metaText}>{date}</Text>
      <Text style={styles.metaText}>{time}</Text>
      <Text style={styles.metaText}>Teacher: {teacher}</Text>
      <Text style={styles.metaText}>Location: {item.location.name}</Text>
      <Text style={styles.metaText}>
        Spots: {item.bookedCount}/{item.capacity}
      </Text>
      {item.bookingStatus ? <Text style={styles.bookingStatus}>Booking: {item.bookingStatus}</Text> : null}
    </View>
  )
}

export default function ScheduleScreen() {
  const { token, user } = useAuth()
  const [items, setItems] = useState<MobileScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateRange = useMemo(() => {
    const from = new Date()
    const to = new Date(from)
    to.setDate(to.getDate() + 14)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    }
  }, [])

  const loadSchedule = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false)
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      try {
        const response = await mobileApi.schedule(token, dateRange)
        setItems(response.items)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load schedule"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [dateRange, token]
  )

  useEffect(() => {
    void loadSchedule()
  }, [loadSchedule])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.subtitle}>Next 14 days for {user?.role?.toLowerCase() || "account"}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && items.length === 0 ? <Text style={styles.loading}>Loading schedule...</Text> : null}

      {!loading && items.length === 0 && !error ? <Text style={styles.empty}>No schedule items in this range.</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.bookingId || "session"}-${item.id}`}
        renderItem={({ item }) => <ScheduleCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadSchedule(true)} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    color: "#334155",
    marginBottom: 4,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 3,
  },
  className: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  metaText: {
    color: "#334155",
  },
  bookingStatus: {
    marginTop: 4,
    color: "#1d4ed8",
    fontWeight: "600",
  },
  loading: {
    color: "#475569",
  },
  empty: {
    color: "#64748b",
  },
  error: {
    color: "#dc2626",
  },
})
