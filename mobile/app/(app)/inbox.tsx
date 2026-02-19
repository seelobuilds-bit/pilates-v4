import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type { MobileConversationSummary, MobileInboxMessage } from "@/src/types/mobile"

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function ConversationCard({
  item,
  onOpen,
  primaryColor,
}: {
  item: MobileConversationSummary
  onOpen: (conversation: MobileConversationSummary) => void
  primaryColor: string
}) {
  return (
    <Pressable style={styles.card} onPress={() => onOpen(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.clientName}</Text>
        {item.unreadCount > 0 ? <Text style={[styles.badge, { backgroundColor: primaryColor }]}>{item.unreadCount}</Text> : null}
      </View>
      <Text style={styles.cardMeta}>{item.clientEmail}</Text>
      <Text style={styles.cardMeta}>Messages: {item.messageCount}</Text>
      {item.lastMessage ? (
        <>
          <Text style={styles.lastMessageTime}>{formatTimestamp(item.lastMessage.createdAt)}</Text>
          <Text style={styles.lastMessageBody} numberOfLines={2}>
            {item.lastMessage.body}
          </Text>
        </>
      ) : (
        <Text style={styles.emptyHint}>No messages yet</Text>
      )}
    </Pressable>
  )
}

function MessageCard({ item, primaryColor }: { item: MobileInboxMessage; primaryColor: string }) {
  const inbound = item.direction === "INBOUND"

  return (
    <View style={[styles.card, inbound ? styles.inboundCard : [styles.outboundCard, { borderLeftColor: primaryColor }]]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{inbound ? "Inbound" : "Outbound"}</Text>
        <Text style={[styles.messageChannel, { color: primaryColor }]}>{item.channel}</Text>
      </View>
      <Text style={styles.lastMessageTime}>{formatTimestamp(item.createdAt)}</Text>
      <Text style={styles.lastMessageBody}>{item.body}</Text>
    </View>
  )
}

export default function InboxScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ clientId?: string | string[] }>()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [conversations, setConversations] = useState<MobileConversationSummary[]>([])
  const [messages, setMessages] = useState<MobileInboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeConversation, setActiveConversation] = useState<MobileConversationSummary | null>(null)
  const [threadMessages, setThreadMessages] = useState<MobileInboxMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)

  const [channel, setChannel] = useState<"EMAIL" | "SMS">("EMAIL")
  const [subject, setSubject] = useState("")
  const [composerText, setComposerText] = useState("")
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState("")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [clientChannelFilter, setClientChannelFilter] = useState<"ALL" | "EMAIL" | "SMS">("ALL")
  const handledRouteClientIdRef = useRef<string | null>(null)

  const isClient = useMemo(() => user?.role === "CLIENT", [user?.role])
  const searchNormalized = search.trim().toLowerCase()
  const routeClientId = useMemo(() => {
    const raw = params.clientId
    if (Array.isArray(raw)) return raw[0] || null
    return raw || null
  }, [params.clientId])

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      if (unreadOnly && conversation.unreadCount === 0) {
        return false
      }

      if (!searchNormalized) {
        return true
      }

      const haystack = `${conversation.clientName} ${conversation.clientEmail} ${conversation.lastMessage?.body || ""}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [conversations, searchNormalized, unreadOnly])

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (clientChannelFilter !== "ALL" && message.channel !== clientChannelFilter) {
        return false
      }

      if (!searchNormalized) {
        return true
      }

      const haystack = `${message.body} ${message.subject || ""}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })
  }, [clientChannelFilter, messages, searchNormalized])

  const loadInbox = useCallback(
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
        const response = await mobileApi.inbox(token)
        setConversations(response.conversations || [])
        setMessages(
          (response.messages || []).slice().sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load inbox"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token]
  )

  const loadThread = useCallback(
    async (clientId: string) => {
      if (!token) return

      setThreadLoading(true)
      setThreadError(null)
      try {
        const response = await mobileApi.inboxThread(token, clientId)
        setThreadMessages(response.messages)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load conversation"
        setThreadError(message)
      } finally {
        setThreadLoading(false)
      }
    },
    [token]
  )

  const openConversation = useCallback(
    (conversation: MobileConversationSummary) => {
      setActiveConversation(conversation)
      setComposerText("")
      setThreadMessages([])
      void loadThread(conversation.clientId)
    },
    [loadThread]
  )

  const sendMessage = useCallback(async () => {
    if (!token) return
    if (!isClient && !activeConversation) return
    if (!composerText.trim()) return

    setSending(true)
    if (isClient) {
      setError(null)
    } else {
      setThreadError(null)
    }

    try {
      await mobileApi.sendInboxMessage(token, {
        clientId: activeConversation?.clientId,
        channel,
        subject,
        message: composerText.trim(),
      })

      setComposerText("")
      if (channel === "EMAIL") {
        setSubject("")
      }

      if (isClient) {
        await loadInbox(true)
      } else if (activeConversation) {
        await Promise.all([loadThread(activeConversation.clientId), loadInbox(true)])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message"
      if (isClient) {
        setError(message)
      } else {
        setThreadError(message)
      }
    } finally {
      setSending(false)
    }
  }, [activeConversation, channel, composerText, isClient, loadInbox, loadThread, subject, token])

  useEffect(() => {
    void loadInbox()
  }, [loadInbox])

  useEffect(() => {
    if (isClient || !routeClientId || conversations.length === 0) {
      return
    }

    if (handledRouteClientIdRef.current === routeClientId) {
      return
    }

    const matched = conversations.find((conversation) => conversation.clientId === routeClientId)
    if (!matched) {
      return
    }

    handledRouteClientIdRef.current = routeClientId
    openConversation(matched)
    router.replace("/(app)/inbox")
  }, [conversations, isClient, openConversation, routeClientId, router])

  if (!isClient && activeConversation) {
    return (
      <View style={styles.container}>
        <View style={styles.threadHeader}>
          <Pressable style={styles.backButton} onPress={() => setActiveConversation(null)}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{activeConversation.clientName}</Text>
            <Text style={styles.subtitle}>{activeConversation.clientEmail}</Text>
          </View>
        </View>

        {threadError ? <Text style={styles.error}>{threadError}</Text> : null}

        {threadLoading && threadMessages.length === 0 ? (
          <View style={styles.threadLoadingWrap}>
            <ActivityIndicator size="small" />
            <Text style={styles.loading}>Loading conversation...</Text>
          </View>
        ) : null}

        <FlatList
          data={threadMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageCard item={item} primaryColor={primaryColor} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={threadLoading} onRefresh={() => void loadThread(activeConversation.clientId)} />}
        />

        <View style={styles.composerWrap}>
          <View style={styles.channelRow}>
            <Pressable
              style={[
                styles.channelButton,
                channel === "EMAIL" && [styles.channelButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
              ]}
              onPress={() => setChannel("EMAIL")}
            >
              <Text style={[styles.channelButtonText, channel === "EMAIL" && [styles.channelButtonTextActive, { color: primaryColor }]]}>Email</Text>
            </Pressable>
            <Pressable
              style={[
                styles.channelButton,
                channel === "SMS" && [styles.channelButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
              ]}
              onPress={() => setChannel("SMS")}
            >
              <Text style={[styles.channelButtonText, channel === "SMS" && [styles.channelButtonTextActive, { color: primaryColor }]]}>SMS</Text>
            </Pressable>
          </View>

          {channel === "EMAIL" ? (
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Subject (optional)"
              style={styles.subjectInput}
            />
          ) : null}

          <TextInput
            value={composerText}
            onChangeText={setComposerText}
            placeholder="Write a message..."
            style={styles.messageInput}
            multiline
          />

          <Pressable
            style={[styles.sendButton, { backgroundColor: primaryColor }, (sending || !composerText.trim()) && styles.sendButtonDisabled]}
            onPress={() => void sendMessage()}
            disabled={sending || !composerText.trim()}
          >
            <Text style={styles.sendButtonText}>{sending ? "Sending..." : "Send"}</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const hasData = isClient ? filteredMessages.length > 0 : filteredConversations.length > 0

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      <Text style={styles.subtitle}>{isClient ? "Message the studio" : "Conversations"}</Text>

      <View style={styles.filtersWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={isClient ? "Search messages..." : "Search clients/messages..."}
          style={styles.searchInput}
        />
        {isClient ? (
          <View style={styles.channelRow}>
            <Pressable
              style={[
                styles.channelButton,
                clientChannelFilter === "ALL" && [styles.channelButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
              ]}
              onPress={() => setClientChannelFilter("ALL")}
            >
              <Text style={[styles.channelButtonText, clientChannelFilter === "ALL" && [styles.channelButtonTextActive, { color: primaryColor }]]}>All</Text>
            </Pressable>
            <Pressable
              style={[
                styles.channelButton,
                clientChannelFilter === "EMAIL" && [styles.channelButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
              ]}
              onPress={() => setClientChannelFilter("EMAIL")}
            >
              <Text
                style={[styles.channelButtonText, clientChannelFilter === "EMAIL" && [styles.channelButtonTextActive, { color: primaryColor }]]}
              >
                Email
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.channelButton,
                clientChannelFilter === "SMS" && [styles.channelButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
              ]}
              onPress={() => setClientChannelFilter("SMS")}
            >
              <Text style={[styles.channelButtonText, clientChannelFilter === "SMS" && [styles.channelButtonTextActive, { color: primaryColor }]]}>SMS</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.unreadToggle, unreadOnly && [styles.unreadToggleActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }]]}
            onPress={() => setUnreadOnly((prev) => !prev)}
          >
            <Text style={[styles.unreadToggleText, unreadOnly && [styles.unreadToggleTextActive, { color: primaryColor }]]}>
              {unreadOnly ? "Unread only: ON" : "Unread only: OFF"}
            </Text>
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !hasData ? <Text style={styles.loading}>Loading inbox...</Text> : null}

      {!loading && !hasData && !error ? (
        <Text style={styles.empty}>{searchNormalized ? "No results for current filters." : "No inbox activity yet."}</Text>
      ) : null}

      {isClient ? (
        <>
          <FlatList
            data={filteredMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageCard item={item} primaryColor={primaryColor} />}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadInbox(true)} />}
          />

          <View style={styles.composerWrap}>
            <View style={styles.channelRow}>
              <Pressable
                style={[
                  styles.channelButton,
                  channel === "EMAIL" && [styles.channelButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
                ]}
                onPress={() => setChannel("EMAIL")}
              >
                <Text style={[styles.channelButtonText, channel === "EMAIL" && [styles.channelButtonTextActive, { color: primaryColor }]]}>Email</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.channelButton,
                  channel === "SMS" && [styles.channelButtonActive, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.14) }],
                ]}
                onPress={() => setChannel("SMS")}
              >
                <Text style={[styles.channelButtonText, channel === "SMS" && [styles.channelButtonTextActive, { color: primaryColor }]]}>SMS</Text>
              </Pressable>
            </View>

            {channel === "EMAIL" ? (
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject (optional)"
                style={styles.subjectInput}
              />
            ) : null}

            <TextInput
              value={composerText}
              onChangeText={setComposerText}
              placeholder="Write a message..."
              style={styles.messageInput}
              multiline
            />

            <Pressable
              style={[styles.sendButton, { backgroundColor: primaryColor }, (sending || !composerText.trim()) && styles.sendButtonDisabled]}
              onPress={() => void sendMessage()}
              disabled={sending || !composerText.trim()}
            >
              <Text style={styles.sendButtonText}>{sending ? "Sending..." : "Send"}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.clientId}
          renderItem={({ item }) => <ConversationCard item={item} onOpen={openConversation} primaryColor={primaryColor} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadInbox(true)} />}
        />
      )}
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
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: mobileTheme.colors.surface,
  },
  backButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
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
  filtersWrap: {
    gap: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.surface,
  },
  unreadToggle: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: mobileTheme.colors.surface,
  },
  unreadToggleActive: {
    borderWidth: 1,
  },
  unreadToggleText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  unreadToggleTextActive: {
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 12,
    gap: 4,
  },
  inboundCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },
  outboundCard: {
    borderLeftWidth: 4,
    borderLeftColor: mobileTheme.colors.text,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  cardMeta: {
    color: mobileTheme.colors.textFaint,
  },
  lastMessageTime: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  lastMessageBody: {
    color: mobileTheme.colors.text,
  },
  badge: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 11,
    backgroundColor: mobileTheme.colors.text,
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    overflow: "hidden",
  },
  messageChannel: {
    color: mobileTheme.colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  loading: {
    color: mobileTheme.colors.textFaint,
  },
  threadLoadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  empty: {
    color: mobileTheme.colors.textSubtle,
  },
  emptyHint: {
    color: mobileTheme.colors.textSubtle,
  },
  error: {
    color: mobileTheme.colors.danger,
  },
  composerWrap: {
    borderTopWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingTop: 10,
    gap: 8,
  },
  channelRow: {
    flexDirection: "row",
    gap: 8,
  },
  channelButton: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: mobileTheme.colors.surface,
  },
  channelButtonActive: {
    borderWidth: 1,
  },
  channelButtonText: {
    color: mobileTheme.colors.textMuted,
    fontWeight: "600",
  },
  channelButtonTextActive: {
    fontWeight: "700",
  },
  subjectInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.surface,
    color: mobileTheme.colors.text,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.surface,
    minHeight: 80,
    textAlignVertical: "top",
    color: mobileTheme.colors.text,
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.text,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "700",
  },
})
