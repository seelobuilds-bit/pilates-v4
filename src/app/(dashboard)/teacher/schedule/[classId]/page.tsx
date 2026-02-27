"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Loader2,
  Mail,
  MessageSquare,
  Send,
  X,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

interface ClassSession {
  id: string
  startTime: string
  endTime: string
  capacity: number
  classType: { id: string; name: string }
  location: { id: string; name: string }
  bookings: { 
    id: string
    client: { 
      id: string
      firstName: string
      lastName: string
      email: string
      phone?: string | null
      healthIssues?: string | null
      classNotes?: string | null
    } 
  }[]
  _count: { bookings: number }
  clientAlertCount: number
  availableSwapTeachers: {
    id: string
    user: { firstName: string; lastName: string }
  }[]
  swapPolicy: {
    requiresApproval: boolean
  }
  latestSwapRequest: {
    id: string
    status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED"
    createdAt: string
    toTeacher: {
      id: string
      user: { firstName: string; lastName: string }
    }
    adminNotes?: string | null
  } | null
}

export default function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [classSession, setClassSession] = useState<ClassSession | null>(null)

  // Message all state
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageType, setMessageType] = useState<"email" | "sms">("email")
  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [swapTeacherId, setSwapTeacherId] = useState("")
  const [swapNotes, setSwapNotes] = useState("")
  const [submittingSwap, setSubmittingSwap] = useState(false)
  const [swapFeedback, setSwapFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/schedule/${resolvedParams.classId}`)
      if (res.ok) {
        const data = await res.json()
        setClassSession(data)
      }
    } catch (error) {
      console.error("Failed to fetch class:", error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.classId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleSendMessageToAll = async () => {
    if (!classSession || !messageBody.trim()) return
    if (messageType === "email" && !messageSubject.trim()) return

    setSendingMessage(true)
    try {
      const clientIds = classSession.bookings.map(b => b.client.id)
      const res = await fetch('/api/teacher/messages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds,
          channel: messageType.toUpperCase(),
          subject: messageType === "email" ? messageSubject : undefined,
          message: messageBody,
          classId: classSession.id
        })
      })

      if (res.ok) {
        setMessageSent(true)
        setTimeout(() => {
          setShowMessageModal(false)
          setMessageSent(false)
          setMessageSubject("")
          setMessageBody("")
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to send messages:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const openMessageModal = () => {
    if (classSession) {
      setMessageSubject(`Update: ${classSession.classType.name} - ${new Date(classSession.startTime).toLocaleDateString()}`)
    }
    setShowMessageModal(true)
  }

  const handleSwapRequest = async () => {
    if (!classSession || !swapTeacherId) {
      setSwapFeedback({ type: "error", text: "Please select a teacher." })
      return
    }

    setSubmittingSwap(true)
    setSwapFeedback(null)
    try {
      const res = await fetch("/api/teacher/class-swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: classSession.id,
          toTeacherId: swapTeacherId,
          notes: swapNotes,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit class swap")
      }

      setSwapTeacherId("")
      setSwapNotes("")
      setSwapFeedback({
        type: "success",
        text:
          data.mode === "AUTO_APPROVED"
            ? "Swap completed immediately."
            : "Swap request sent for admin approval.",
      })
      await fetchData()
    } catch (error) {
      setSwapFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to submit class swap",
      })
    } finally {
      setSubmittingSwap(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!classSession) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Class not found</p>
          <Link href="/teacher/schedule">
            <Button variant="outline">Back to Schedule</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Message All Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-[500px] shadow-xl">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between gap-3 sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Send className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">Message All Attendees</h2>
                    <p className="text-sm text-gray-500">
                      Send to {classSession.bookings.length} client{classSession.bookings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowMessageModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {messageSent ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages Sent!</h3>
                  <p className="text-gray-500">
                    Successfully sent to {classSession.bookings.length} client{classSession.bookings.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <>
                  {/* Message Type Toggle */}
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                    <button
                      onClick={() => setMessageType("email")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                        messageType === "email" 
                          ? "bg-white text-blue-600 shadow-sm font-medium" 
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => setMessageType("sms")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                        messageType === "sms" 
                          ? "bg-white text-green-600 shadow-sm font-medium" 
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS</span>
                    </button>
                  </div>

                  {/* Recipients Preview */}
                  <div className="p-3 bg-gray-50 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Recipients:</p>
                    <div className="flex flex-wrap gap-2">
                      {classSession.bookings.slice(0, 5).map(b => (
                        <Badge key={b.id} variant="secondary" className="text-xs">
                          {b.client.firstName} {b.client.lastName[0]}.
                        </Badge>
                      ))}
                      {classSession.bookings.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{classSession.bookings.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Subject (email only) */}
                  {messageType === "email" && (
                    <div className="mb-4">
                      <Label>Subject</Label>
                      <Input
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        placeholder="Email subject..."
                        className="mt-1"
                      />
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="mb-4">
                    <Label>Message</Label>
                    <Textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder={`Write your ${messageType === 'email' ? 'email' : 'SMS'} message...`}
                      rows={5}
                      className="mt-1"
                    />
                    {messageType === "sms" && (
                      <p className="text-xs text-gray-400 mt-1">{messageBody.length}/160 characters</p>
                    )}
                  </div>

                  {/* Shared inbox note */}
                  <div className="p-3 bg-blue-50 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                      💬 Messages will appear in each client&apos;s shared conversation thread
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button 
                      variant="outline" 
                      className="w-full flex-1"
                      onClick={() => setShowMessageModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className={`w-full flex-1 ${messageType === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                      onClick={handleSendMessageToAll}
                      disabled={sendingMessage || !messageBody.trim() || (messageType === "email" && !messageSubject.trim())}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send to All
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link href="/teacher/schedule" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Schedule
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classSession.classType.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(classSession.startTime).toLocaleDateString("en-US", { 
                weekday: "long",
                month: "long", 
                day: "numeric",
                year: "numeric"
              })}
            </p>
          </div>
          {classSession.bookings.length > 0 && (
            <Button 
              onClick={openMessageModal}
              className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              Message All Attendees
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booked Clients */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold text-gray-900">Booked Clients</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {classSession.clientAlertCount > 0 && (
                    <Badge variant="destructive" className="w-fit gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {classSession.clientAlertCount} client alert{classSession.clientAlertCount === 1 ? "" : "s"}
                    </Badge>
                  )}
                  <Badge className="w-fit" variant={classSession._count.bookings >= classSession.capacity ? "destructive" : "secondary"}>
                    {classSession._count.bookings}/{classSession.capacity} spots
                  </Badge>
                </div>
              </div>
              
              {classSession.bookings && classSession.bookings.length > 0 ? (
                <div className="space-y-2">
                  {classSession.bookings.map((booking) => {
                    const healthIssues = booking.client.healthIssues?.trim()
                    const classNotes = booking.client.classNotes?.trim()
                    const hasClientAlerts = Boolean(healthIssues || classNotes)

                    return (
                    <Link key={booking.id} href={`/teacher/clients/${booking.client.id}`}>
                      <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 cursor-pointer sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-medium">
                            {booking.client.firstName[0]}{booking.client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{booking.client.firstName} {booking.client.lastName}</p>
                            <p className="text-sm text-gray-500">{booking.client.email}</p>
                            {hasClientAlerts && (
                              <div className="mt-2 space-y-1">
                                {healthIssues && (
                                  <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                                    <span className="font-semibold">Health:</span> {healthIssues}
                                  </p>
                                )}
                                {classNotes && (
                                  <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                                    <span className="font-semibold">Notes:</span> {classNotes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="w-fit text-emerald-600 border-emerald-200">
                          Confirmed
                        </Badge>
                      </div>
                    </Link>
                  )})}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No bookings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Class Summary */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Class Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Class Type</p>
                    <p className="font-medium text-gray-900">{classSession.classType.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">
                      {new Date(classSession.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(classSession.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{classSession.location.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bookings</p>
                    <p className={`font-medium ${
                      classSession._count.bookings >= classSession.capacity ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {classSession._count.bookings} / {classSession.capacity}
                      {classSession._count.bookings >= classSession.capacity && " (Full)"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {classSession.bookings.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={openMessageModal}
                  >
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    Email All ({classSession.bookings.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setMessageType("sms")
                      openMessageModal()
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                    SMS All ({classSession.bookings.filter(b => b.client.phone).length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Swap This Class</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {classSession.swapPolicy.requiresApproval
                    ? "Owner approval is required before the teacher change is applied."
                    : "Owner approval is off. This swap will apply immediately."}
                </p>
              </div>

              {classSession.latestSwapRequest && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">
                    Latest request: {classSession.latestSwapRequest.status}
                  </p>
                  <p className="text-gray-600">
                    To {classSession.latestSwapRequest.toTeacher.user.firstName}{" "}
                    {classSession.latestSwapRequest.toTeacher.user.lastName}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="swapTeacher">Swap to</Label>
                <select
                  id="swapTeacher"
                  value={swapTeacherId}
                  onChange={(event) => setSwapTeacherId(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="">Select teacher</option>
                  {classSession.availableSwapTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="swapNotes">Reason (optional)</Label>
                <Textarea
                  id="swapNotes"
                  value={swapNotes}
                  onChange={(event) => setSwapNotes(event.target.value)}
                  rows={3}
                  placeholder="Add context for this swap request."
                />
              </div>

              {swapFeedback && (
                <p className={`text-sm ${swapFeedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                  {swapFeedback.text}
                </p>
              )}

              <Button
                onClick={handleSwapRequest}
                disabled={submittingSwap || !swapTeacherId}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {submittingSwap ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Swap"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}






