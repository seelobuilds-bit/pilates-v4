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
  healthIssues: string | null
  classNotes: string | null
  staffNotes: string | null
  credits: number
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
  const [updatingCredits, setUpdatingCredits] = useState(false)
  const [creditAdjustAmount, setCreditAdjustAmount] = useState("1")
  const [staffNotesDraft, setStaffNotesDraft] = useState("")
  const [savingStaffNotes, setSavingStaffNotes] = useState(false)
  
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
    setStaffNotesDraft(client?.staffNotes || "")
  }, [client?.staffNotes])

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

  const adjustCredits = async (delta: number) => {
    setUpdatingCredits(true)
    try {
      const res = await fetch(`/api/teacher/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditDelta: delta }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to update credits")
      }

      const data = await res.json()
      setClient((prev) => (prev ? { ...prev, credits: data.credits } : prev))
    } catch (error) {
      console.error("Failed to adjust credits:", error)
    } finally {
      setUpdatingCredits(false)
    }
  }

  const saveStaffNotes = async () => {
    setSavingStaffNotes(true)
    try {
      const res = await fetch(`/api/teacher/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffNotes: staffNotesDraft }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to update staff notes")
      }

      const data = await res.json()
      setClient((prev) => (prev ? { ...prev, staffNotes: data.staffNotes } : prev))
    } catch (error) {
      console.error("Failed to update staff notes:", error)
    } finally {
      setSavingStaffNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8">
        <p>Client not found or you don&apos;t have access.</p>
        <Link href="/teacher/clients">
          <Button variant="outline" className="mt-4">Back to Clients</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-white border-b">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link href="/teacher/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center text-lg font-medium text-violet-700">
            {client.firstName[0]}{client.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{client.firstName} {client.lastName}</h1>
            <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-1 min-w-0">
                <Mail className="h-4 w-4" />
                <span className="truncate">{client.email}</span>
              </span>
              {client.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-violet-600">{client.bookingsCount}</p>
            <p className="text-sm text-gray-500">classes with you</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Conversation */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Mobile client snapshot */}
          <div className="lg:hidden p-4 bg-white border-b">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Credits</p>
                  <p className="font-medium text-gray-900">{client.credits}</p>
                </div>
                <div>
                  <p className="text-gray-500">Member since</p>
                  <p className="font-medium text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              {client.lastBooking && (
                <div>
                  <p className="text-gray-500">Last class</p>
                  <p className="font-medium text-gray-900">{new Date(client.lastBooking).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {(client.healthIssues?.trim() || client.classNotes?.trim()) && (
              <div className="mt-3 space-y-2">
                {client.healthIssues?.trim() && (
                  <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                    <span className="font-semibold">Health:</span> {client.healthIssues}
                  </p>
                )}
                {client.classNotes?.trim() && (
                  <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                    <span className="font-semibold">Notes:</span> {client.classNotes}
                  </p>
                )}
              </div>
            )}
            <div className="mt-3 flex flex-col items-center gap-3">
              <div className="w-full max-w-[180px]">
                <Label htmlFor="teacherCreditAdjustMobile" className="text-xs text-gray-500">Adjust credits by</Label>
                <Input
                  id="teacherCreditAdjustMobile"
                  type="number"
                  min="1"
                  value={creditAdjustAmount}
                  onChange={(e) => setCreditAdjustAmount(e.target.value)}
                  className="mt-1 h-9 text-center"
                />
              </div>
              <div className="flex w-full justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={updatingCredits}
                onClick={() => void adjustCredits(Math.max(1, parseInt(creditAdjustAmount, 10) || 1))}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={updatingCredits || client.credits <= 0}
                onClick={() => void adjustCredits(-Math.max(1, parseInt(creditAdjustAmount, 10) || 1))}
              >
                Remove
              </Button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label htmlFor="teacherStaffNotesMobile" className="text-xs text-gray-500">Internal Team Notes</Label>
              <Textarea
                id="teacherStaffNotesMobile"
                value={staffNotesDraft}
                onChange={(e) => setStaffNotesDraft(e.target.value)}
                placeholder="Shared notes for teachers and studio admins"
                rows={3}
              />
              <Button
                size="sm"
                className="w-full bg-violet-600 hover:bg-violet-700"
                onClick={() => void saveStaffNotes()}
                disabled={savingStaffNotes}
              >
                {savingStaffNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>

          {/* Message Type Toggle */}
          <div className="p-4 bg-white border-b flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
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
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
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
          <div className="p-4 pb-24 lg:pb-4 lg:pr-24 bg-white border-t space-y-3">
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
                className={`shrink-0 ${messageType === "email" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}
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
        <div className="hidden lg:block w-80 border-l bg-white overflow-y-auto">
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
                <div>
                  <Label className="text-xs text-gray-500">Credits</Label>
                  <p>{client.credits}</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label htmlFor="teacherCreditAdjustDesktop" className="text-xs text-gray-500">Adjust credits by</Label>
                    <Input
                      id="teacherCreditAdjustDesktop"
                      type="number"
                      min="1"
                      value={creditAdjustAmount}
                      onChange={(e) => setCreditAdjustAmount(e.target.value)}
                      className="mt-1 text-center"
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={updatingCredits}
                      onClick={() => void adjustCredits(Math.max(1, parseInt(creditAdjustAmount, 10) || 1))}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={updatingCredits || client.credits <= 0}
                      onClick={() => void adjustCredits(-Math.max(1, parseInt(creditAdjustAmount, 10) || 1))}
                    >
                      Remove
                    </Button>
                  </div>
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

            {(client.healthIssues?.trim() || client.classNotes?.trim()) && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Health & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {client.healthIssues?.trim() && (
                    <p className="rounded-md bg-red-50 px-2 py-1 text-red-700">
                      <span className="font-semibold">Health:</span> {client.healthIssues}
                    </p>
                  )}
                  {client.classNotes?.trim() && (
                    <p className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                      <span className="font-semibold">Notes:</span> {client.classNotes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Internal Team Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Textarea
                    value={staffNotesDraft}
                    onChange={(e) => setStaffNotesDraft(e.target.value)}
                    placeholder="Shared notes for teachers and studio admins"
                    rows={4}
                  />
                  <Button
                    size="sm"
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    onClick={() => void saveStaffNotes()}
                    disabled={savingStaffNotes}
                  >
                    {savingStaffNotes ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
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






