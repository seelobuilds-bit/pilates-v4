import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
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

function ScheduleCard({
  item,
  isClient,
  browsingMode,
  actionLoading,
  onBook,
  onCancel,
}: {
  item: MobileScheduleItem
  isClient: boolean
  browsingMode: boolean
  actionLoading: boolean
  onBook: (classSessionId: string) => void
  onCancel: (bookingId: string) => void
}) {
  const { date, time } = formatDateRange(item.startTime, item.endTime)
  const teacher = `${item.teacher.firstName} ${item.teacher.lastName}`
  const hasBooking = Boolean(item.bookingId) && item.bookingStatus !== "CANCELLED"
  const isPaidClass = item.classType.price > 0

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
      <Text style={styles.metaText}>Price: {item.classType.price > 0 ? `$${item.classType.price}` : "Free"}</Text>

      {item.bookingStatus ? <Text style={styles.bookingStatus}>Booking: {item.bookingStatus}</Text> : null}

      {isClient && browsingMode ? (
        <View style={styles.cardActions}>
          {hasBooking && item.bookingId ? (
            <Pressable
              style={[styles.actionButton, styles.cancelButton, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onCancel(item.bookingId!)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : "Cancel Booking"}</Text>
            </Pressable>
          ) : isPaidClass ? (
            <View style={[styles.actionButton, styles.disabledInfoButton]}>
              <Text style={styles.disabledInfoText}>Paid class: book via web checkout</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.actionButton, styles.bookButton, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onBook(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : "Book Class"}</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  )
}

export default function ScheduleScreen() {
  const { token, user } = useAuth()
  const [items, setItems] = useState<MobileScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const isClient = user?.role === "CLIENT"
  const [clientMode, setClientMode] = useState<"booked" | "all">("booked")

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
        const response = await mobileApi.schedule(token, {
          ...dateRange,
          mode: isClient ? clientMode : undefined,
        })
        setItems(response.items)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load schedule"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [clientMode, dateRange, isClient, token]
  )

  const handleBook = useCallback(
    async (classSessionId: string) => {
      if (!token) return
      setActionLoadingId(classSessionId)
      setError(null)
      try {
        await mobileApi.bookClass(token, classSessionId)
        await loadSchedule(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to book class"
        setError(message)
      } finally {
        setActionLoadingId(null)
      }
    },
    [loadSchedule, token]
  )

  const handleCancel = useCallback(
    async (bookingId: string) => {
      if (!token) return
      setActionLoadingId(bookingId)
      setError(null)
      try {
        await mobileApi.cancelBooking(token, bookingId)
        await loadSchedule(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel booking"
        setError(message)
      } finally {
        setActionLoadingId(null)
      }
    },
    [loadSchedule, token]
  )

  useEffect(() => {
    void loadSchedule()
  }, [loadSchedule])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.subtitle}>Next 14 days for {user?.role?.toLowerCase() || "account"}</Text>

      {isClient ? (
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, clientMode === "booked" && styles.modeButtonActive]}
            onPress={() => setClientMode("booked")}
          >
            <Text style={[styles.modeButtonText, clientMode === "booked" && styles.modeButtonTextActive]}>My Bookings</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, clientMode === "all" && styles.modeButtonActive]}
            onPress={() => setClientMode("all")}
          >
            <Text style={[styles.modeButtonText, clientMode === "all" && styles.modeButtonTextActive]}>Browse Classes</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && items.length === 0 ? <Text style={styles.loading}>Loading schedule...</Text> : null}

      {!loading && items.length === 0 && !error ? <Text style={styles.empty}>No schedule items in this range.</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.bookingId || "session"}-${item.id}`}
        renderItem={({ item }) => (
          <ScheduleCard
            item={item}
            isClient={isClient}
            browsingMode={isClient && clientMode === "all"}
            actionLoading={actionLoadingId === item.id || actionLoadingId === item.bookingId}
            onBook={handleBook}
            onCancel={handleCancel}
          />
        )}
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
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 2,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modeButtonActive: {
    borderColor: "#1d4ed8",
    backgroundColor: "#dbeafe",
  },
  modeButtonText: {
    color: "#334155",
    fontWeight: "600",
  },
  modeButtonTextActive: {
    color: "#1d4ed8",
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
  cardActions: {
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButton: {
    backgroundColor: "#1d4ed8",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
  },
  disabledInfoButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  disabledInfoText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 12,
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
