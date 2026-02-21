import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileClientSummary } from "@/src/types/mobile"

function formatDateTime(value: string | null) {
  if (!value) return "No bookings yet"
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ClientCard({ item }: { item: MobileClientSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.nameText}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
          {item.isActive ? "Active" : "Inactive"}
        </Text>
      </View>
      <Text style={styles.metaText}>{item.email}</Text>
      <Text style={styles.metaText}>{item.phone || "No phone"}</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statPill}>Bookings: {item.totalBookings}</Text>
        <Text style={styles.statPill}>Last: {formatDateTime(item.lastBookingAt)}</Text>
      </View>
    </View>
  )
}

export default function PeopleScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [clients, setClients] = useState<MobileClientSummary[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const trimmedSearch = search.trim()

  const loadClients = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setClients([])
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      try {
        const response = await mobileApi.clients(token, { search: trimmedSearch || undefined })
        setClients(response.clients || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load clients"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAllowedRole, token, trimmedSearch]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadClients()
    }, 220)
    return () => clearTimeout(timeout)
  }, [loadClients, trimmedSearch])

  const statusCounts = useMemo(() => {
    const active = clients.filter((client) => client.isActive).length
    return {
      ALL: clients.length,
      ACTIVE: active,
      INACTIVE: clients.length - active,
    } as const
  }, [clients])

  const filteredClients = useMemo(() => {
    if (statusFilter === "ALL") return clients
    if (statusFilter === "ACTIVE") return clients.filter((client) => client.isActive)
    return clients.filter((client) => !client.isActive)
  }, [clients, statusFilter])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "People view is available for studio owner and teacher accounts."
    if (trimmedSearch) return "No clients matched your search."
    if (statusFilter === "ACTIVE") return "No active clients matched this view."
    if (statusFilter === "INACTIVE") return "No inactive clients matched this view."
    return "No clients available yet."
  }, [isAllowedRole, statusFilter, trimmedSearch])

  const handleMessageClient = useCallback((clientId: string) => {
    router.push({ pathname: "/(app)/inbox", params: { clientId } })
  }, [router])

  const handleViewClient = useCallback(
    (clientId: string) => {
      router.push(`/(app)/people/${clientId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>People</Text>
        <Text style={styles.subtitle}>Clients for {user?.role?.toLowerCase() || "account"} view</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search clients..."
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterButton, statusFilter === "ALL" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setStatusFilter("ALL")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "ALL" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`All (${statusCounts.ALL})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, statusFilter === "ACTIVE" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setStatusFilter("ACTIVE")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "ACTIVE" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`Active (${statusCounts.ACTIVE})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, statusFilter === "INACTIVE" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setStatusFilter("INACTIVE")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "INACTIVE" && [styles.filterButtonTextActive, { color: primaryColor }]]}>
            {`Inactive (${statusCounts.INACTIVE})`}
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
          data={filteredClients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.clientRowWrap}>
              <ClientCard item={item} />
              <View style={styles.clientActionsRow}>
                <Pressable
                  style={[styles.secondaryButton, { borderColor: withOpacity(primaryColor, 0.35), backgroundColor: withOpacity(primaryColor, 0.08) }]}
                  onPress={() => handleViewClient(item.id)}
                >
                  <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>View</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, { borderColor: withOpacity(primaryColor, 0.45), backgroundColor: withOpacity(primaryColor, 0.11) }]}
                  onPress={() => handleMessageClient(item.id)}
                >
                  <Text style={[styles.primaryButtonText, { color: primaryColor }]}>Message</Text>
                </Pressable>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadClients(true)} />}
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
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
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
    flexWrap: "wrap",
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
    fontSize: 12,
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 24,
    gap: 8,
  },
  clientRowWrap: {
    gap: 6,
  },
  clientActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nameText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
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
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  statPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: "#f8fafc",
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
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
