import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "expo-router"
import { FlatList, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
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

function monthKeyForDate(value: string) {
  return value.slice(0, 7)
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split("-").map((part) => Number(part))
  if (!year || !month) return key
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
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
  const [selectedDateKey, setSelectedDateKey] = useState<string>("ALL")
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("")
  const [showMonthPicker, setShowMonthPicker] = useState(false)
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
    to.setDate(to.getDate() + 35)
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

  const windowScopedItems = useMemo(() => {
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

  const dateOptions = useMemo(() => {
    const seen = new Set<string>()
    return windowScopedItems
      .map((item) => {
        const date = new Date(item.startTime)
        const key = date.toISOString().slice(0, 10)
        if (seen.has(key)) return null
        seen.add(key)
        return {
          key,
          label: date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
        }
      })
      .filter((value): value is { key: string; label: string } => Boolean(value))
  }, [windowScopedItems])

  const monthOptions = useMemo(() => {
    const seen = new Set<string>()
    return dateOptions
      .map((option) => {
        const key = monthKeyForDate(option.key)
        if (seen.has(key)) return null
        seen.add(key)
        return {
          key,
          label: monthLabelFromKey(key),
        }
      })
      .filter((value): value is { key: string; label: string } => Boolean(value))
  }, [dateOptions])

  useEffect(() => {
    if (selectedDateKey === "ALL") return
    if (!dateOptions.some((option) => option.key === selectedDateKey)) {
      setSelectedDateKey("ALL")
    }
  }, [dateOptions, selectedDateKey])

  useEffect(() => {
    if (monthOptions.length === 0) {
      setSelectedMonthKey("")
      return
    }

    if (!selectedMonthKey || !monthOptions.some((option) => option.key === selectedMonthKey)) {
      setSelectedMonthKey(monthOptions[0].key)
    }
  }, [monthOptions, selectedMonthKey])

  const monthCalendarCells = useMemo(() => {
    if (!selectedMonthKey) return []

    const [yearString, monthString] = selectedMonthKey.split("-")
    const year = Number(yearString)
    const month = Number(monthString)
    if (!year || !month) return []

    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startWeekday = (firstDay.getDay() + 6) % 7
    const availableDates = new Set(dateOptions.filter((option) => monthKeyForDate(option.key) === selectedMonthKey).map((option) => option.key))
    const cells: Array<{ key: string; label: string; available: boolean } | null> = []

    for (let index = 0; index < startWeekday; index += 1) {
      cells.push(null)
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const key = `${selectedMonthKey}-${String(day).padStart(2, "0")}`
      cells.push({
        key,
        label: String(day),
        available: availableDates.has(key),
      })
    }

    return cells
  }, [dateOptions, selectedMonthKey])

  const filteredItems = useMemo(() => {
    if (selectedDateKey === "ALL") return windowScopedItems
    return windowScopedItems.filter((item) => item.startTime.slice(0, 10) === selectedDateKey)
  }, [selectedDateKey, windowScopedItems])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.subtitle}>Next 35 days for {user?.role?.toLowerCase() || "account"}</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search class, teacher, or location..."
        style={styles.searchInput}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
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
      </ScrollView>

      {monthOptions.length > 0 ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthStrip}>
            {monthOptions.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.monthChip,
                  selectedMonthKey === option.key && [styles.monthChipActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
                ]}
                onPress={() => {
                  setSelectedMonthKey(option.key)
                  const firstAvailable = dateOptions.find((dateOption) => monthKeyForDate(dateOption.key) === option.key)
                  if (firstAvailable && selectedDateKey !== "ALL" && monthKeyForDate(selectedDateKey) !== option.key) {
                    setSelectedDateKey(firstAvailable.key)
                  }
                }}
              >
                <Text style={[styles.monthChipText, selectedMonthKey === option.key && [styles.monthChipTextActive, { color: primaryColor }]]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[
              styles.jumpToggleButton,
              showMonthPicker && [styles.jumpToggleButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
            ]}
            onPress={() => setShowMonthPicker((current) => !current)}
          >
            <Text
              style={[
                styles.jumpToggleButtonText,
                showMonthPicker && [styles.jumpToggleButtonTextActive, { color: primaryColor }],
              ]}
            >
              {showMonthPicker ? "Hide day picker" : "Jump to day"}
            </Text>
          </Pressable>

          {showMonthPicker && monthCalendarCells.length > 0 ? (
            <View style={styles.monthCard}>
              <Text style={styles.monthCardTitle}>Jump to day</Text>
              <View style={styles.weekdayRow}>
                {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
                  <Text key={`${label}-${index}`} style={styles.weekdayCell}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {monthCalendarCells.map((cell, index) =>
                  cell ? (
                    <Pressable
                      key={cell.key}
                      disabled={!cell.available}
                      style={[
                        styles.calendarDay,
                        cell.available ? styles.calendarDayAvailable : styles.calendarDayUnavailable,
                        selectedDateKey === cell.key && [styles.calendarDaySelected, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
                      ]}
                      onPress={() => {
                        setSelectedDateKey(cell.key)
                        setShowMonthPicker(false)
                      }}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          !cell.available && styles.calendarDayTextUnavailable,
                          selectedDateKey === cell.key && [styles.calendarDayTextSelected, { color: primaryColor }],
                        ]}
                      >
                        {cell.label}
                      </Text>
                    </Pressable>
                  ) : (
                    <View key={`empty-${index}`} style={styles.calendarSpacer} />
                  )
                )}
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      {dateOptions.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          <Pressable
            style={[
              styles.dateChip,
              selectedDateKey === "ALL" && [styles.dateChipActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
            ]}
            onPress={() => setSelectedDateKey("ALL")}
          >
            <Text style={[styles.dateChipText, selectedDateKey === "ALL" && [styles.dateChipTextActive, { color: primaryColor }]]}>All dates</Text>
          </Pressable>
          {dateOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.dateChip,
                selectedDateKey === option.key && [styles.dateChipActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
              ]}
              onPress={() => setSelectedDateKey(option.key)}
            >
              <Text
                style={[
                  styles.dateChipText,
                  selectedDateKey === option.key && [styles.dateChipTextActive, { color: primaryColor }],
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {isClient ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeStrip}>
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
        </ScrollView>
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
  filterStrip: {
    gap: 8,
    paddingBottom: 2,
    paddingRight: 12,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  filterButtonActive: {
    borderWidth: 1,
  },
  filterButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 11,
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  monthStrip: {
    gap: 8,
    paddingBottom: 2,
    paddingRight: 12,
  },
  monthChip: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  monthChipActive: {
    borderWidth: 1,
  },
  monthChipText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 11,
  },
  monthChipTextActive: {
    fontWeight: "700",
  },
  monthCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
  },
  jumpToggleButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  jumpToggleButtonActive: {
    borderWidth: 1,
  },
  jumpToggleButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  jumpToggleButtonTextActive: {
    fontWeight: "700",
  },
  monthCardTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 6,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    color: mobileTheme.colors.textSubtle,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  calendarSpacer: {
    width: "13%",
    aspectRatio: 1,
  },
  calendarDay: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayAvailable: {
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.surface,
  },
  calendarDayUnavailable: {
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: mobileTheme.colors.canvas,
  },
  calendarDaySelected: {
    borderWidth: 1,
  },
  calendarDayText: {
    color: mobileTheme.colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  calendarDayTextUnavailable: {
    color: mobileTheme.colors.textFaint,
  },
  calendarDayTextSelected: {
    fontWeight: "700",
  },
  dateStrip: {
    gap: 8,
    paddingBottom: 2,
    paddingRight: 12,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateChipActive: {
    borderWidth: 1,
  },
  dateChipText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 11,
  },
  dateChipTextActive: {
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 2,
  },
  modeStrip: {
    gap: 8,
    paddingBottom: 2,
    paddingRight: 12,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexShrink: 0,
  },
  modeButtonActive: {
    borderWidth: 1,
  },
  modeButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  modeButtonTextActive: {
    fontWeight: "700",
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  list: {
    flex: 1,
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
