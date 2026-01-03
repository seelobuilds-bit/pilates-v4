"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  Loader2,
  Users,
  Pin,
  Reply,
  MoreVertical,
  Smile,
  Image,
  Paperclip,
  X,
  ChevronDown
} from "lucide-react"

interface ChatMessage {
  id: string
  content: string
  type: string
  mediaUrl: string | null
  isEdited: boolean
  createdAt: string
  member: {
    role: string
    enrollment: {
      client: { firstName: string; lastName: string } | null
      teacher: { user: { firstName: string; lastName: string } } | null
      user: { firstName: string; lastName: string } | null
    }
  }
  replyTo: {
    content: string
    member: {
      enrollment: {
        client: { firstName: string } | null
        teacher: { user: { firstName: string } } | null
        user: { firstName: string } | null
      }
    }
  } | null
  reactions: Array<{ emoji: string; memberId: string }>
}

interface ChatRoom {
  id: string
  name: string | null
  isEnabled: boolean
  instructorsOnly: boolean
}

interface CourseChatProps {
  courseId: string
  courseName: string
}

export function CourseChat({ courseId, courseName }: CourseChatProps) {
  const [loading, setLoading] = useState(true)
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [showPinned, setShowPinned] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChat()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchChat, 5000)
    return () => clearInterval(interval)
  }, [courseId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function fetchChat() {
    try {
      const res = await fetch(`/api/vault/chat?courseId=${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setChatRoom(data.chatRoom)
        setMessages(data.messages || [])
        setPinnedMessages(data.pinnedMessages || [])
        setOnlineCount(data.onlineCount || 0)
      }
    } catch (err) {
      console.error("Failed to fetch chat:", err)
    }
    setLoading(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch("/api/vault/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          content: newMessage.trim(),
          type: "text",
          replyToId: replyTo?.id
        })
      })

      if (res.ok) {
        const message = await res.json()
        setMessages([...messages, message])
        setNewMessage("")
        setReplyTo(null)
      }
    } catch (err) {
      console.error("Failed to send message:", err)
    }
    setSending(false)
  }

  async function addReaction(messageId: string, emoji: string) {
    try {
      await fetch("/api/vault/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          messageId,
          action: "react",
          emoji
        })
      })
      fetchChat()
    } catch (err) {
      console.error("Failed to add reaction:", err)
    }
  }

  function getMemberName(enrollment: ChatMessage["member"]["enrollment"]) {
    if (enrollment.client) {
      return `${enrollment.client.firstName} ${enrollment.client.lastName}`
    }
    if (enrollment.teacher) {
      return `${enrollment.teacher.user.firstName} ${enrollment.teacher.user.lastName}`
    }
    if (enrollment.user) {
      return `${enrollment.user.firstName} ${enrollment.user.lastName}`
    }
    return "Unknown"
  }

  function getInitials(enrollment: ChatMessage["member"]["enrollment"]) {
    const name = getMemberName(enrollment)
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-700 text-xs ml-2">Admin</Badge>
      case "instructor":
        return <Badge className="bg-violet-100 text-violet-700 text-xs ml-2">Instructor</Badge>
      case "moderator":
        return <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">Mod</Badge>
      default:
        return null
    }
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

  if (loading) {
    return (
      <Card className="border-0 shadow-sm h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </Card>
    )
  }

  if (!chatRoom || !chatRoom.isEnabled) {
    return (
      <Card className="border-0 shadow-sm h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Community chat is not available for this course</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{chatRoom.name || `${courseName} Community`}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {onlineCount} online
            </p>
          </div>
        </div>
        
        {pinnedMessages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPinned(!showPinned)}
            className="gap-2"
          >
            <Pin className="h-4 w-4" />
            {pinnedMessages.length} Pinned
            <ChevronDown className={`h-4 w-4 transition-transform ${showPinned ? "rotate-180" : ""}`} />
          </Button>
        )}
      </div>

      {/* Pinned Messages */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="p-3 bg-amber-50 border-b space-y-2">
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="flex items-start gap-2 text-sm">
              <Pin className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <span className="font-medium">{getMemberName(msg.member.enrollment)}:</span>
                <span className="ml-1 text-gray-600">{msg.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Be the first to say hello!</p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="group flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                  {getInitials(msg.member.enrollment)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {getMemberName(msg.member.enrollment)}
                  </span>
                  {getRoleBadge(msg.member.role)}
                  <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                  {msg.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
                </div>
                
                {msg.replyTo && (
                  <div className="mb-1 pl-2 border-l-2 border-gray-200 text-xs text-gray-500">
                    <span className="font-medium">
                      {msg.replyTo.member.enrollment.client?.firstName ||
                       msg.replyTo.member.enrollment.teacher?.user.firstName ||
                       msg.replyTo.member.enrollment.user?.firstName}
                    </span>
                    : {msg.replyTo.content.slice(0, 50)}...
                  </div>
                )}
                
                <p className="text-gray-700 break-words">{msg.content}</p>
                
                {msg.mediaUrl && (
                  <img src={msg.mediaUrl} alt="" className="mt-2 max-w-xs rounded-lg" />
                )}
                
                {/* Reactions */}
                {msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(
                      msg.reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(msg.id, emoji)}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs flex items-center gap-1"
                      >
                        <span>{emoji}</span>
                        <span>{count}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Actions - visible on hover */}
                <div className="hidden group-hover:flex items-center gap-1 mt-1">
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    title="Reply"
                  >
                    <Reply className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => addReaction(msg.id, "👍")}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    title="React"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Replying to {getMemberName(replyTo.member.enrollment)}</span>
            <p className="text-xs text-gray-400 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={chatRoom.instructorsOnly ? "Only instructors can post" : "Type a message..."}
            disabled={chatRoom.instructorsOnly || sending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending || chatRoom.instructorsOnly}
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
    </Card>
  )
}












