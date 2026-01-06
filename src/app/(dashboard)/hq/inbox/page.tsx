"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search,
  Mail,
  Send,
  Building2,
  User,
  RefreshCw,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Clock
} from "lucide-react"

interface Message {
  id: string
  direction: "INBOUND" | "OUTBOUND"
  subject: string | null
  body: string
  fromName: string | null
  createdAt: string
}

interface Conversation {
  studioId: string
  studioName: string
  ownerName: string
  ownerEmail: string
  lastMessage: {
    direction: string
    subject: string | null
    body: string
    createdAt: string
  } | null
  totalMessages: number
  unreadCount: number
}

interface StudioDetails {
  id: string
  name: string
  ownerName: string
  ownerEmail: string
}

export default function HQInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedStudio, setSelectedStudio] = useState<StudioDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Compose state
  const [newSubject, setNewSubject] = useState("")
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/hq/inbox")
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectStudio = async (studioId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/hq/inbox?studioId=${studioId}`)
      const data = await res.json()
      if (data.studio) {
        setSelectedStudio(data.studio)
        setMessages(data.messages || [])
        // Pre-fill subject if replying
        if (data.messages?.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1]
          if (lastMsg.subject && !lastMsg.subject.startsWith("Re:")) {
            setNewSubject(`Re: ${lastMsg.subject}`)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedStudio || !newSubject.trim() || !newMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch("/api/hq/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: selectedStudio.id,
          subject: newSubject,
          message: newMessage
        })
      })

      if (res.ok) {
        // Refresh messages
        await selectStudio(selectedStudio.id)
        setNewMessage("")
        // Keep subject for follow-up
        if (!newSubject.startsWith("Re:")) {
          setNewSubject(`Re: ${newSubject}`)
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.studioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - Conversations List */}
      <div className="w-96 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Studio Communications</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search studios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No studios found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.studioId}
                onClick={() => selectStudio(conv.studioId)}
                className={`w-full p-4 border-b text-left hover:bg-gray-50 transition-colors ${
                  selectedStudio?.id === conv.studioId ? "bg-violet-50 border-l-4 border-l-violet-600" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{conv.studioName}</p>
                      <p className="text-sm text-gray-500 truncate">{conv.ownerName}</p>
                    </div>
                  </div>
                  {conv.lastMessage && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 pl-13">
                    {conv.lastMessage.direction === "INBOUND" ? "↩️ " : "→ "}
                    {conv.lastMessage.body}
                  </p>
                )}
                {conv.unreadCount > 0 && (
                  <Badge className="mt-2 bg-violet-100 text-violet-700">
                    {conv.unreadCount} new
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main - Messages Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedStudio ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a studio</p>
              <p className="text-sm">Choose a studio from the list to view or send messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedStudio(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedStudio.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedStudio.ownerName} • {selectedStudio.ownerEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Send the first message to this studio</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-lg rounded-lg p-4 ${
                        msg.direction === "OUTBOUND"
                          ? "bg-violet-600 text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      {msg.subject && (
                        <p className={`text-sm font-medium mb-1 ${
                          msg.direction === "OUTBOUND" ? "text-violet-100" : "text-gray-500"
                        }`}>
                          {msg.subject}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className={`text-xs mt-2 ${
                        msg.direction === "OUTBOUND" ? "text-violet-200" : "text-gray-400"
                      }`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Compose */}
            <div className="bg-white border-t p-4">
              <div className="space-y-3">
                <Input
                  placeholder="Subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newSubject.trim() || !newMessage.trim()}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
