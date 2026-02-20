import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileVaultCourseDetailResponse } from "@/src/types/mobile"

function normalizeCurrencyCode(value: string | null | undefined) {
  const normalized = String(value || "").trim().toUpperCase()
  return normalized || "USD"
}

function formatCurrency(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizeCurrencyCode(currencyCode),
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value}`
  }
}

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

function audienceLabel(audience: string) {
  if (audience === "STUDIO_OWNERS") return "Owners"
  if (audience === "TEACHERS") return "Teachers"
  if (audience === "CLIENTS") return "Clients"
  return "All"
}

export default function VaultCourseDetailScreen() {
  const { token, user } = useAuth()
  const { courseId } = useLocalSearchParams<{ courseId?: string }>()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileVaultCourseDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingPublish, setUpdatingPublish] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedCourseId = useMemo(() => String(courseId || "").trim(), [courseId])
  const currency = normalizeCurrencyCode(data?.course.currency || user?.studio.currency)

  const loadCourse = useCallback(
    async (isRefresh = false) => {
      if (!token || !resolvedCourseId) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.vaultCourseDetail(token, resolvedCourseId)
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load course detail"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [resolvedCourseId, token]
  )

  useEffect(() => {
    void loadCourse()
  }, [loadCourse])

  const publishAction = useMemo(() => {
    if (!data?.course || user?.role !== "OWNER") {
      return null
    }

    return data.course.isPublished
      ? ({
          action: "unpublish" as const,
          label: "Unpublish Course",
          hint: "Hides this course from published listings until you republish it.",
        })
      : ({
          action: "publish" as const,
          label: "Publish Course",
          hint: "Makes this course available in published listings.",
        })
  }, [data?.course, user?.role])

  const handlePublishAction = useCallback(async () => {
    if (!token || !resolvedCourseId || !publishAction) {
      return
    }

    setUpdatingPublish(true)
    setError(null)
    try {
      const response = await mobileApi.vaultCoursePublish(token, resolvedCourseId, publishAction.action)
      setData((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          course: {
            ...previous.course,
            isPublished: response.course.isPublished,
            publishedAt: response.course.publishedAt,
            updatedAt: response.course.updatedAt,
          },
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update publish status"
      setError(message)
    } finally {
      setUpdatingPublish(false)
    }
  }, [publishAction, resolvedCourseId, token])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadCourse(true)} />}
    >
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Vault Course</Text>
        {data ? (
          <>
            <Text style={styles.nameText}>{data.course.title}</Text>
            <Text style={styles.metaText}>{audienceLabel(data.course.audience)} • {data.course.difficulty || "General"}</Text>
            <Text style={styles.metaText}>{data.course.isPublished ? "Published" : "Draft"} • {data.course.isFeatured ? "Featured" : "Standard"}</Text>
            {publishAction ? (
              <View style={styles.actionWrap}>
                <Pressable
                  disabled={updatingPublish}
                  style={[styles.actionButton, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.12) }]}
                  onPress={() => void handlePublishAction()}
                >
                  <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                    {updatingPublish ? "Updating..." : publishAction.label}
                  </Text>
                </Pressable>
                <Text style={styles.actionHint}>{publishAction.hint}</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading course details...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Overview</Text>
            {data.course.thumbnailUrl ? <Image source={{ uri: data.course.thumbnailUrl }} style={styles.heroImage} /> : null}
            {data.course.subtitle ? <Text style={styles.metaText}>{data.course.subtitle}</Text> : null}
            <Text style={styles.metaText}>{data.course.description}</Text>
            <Text style={styles.metaText}>
              Pricing: {data.course.pricingType === "FREE" || data.course.price <= 0 ? "Free" : formatCurrency(data.course.price, currency)}
            </Text>
            {data.course.subscriptionPrice ? (
              <Text style={styles.metaText}>Subscription: {formatCurrency(data.course.subscriptionPrice, currency)} / {data.course.subscriptionInterval || "period"}</Text>
            ) : null}
            <Text style={styles.metaText}>Rating: {data.course.averageRating.toFixed(1)} ({data.course.reviewCount} reviews)</Text>
            {data.course.tags.length > 0 ? <Text style={styles.metaText}>Tags: {data.course.tags.join(", ")}</Text> : null}
            {data.course.creator ? <Text style={styles.metaText}>Creator: {data.course.creator.firstName} {data.course.creator.lastName}</Text> : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Enrollments</Text><Text style={styles.rowValue}>{data.stats.totalEnrollments}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Active</Text><Text style={styles.rowValue}>{data.stats.activeEnrollments}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Completed</Text><Text style={styles.rowValue}>{data.stats.completedEnrollments}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Completion Rate</Text><Text style={styles.rowValue}>{data.stats.completionRate}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Average Progress</Text><Text style={styles.rowValue}>{data.stats.averageProgress}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Modules</Text><Text style={styles.rowValue}>{data.stats.publishedModules}/{data.stats.totalModules}</Text></View>
            <View style={styles.rowItem}><Text style={styles.rowLabel}>Lessons</Text><Text style={styles.rowValue}>{data.stats.publishedLessons}/{data.stats.totalLessons}</Text></View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Instructors</Text>
            {data.instructors.length === 0 ? (
              <Text style={styles.metaText}>No instructors assigned.</Text>
            ) : (
              data.instructors.map((instructor) => (
                <View key={instructor.id} style={styles.rowBlock}>
                  <Text style={styles.rowLabel}>{instructor.teacher.firstName} {instructor.teacher.lastName}</Text>
                  <Text style={styles.metaText}>{instructor.role}</Text>
                  <Text style={styles.metaText}>{instructor.teacher.email}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Modules</Text>
            {data.modules.length === 0 ? (
              <Text style={styles.metaText}>No modules created yet.</Text>
            ) : (
              data.modules.map((module) => (
                <View key={module.id} style={styles.moduleRow}>
                  <Text style={styles.rowLabel}>{module.order + 1}. {module.title}</Text>
                  <Text style={styles.metaText}>{module.isPublished ? "Published" : "Draft"} • {module.publishedLessons}/{module.lessonCount} lessons</Text>
                  {module.dripDelay !== null ? <Text style={styles.metaText}>Drip delay: {module.dripDelay} days</Text> : null}
                  {module.lessons.slice(0, 3).map((lesson) => (
                    <Text key={lesson.id} style={styles.lessonText}>- {lesson.title} ({lesson.contentType})</Text>
                  ))}
                  {module.lessons.length > 3 ? <Text style={styles.metaText}>+ {module.lessons.length - 3} more lessons</Text> : null}
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Enrollments</Text>
            {data.recentEnrollments.length === 0 ? (
              <Text style={styles.metaText}>No enrollments yet.</Text>
            ) : (
              data.recentEnrollments.map((enrollment) => (
                <View key={enrollment.id} style={styles.enrollmentRow}>
                  <Text style={styles.rowLabel}>
                    {enrollment.participant.firstName} {enrollment.participant.lastName} • {enrollment.participant.type}
                  </Text>
                  <Text style={styles.metaText}>{enrollment.status} • Progress {enrollment.progressPercent}%</Text>
                  <Text style={styles.metaText}>Enrolled {formatDateTime(enrollment.enrolledAt)}</Text>
                  {enrollment.paidAmount ? <Text style={styles.metaText}>Paid {formatCurrency(enrollment.paidAmount, currency)}</Text> : null}
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Course not found</Text>
          <Text style={styles.metaText}>This course is not available in your account scope.</Text>
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
  actionWrap: {
    marginTop: 6,
    gap: 6,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonText: {
    fontWeight: "700",
    fontSize: 13,
  },
  actionHint: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  heroImage: {
    width: "100%",
    height: 190,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: "#e2e8f0",
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
  rowItem: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowBlock: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  moduleRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  lessonText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
  },
  enrollmentRow: {
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderMuted,
    paddingTop: 8,
    gap: 2,
  },
  rowLabel: {
    color: mobileTheme.colors.text,
    fontWeight: "600",
  },
  rowValue: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
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
