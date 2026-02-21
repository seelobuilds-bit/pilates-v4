import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Image, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import { toWorkspaceUrl } from "@/src/lib/workspace-links"
import type { MobileVaultAudience, MobileVaultCourseSummary, MobileVaultResponse } from "@/src/types/mobile"

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

function audienceLabel(audience: MobileVaultAudience) {
  if (audience === "STUDIO_OWNERS") return "Owners"
  if (audience === "TEACHERS") return "Teachers"
  if (audience === "CLIENTS") return "Clients"
  return "All"
}

function pricingLabel(item: MobileVaultCourseSummary) {
  if (item.pricingType === "FREE" || item.price <= 0) return "Free"
  if (item.pricingType === "SUBSCRIPTION") return `${formatCurrency(item.price, item.currency)} / sub`
  return formatCurrency(item.price, item.currency)
}

function CourseCard({
  item,
  onViewDetails,
  onTogglePublish,
  canManagePublishing,
  isUpdating,
  primaryColor,
}: {
  item: MobileVaultCourseSummary
  onViewDetails: (courseId: string) => void
  onTogglePublish: (courseId: string, action: "publish" | "unpublish") => void
  canManagePublishing: boolean
  isUpdating: boolean
  primaryColor: string
}) {
  const action = item.isPublished ? "unpublish" : "publish"

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={styles.courseImage} /> : <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>No image</Text></View>}
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.metaText}>{audienceLabel(item.audience)}</Text>
          <Text style={styles.priceText}>{pricingLabel(item)}</Text>
          {item.category ? <Text style={styles.metaText}>{item.category}</Text> : null}
        </View>
        <View style={styles.badgeColumn}>
          <Text style={[styles.statusBadge, item.isPublished ? styles.statusActive : styles.statusInactive]}>
            {item.isPublished ? "Published" : "Draft"}
          </Text>
          {item.isFeatured ? <Text style={styles.featuredBadge}>Featured</Text> : null}
        </View>
      </View>

      {item.subtitle ? <Text style={styles.subtitleText}>{item.subtitle}</Text> : null}

      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.moduleCount} modules</Text>
        <Text style={styles.metaPill}>{item.enrollmentCount} enrollments</Text>
        <Text style={styles.metaPill}>{item.reviewCount} reviews</Text>
        <Text style={styles.metaPill}>Rating {item.averageRating.toFixed(1)}</Text>
      </View>

      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.includeInSubscription ? "In Subscription" : "Standalone"}</Text>
        {item.creatorName ? <Text style={styles.metaPill}>By {item.creatorName}</Text> : null}
      </View>

      {canManagePublishing ? (
        <Pressable
          disabled={isUpdating}
          style={[styles.inlineActionButton, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.12) }]}
          onPress={() => onTogglePublish(item.id, action)}
        >
          <Text style={[styles.inlineActionText, { color: primaryColor }]}>
            {isUpdating ? "Updating..." : action === "publish" ? "Publish Course" : "Unpublish Course"}
          </Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

const AUDIENCE_OPTIONS: { value: "all" | MobileVaultAudience; label: string }[] = [
  { value: "all", label: "All" },
  { value: "CLIENTS", label: "Clients" },
  { value: "TEACHERS", label: "Teachers" },
  { value: "STUDIO_OWNERS", label: "Owners" },
]

export default function VaultScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileVaultResponse | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"published" | "all">("published")
  const [audienceFilter, setAudienceFilter] = useState<"all" | MobileVaultAudience>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const trimmedSearch = search.trim()

  const loadVault = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.vault(token, {
          search: trimmedSearch || undefined,
          status: statusFilter,
          audience: audienceFilter,
        })
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load vault"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [audienceFilter, isAllowedRole, statusFilter, token, trimmedSearch]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadVault()
    }, 220)
    return () => clearTimeout(timeout)
  }, [loadVault])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Vault is available for studio owner and teacher accounts only."
    if (trimmedSearch) return "No courses matched your search."
    return statusFilter === "published" ? "No published courses yet." : "No courses found."
  }, [isAllowedRole, statusFilter, trimmedSearch])

  const vaultWebHref = user?.role === "TEACHER" ? "/teacher/vault" : "/studio/vault"
  const canManagePublishing = user?.role === "OWNER"
  const handleViewDetails = useCallback(
    (courseId: string) => {
      router.push(`/(app)/vault/${courseId}` as never)
    },
    [router]
  )

  const handleTogglePublish = useCallback(
    async (courseId: string, action: "publish" | "unpublish") => {
      if (!token || !canManagePublishing) return
      setUpdatingCourseId(courseId)
      setError(null)
      try {
        await mobileApi.vaultCoursePublish(token, courseId, action)
        await loadVault(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update publish status"
        setError(message)
      } finally {
        setUpdatingCourseId(null)
      }
    },
    [canManagePublishing, loadVault, token]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>The Vault</Text>
        <Text style={styles.subtitle}>Courses, enrollments, and publishing health</Text>
        {data ? (
          <View style={styles.statsRow}>
            <Text style={styles.statPill}>Courses {data.stats.totalCourses}</Text>
            <Text style={styles.statPill}>Published {data.stats.publishedCourses}</Text>
            <Text style={styles.statPill}>Featured {data.stats.featuredCourses}</Text>
            <Text style={styles.statPill}>Enrollments {data.stats.totalEnrollments}</Text>
          </View>
        ) : null}
      </View>

      <TextInput value={search} onChangeText={setSearch} placeholder="Search courses..." style={styles.searchInput} />

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterButton, statusFilter === "published" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setStatusFilter("published")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "published" && [styles.filterButtonTextActive, { color: primaryColor }]]}>Published</Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, statusFilter === "all" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setStatusFilter("all")}
        >
          <Text style={[styles.filterButtonText, statusFilter === "all" && [styles.filterButtonTextActive, { color: primaryColor }]]}>All</Text>
        </Pressable>
      </View>

      <View style={styles.filterRowWrap}>
        {AUDIENCE_OPTIONS.map((option) => {
          const active = audienceFilter === option.value
          return (
            <Pressable
              key={option.value}
              style={[styles.filterButton, active && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
              onPress={() => setAudienceFilter(option.value)}
            >
              <Text style={[styles.filterButtonText, active && [styles.filterButtonTextActive, { color: primaryColor }]]}>{option.label}</Text>
            </Pressable>
          )
        })}
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
          data={data?.courses || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CourseCard
              item={item}
              onViewDetails={handleViewDetails}
              onTogglePublish={(courseId, action) => void handleTogglePublish(courseId, action)}
              canManagePublishing={canManagePublishing}
              isUpdating={updatingCourseId === item.id}
              primaryColor={primaryColor}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadVault(true)} />}
          ListEmptyComponent={!loading ? <View style={styles.emptyWrap}><Text style={styles.emptyText}>{emptyText}</Text></View> : null}
          ListFooterComponent={
            <View style={styles.footerSection}>
              <Text style={styles.metaText}>Need full editing controls? Open the complete web vault.</Text>
              <Pressable
                style={[styles.actionButton, { backgroundColor: primaryColor }]}
                onPress={() => {
                  void Linking.openURL(toWorkspaceUrl(vaultWebHref))
                }}
              >
                <Text style={styles.actionButtonText}>Open Web Vault</Text>
              </Pressable>
            </View>
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
  filterRowWrap: {
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
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 7,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  courseImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  imagePlaceholderText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 10,
    textAlign: "center",
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  subtitleText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
  },
  priceText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  badgeColumn: {
    alignItems: "flex-end",
    gap: 4,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.35,
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
  featuredBadge: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#fef9c3",
    color: "#854d0e",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  pillRow: {
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
  detailsButton: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: mobileTheme.colors.surface,
  },
  inlineActionButton: {
    marginTop: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  inlineActionText: {
    fontWeight: "700",
    fontSize: 12,
  },
  detailsButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  footerSection: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
    marginTop: 8,
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
