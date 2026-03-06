import { db } from "@/lib/db"

type InboxConversationFilters = {
  studioId: string
  clientIds?: string[]
}

export type InboxConversationSummary = {
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  messageCount: number
  unreadCount: number
  lastMessage: {
    id: string
    direction: "INBOUND" | "OUTBOUND"
    channel: "CHAT" | "EMAIL" | "SMS"
    body: string
    createdAt: string
  } | null
}

function buildClientWhere(clientIds?: string[]) {
  if (!clientIds?.length) {
    return {
      not: null,
    }
  }

  return {
    in: clientIds,
  }
}

export async function loadInboxConversationSummaries(
  filters: InboxConversationFilters
): Promise<InboxConversationSummary[]> {
  const clientWhere = buildClientWhere(filters.clientIds)

  const [messageCounts, unreadCounts, latestMessages] = await Promise.all([
    db.message.groupBy({
      by: ["clientId"],
      where: {
        studioId: filters.studioId,
        clientId: clientWhere,
      },
      _count: {
        _all: true,
      },
    }),
    db.message.groupBy({
      by: ["clientId"],
      where: {
        studioId: filters.studioId,
        clientId: clientWhere,
        direction: "INBOUND",
        openedAt: null,
      },
      _count: {
        _all: true,
      },
    }),
    db.message.findMany({
      where: {
        studioId: filters.studioId,
        clientId: clientWhere,
      },
      orderBy: [{ clientId: "asc" }, { createdAt: "desc" }],
      distinct: ["clientId"],
      select: {
        id: true,
        clientId: true,
        direction: true,
        channel: true,
        body: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
  ])

  const unreadCountByClientId = new Map(
    unreadCounts
      .filter((row): row is typeof row & { clientId: string } => Boolean(row.clientId))
      .map((row) => [row.clientId, row._count._all])
  )
  const latestMessageByClientId = new Map(
    latestMessages
      .filter((row): row is typeof row & { clientId: string; client: NonNullable<typeof row.client> } => Boolean(row.clientId && row.client))
      .map((row) => [row.clientId, row])
  )

  const conversations = messageCounts
    .filter((row): row is typeof row & { clientId: string } => Boolean(row.clientId))
    .map((row) => {
      const latestMessage = latestMessageByClientId.get(row.clientId)
      if (!latestMessage?.client) {
        return null
      }

      return {
        clientId: row.clientId,
        clientName: `${latestMessage.client.firstName} ${latestMessage.client.lastName}`.trim(),
        clientEmail: latestMessage.client.email,
        clientPhone: latestMessage.client.phone,
        messageCount: row._count._all,
        unreadCount: unreadCountByClientId.get(row.clientId) ?? 0,
        lastMessage: {
          id: latestMessage.id,
          direction: latestMessage.direction,
          channel: latestMessage.channel,
          body: latestMessage.body,
          createdAt: latestMessage.createdAt.toISOString(),
        },
      } satisfies InboxConversationSummary
    })
    .filter((conversation) => conversation !== null)

  conversations.sort((a, b) => {
    return a.clientName.localeCompare(b.clientName)
  })

  conversations.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    }
    if (a.lastMessage) return -1
    if (b.lastMessage) return 1
    return 0
  })

  return conversations
}
