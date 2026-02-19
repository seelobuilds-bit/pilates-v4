import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileClassFlowContentSummary, MobileClassFlowsResponse, MobileClassFlowType, MobileClassFlowDifficulty } from "@/src/types/mobile"

type FlowFilterType = "all" | MobileClassFlowType
type FlowFilterDifficulty = "all" | MobileClassFlowDifficulty

type ContentRow = MobileClassFlowContentSummary & {
  categoryId: string
  categoryName: string
  categoryIcon: string | null
}

function statusTone(progress: MobileClassFlowContentSummary["progress"]) {
  if (progress?.isCompleted) return styles.progressComplete
  if (progress && progress.progressPercent > 0) return styles.progressPartial
  return styles.progressNew
}

function difficultyTone(difficulty: MobileClassFlowDifficulty) {
  if (difficulty === "BEGINNER") return styles.diffBeginner
  if (difficulty === "INTERMEDIATE") return styles.diffIntermediate
  if (difficulty === "ADVANCED") return styles.diffAdvanced
  return styles.diffExpert
}

function ContentCard({
  item,
  isTeacher,
  primaryColor,
  onMarkComplete,
  busy,
}: {
  item: ContentRow
  isTeacher: boolean
  primaryColor: string
  onMarkComplete: (contentId: string) => void
  busy: boolean
}) {
  const progressPercent = item.progress?.progressPercent ?? 0
  const completed = Boolean(item.progress?.isCompleted)

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={[styles.typeBadge, item.type === "VIDEO" ? styles.typeVideo : item.type === "PDF" ? styles.typePdf : styles.typeArticle]}>
          {item.type}
        </Text>
      </View>
      <Text style={styles.metaText}>
        {(item.categoryIcon ? `${item.categoryIcon} ` : "") + item.categoryName}
      </Text>
      {item.description ? (
        <Text numberOfLines={2} style={styles.descriptionText}>
          {item.description}
        </Text>
      ) : null}
      <View style={styles.pillRow}>
        <Text style={[styles.metaPill, difficultyTone(item.difficulty)]}>{item.difficulty}</Text>
        {item.duration ? <Text style={styles.metaPill}>{item.duration} min</Text> : null}
        {item.isFeatured ? <Text style={styles.metaPill}>Featured</Text> : null}
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={[styles.progressStatus, statusTone(item.progress)]}>
            {completed ? "Completed" : `${progressPercent}%`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(4, Math.min(100, completed ? 100 : progressPercent))}%`,
                backgroundColor: completed ? "#16a34a" : primaryColor,
              },
            ]}
          />
        </View>
      </View>

      {isTeacher && !completed ? (
        <Pressable
          style={[styles.actionButton, { borderColor: withOpacity(primaryColor, 0.45), backgroundColor: withOpacity(primaryColor, 0.12) }]}
          onPress={() => onMarkComplete(item.id)}
          disabled={busy}
        >
          <Text style={[styles.actionButtonText, { color: primaryColor }]}>{busy ? "Saving..." : "Mark complete"}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export default function ClassFlowsScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileClassFlowsResponse | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<FlowFilterType>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<FlowFilterDifficulty>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingContentId, setSavingContentId] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"
  const isTeacher = user?.role === "TEACHER"
  const trimmedSearch = search.trim()

  const loadFlows = useCallback(
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
        const response = await mobileApi.classFlows(token, {
          categoryId: categoryFilter === "all" ? undefined : categoryFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
          difficulty: difficultyFilter === "all" ? undefined : difficultyFilter,
          featuredOnly,
          search: trimmedSearch || undefined,
        })
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load class flows"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [categoryFilter, difficultyFilter, featuredOnly, isAllowedRole, token, trimmedSearch, typeFilter]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadFlows()
    }, 220)
    return () => clearTimeout(timeout)
  }, [loadFlows])

  const contentRows = useMemo(() => {
    if (!data) return []
    return data.categories.flatMap((category) =>
      category.contents.map((content) => ({
        ...content,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
      }))
    )
  }, [data])

  const handleMarkComplete = useCallback(
    async (contentId: string) => {
      if (!token || !isTeacher) return
      setSavingContentId(contentId)
      try {
        await mobileApi.updateClassFlowProgress(token, contentId, { isCompleted: true, progressPercent: 100 })
        await loadFlows(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update progress"
        setError(message)
      } finally {
        setSavingContentId(null)
      }
    },
    [isTeacher, loadFlows, token]
  )

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Class flows are available for studio owner and teacher accounts."
    if (trimmedSearch) return "No class flow content matched your search."
    return "No class flow content available right now."
  }, [isAllowedRole, trimmedSearch])

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Class Flows</Text>
        <Text style={styles.subtitle}>Training library and completion progress</Text>
        {data ? (
          <View style={styles.statsRow}>
            <Text style={styles.statPill}>Categories {data.stats.categories}</Text>
            <Text style={styles.statPill}>Content {data.stats.totalContent}</Text>
            {isTeacher ? <Text style={styles.statPill}>Completed {data.stats.completedContent}</Text> : null}
            <Text style={styles.statPill}>Requests {data.stats.pendingTrainingRequests}</Text>
          </View>
        ) : null}
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search class flows..."
        style={styles.searchInput}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        <Pressable
          style={[styles.filterButton, featuredOnly && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
          onPress={() => setFeaturedOnly((value) => !value)}
        >
          <Text style={[styles.filterButtonText, featuredOnly && [styles.filterButtonTextActive, { color: primaryColor }]]}>Featured</Text>
        </Pressable>
        {(["all", "VIDEO", "PDF", "ARTICLE", "QUIZ"] as FlowFilterType[]).map((type) => (
          <Pressable
            key={type}
            style={[styles.filterButton, typeFilter === type && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
            onPress={() => setTypeFilter(type)}
          >
            <Text style={[styles.filterButtonText, typeFilter === type && [styles.filterButtonTextActive, { color: primaryColor }]]}>
              {type === "all" ? "Type: All" : type}
            </Text>
          </Pressable>
        ))}
        {(["all", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as FlowFilterDifficulty[]).map((difficulty) => (
          <Pressable
            key={difficulty}
            style={[styles.filterButton, difficultyFilter === difficulty && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
            onPress={() => setDifficultyFilter(difficulty)}
          >
            <Text style={[styles.filterButtonText, difficultyFilter === difficulty && [styles.filterButtonTextActive, { color: primaryColor }]]}>
              {difficulty === "all" ? "Level: All" : difficulty}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {data?.categories?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            style={[styles.filterButton, categoryFilter === "all" && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
            onPress={() => setCategoryFilter("all")}
          >
            <Text style={[styles.filterButtonText, categoryFilter === "all" && [styles.filterButtonTextActive, { color: primaryColor }]]}>Category: All</Text>
          </Pressable>
          {data.categories.map((category) => (
            <Pressable
              key={category.id}
              style={[styles.filterButton, categoryFilter === category.id && [styles.filterButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
              onPress={() => setCategoryFilter(category.id)}
            >
              <Text style={[styles.filterButtonText, categoryFilter === category.id && [styles.filterButtonTextActive, { color: primaryColor }]]}>
                {(category.icon ? `${category.icon} ` : "") + category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isAllowedRole ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Pressable style={[styles.actionButtonSolid, { backgroundColor: primaryColor }]} onPress={() => router.push("/(app)/workspace")}>
            <Text style={styles.actionButtonSolidText}>Go to workspace</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={contentRows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContentCard
              item={item}
              isTeacher={isTeacher}
              primaryColor={primaryColor}
              onMarkComplete={handleMarkComplete}
              busy={savingContentId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadFlows(true)} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            data?.recentRequests?.length ? (
              <View style={styles.requestsWrap}>
                <Text style={styles.requestsTitle}>Recent Training Requests</Text>
                {data.recentRequests.map((request) => (
                  <View key={request.id} style={styles.requestRow}>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                    <Text style={styles.requestStatus}>{request.status}</Text>
                  </View>
                ))}
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
    gap: 6,
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
  filterScroll: {
    gap: 8,
    paddingRight: 8,
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
    gap: 8,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  typeVideo: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  typePdf: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  typeArticle: {
    backgroundColor: "#e9d5ff",
    color: "#7e22ce",
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  descriptionText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
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
  diffBeginner: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderColor: "#86efac",
  },
  diffIntermediate: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    borderColor: "#93c5fd",
  },
  diffAdvanced: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderColor: "#fcd34d",
  },
  diffExpert: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderColor: "#fca5a5",
  },
  progressWrap: {
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
  },
  progressStatus: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressNew: {
    color: "#64748b",
  },
  progressPartial: {
    color: "#1d4ed8",
  },
  progressComplete: {
    color: "#166534",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
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
  actionButtonSolid: {
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonSolidText: {
    color: "#fff",
    fontWeight: "700",
  },
  requestsWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
  },
  requestsTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  requestTitle: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  requestStatus: {
    color: mobileTheme.colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
})
