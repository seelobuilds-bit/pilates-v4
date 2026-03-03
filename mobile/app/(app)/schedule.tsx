import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "expo-router"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { FlatList, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
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
      <View style={styles.cardHeader}>
        <Text style={styles.className}>{item.classType.name}</Text>
        {item.bookingStatus ? (
          <Text style={[styles.bookingStatus, { color: primaryColor, backgroundColor: withOpacity(primaryColor, 0.1) }]}>
            {item.bookingStatus}
          </Text>
        ) : null}
      </View>
      <Text style={styles.cardPrimaryMeta}>{date}</Text>
      <Text style={styles.cardPrimaryMeta}>{time}</Text>
      <Text style={styles.metaText}>{teacher}</Text>
      <Text style={styles.metaText}>{item.location.name}</Text>
      <View style={styles.metaChipRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>
            {item.bookedCount}/{item.capacity} booked
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>
            {item.classType.price > 0 ? formatCurrency(item.classType.price, currencyCode) : "Free"}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
          <Text style={styles.detailsButtonText}>Open</Text>
        </Pressable>

        {isClient && browsingMode ? (
          hasBooking && item.bookingId ? (
            <Pressable
              style={[styles.actionButton, styles.cancelButton, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onCancel(item.bookingId!)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : "Cancel"}</Text>
            </Pressable>
          ) : isPaidClass ? (
            <Pressable
              style={[styles.actionButton, styles.webButton, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onOpenWebBooking(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Opening..." : "Pay on web"}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.actionButton, styles.bookButton, { backgroundColor: primaryColor }, actionLoading && styles.actionButtonDisabled]}
              onPress={() => onBook(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>{actionLoading ? "Working..." : "Book now"}</Text>
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
  const [pickerDraftDate, setPickerDraftDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const latestScheduleRequestIdRef = useRef(0)

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

      const requestId = latestScheduleRequestIdRef.current + 1
      latestScheduleRequestIdRef.current = requestId
      setError(null)
      try {
        const response = await mobileApi.schedule(token, {
          from: dateRange.from,
          to: dateRange.to,
          mode: isClient ? clientMode : undefined,
        })
        if (requestId !== latestScheduleRequestIdRef.current) return
        setItems(response.items)
        setCurrencyCode(normalizeCurrencyCode(response.studio?.currency))
      } catch (err) {
        if (requestId !== latestScheduleRequestIdRef.current) return
        const message = err instanceof Error ? err.message : "Failed to load schedule"
        setError(message)
      } finally {
        if (requestId !== latestScheduleRequestIdRef.current) return
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

  const openDatePicker = useCallback(() => {
    setPickerDraftDate(parseDateKey(selectedDateKey) || dateRange.minDate)
    setShowDatePicker(true)
  }, [dateRange.minDate, selectedDateKey])

  const closeDatePicker = useCallback(() => {
    setPickerDraftDate(null)
    setShowDatePicker(false)
  }, [])

  const applyPickedDate = useCallback(
    (selectedDate: Date) => {
      setSelectedDateKey(formatDateKey(selectedDate))
      closeDatePicker()
    },
    [closeDatePicker]
  )

  const handleDatePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "dismissed" || !selectedDate) {
        if (Platform.OS !== "ios") {
          closeDatePicker()
        }
        return
      }

      if (Platform.OS === "ios") {
        setPickerDraftDate(selectedDate)
        return
      }

      applyPickedDate(selectedDate)
    },
    [applyPickedDate, closeDatePicker]
  )

  return (
      <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.subtitle}>
        {isClient ? "See upcoming classes and book quickly." : "See what is running and jump to the right day."}
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search classes, teachers or locations..."
        style={styles.searchInput}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.segmentScroll}
        contentContainerStyle={styles.segmentScrollContent}
      >
        {[
          { id: "ALL" as const, label: "All" },
          { id: "TODAY" as const, label: "Today" },
          { id: "WEEK" as const, label: "7 Days" },
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
      </ScrollView>

      {isClient ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.segmentScroll}
          contentContainerStyle={styles.segmentScrollContent}
        >
            {[
              { id: "booked" as const, label: "Booked" },
              { id: "all" as const, label: "Browse" },
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
        </ScrollView>
      ) : null}

      <Text style={styles.resultsHint}>
        Showing {filteredItems.length} class{filteredItems.length === 1 ? "" : "es"}
        {windowFilter !== "ALL" ? ` for ${windowFilter === "TODAY" ? "today" : "the next 7 days"}` : ""}
      </Text>

      <View style={styles.dateRow}>
        <Pressable style={styles.dateButton} onPress={openDatePicker}>
          <Text style={styles.dateLabel}>Date</Text>
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

      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent
        onRequestClose={closeDatePicker}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeDatePicker} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select date</Text>
            <DateTimePicker
              value={pickerDraftDate || pickerValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              minimumDate={dateRange.minDate}
              maximumDate={dateRange.maxDate}
              onChange={handleDatePickerChange}
            />
            {Platform.OS === "ios" ? (
              <View style={styles.pickerActions}>
                <Pressable style={styles.pickerSecondaryButton} onPress={closeDatePicker}>
                  <Text style={styles.pickerSecondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.pickerPrimaryButton, { backgroundColor: primaryColor }]}
                  onPress={() => applyPickedDate(pickerDraftDate || pickerValue)}
                >
                  <Text style={styles.pickerPrimaryButtonText}>Apply</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && items.length === 0 ? <Text style={styles.loading}>Loading schedule...</Text> : null}

      {!loading && filteredItems.length === 0 && !error ? (
        <Text style={styles.empty}>
          {searchNormalized && windowFilter !== "ALL"
            ? "Nothing matches your search and date filters."
            : searchNormalized
              ? "Nothing matches your search."
              : "Nothing is scheduled in this view."}
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
  subtitle: {
    color: mobileTheme.colors.textMuted,
    fontSize: 13,
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
  segmentScroll: {
    flexGrow: 0,
  },
  segmentScrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  modeButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  resultsHint: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  dateButton: {
    minWidth: 180,
    flexGrow: 1,
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
  pickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  pickerSecondaryButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: mobileTheme.colors.canvas,
  },
  pickerSecondaryButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  pickerPrimaryButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerPrimaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    justifyContent: "center",
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  modalTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 15,
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
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.text,
    flex: 1,
  },
  cardPrimaryMeta: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  metaText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 13,
  },
  bookingStatus: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "capitalize",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  metaChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.canvas,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
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
