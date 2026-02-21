import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "expo-router"
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
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

function normalizeCurrencyCode(value: string | null | undefined) {
  const normalized = String(value || "").trim().toUpperCase()
  return normalized || "USD"
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizeCurrencyCode(currency),
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value}`
  }
}

function ScheduleCard({
  item,
  isClient,
  browsingMode,
  actionLoading,
  onBook,
  onCancel,
  onOpenWebBooking,
  onViewDetails,
  currencyCode,
  primaryColor,
}: {
  item: MobileScheduleItem
  isClient: boolean
  browsingMode: boolean
  actionLoading: boolean
  currencyCode: string
  primaryColor: string
  onBook: (classSessionId: string) => void
  onCancel: (bookingId: string) => void
  onOpenWebBooking: (classSessionId: string) => void
  onViewDetails: (sessionId: string) => void
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
      <Text style={styles.metaText}>Price: {item.classType.price > 0 ? formatCurrency(item.classType.price, currencyCode) : "Free"}</Text>

      {item.bookingStatus ? <Text style={[styles.bookingStatus, { color: primaryColor }]}>Booking: {item.bookingStatus}</Text> : null}

      <View style={styles.cardActions}>
        <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </Pressable>

        {isClient && browsingMode ? (
          hasBooking && item.bookingId ? (
            <Pressable
              style={[styles.actionButton, styles.cancelButton, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onCancel(item.bookingId!)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : "Cancel Booking"}</Text>
            </Pressable>
          ) : isPaidClass ? (
            <Pressable
              style={[styles.actionButton, styles.webButton, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onOpenWebBooking(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Opening..." : "Book on Web Checkout"}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.actionButton, styles.bookButton, { backgroundColor: primaryColor }, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onBook(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : "Book Class"}</Text>
            </Pressable>
          )
        ) : null}
      </View>
    </View>
  )
}

export default function ScheduleScreen() {
  const { token, user, bootstrap } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<MobileScheduleItem[]>([])
  const [search, setSearch] = useState("")
  const [windowFilter, setWindowFilter] = useState<"ALL" | "TODAY" | "WEEK">("ALL")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const isClient = user?.role === "CLIENT"
  const [clientMode, setClientMode] = useState<"booked" | "all">("booked")
  const [currencyCode, setCurrencyCode] = useState("USD")
  const primaryColor = getStudioPrimaryColor()
  const searchNormalized = search.trim().toLowerCase()
  const resolvedSubdomain = useMemo(
    () => (bootstrap?.studio?.subdomain || user?.studio?.subdomain || mobileConfig.studioSubdomain || "").trim().toLowerCase(),
    [bootstrap?.studio?.subdomain, user?.studio?.subdomain]
  )

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
        setCurrencyCode(normalizeCurrencyCode(response.studio?.currency))
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

  const handleOpenWebBooking = useCallback(
    async (classSessionId: string) => {
      if (!resolvedSubdomain) {
        setError("Studio subdomain is missing for web checkout")
        return
      }

      setActionLoadingId(classSessionId)
      setError(null)
      const base = mobileConfig.apiBaseUrl.replace(/\/$/, "")
      const url = `${base}/${resolvedSubdomain}/book?source=mobile&classSessionId=${encodeURIComponent(classSessionId)}`

      try {
        await Linking.openURL(url)
      } catch {
        setError("Unable to open web checkout")
      } finally {
        setActionLoadingId(null)
      }
    },
    [resolvedSubdomain]
  )

  const handleViewDetails = useCallback(
    (sessionId: string) => {
      router.push(`/(app)/schedule/${sessionId}` as never)
    },
    [router]
  )

  useEffect(() => {
    void loadSchedule()
  }, [loadSchedule])

  const searchScopedItems = useMemo(() => {
    if (!searchNormalized) return items
    return items.filter((item) => {
      const haystack =
        `${item.classType.name} ${item.teacher.firstName} ${item.teacher.lastName} ${item.location.name}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [items, searchNormalized])

  const windowCounts = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const todayCount = searchScopedItems.filter((item) => {
      const start = new Date(item.startTime)
      return start >= todayStart && start < tomorrowStart
    }).length

    const weekCount = searchScopedItems.filter((item) => {
      const start = new Date(item.startTime)
      return start >= now && start <= weekEnd
    }).length

    return {
      ALL: searchScopedItems.length,
      TODAY: todayCount,
      WEEK: weekCount,
    } as const
  }, [searchScopedItems])

  const filteredItems = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)

    return searchScopedItems.filter((item) => {
      const start = new Date(item.startTime)
      if (windowFilter === "TODAY" && !(start >= todayStart && start < tomorrowStart)) {
        return false
      }
      if (windowFilter === "WEEK" && !(start >= now && start <= weekEnd)) {
        return false
      }
      return true
    })
  }, [searchScopedItems, windowFilter])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.subtitle}>Next 14 days for {user?.role?.toLowerCase() || "account"}</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search class, teacher, or location..."
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        <Pressable
          style={[
            styles.filterButton,
            windowFilter === "ALL" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setWindowFilter("ALL")}
        >
          <Text style={[styles.filterButtonText, windowFilter === "ALL" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`All (${windowCounts.ALL})`}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterButton,
            windowFilter === "TODAY" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setWindowFilter("TODAY")}
        >
          <Text style={[styles.filterButtonText, windowFilter === "TODAY" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`Today (${windowCounts.TODAY})`}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterButton,
            windowFilter === "WEEK" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setWindowFilter("WEEK")}
        >
          <Text style={[styles.filterButtonText, windowFilter === "WEEK" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`7d (${windowCounts.WEEK})`}
          </Text>
        </Pressable>
      </View>

      {isClient ? (
        <View style={styles.modeRow}>
          <Pressable
            style={[
              styles.modeButton,
              clientMode === "booked" && [styles.modeButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
            ]}
            onPress={() => setClientMode("booked")}
          >
            <Text style={[styles.modeButtonText, clientMode === "booked" && [styles.modeButtonTextActive, { color: primaryColor }]]}>
              My Bookings
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              clientMode === "all" && [styles.modeButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
            ]}
            onPress={() => setClientMode("all")}
          >
            <Text style={[styles.modeButtonText, clientMode === "all" && [styles.modeButtonTextActive, { color: primaryColor }]]}>
              Browse Classes
            </Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && items.length === 0 ? <Text style={styles.loading}>Loading schedule...</Text> : null}

      {!loading && filteredItems.length === 0 && !error ? (
        <Text style={styles.empty}>
          {searchNormalized && windowFilter !== "ALL"
            ? "No schedule items matched your search and range."
            : searchNormalized
              ? "No schedule items matched your search."
              : "No schedule items in this range."}
        </Text>
      ) : null}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.bookingId || "session"}-${item.id}`}
        renderItem={({ item }) => (
          <ScheduleCard
            item={item}
            isClient={isClient}
            browsingMode={isClient && clientMode === "all"}
            actionLoading={actionLoadingId === item.id || actionLoadingId === item.bookingId}
            currencyCode={currencyCode}
            primaryColor={primaryColor}
            onBook={handleBook}
            onCancel={handleCancel}
            onOpenWebBooking={handleOpenWebBooking}
            onViewDetails={handleViewDetails}
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
    backgroundColor: mobileTheme.colors.canvas,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  subtitle: {
    color: mobileTheme.colors.textMuted,
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
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
    borderRadius: 10,
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
    fontSize: 12,
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 2,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modeButtonActive: {
    borderWidth: 1,
  },
  modeButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
  },
  modeButtonTextActive: {
    fontWeight: "700",
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 12,
    gap: 3,
  },
  className: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.text,
    marginBottom: 4,
  },
  metaText: {
    color: mobileTheme.colors.textMuted,
  },
  bookingStatus: {
    marginTop: 4,
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  cardActions: {
    marginTop: 8,
    gap: 8,
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surface,
  },
  detailsButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButton: {
    backgroundColor: mobileTheme.colors.text,
  },
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  webButton: {
    backgroundColor: "#0f766e",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
  },
  loading: {
    color: mobileTheme.colors.textFaint,
  },
  empty: {
    color: mobileTheme.colors.textSubtle,
  },
  error: {
    color: mobileTheme.colors.danger,
  },
})
