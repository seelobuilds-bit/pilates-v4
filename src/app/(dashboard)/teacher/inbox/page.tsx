"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Send,
  RefreshCw,
  Loader2,
  Mail,
  MessageSquare,
  User,
  ChevronRight,
  Inbox
} from "lucide-react"

interface ClientConversation {
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  lastMessage: {
    channel: "EMAIL" | "SMS"
    body: string
    createdAt: string
    direction: "INBOUND" | "OUTBOUND"
  } | null
  unreadCount: number
  totalMessages: number
}

interface Message {
  id: string
  channel: "EMAIL" | "SMS"
  direction: "INBOUND" | "OUTBOUND"
  subject: string | null
  body: string
  fromName: string | null
  createdAt: string
}

export default function TeacherInboxPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ClientConversation[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientConversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Compose
  const [messageType, setMessageType] = useState<"email" | "sms">("email")
  const [emailSubject, setEmailSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/inbox')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
    }
    setLoading(false)
  }, [])

  const fetchMessages = async (clientId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/teacher/inbox?clientId=${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    }
    setLoadingMessages(false)
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectConversation = (conv: ClientConversation) => {
    setSelectedClient(conv)
    setMessageType(conv.clientPhone ? "email" : "email")
    fetchMessages(conv.clientId)
  }

  const sendMessage = async () => {
    if (!selectedClient || !messageBody.trim()) return
    if (messageType === "email" && !emailSubject.trim()) return

    setSending(true)
    try {
      const res = await fetch("/api/teacher/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: messageType,
          clientId: selectedClient.clientId,
          subject: emailSubject,
          message: messageBody
        })
      })

      if (res.ok) {
        setEmailSubject("")
        setMessageBody("")
        fetchMessages(selectedClient.clientId)
        fetchConversations()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Client Inbox</h1>
              <p className="text-sm text-gray-500">Email & SMS with your clients</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchConversations}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500 px-4">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm mt-1">
                Messages with your clients will appear here
              </p>
              <Link href="/teacher/clients">
                <Button variant="outline" className="mt-4">
                  View My Clients
                </Button>
              </Link>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.clientId}
                onClick={() => selectConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedClient?.clientId === conv.clientId ? 'bg-violet-50 border-l-4 border-l-violet-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-violet-700">
                      {conv.clientName.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate text-gray-900">
                        {conv.clientName}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.clientEmail}
                    </p>
                    {conv.lastMessage && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {conv.lastMessage.channel === "EMAIL" ? (
                            <><Mail className="h-3 w-3 mr-1" /> Email</>
                          ) : (
                            <><MessageSquare className="h-3 w-3 mr-1" /> SMS</>
                          )}
                        </Badge>
                        <p className="text-xs text-gray-400 truncate flex-1">
                          {conv.lastMessage.direction === "OUTBOUND" && "You: "}
                          {conv.lastMessage.body.substring(0, 50)}...
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {conv.totalMessages} message{conv.totalMessages !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedClient ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedClient.clientName}</p>
                    <p className="text-xs text-gray-500">{selectedClient.clientEmail}</p>
                  </div>
                </div>
                <Link href={`/teacher/clients/${selectedClient.clientId}`}>
                  <Button variant="outline" size="sm">
                    View Profile
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Message Type Toggle */}
            <div className="p-3 bg-white border-b flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Send via:</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={messageType === "email" ? "default" : "outline"}
                  onClick={() => setMessageType("email")}
                  className={messageType === "email" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button
                  size="sm"
                  variant={messageType === "sms" ? "default" : "outline"}
                  onClick={() => setMessageType("sms")}
                  disabled={!selectedClient.clientPhone}
                  className={messageType === "sms" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
              </div>
              {!selectedClient.clientPhone && (
                <span className="text-xs text-gray-400">(No phone number)</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation below</p>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.direction === "OUTBOUND"
                            ? msg.channel === "EMAIL"
                              ? "bg-emerald-600 text-white rounded-br-md"
                              : "bg-blue-600 text-white rounded-br-md"
                            : "bg-white shadow-sm rounded-bl-md"
                        }`}
                      >
                        {/* Channel Badge & Sender */}
                        <div className={`flex items-center gap-2 mb-1 text-xs ${
                          msg.direction === "OUTBOUND" ? "text-white/70" : "text-gray-500"
                        }`}>
                          <Badge variant="outline" className={`text-xs ${
                            msg.direction === "OUTBOUND" ? "border-white/30 text-white/80" : ""
                          }`}>
                            {msg.channel === "EMAIL" ? (
                              <><Mail className="h-3 w-3 mr-1" /> Email</>
                            ) : (
                              <><MessageSquare className="h-3 w-3 mr-1" /> SMS</>
                            )}
                          </Badge>
                          {msg.fromName && msg.direction === "OUTBOUND" && (
                            <span>by {msg.fromName}</span>
                          )}
                        </div>
                        
                        {/* Subject for emails */}
                        {msg.channel === "EMAIL" && msg.subject && (
                          <p className={`font-medium text-sm mb-1 ${
                            msg.direction === "OUTBOUND" ? "text-white" : "text-gray-900"
                          }`}>
                            {msg.subject}
                          </p>
                        )}
                        
                        {/* Body */}
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        
                        {/* Timestamp */}
                        <p className={`text-xs mt-2 ${
                          msg.direction === "OUTBOUND" ? "text-white/60" : "text-gray-400"
                        }`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Compose */}
            <div className="p-4 bg-white border-t space-y-3">
              {messageType === "email" && (
                <Input
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              )}
              <div className="flex items-end gap-3">
                <Textarea
                  placeholder={messageType === "email" ? "Write your email..." : "Write your SMS..."}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={3}
                  className="flex-1 resize-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !messageBody.trim() || (messageType === "email" && !emailSubject.trim())}
                  className={messageType === "email" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                💡 This conversation is shared - HQ and other teachers can see all messages
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Inbox className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a client from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
