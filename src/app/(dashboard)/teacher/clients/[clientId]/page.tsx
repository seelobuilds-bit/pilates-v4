"use client"

import { useState, useEffect, useCallback, use, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  User,
  Calendar,
  Clock,
  Send,
  Loader2,
} from "lucide-react"

interface ClientDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  createdAt: string
  bookingsCount: number
  lastBooking: string | null
  upcomingBookings: {
    id: string
    date: string
    className: string
  }[]
}

interface Message {
  id: string
  channel: "EMAIL" | "SMS"
  direction: "INBOUND" | "OUTBOUND"
  subject: string | null
  body: string
  fromName: string | null
  createdAt: string
  sentBy?: {
    firstName: string
    lastName: string
    role: string
  } | null
}

export default function TeacherClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params)
  
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  
  // Message compose
  const [messageType, setMessageType] = useState<"email" | "sms">("email")
  const [emailSubject, setEmailSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/clients/${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data.client)
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to fetch client:", error)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!messageBody.trim()) return
    if (messageType === "email" && !emailSubject.trim()) return

    setSending(true)
    try {
      const res = await fetch("/api/teacher/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: messageType,
          clientId,
          subject: emailSubject,
          message: messageBody
        })
      })

      if (res.ok) {
        setEmailSubject("")
        setMessageBody("")
        fetchClient() // Refresh to get new message
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8">
        <p>Client not found or you don&apos;t have access.</p>
        <Link href="/teacher/clients">
          <Button variant="outline" className="mt-4">Back to Clients</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center gap-4">
          <Link href="/teacher/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center text-lg font-medium text-violet-700">
            {client.firstName[0]}{client.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{client.firstName} {client.lastName}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {client.email}
              </span>
              {client.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-violet-600">{client.bookingsCount}</p>
            <p className="text-sm text-gray-500">classes with you</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Conversation */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Message Type Toggle */}
          <div className="p-4 bg-white border-b flex items-center gap-4">
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
                disabled={!client.phone}
                className={messageType === "sms" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                SMS
              </Button>
            </div>
            {!client.phone && (
              <span className="text-xs text-gray-400">(No phone number)</span>
            )}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation below</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
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
                        {msg.sentBy && (
                          <span>
                            by {msg.sentBy.firstName} {msg.sentBy.lastName}
                            {msg.sentBy.role !== "TEACHER" && (
                              <span className="opacity-70"> ({msg.sentBy.role})</span>
                            )}
                          </span>
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
              💡 All messages are shared - HQ and other teachers can see this conversation
            </p>
          </div>
        </div>

        {/* Right - Client Info */}
        <div className="w-80 border-l bg-white overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Client Info */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p>{client.email}</p>
                </div>
                {client.phone && (
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <p>{client.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-gray-500">Member Since</Label>
                  <p>{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Stats */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Your Classes Together
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Classes</span>
                  <span className="font-medium">{client.bookingsCount}</span>
                </div>
                {client.lastBooking && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Class</span>
                    <span className="font-medium">{new Date(client.lastBooking).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming */}
            {client.upcomingBookings && client.upcomingBookings.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Upcoming Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {client.upcomingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between text-sm p-2 bg-violet-50 rounded-lg">
                        <span className="font-medium">{booking.className}</span>
                        <span className="text-gray-500">{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}












