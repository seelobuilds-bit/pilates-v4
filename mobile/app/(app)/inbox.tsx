import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
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

function ConversationCard({ item }: { item: MobileConversationSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.clientName}</Text>
        {item.unreadCount > 0 ? <Text style={styles.badge}>{item.unreadCount}</Text> : null}
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
    </View>
  )
}

function MessageCard({ item }: { item: MobileInboxMessage }) {
  const inbound = item.direction === "INBOUND"

  return (
    <View style={[styles.card, inbound ? styles.inboundCard : styles.outboundCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{inbound ? "From studio" : "Sent"}</Text>
        <Text style={styles.messageChannel}>{item.channel}</Text>
      </View>
      <Text style={styles.lastMessageTime}>{formatTimestamp(item.createdAt)}</Text>
      <Text style={styles.lastMessageBody}>{item.body}</Text>
    </View>
  )
}

export default function InboxScreen() {
  const { token, user } = useAuth()
  const [conversations, setConversations] = useState<MobileConversationSummary[]>([])
  const [messages, setMessages] = useState<MobileInboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isClient = useMemo(() => user?.role === "CLIENT", [user?.role])

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
        setMessages(response.messages || [])
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

  useEffect(() => {
    void loadInbox()
  }, [loadInbox])

  const hasData = isClient ? messages.length > 0 : conversations.length > 0

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      <Text style={styles.subtitle}>{isClient ? "Message history" : "Conversations"}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !hasData ? <Text style={styles.loading}>Loading inbox...</Text> : null}

      {!loading && !hasData && !error ? <Text style={styles.empty}>No inbox activity yet.</Text> : null}

      {isClient ? (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadInbox(true)} />}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.clientId}
          renderItem={({ item }) => <ConversationCard item={item} />}
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
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    color: "#334155",
    marginBottom: 4,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 4,
  },
  inboundCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },
  outboundCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#1d4ed8",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardMeta: {
    color: "#475569",
  },
  lastMessageTime: {
    color: "#64748b",
    fontSize: 12,
  },
  lastMessageBody: {
    color: "#1e293b",
  },
  badge: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 11,
    backgroundColor: "#1d4ed8",
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    overflow: "hidden",
  },
  messageChannel: {
    color: "#1d4ed8",
    fontWeight: "600",
    fontSize: 12,
  },
  loading: {
    color: "#475569",
  },
  empty: {
    color: "#64748b",
  },
  emptyHint: {
    color: "#64748b",
  },
  error: {
    color: "#dc2626",
  },
})
