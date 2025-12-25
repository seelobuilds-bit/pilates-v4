"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  Video,
  Phone,
  Users,
  Clock,
  Plus,
  X,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  eventType: string
  startTime: string
  endTime: string
  lead: {
    id: string
    studioName: string
    contactName: string
  } | null
}

interface Demo {
  id: string
  studioName: string
  contactName: string
  contactEmail: string
  scheduledDate: string | null
  meetingLink: string | null
  status: string
}

interface Lead {
  id: string
  studioName: string
  contactName: string
}

const EVENT_TYPES = [
  { value: "CALL", label: "Call", color: "bg-blue-100 text-blue-700" },
  { value: "DEMO", label: "Demo", color: "bg-purple-100 text-purple-700" },
  { value: "MEETING", label: "Meeting", color: "bg-green-100 text-green-700" },
  { value: "FOLLOW_UP", label: "Follow Up", color: "bg-orange-100 text-orange-700" },
  { value: "BLOCKED", label: "Blocked", color: "bg-gray-100 text-gray-700" },
]

export default function SalesCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [demos, setDemos] = useState<Demo[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventType: "CALL",
    startTime: "",
    endTime: "",
    leadId: ""
  })

  const fetchData = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const [eventsRes, demosRes, leadsRes] = await Promise.all([
        fetch(`/api/sales/calendar?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`),
        fetch("/api/sales/demos"),
        fetch("/api/sales/leads")
      ])

      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || [])
      }
      if (demosRes.ok) {
        const data = await demosRes.json()
        setDemos(data.demos?.filter((d: Demo) => d.status === "scheduled") || [])
      }
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error("Failed to fetch calendar:", error)
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.startTime) return

    try {
      setSaving(true)
      const res = await fetch("/api/sales/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      })

      if (res.ok) {
        setShowAddEvent(false)
        setNewEvent({
          title: "",
          description: "",
          eventType: "CALL",
          startTime: "",
          endTime: "",
          leadId: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create event:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/sales/calendar?eventId=${eventId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setSelectedEvent(null)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []
    
    for (let i = 0; i < startingDay; i++) {
      const prevMonthDay = new Date(year, month, -startingDay + i + 1)
      days.push({ date: prevMonthDay, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.startTime)
      return eventDate >= dayStart && eventDate < dayEnd
    })

    const dayDemos = demos.filter(d => {
      if (!d.scheduledDate) return false
      const demoDate = new Date(d.scheduledDate)
      return demoDate >= dayStart && demoDate < dayEnd
    })

    return { events: dayEvents, demos: dayDemos }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getEventTypeColor = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.color || "bg-gray-100 text-gray-700"
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "DEMO": return <Video className="h-3 w-3" />
      case "CALL": return <Phone className="h-3 w-3" />
      case "MEETING": return <Users className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    const dateStr = date.toISOString().split("T")[0]
    setNewEvent(prev => ({
      ...prev,
      startTime: `${dateStr}T09:00`,
      endTime: `${dateStr}T10:00`
    }))
    setShowAddEvent(true)
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const days = getDaysInMonth()

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="h-7 w-7 text-violet-600" />
            My Calendar
          </h1>
          <p className="text-gray-500 mt-1">Manage your schedule and demos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={() => {
              const today = new Date()
              const dateStr = today.toISOString().split("T")[0]
              setNewEvent(prev => ({
                ...prev,
                startTime: `${dateStr}T09:00`,
                endTime: `${dateStr}T10:00`
              }))
              setShowAddEvent(true)
            }} 
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const { events: dayEvents, demos: dayDemos } = getEventsForDay(day.date)
              const hasItems = dayEvents.length > 0 || dayDemos.length > 0

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day.date)}
                  className={`min-h-[120px] border-b border-r p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !day.isCurrentMonth ? "bg-gray-50/50" : ""
                  } ${isToday(day.date) ? "bg-violet-50" : ""}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    !day.isCurrentMonth ? "text-gray-400" : isToday(day.date) ? "text-violet-600" : "text-gray-900"
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayDemos.map(demo => (
                      <div
                        key={demo.id}
                        className="text-xs p-1.5 rounded bg-purple-100 text-purple-700 truncate flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{demo.studioName}</span>
                      </div>
                    ))}
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1.5 rounded truncate flex items-center gap-1 cursor-pointer hover:opacity-80 ${getEventTypeColor(event.eventType)}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(event)
                        }}
                      >
                        {getEventTypeIcon(event.eventType)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
        <div className="space-y-3">
          {(() => {
            const today = new Date()
            const { events: todayEvents, demos: todayDemos } = getEventsForDay(today)
            const allItems = [
              ...todayDemos.map(d => ({ type: "demo" as const, data: d, time: d.scheduledDate! })),
              ...todayEvents.map(e => ({ type: "event" as const, data: e, time: e.startTime }))
            ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

            if (allItems.length === 0) {
              return (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-8 text-center text-gray-500">
                    No scheduled items for today. Click on a calendar day to add an event.
                  </CardContent>
                </Card>
              )
            }

            return allItems.map((item, idx) => (
              <Card key={idx} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === "demo" ? "bg-purple-100" : "bg-blue-100"
                  }`}>
                    {item.type === "demo" ? (
                      <Video className="h-5 w-5 text-purple-600" />
                    ) : (
                      getEventTypeIcon((item.data as CalendarEvent).eventType)
                    )}
                  </div>
                  <div className="flex-1">
                    {item.type === "demo" ? (
                      <>
                        <p className="font-medium">Demo: {(item.data as Demo).studioName}</p>
                        <p className="text-sm text-gray-500">{(item.data as Demo).contactName}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{(item.data as CalendarEvent).title}</p>
                        {(item.data as CalendarEvent).lead && (
                          <p className="text-sm text-gray-500">{(item.data as CalendarEvent).lead?.studioName}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-violet-600">{formatTime(item.time)}</p>
                    <Badge className={item.type === "demo" ? "bg-purple-100 text-purple-700" : getEventTypeColor((item.data as CalendarEvent).eventType)}>
                      {item.type === "demo" ? "Demo" : (item.data as CalendarEvent).eventType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          })()}
        </div>
      </div>

      {/* Add Event Modal */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="e.g., Call with John"
              />
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={newEvent.eventType} onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Related Lead (optional)</Label>
              <Select 
                value={newEvent.leadId || "none"} 
                onValueChange={(v) => setNewEvent({ ...newEvent, leadId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.studioName} - {lead.contactName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add notes..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddEvent(false)}>Cancel</Button>
            <Button 
              onClick={createEvent}
              disabled={saving || !newEvent.title || !newEvent.startTime}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getEventTypeIcon(selectedEvent.eventType)}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className={getEventTypeColor(selectedEvent.eventType)}>
                  {selectedEvent.eventType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">
                  {new Date(selectedEvent.startTime).toLocaleString()}
                  {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                </p>
              </div>
              {selectedEvent.lead && (
                <div>
                  <p className="text-sm text-gray-500">Related Lead</p>
                  <p className="font-medium">{selectedEvent.lead.studioName}</p>
                  <p className="text-sm text-gray-600">{selectedEvent.lead.contactName}</p>
                  <Link 
                    href={`/sales/leads/${selectedEvent.lead.id}`}
                    className="inline-flex items-center gap-1 mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Lead Profile
                  </Link>
                </div>
              )}
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => selectedEvent && deleteEvent(selectedEvent.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
