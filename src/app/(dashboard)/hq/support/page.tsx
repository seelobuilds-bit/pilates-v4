"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  CheckCheck,
  Check,
  Clock,
  User,
  Building,
  Filter,
  Inbox,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  Headphones
} from "lucide-react"

interface Message {
  id: string
  content: string
  senderType: string
  senderName: string
  senderId: string
  createdAt: string
  isRead: boolean
  isSystemMessage: boolean
}

interface Conversation {
  id: string
  subject: string
  status: string
  priority: string
  userId: string | null
  teacherId: string | null
  studioId: string | null
  category: string | null
  lastMessageAt: string
  unreadByHQ: boolean
  createdAt: string
  messages: Message[]
  user?: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function HQSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/support/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(fetchConversations, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [fetchConversations])

  // Poll selected conversation more frequently
  useEffect(() => {
    if (!selectedConversation) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/conversations/${selectedConversation.id}`)
        if (res.ok) {
          const data = await res.json()
          setSelectedConversation(data.conversation)
        }
      } catch (error) {
        console.error("Failed to refresh conversation:", error)
      }
    }, 3000) // Every 3 seconds

    return () => clearInterval(interval)
  }, [selectedConversation?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [selectedConversation?.messages])

  const openConversation = async (conversation: Conversation) => {
    try {
      const res = await fetch(`/api/support/conversations/${conversation.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedConversation(data.conversation)
        fetchConversations() // Refresh list to update unread counts
      }
    } catch (error) {
      console.error("Failed to open conversation:", error)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !selectedConversation) return

    try {
      setSending(true)
      const res = await fetch(`/api/support/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedConversation(prev => {
          if (!prev) return prev
          return {
            ...prev,
            messages: [...prev.messages, data.message]
          }
        })
        setMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!selectedConversation) return

    try {
      const res = await fetch(`/api/support/conversations/${selectedConversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedConversation(data.conversation)
        fetchConversations()
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-100 text-blue-700 border-blue-200"
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "WAITING_CUSTOMER": return "bg-orange-100 text-orange-700 border-orange-200"
      case "RESOLVED": return "bg-green-100 text-green-700 border-green-200"
      case "CLOSED": return "bg-gray-100 text-gray-700 border-gray-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-700"
      case "HIGH": return "bg-orange-100 text-orange-700"
      case "MEDIUM": return "bg-yellow-100 text-yellow-700"
      case "LOW": return "bg-gray-100 text-gray-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (statusFilter !== "all" && conv.status !== statusFilter) return false
    if (priorityFilter !== "all" && conv.priority !== priorityFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSubject = conv.subject.toLowerCase().includes(query)
      const matchesMessages = conv.messages.some(m => m.content.toLowerCase().includes(query))
      if (!matchesSubject && !matchesMessages) return false
    }
    return true
  })

  // Stats
  const stats = {
    total: conversations.length,
    open: conversations.filter(c => c.status === "OPEN").length,
    inProgress: conversations.filter(c => c.status === "IN_PROGRESS").length,
    unread: conversations.filter(c => c.unreadByHQ).length
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Headphones className="h-7 w-7 text-violet-600" />
            Support Inbox
          </h1>
          <p className="text-gray-500 mt-1">Manage support conversations from studios and teachers</p>
        </div>
        <Button onClick={fetchConversations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-320px)]">
        {/* Conversation List */}
        <Card className="col-span-4 border-0 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_CUSTOMER">Waiting</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Inbox className="h-8 w-8 mb-2 text-gray-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-violet-50" : ""
                    } ${conv.unreadByHQ ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        conv.teacherId ? "bg-green-100" : "bg-violet-100"
                      }`}>
                        {conv.teacherId ? (
                          <User className="h-5 w-5 text-green-600" />
                        ) : (
                          <Building className="h-5 w-5 text-violet-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {conv.unreadByHQ && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm line-clamp-1 flex-1">
                            {conv.subject}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {conv.messages[conv.messages.length - 1]?.content || "No messages"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-xs ${getStatusColor(conv.status)}`}>
                            {conv.status.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-gray-400">{formatTime(conv.lastMessageAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Conversation Detail */}
        <Card className="col-span-8 border-0 shadow-sm overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <CardHeader className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={getStatusColor(selectedConversation.status)}>
                        {selectedConversation.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(selectedConversation.priority)}>
                        {selectedConversation.priority}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Started {formatFullDate(selectedConversation.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Select 
                    value={selectedConversation.status} 
                    onValueChange={updateStatus}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-500" /> Open
                        </span>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" /> In Progress
                        </span>
                      </SelectItem>
                      <SelectItem value="WAITING_CUSTOMER">
                        <span className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-orange-500" /> Waiting
                        </span>
                      </SelectItem>
                      <SelectItem value="RESOLVED">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" /> Resolved
                        </span>
                      </SelectItem>
                      <SelectItem value="CLOSED">
                        <span className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-gray-500" /> Closed
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {selectedConversation.messages.map((msg) => {
                  const isHQ = msg.senderType === "hq"
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isHQ ? "justify-end" : "justify-start"}`}
                    >
                      {msg.isSystemMessage ? (
                        <div className="w-full text-center">
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      ) : (
                        <div className={`max-w-[70%] ${isHQ ? "order-2" : ""}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isHQ ? "justify-end" : ""}`}>
                            <span className="text-xs font-medium text-gray-600">{msg.senderName}</span>
                            <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isHQ
                                ? "bg-violet-600 text-white rounded-br-md"
                                : "bg-white text-gray-800 rounded-bl-md shadow-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {isHQ && (
                            <div className="flex justify-end mt-1">
                              {msg.isRead ? (
                                <CheckCheck className="h-3 w-3 text-violet-400" />
                              ) : (
                                <Check className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedConversation.status !== "CLOSED" && (
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-3">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Type your reply..."
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !message.trim()}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus("WAITING_CUSTOMER")}
                      className="text-xs"
                    >
                      Mark Waiting for Customer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus("RESOLVED")}
                      className="text-xs text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              )}

              {selectedConversation.status === "CLOSED" && (
                <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-500">
                  This conversation has been closed
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="h-16 w-16 mb-4 text-gray-200" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a conversation from the list to view messages</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}














