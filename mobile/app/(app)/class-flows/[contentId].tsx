import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileClassFlowContentDetailResponse } from "@/src/types/mobile"

function formatDateTime(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function difficultyTone(difficulty: MobileClassFlowContentDetailResponse["content"]["difficulty"]) {
  if (difficulty === "BEGINNER") return styles.diffBeginner
  if (difficulty === "INTERMEDIATE") return styles.diffIntermediate
  if (difficulty === "ADVANCED") return styles.diffAdvanced
  return styles.diffExpert
}

export default function ClassFlowContentDetailScreen() {
  const { token, user } = useAuth()
  const router = useRouter()
  const { contentId } = useLocalSearchParams<{ contentId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileClassFlowContentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedContentId = useMemo(() => String(contentId || "").trim(), [contentId])

  const loadContent = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedContentId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.classFlowDetail(token, resolvedContentId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load class flow content"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedContentId, token]
  )

  useEffect(() => {
    void loadContent()
  }, [loadContent])

  const handleMarkComplete = useCallback(async () => {
    if (!token || !resolvedContentId || !data?.permissions.canUpdateProgress) return
    setSaving(true)
    setError(null)
    try {
      await mobileApi.updateClassFlowProgress(token, resolvedContentId, { isCompleted: true, progressPercent: 100 })
      await loadContent(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update progress"
      setError(message)
    } finally {
      setSaving(false)
    }
  }, [data?.permissions.canUpdateProgress, loadContent, resolvedContentId, token])

  const openResource = useCallback(async (url: string | null) => {
    if (!url) return
    try {
      await Linking.openURL(url)
    } catch {
      setError("Unable to open resource link on this device.")
    }
  }, [])

  const isTeacher = user?.role === "TEACHER"
  const completed = Boolean(data?.progress?.isCompleted)

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadContent(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Class Flow Detail</Text>
        {data?.content ? (
          <>
            <Text style={styles.nameText}>{data.content.title}</Text>
            <Text style={styles.metaText}>
              {(data.content.category.icon ? `${data.content.category.icon} ` : "") + data.content.category.name}
            </Text>
            {data.content.description ? <Text style={styles.metaText}>{data.content.description}</Text> : null}
            <View style={styles.pillRow}>
              <Text style={[styles.metaPill, difficultyTone(data.content.difficulty)]}>{data.content.difficulty}</Text>
              <Text style={styles.metaPill}>{data.content.type}</Text>
              {data.content.duration ? <Text style={styles.metaPill}>{data.content.duration} min</Text> : null}
              {data.content.isFeatured ? <Text style={styles.metaPill}>Featured</Text> : null}
            </View>
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading content details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Resources</Text>
            <View style={styles.pillRow}>
              <Text style={styles.metaPill}>Video {data.content.resourceAvailability.video ? "Yes" : "No"}</Text>
              <Text style={styles.metaPill}>PDF {data.content.resourceAvailability.pdf ? "Yes" : "No"}</Text>
              <Text style={styles.metaPill}>Article {data.content.resourceAvailability.article ? "Yes" : "No"}</Text>
            </View>
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.outlineButton, !data.content.videoUrl && styles.disabledButton]}
                onPress={() => void openResource(data.content.videoUrl)}
                disabled={!data.content.videoUrl}
              >
                <Text style={styles.outlineButtonText}>Open Video</Text>
              </Pressable>
              <Pressable
                style={[styles.outlineButton, !data.content.pdfUrl && styles.disabledButton]}
                onPress={() => void openResource(data.content.pdfUrl)}
                disabled={!data.content.pdfUrl}
              >
                <Text style={styles.outlineButtonText}>Open PDF</Text>
              </Pressable>
            </View>
            {data.content.articlePreview ? (
              <View style={styles.articleBox}>
                <Text style={styles.rowLabel}>Article preview</Text>
                <Text style={styles.metaText}>{data.content.articlePreview}</Text>
              </View>
            ) : null}
            {data.content.tags.length ? (
              <View style={styles.pillRow}>
                {data.content.tags.slice(0, 8).map((tag) => (
                  <Text key={tag} style={styles.metaPill}>
                    #{tag}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Status</Text>
              <Text style={styles.rowValue}>
                {completed ? "Completed" : `${data.progress?.progressPercent ?? 0}%`}
              </Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Last viewed</Text>
              <Text style={styles.rowValue}>{formatDateTime(data.progress?.lastViewedAt || null)}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Completed at</Text>
              <Text style={styles.rowValue}>{formatDateTime(data.progress?.completedAt || null)}</Text>
            </View>
            {data.progress?.notes ? <Text style={styles.metaText}>Notes: {data.progress.notes}</Text> : null}
            {isTeacher && data.permissions.canUpdateProgress && !completed ? (
              <Pressable style={[styles.solidButton, { backgroundColor: primaryColor }]} onPress={() => void handleMarkComplete()} disabled={saving}>
                <Text style={styles.solidButtonText}>{saving ? "Saving..." : "Mark complete"}</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Related Content</Text>
            {data.relatedContent.length === 0 ? (
              <Text style={styles.metaText}>No related content found in this category.</Text>
            ) : (
              data.relatedContent.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.relatedRow}
                  onPress={() => router.push(`/(app)/class-flows/${item.id}` as never)}
                >
                  <Text style={styles.rowLabel}>{item.title}</Text>
                  <Text style={styles.metaText}>
                    {item.type} • {item.difficulty}
                    {item.duration ? ` • ${item.duration} min` : ""}
                  </Text>
                  {item.progress ? (
                    <Text style={styles.metaText}>{item.progress.isCompleted ? "Completed" : `${item.progress.progressPercent}% complete`}</Text>
                  ) : null}
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Training Requests</Text>
            {data.recentRequests.length === 0 ? (
              <Text style={styles.metaText}>No recent training requests.</Text>
            ) : (
              data.recentRequests.map((request) => (
                <View key={request.id} style={styles.relatedRow}>
                  <Text style={styles.rowLabel}>{request.title}</Text>
                  <Text style={styles.metaText}>{request.status} • Created {formatDateTime(request.createdAt)}</Text>
                  {request.scheduledDate ? <Text style={styles.metaText}>Scheduled {formatDateTime(request.scheduledDate)}</Text> : null}
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.metaText}>Category content: {data.stats.categoryContentCount}</Text>
            <Text style={styles.metaText}>Related items: {data.stats.relatedContentCount}</Text>
            <Text style={styles.metaText}>Recent requests: {data.stats.requestCount}</Text>
            <Text style={styles.metaText}>Updated: {formatDateTime(data.content.updatedAt)}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Content not found</Text>
          <Text style={styles.metaText}>This content item is not available in your account scope.</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
    backgroundColor: mobileTheme.colors.canvas,
    paddingBottom: 24,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.xl,
    padding: 14,
    gap: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  nameText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  rowItem: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  rowValue: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
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
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surface,
  },
  outlineButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  solidButton: {
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  solidButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.45,
  },
  articleBox: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  relatedRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
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
  emptyCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 3,
  },
  emptyTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  errorText: {
    color: mobileTheme.colors.danger,
  },
})
