"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  Loader2,
  Users,
  Crown
} from "lucide-react"

interface ChatMessage {
  id: string
  content: string
  type: string
  isEdited: boolean
  createdAt: string
  member: {
    role: string
    subscriber: {
      teacher: { user: { firstName: string; lastName: string } } | null
      user: { firstName: string; lastName: string } | null
    }
  }
}

interface SubscriptionChatProps {
  planId: string
  planName: string
  audience: string
}

export function SubscriptionChat({ planId, planName, audience }: SubscriptionChatProps) {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [chatEnabled, setChatEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const fetchChat = useCallback(async () => {
    console.log("[SubscriptionChat] Fetching chat for planId:", planId)
    try {
      const res = await fetch(`/api/vault/subscription/chat?planId=${planId}`)
      console.log("[SubscriptionChat] Response status:", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("[SubscriptionChat] Chat data:", { messagesCount: data.messages?.length, memberCount: data.memberCount, chatEnabled: data.chat?.isEnabled })
        setMessages(data.messages || [])
        setMemberCount(data.memberCount || 0)
        setChatEnabled(data.chat?.isEnabled ?? true)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("[SubscriptionChat] Failed to fetch chat:", res.status, errorData)
      }
    } catch (err) {
      console.error("[SubscriptionChat] Failed to fetch chat:", err)
    }
    setLoading(false)
  }, [planId])

  useEffect(() => {
    const poll = () => {
      void fetchChat()
    }
    const init = setTimeout(poll, 0)
    const interval = setInterval(poll, 5000)
    return () => {
      clearTimeout(init)
      clearInterval(interval)
    }
  }, [fetchChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch("/api/vault/subscription/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          content: newMessage.trim(),
          type: "text"
        })
      })

      if (res.ok) {
        const message = await res.json()
        setMessages([...messages, message])
        setNewMessage("")
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
        console.error("Failed to send message:", res.status, errorData)
        alert(`Failed to send message: ${errorData.error || "Unknown error"}`)
      }
    } catch (err) {
      console.error("Failed to send message:", err)
      alert("Failed to send message. Please try again.")
    }
    setSending(false)
  }

  function getMemberName(subscriber: ChatMessage["member"]["subscriber"]) {
    if (subscriber.teacher) {
      return `${subscriber.teacher.user.firstName} ${subscriber.teacher.user.lastName}`
    }
    if (subscriber.user) {
      return `${subscriber.user.firstName} ${subscriber.user.lastName}`
    }
    return "Unknown"
  }

  function getInitials(subscriber: ChatMessage["member"]["subscriber"]) {
    const name = getMemberName(subscriber)
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  function getAudienceColor(aud: string) {
    switch (aud) {
      case "STUDIO_OWNERS": return "bg-purple-100 text-purple-700"
      case "TEACHERS": return "bg-blue-100 text-blue-700"
      case "CLIENTS": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  function getAudienceLabel(aud: string) {
    switch (aud) {
      case "STUDIO_OWNERS": return "Studio Owners"
      case "TEACHERS": return "Teachers"
      case "CLIENTS": return "At-Home Members"
      default: return aud
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <Crown className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{planName} Community</h3>
            <div className="flex items-center gap-2">
              <Badge className={`${getAudienceColor(audience)} text-xs`}>
                {getAudienceLabel(audience)}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount} members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                  {getInitials(msg.member.subscriber)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {getMemberName(msg.member.subscriber)}
                  </span>
                  {msg.member.role !== "member" && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {msg.member.role}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                </div>
                
                <p className="text-gray-700 break-words">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {chatEnabled ? (
        <form onSubmit={sendMessage} className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t bg-gray-50 text-center text-gray-500 text-sm">
          Chat is currently disabled
        </div>
      )}
    </Card>
  )
}













