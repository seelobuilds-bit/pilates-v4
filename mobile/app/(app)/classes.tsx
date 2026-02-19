import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileClassTypeSummary } from "@/src/types/mobile"

function formatCurrency(value: number, currencyCode: string) {
  const normalized = String(currencyCode || "USD").toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value}`
  }
}

function ClassCard({ item, currency }: { item: MobileClassTypeSummary; currency: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.classTitle}>{item.name}</Text>
        <Text style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
          {item.isActive ? "Active" : "Inactive"}
        </Text>
      </View>
      {item.description ? <Text style={styles.descriptionText}>{item.description}</Text> : null}
      <View style={styles.rowMeta}>
        <Text style={styles.metaPill}>{item.duration} mins</Text>
        <Text style={styles.metaPill}>Capacity {item.capacity}</Text>
        <Text style={styles.metaPill}>{item.price > 0 ? formatCurrency(item.price, currency) : "Free"}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.metaPill}>Upcoming {item.upcomingSessions}</Text>
        <Text style={styles.metaPill}>Total Sessions {item.totalSessions}</Text>
      </View>
    </View>
  )
}

export default function ClassesScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [classTypes, setClassTypes] = useState<MobileClassTypeSummary[]>([])
  const [currency, setCurrency] = useState("USD")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const trimmedSearch = search.trim()

  const loadClassTypes = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setClassTypes([])
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      try {
        const response = await mobileApi.classTypes(token, {
          search: trimmedSearch || undefined,
          status: statusFilter,
        })
        setClassTypes(response.classTypes || [])
        setCurrency(response.studio?.currency || "USD")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load class types"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAllowedRole, statusFilter, token, trimmedSearch]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadClassTypes()
    }, 200)
    return () => clearTimeout(timeout)
  }, [loadClassTypes, trimmedSearch, statusFilter])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Classes view is available for studio owner and teacher accounts."
    if (trimmedSearch) return "No classes matched your search."
    return statusFilter === "active" ? "No active classes yet." : "No classes available yet."
  }, [isAllowedRole, statusFilter, trimmedSearch])

  const handleViewClassType = useCallback(
    (classTypeId: string) => {
      router.push(`/(app)/classes/${classTypeId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Classes</Text>
        <Text style={styles.subtitle}>Class types and session activity</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search class types..."
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        <Pressable
          style={[
            styles.filterButton,
            statusFilter === "active" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setStatusFilter("active")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "active" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            Active
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterButton,
            statusFilter === "all" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
          ]}
          onPress={() => setStatusFilter("all")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "all" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            All
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isAllowedRole ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => router.push("/(app)/workspace")}>
            <Text style={styles.actionButtonText}>Go to workspace</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={classTypes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.classRowWrap}>
              <ClassCard item={item} currency={currency} />
              <Pressable
                style={[styles.viewButton, { borderColor: withOpacity(primaryColor, 0.35), backgroundColor: withOpacity(primaryColor, 0.1) }]}
                onPress={() => handleViewClassType(item.id)}
              >
                <Text style={[styles.viewButtonText, { color: primaryColor }]}>View Details</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadClassTypes(true)} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
    padding: 16,
    gap: 10,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.xl,
    padding: 14,
    gap: 4,
  },
  title: {
    color: mobileTheme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: mobileTheme.colors.textMuted,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    color: mobileTheme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
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
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  classRowWrap: {
    gap: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  classTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
  },
  descriptionText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  rowMeta: {
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
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusInactive: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  viewButton: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  viewButtonText: {
    fontWeight: "700",
    fontSize: 13,
  },
  errorText: {
    color: mobileTheme.colors.danger,
  },
  emptyWrap: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: mobileTheme.colors.textSubtle,
  },
  actionButton: {
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
})
