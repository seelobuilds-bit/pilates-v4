import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "expo-router"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { FlatList, Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
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

function formatDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateKey(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
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
  const [selectedDateKey, setSelectedDateKey] = useState<string>("ALL")
  const [showDatePicker, setShowDatePicker] = useState(false)
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
    const from = startOfToday()
    const to = new Date(from)
    to.setDate(to.getDate() + 35)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      minDate: from,
      maxDate: to,
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
          from: dateRange.from,
          to: dateRange.to,
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
    [clientMode, dateRange.from, dateRange.to, isClient, token]
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
      const haystack = `${item.classType.name} ${item.teacher.firstName} ${item.teacher.lastName} ${item.location.name}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [items, searchNormalized])

  const windowCounts = useMemo(() => {
    const now = new Date()
    const todayStart = startOfToday()
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

  const windowScopedItems = useMemo(() => {
    const now = new Date()
    const todayStart = startOfToday()
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

  const filteredItems = useMemo(() => {
    if (selectedDateKey === "ALL") return windowScopedItems
    return windowScopedItems.filter((item) => item.startTime.slice(0, 10) === selectedDateKey)
  }, [selectedDateKey, windowScopedItems])

  const selectedDateLabel = useMemo(() => {
    if (selectedDateKey === "ALL") return "Any date"
    const parsed = parseDateKey(selectedDateKey)
    if (!parsed) return selectedDateKey
    return parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }, [selectedDateKey])

  const pickerValue = useMemo(() => parseDateKey(selectedDateKey) || dateRange.minDate, [dateRange.minDate, selectedDateKey])

  const handleDatePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "dismissed" || !selectedDate) {
        setShowDatePicker(false)
        return
      }

      setSelectedDateKey(formatDateKey(selectedDate))
      setShowDatePicker(false)
    },
    []
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search class, teacher, or location..."
        style={styles.searchInput}
      />

      <View style={styles.segmentRow}>
        {[
          { id: "ALL" as const, label: `All (${windowCounts.ALL})` },
          { id: "TODAY" as const, label: `Today (${windowCounts.TODAY})` },
          { id: "WEEK" as const, label: `7d (${windowCounts.WEEK})` },
        ].map((option) => {
          const selected = option.id === windowFilter
          return (
            <Pressable
              key={option.id}
              style={[
                styles.segmentButton,
                selected ? { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) } : null,
              ]}
              onPress={() => setWindowFilter(option.id)}
            >
              <Text style={[styles.segmentButtonText, selected ? { color: primaryColor } : null]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {isClient ? (
        <View style={styles.modeRow}>
          {[
            { id: "booked" as const, label: "My Bookings" },
            { id: "all" as const, label: "Browse Classes" },
          ].map((option) => {
            const selected = option.id === clientMode
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.modeButton,
                  selected ? { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) } : null,
                ]}
                onPress={() => setClientMode(option.id)}
              >
                <Text style={[styles.modeButtonText, selected ? { color: primaryColor } : null]} numberOfLines={1}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      <View style={styles.dateRow}>
        <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateLabel}>Select date</Text>
          <Text style={styles.dateValue}>{selectedDateLabel}</Text>
        </Pressable>
        <Pressable
          style={styles.quickDateButton}
          onPress={() => setSelectedDateKey(formatDateKey(startOfToday()))}
        >
          <Text style={[styles.quickDateButtonText, { color: primaryColor }]}>Today</Text>
        </Pressable>
        {selectedDateKey !== "ALL" ? (
          <Pressable style={styles.clearDateButton} onPress={() => setSelectedDateKey("ALL")}>
            <Text style={[styles.clearDateButtonText, { color: primaryColor }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {showDatePicker ? (
        <View style={styles.datePickerWrap}>
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={dateRange.minDate}
            maximumDate={dateRange.maxDate}
            onChange={handleDatePickerChange}
          />
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
        style={styles.list}
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
    gap: 10,
    backgroundColor: mobileTheme.colors.canvas,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
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
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  dateLabel: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dateValue: {
    color: mobileTheme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  clearDateButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickDateButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickDateButtonText: {
    fontWeight: "700",
    fontSize: 12,
  },
  clearDateButtonText: {
    fontWeight: "700",
    fontSize: 12,
  },
  datePickerWrap: {
    alignSelf: "flex-start",
    marginTop: -2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    gap: 4,
  },
  className: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  metaText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 13,
  },
  bookingStatus: {
    marginTop: 4,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  detailsButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.canvas,
  },
  detailsButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  actionButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  bookButton: {
    backgroundColor: mobileTheme.colors.text,
  },
  cancelButton: {
    backgroundColor: mobileTheme.colors.danger,
  },
  webButton: {
    backgroundColor: mobileTheme.colors.text,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  loading: {
    color: mobileTheme.colors.textMuted,
  },
  empty: {
    color: mobileTheme.colors.textMuted,
  },
  error: {
    color: mobileTheme.colors.danger,
  },
})
