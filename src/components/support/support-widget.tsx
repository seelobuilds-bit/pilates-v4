"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  X,
  Send,
  Plus,
  ArrowLeft,
  Loader2,
  Check,
  CheckCheck,
  Headphones,
  Sparkles,
  Clock
} from "lucide-react"

interface Conversation {
  id: string
  subject: string
  status: string
  lastMessageAt: string
  unreadByUser: boolean
  messages: Message[]
}

interface Message {
  id: string
  content: string
  senderType: string
  senderName: string
  createdAt: string
  isRead: boolean
  isSystemMessage: boolean
}

export function SupportWidget() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<"list" | "chat" | "new">("list")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
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

  // Fetch conversations when widget opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations()
    }
  }, [isOpen, fetchConversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [selectedConversation?.messages])

  // Poll for new messages when in chat view
  useEffect(() => {
    if (!isOpen || view !== "chat" || !selectedConversation) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/conversations/${selectedConversation.id}`)
        if (res.ok) {
          const data = await res.json()
          setSelectedConversation(data.conversation)
        }
      } catch (error) {
        console.error("Failed to poll messages:", error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [isOpen, view, selectedConversation?.id])

  const openConversation = async (conversation: Conversation) => {
    try {
      const res = await fetch(`/api/support/conversations/${conversation.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedConversation(data.conversation)
        setView("chat")
      }
    } catch (error) {
      console.error("Failed to open conversation:", error)
    }
  }

  const createConversation = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return

    try {
      setSending(true)
      const res = await fetch("/api/support/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject,
          message: newMessage
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedConversation(data.conversation)
        setView("chat")
        setNewSubject("")
        setNewMessage("")
        fetchConversations()
      }
    } catch (error) {
      console.error("Failed to create conversation:", error)
    } finally {
      setSending(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-100 text-blue-700"
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-700"
      case "WAITING_CUSTOMER": return "bg-orange-100 text-orange-700"
      case "RESOLVED": return "bg-green-100 text-green-700"
      case "CLOSED": return "bg-gray-100 text-gray-700"
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

  const unreadCount = conversations.filter(c => c.unreadByUser).length

  // Don't render for HQ admins or Sales agents (internal staff)
  if (session?.user?.role === "HQ_ADMIN" || session?.user?.role === "SALES_AGENT") {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Headphones className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] shadow-2xl border-0 overflow-hidden flex flex-col">
          {/* Header */}
          <CardHeader className="p-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              {view !== "list" && (
                <button
                  onClick={() => {
                    setView("list")
                    setSelectedConversation(null)
                  }}
                  className="hover:bg-white/20 p-1 rounded"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex-1 ml-2">
                {view === "list" && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-semibold">Current Support</span>
                  </div>
                )}
                {view === "new" && <span className="font-semibold">New Conversation</span>}
                {view === "chat" && selectedConversation && (
                  <div>
                    <span className="font-semibold text-sm line-clamp-1">{selectedConversation.subject}</span>
                    <div className="flex items-center gap-1 text-xs text-white/70">
                      <Clock className="h-3 w-3" />
                      <span>We typically reply within minutes</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            {/* Conversation List View */}
            {view === "list" && (
              <>
                <div className="p-4 border-b">
                  <Button
                    onClick={() => setView("new")}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                      <MessageCircle className="h-12 w-12 mb-3 text-gray-300" />
                      <p className="font-medium">No conversations yet</p>
                      <p className="text-sm text-center mt-1">Start a conversation and we'll get back to you right away!</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => openConversation(conversation)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            conversation.unreadByUser ? "bg-violet-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {conversation.unreadByUser && (
                                  <span className="w-2 h-2 bg-violet-600 rounded-full" />
                                )}
                                <span className="font-medium text-sm line-clamp-1">
                                  {conversation.subject}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(conversation.lastMessageAt)}
                              </p>
                            </div>
                            <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
                              {conversation.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* New Conversation View */}
            {view === "new" && (
              <div className="flex-1 p-4 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <Input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="What do you need help with?"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Describe your question or issue..."
                      className="mt-1 w-full h-32 px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <Button
                  onClick={createConversation}
                  disabled={sending || !newSubject.trim() || !newMessage.trim()}
                  className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            )}

            {/* Chat View */}
            {view === "chat" && selectedConversation && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedConversation.messages.map((msg) => {
                    const isUser = msg.senderType !== "hq"
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {msg.isSystemMessage ? (
                          <div className="w-full text-center">
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        ) : (
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isUser
                                ? "bg-violet-600 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-800 rounded-bl-md"
                            }`}
                          >
                            {!isUser && (
                              <p className="text-xs font-medium text-violet-600 mb-1">
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isUser ? "text-white/70" : "text-gray-400"
                            }`}>
                              <span className="text-xs">{formatTime(msg.createdAt)}</span>
                              {isUser && (
                                msg.isRead ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedConversation.status !== "CLOSED" && (
                  <div className="p-3 border-t bg-white">
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !message.trim()}
                        size="icon"
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedConversation.status === "CLOSED" && (
                  <div className="p-3 border-t bg-gray-50 text-center text-sm text-gray-500">
                    This conversation has been closed
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}














