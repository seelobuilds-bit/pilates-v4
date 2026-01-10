"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Loader2,
  Save,
  Trash2,
  AlertTriangle,
  User,
  Repeat,
  Info,
  Copy,
  Mail,
  MessageSquare,
  Send,
  X
} from "lucide-react"

const DAYS_OF_WEEK = [
  { id: 0, name: "Sun", fullName: "Sunday" },
  { id: 1, name: "Mon", fullName: "Monday" },
  { id: 2, name: "Tue", fullName: "Tuesday" },
  { id: 3, name: "Wed", fullName: "Wednesday" },
  { id: 4, name: "Thu", fullName: "Thursday" },
  { id: 5, name: "Fri", fullName: "Friday" },
  { id: 6, name: "Sat", fullName: "Saturday" },
]

interface ClassSession {
  id: string
  startTime: string
  endTime: string
  capacity: number
  recurringGroupId?: string | null
  classType: { id: string; name: string }
  teacher: { id: string; user: { firstName: string; lastName: string } }
  location: { id: string; name: string }
  bookings: { id: string; client: { id: string; firstName: string; lastName: string; email: string; phone?: string | null } }[]
  _count: { bookings: number }
}

interface Teacher {
  id: string
  user: { firstName: string; lastName: string }
}

interface Location {
  id: string
  name: string
}

export default function ClassSessionDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [classSession, setClassSession] = useState<ClassSession | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  
  // Form state
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [capacity, setCapacity] = useState(10)
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")

  // Recurring state
  const [showRecurring, setShowRecurring] = useState(false)
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const [recurringEndDate, setRecurringEndDate] = useState("")
  const [creatingRecurring, setCreatingRecurring] = useState(false)
  const [recurringCreatedCount, setRecurringCreatedCount] = useState<number | null>(null)

  // Message all state
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageType, setMessageType] = useState<"email" | "sms">("email")
  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  
  // Recurring series management
  const [showRecurringActions, setShowRecurringActions] = useState(false)
  const [recurringActionLoading, setRecurringActionLoading] = useState(false)
  const [recurringClassCount, setRecurringClassCount] = useState<number | null>(null)
  const [showReassignSeriesModal, setShowReassignSeriesModal] = useState(false)
  const [reassignSeriesTeacherId, setReassignSeriesTeacherId] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch class session
        const classRes = await fetch(`/api/studio/schedule/${resolvedParams.classId}`)
        if (classRes.ok) {
          const data = await classRes.json()
          setClassSession(data)
          setStartTime(new Date(data.startTime).toISOString().slice(0, 16))
          setEndTime(new Date(data.endTime).toISOString().slice(0, 16))
          setCapacity(data.capacity)
          setSelectedTeacher(data.teacher.id)
          setSelectedLocation(data.location.id)
        }

        // Fetch teachers
        const teacherRes = await fetch('/api/studio/teachers')
        if (teacherRes.ok) {
          setTeachers(await teacherRes.json())
        }

        // Fetch locations
        const locationRes = await fetch('/api/studio/locations')
        if (locationRes.ok) {
          setLocations(await locationRes.json())
        }
      } catch (error) {
        console.error("Failed to fetch class session:", error)
      }
      setLoading(false)
    }
    fetchData()
  }, [resolvedParams.classId])

  // Initialize recurring days when showing recurring panel
  useEffect(() => {
    if (showRecurring && classSession && recurringDays.length === 0) {
      const classDate = new Date(classSession.startTime)
      setRecurringDays([classDate.getDay()])
      // Default end date to 4 weeks from the class date
      const defaultEnd = new Date(classDate)
      defaultEnd.setDate(defaultEnd.getDate() + 28)
      setRecurringEndDate(defaultEnd.toISOString().split("T")[0])
    }
  }, [showRecurring, classSession, recurringDays.length])
  
  // Fetch recurring series count if this class is part of a series
  useEffect(() => {
    async function fetchRecurringCount() {
      if (!classSession?.recurringGroupId) return
      
      try {
        const res = await fetch(`/api/studio/schedule?recurringGroupId=${classSession.recurringGroupId}&futureOnly=true`)
        if (res.ok) {
          const data = await res.json()
          setRecurringClassCount(Array.isArray(data) ? data.length : 0)
        }
      } catch (error) {
        console.error("Failed to fetch recurring count:", error)
      }
    }
    fetchRecurringCount()
  }, [classSession?.recurringGroupId])
  
  // Delete all future classes in the recurring series
  const handleDeleteRecurringSeries = async () => {
    if (!classSession?.recurringGroupId) return
    
    if (!confirm(`Are you sure you want to delete all future classes in this recurring series? This cannot be undone.`)) return
    
    setRecurringActionLoading(true)
    try {
      const res = await fetch('/api/studio/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recurringGroupId: classSession.recurringGroupId,
          futureOnly: true
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        alert(`Deleted ${data.deleted} classes from the recurring series`)
        router.push("/studio/schedule")
      } else {
        const data = await res.json()
        alert(data.message || data.error || 'Failed to delete classes')
      }
    } catch (error) {
      console.error('Failed to delete recurring series:', error)
      alert('Failed to delete recurring series')
    } finally {
      setRecurringActionLoading(false)
    }
  }
  
  // Reassign all future classes in the recurring series
  const handleReassignRecurringSeries = async () => {
    if (!classSession?.recurringGroupId || !reassignSeriesTeacherId) return
    
    setRecurringActionLoading(true)
    try {
      const res = await fetch('/api/studio/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recurringGroupId: classSession.recurringGroupId,
          futureOnly: true,
          teacherId: reassignSeriesTeacherId
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        alert(`Reassigned ${data.updated} classes in the recurring series`)
        router.push("/studio/schedule")
      } else {
        const data = await res.json()
        alert(data.message || data.error || 'Failed to reassign classes')
      }
    } catch (error) {
      console.error('Failed to reassign recurring series:', error)
      alert('Failed to reassign recurring series')
    } finally {
      setRecurringActionLoading(false)
      setShowReassignSeriesModal(false)
    }
  }

  const toggleRecurringDay = (dayId: number) => {
    setRecurringDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort((a, b) => a - b)
    )
  }

  const calculateRecurringCount = () => {
    if (!classSession || !recurringEndDate || recurringDays.length === 0) return 0
    
    const classDate = new Date(classSession.startTime)
    const start = new Date(classDate)
    start.setDate(start.getDate() + 1) // Start from the day after the original class
    start.setHours(0, 0, 0, 0)
    const end = new Date(recurringEndDate + "T23:59:59")
    let count = 0
    
    const current = new Date(start)
    while (current <= end) {
      if (recurringDays.includes(current.getDay())) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  const handleCreateRecurring = async () => {
    if (!classSession || recurringDays.length === 0 || !recurringEndDate) return
    
    setCreatingRecurring(true)
    setRecurringCreatedCount(null)
    
    try {
      const classDate = new Date(classSession.startTime)
      const classTime = classDate.toTimeString().slice(0, 5) // HH:MM format
      const duration = Math.round((new Date(classSession.endTime).getTime() - classDate.getTime()) / 60000)
      
      const res = await fetch("/api/studio/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classTypeId: classSession.classType.id,
          teacherId: selectedTeacher,
          locationId: selectedLocation,
          startTime: classDate.toISOString(),
          endTime: classSession.endTime,
          capacity: capacity,
          recurring: {
            days: recurringDays,
            endDate: recurringEndDate,
            time: classTime,
            duration: duration,
            skipFirst: true // Skip the first occurrence since we already have this class
          }
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setRecurringCreatedCount(data.count || 0)
        setTimeout(() => {
          router.push("/studio/schedule")
        }, 2000)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to create recurring classes")
      }
    } catch (error) {
      console.error("Error creating recurring classes:", error)
      alert("Failed to create recurring classes")
    } finally {
      setCreatingRecurring(false)
    }
  }

  const expectedRecurringCount = calculateRecurringCount()

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/studio/schedule/${resolvedParams.classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          capacity,
          teacherId: selectedTeacher,
          locationId: selectedLocation
        })
      })
      if (res.ok) {
        router.push("/studio/schedule")
      }
    } catch (error) {
      console.error("Failed to save:", error)
    }
    setSaving(false)
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this class? All booked clients will be notified.")) {
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch(`/api/studio/schedule/${resolvedParams.classId}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        const data = await res.json()
        alert(`Class cancelled. ${data.notifiedClients || 0} client(s) have been notified.`)
        router.push("/studio/schedule")
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Failed to cancel class. Please try again.")
      }
    } catch (error) {
      console.error("Failed to cancel class:", error)
      alert("Failed to cancel class. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleQuickReassign = async (newTeacherId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/studio/schedule/${resolvedParams.classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: newTeacherId })
      })
      
      if (res.ok) {
        const updated = await res.json()
        setClassSession(updated)
        setSelectedTeacher(newTeacherId)
        alert("Teacher reassigned successfully!")
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Failed to reassign teacher")
      }
    } catch (error) {
      console.error("Failed to reassign:", error)
      alert("Failed to reassign teacher")
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessageToAll = async () => {
    if (!classSession || !messageBody.trim()) return
    if (messageType === "email" && !messageSubject.trim()) return

    setSendingMessage(true)
    try {
      const clientIds = classSession.bookings.map(b => b.client.id)
      const res = await fetch('/api/studio/messages/bulk', {
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

  if (loading) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!classSession) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Class not found</p>
          <Link href="/studio/schedule">
            <Button variant="outline">Back to Schedule</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-[400px] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h2 className="font-semibold text-lg">Cancel This Class?</h2>
              </div>
              <p className="text-gray-600 mb-2">
                This will cancel the class and notify all {classSession._count.bookings} booked clients.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowCancelDialog(false)}
                >
                  Keep Class
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Class"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message All Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-[500px] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
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
                    <Send className="h-8 w-8 text-emerald-600" />
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowMessageModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className={`flex-1 ${messageType === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
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
        <Link href="/studio/schedule" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Schedule
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classSession.classType.name}</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(classSession.startTime).toLocaleDateString("en-US", { 
                weekday: "long",
                month: "long", 
                day: "numeric",
                year: "numeric"
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Reassign Dropdown */}
            <Select
              value={selectedTeacher}
              onValueChange={(value) => {
                if (value !== selectedTeacher) {
                  if (confirm(`Reassign this class to ${teachers.find(t => t.id === value)?.user.firstName} ${teachers.find(t => t.id === value)?.user.lastName}?`)) {
                    handleQuickReassign(value)
                  }
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Reassign..." />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                    {teacher.id === selectedTeacher && " (current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleCancel}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Class
            </Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Class Details</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Instructor</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user.firstName} {teacher.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                  min={classSession._count.bookings}
                  className="mt-1 w-32"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: {classSession._count.bookings} (current bookings)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Make Recurring */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {/* Success Message */}
              {recurringCreatedCount !== null && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-emerald-800 font-medium">
                    ✓ Successfully created {recurringCreatedCount} additional class{recurringCreatedCount > 1 ? "es" : ""}!
                  </p>
                  <p className="text-emerald-600 text-sm mt-1">Redirecting to schedule...</p>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Repeat className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Make Recurring</h2>
                    <p className="text-sm text-gray-500">Create copies of this class on other days</p>
                  </div>
                </div>
                <Switch
                  checked={showRecurring}
                  onCheckedChange={(checked) => {
                    setShowRecurring(checked)
                    if (!checked) {
                      setRecurringDays([])
                      setRecurringEndDate("")
                      setRecurringCreatedCount(null)
                    }
                  }}
                />
              </div>

              {showRecurring && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {/* Days of Week */}
                  <div className="space-y-2">
                    <Label>Repeat on</Label>
                    <div className="flex gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleRecurringDay(day.id)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            recurringDays.includes(day.id)
                              ? "bg-violet-600 text-white"
                              : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300"
                          }`}
                          title={day.fullName}
                        >
                          {day.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Select which days to create this class</p>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="recurringEndDate">Repeat until</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="recurringEndDate"
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        min={classSession ? new Date(classSession.startTime).toISOString().split("T")[0] : ""}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {expectedRecurringCount > 0 && classSession && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="text-blue-800 font-medium">
                          This will create {expectedRecurringCount} additional class{expectedRecurringCount > 1 ? "es" : ""}
                        </p>
                        <p className="text-blue-600">
                          Every {recurringDays.map(d => DAYS_OF_WEEK.find(day => day.id === d)?.fullName).join(", ")}
                          {" "}at {new Date(classSession.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          {" "}until {new Date(recurringEndDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateRecurring}
                    disabled={creatingRecurring || recurringDays.length === 0 || !recurringEndDate || expectedRecurringCount === 0}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    {creatingRecurring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Create {expectedRecurringCount} Classes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recurring Series Management (if part of a series) */}
          {classSession.recurringGroupId && (
            <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                {/* Reassign Series Modal */}
                {showReassignSeriesModal && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <Card className="w-[400px] shadow-xl">
                      <CardContent className="p-6">
                        <h2 className="font-semibold text-lg text-gray-900 mb-4">
                          Reassign Recurring Series
                        </h2>
                        <p className="text-gray-500 mb-4">
                          Select a new teacher for all {recurringClassCount || 0} future classes in this series:
                        </p>
                        <Select value={reassignSeriesTeacherId} onValueChange={setReassignSeriesTeacherId}>
                          <SelectTrigger className="mb-4">
                            <SelectValue placeholder="Select teacher..." />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map(teacher => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.user.firstName} {teacher.user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setShowReassignSeriesModal(false)
                              setReassignSeriesTeacherId("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1 bg-violet-600 hover:bg-violet-700"
                            onClick={handleReassignRecurringSeries}
                            disabled={!reassignSeriesTeacherId || recurringActionLoading}
                          >
                            {recurringActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Reassign All"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Repeat className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Part of Recurring Series</h2>
                      <p className="text-sm text-gray-500">
                        {recurringClassCount !== null 
                          ? `${recurringClassCount} future classes in this series`
                          : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowRecurringActions(!showRecurringActions)}
                  >
                    {showRecurringActions ? 'Hide' : 'Manage Series'}
                  </Button>
                </div>

                {showRecurringActions && recurringClassCount !== null && recurringClassCount > 0 && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-600">
                      Perform actions on all <strong>{recurringClassCount}</strong> future classes in this series:
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1 text-violet-600 border-violet-200 hover:bg-violet-50"
                        onClick={() => setShowReassignSeriesModal(true)}
                        disabled={recurringActionLoading}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Reassign All
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={handleDeleteRecurringSeries}
                        disabled={recurringActionLoading}
                      >
                        {recurringActionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete All
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Note: This only affects future classes. Past classes will remain unchanged.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booked Clients */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Booked Clients</h2>
                <div className="flex items-center gap-2">
                  {classSession.bookings.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={openMessageModal}
                      className="text-violet-600 border-violet-200 hover:bg-violet-50"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Message All
                    </Button>
                  )}
                  <Badge variant={classSession._count.bookings >= capacity ? "destructive" : "secondary"}>
                    {classSession._count.bookings}/{capacity} spots
                  </Badge>
                </div>
              </div>
              
              {classSession.bookings && classSession.bookings.length > 0 ? (
                <div className="space-y-2">
                  {classSession.bookings.map((booking) => (
                    <Link key={booking.id} href={`/studio/clients/${booking.id}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-medium">
                            {booking.client.firstName[0]}{booking.client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{booking.client.firstName} {booking.client.lastName}</p>
                            <p className="text-sm text-gray-500">{booking.client.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          Confirmed
                        </Badge>
                      </div>
                    </Link>
                  ))}
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

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Class Summary</h3>
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
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Instructor</p>
                    <p className="font-medium text-gray-900">
                      {classSession.teacher.user.firstName} {classSession.teacher.user.lastName}
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
                      classSession._count.bookings >= capacity ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {classSession._count.bookings} / {capacity}
                      {classSession._count.bookings >= capacity && " (Full)"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
