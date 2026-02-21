import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import { toWorkspaceUrl } from "@/src/lib/workspace-links"
import type { MobileCommunityMessage, MobileCommunityPlanSummary, MobileCommunityResponse } from "@/src/types/mobile"

function audienceLabel(audience: MobileCommunityPlanSummary["audience"]) {
  if (audience === "STUDIO_OWNERS") return "Owners"
  if (audience === "TEACHERS") return "Teachers"
  if (audience === "CLIENTS") return "Clients"
  return "All"
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date)
}

function MessageBubble({ message }: { message: MobileCommunityMessage }) {
  return (
    <View style={[styles.bubbleWrap, message.isMine ? styles.bubbleMineWrap : styles.bubbleOtherWrap]}>
      <View style={[styles.bubble, message.isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {!message.isMine ? <Text style={styles.senderName}>{message.senderName}</Text> : null}
        <Text style={[styles.bubbleText, message.isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>{message.content}</Text>
        <Text style={[styles.bubbleMeta, message.isMine ? styles.bubbleMetaMine : styles.bubbleMetaOther]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  )
}

export default function CommunityScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileCommunityResponse | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [composerText, setComposerText] = useState("")
  const [search, setSearch] = useState("")
  const [messageFilter, setMessageFilter] = useState<"ALL" | "MINE" | "TEAM">("ALL")
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER" || user?.role === "TEACHER"

  const loadCommunity = useCallback(
    async (isRefresh = false, planIdOverride?: string | null) => {
      if (!token || !isAllowedRole) {
        setData(null)
        return
      }

      const planId = planIdOverride ?? selectedPlanId

      if (isRefresh) setRefreshing(true)

      setError(null)
      try {
        const response = await mobileApi.community(token, {
          planId: planId || undefined,
        })
        setData(response)
        setSelectedPlanId(response.activePlanId)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load community"
        setError(message)
      } finally {
        setRefreshing(false)
      }
    },
    [isAllowedRole, selectedPlanId, token]
  )

  useEffect(() => {
    void loadCommunity()
  }, [loadCommunity])

  const activePlan = useMemo(
    () => data?.plans.find((plan) => plan.id === (selectedPlanId || data.activePlanId)) || null,
    [data, selectedPlanId]
  )

  const searchNormalized = search.trim().toLowerCase()
  const messageCounts = useMemo(() => {
    const messages = data?.messages || []
    const mine = messages.filter((message) => message.isMine).length
    return {
      ALL: messages.length,
      MINE: mine,
      TEAM: messages.length - mine,
    } as const
  }, [data?.messages])

  const filteredMessages = useMemo(() => {
    const messages = data?.messages || []
    return messages.filter((message) => {
      if (messageFilter === "MINE" && !message.isMine) return false
      if (messageFilter === "TEAM" && message.isMine) return false
      if (!searchNormalized) return true
      const haystack = `${message.content} ${message.senderName}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [data?.messages, messageFilter, searchNormalized])

  const sendMessage = useCallback(async () => {
    if (!token || !selectedPlanId) {
      return
    }

    const content = composerText.trim()
    if (!content || sending) {
      return
    }

    setSending(true)
    setError(null)
    try {
      const response = await mobileApi.sendCommunityMessage(token, {
        planId: selectedPlanId,
        content,
      })
      setComposerText("")
      setData((current) => {
        if (!current) return current
        return {
          ...current,
          messages: [...current.messages, response.message],
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message"
      setError(message)
    } finally {
      setSending(false)
    }
  }, [composerText, selectedPlanId, sending, token])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Community is available for studio owner and teacher accounts only."
    if (!data?.plans.length) return "No active community plans with chat enabled yet."
    return "No messages yet. Send the first one to start the conversation."
  }, [data?.plans.length, isAllowedRole])

  const emptyFilteredText = useMemo(() => {
    if (!data?.messages?.length) return emptyText
    if (searchNormalized) return "No messages matched your search."
    if (messageFilter === "MINE") return "You have no messages in this plan yet."
    if (messageFilter === "TEAM") return "No teammate messages in this plan yet."
    return emptyText
  }, [data?.messages?.length, emptyText, messageFilter, searchNormalized])

  const webCommunityHref = user?.role === "TEACHER" ? "/teacher/community" : "/studio/community"

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Subscription-tier communities and team discussion</Text>
        {activePlan ? (
          <View style={styles.statsRow}>
            <Text style={styles.statPill}>{activePlan.name}</Text>
            <Text style={styles.statPill}>{audienceLabel(activePlan.audience)}</Text>
            <Text style={styles.statPill}>{activePlan.memberCount} members</Text>
          </View>
        ) : null}
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
        <>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search messages..."
            style={styles.searchInput}
          />

          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, messageFilter === "ALL" && [styles.filterChipActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
              onPress={() => setMessageFilter("ALL")}
            >
              <Text style={[styles.filterChipText, messageFilter === "ALL" && [styles.filterChipTextActive, { color: primaryColor }]]}>
                {`All (${messageCounts.ALL})`}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, messageFilter === "MINE" && [styles.filterChipActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
              onPress={() => setMessageFilter("MINE")}
            >
              <Text style={[styles.filterChipText, messageFilter === "MINE" && [styles.filterChipTextActive, { color: primaryColor }]]}>
                {`Mine (${messageCounts.MINE})`}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, messageFilter === "TEAM" && [styles.filterChipActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
              onPress={() => setMessageFilter("TEAM")}
            >
              <Text style={[styles.filterChipText, messageFilter === "TEAM" && [styles.filterChipTextActive, { color: primaryColor }]]}>
                {`Team (${messageCounts.TEAM})`}
              </Text>
            </Pressable>
          </View>

          <View style={styles.planRow}>
            {data?.plans.map((plan) => {
              const active = plan.id === (selectedPlanId || data.activePlanId)
              return (
                <Pressable
                  key={plan.id}
                  style={[styles.planChip, active && [styles.planChipActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
                  onPress={() => {
                    setSelectedPlanId(plan.id)
                    void loadCommunity(false, plan.id)
                  }}
                >
                  <Text style={[styles.planChipText, active && [styles.planChipTextActive, { color: primaryColor }]]}>{plan.name}</Text>
                </Pressable>
              )
            })}
          </View>

          <FlatList
            data={filteredMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messagesContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadCommunity(true)} />}
            ListEmptyComponent={<View style={styles.emptyWrap}><Text style={styles.emptyText}>{emptyFilteredText}</Text></View>}
            ListFooterComponent={
              <View style={styles.footerSection}>
                <Text style={styles.metaText}>Need moderation tools? Use the full web community view.</Text>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: primaryColor }]}
                  onPress={() => {
                    void Linking.openURL(toWorkspaceUrl(webCommunityHref))
                  }}
                >
                  <Text style={styles.actionButtonText}>Open Web Community</Text>
                </Pressable>
              </View>
            }
          />

          <View style={styles.composerWrap}>
            <TextInput
              value={composerText}
              onChangeText={setComposerText}
              placeholder={activePlan ? `Message ${activePlan.name}...` : "Select a community plan"}
              style={styles.composerInput}
              multiline
              editable={!!activePlan && !sending}
            />
            <Pressable
              style={[styles.sendButton, { backgroundColor: primaryColor }, (!activePlan || !composerText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={() => {
                void sendMessage()
              }}
              disabled={!activePlan || !composerText.trim() || sending}
            >
              <Text style={styles.sendButtonText}>{sending ? "Sending" : "Send"}</Text>
            </Pressable>
          </View>
        </>
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
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterChipText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  filterChipTextActive: {
    fontWeight: "700",
  },
  planRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  planChip: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  planChipActive: {
    borderWidth: 1,
  },
  planChipText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  planChipTextActive: {
    fontWeight: "700",
  },
  messagesContent: {
    gap: 8,
    paddingBottom: 18,
  },
  bubbleWrap: {
    width: "100%",
  },
  bubbleMineWrap: {
    alignItems: "flex-end",
  },
  bubbleOtherWrap: {
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
    maxWidth: "88%",
  },
  bubbleMine: {
    backgroundColor: "#0f766e",
  },
  bubbleOther: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  senderName: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 11,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: "#f8fafc",
  },
  bubbleTextOther: {
    color: mobileTheme.colors.text,
  },
  bubbleMeta: {
    fontSize: 11,
  },
  bubbleMetaMine: {
    color: "#ccfbf1",
  },
  bubbleMetaOther: {
    color: mobileTheme.colors.textSubtle,
  },
  composerWrap: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 10,
    gap: 8,
  },
  composerInput: {
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    color: mobileTheme.colors.text,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: "top",
  },
  sendButton: {
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "700",
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
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
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
