import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileTeacherSummary } from "@/src/types/mobile"

function formatPayRate(teacher: MobileTeacherSummary) {
  if (!teacher.payRate) {
    return "No pay rate set"
  }

  const { type, rate, currency } = teacher.payRate
  const normalizedCurrency = String(currency || "USD").toUpperCase()
  let amount = `${rate}`
  try {
    amount = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(rate)
  } catch {
    amount = `${rate}`
  }

  if (type === "PER_HOUR") return `${amount} / hr`
  if (type === "PER_STUDENT") return `${amount} / student`
  if (type === "PERCENTAGE") return `${rate}% revenue`
  return `${amount} / class`
}

function TeacherCard({ teacher }: { teacher: MobileTeacherSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nameText}>
          {teacher.firstName} {teacher.lastName}
        </Text>
        <Text style={[styles.statusBadge, teacher.isActive ? styles.statusActive : styles.statusInactive]}>
          {teacher.isActive ? "Active" : "Inactive"}
        </Text>
      </View>
      <Text style={styles.metaText}>{teacher.email}</Text>
      {teacher.bio ? <Text style={styles.bioText}>{teacher.bio}</Text> : null}
      {teacher.specialties.length > 0 ? (
        <View style={styles.pillRow}>
          {teacher.specialties.slice(0, 4).map((specialty) => (
            <Text key={specialty} style={styles.pill}>
              {specialty}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.pillRow}>
        <Text style={styles.pill}>Upcoming {teacher.upcomingSessions}</Text>
        <Text style={styles.pill}>Total Sessions {teacher.totalSessions}</Text>
      </View>
      <Text style={styles.payText}>{formatPayRate(teacher)}</Text>
    </View>
  )
}

export default function TeachersScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [teachers, setTeachers] = useState<MobileTeacherSummary[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const trimmedSearch = search.trim()

  const loadTeachers = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setTeachers([])
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      try {
        const response = await mobileApi.teachers(token, {
          search: trimmedSearch || undefined,
          status: "all",
        })
        setTeachers(response.teachers || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load teachers"
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
      void loadTeachers()
    }, 200)
    return () => clearTimeout(timeout)
  }, [loadTeachers, trimmedSearch])

  const statusCounts = useMemo(() => {
    const active = teachers.filter((teacher) => teacher.isActive).length
    return {
      active,
      all: teachers.length,
    } as const
  }, [teachers])

  const filteredTeachers = useMemo(() => {
    if (statusFilter === "all") return teachers
    return teachers.filter((teacher) => teacher.isActive)
  }, [statusFilter, teachers])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Teachers view is available for studio owner and teacher accounts."
    if (trimmedSearch) return statusFilter === "active" ? "No active teachers matched your search." : "No teachers matched your search."
    return statusFilter === "active" ? "No active teachers yet." : "No teachers available yet."
  }, [isAllowedRole, statusFilter, trimmedSearch])

  const handleViewTeacher = useCallback(
    (teacherId: string) => {
      router.push(`/(app)/teachers/${teacherId}` as never)
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Teachers</Text>
        <Text style={styles.subtitle}>Team and teaching activity</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search teachers..."
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
            {`Active (${statusCounts.active})`}
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
            {`All (${statusCounts.all})`}
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
          data={filteredTeachers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.teacherRowWrap}>
              <TeacherCard teacher={item} />
              <Pressable
                style={[styles.viewButton, { borderColor: withOpacity(primaryColor, 0.35), backgroundColor: withOpacity(primaryColor, 0.1) }]}
                onPress={() => handleViewTeacher(item.id)}
              >
                <Text style={[styles.viewButtonText, { color: primaryColor }]}>View Details</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadTeachers(true)} />}
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
  teacherRowWrap: {
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
  bioText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: "#f8fafc",
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  payText: {
    color: mobileTheme.colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
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
