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
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Video,
  Phone,
  Users,
  MapPin,
  Loader2,
  Target
} from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  type: string
  location: string | null
  meetingLink: string | null
  status: string
  leadId: string | null
  lead: {
    id: string
    studioName: string
    contactName: string
  } | null
  agent: {
    user: {
      firstName: string
      lastName: string
    }
  }
}

interface Agent {
  id: string
  user: {
    firstName: string
    lastName: string
  }
}

interface Lead {
  id: string
  studioName: string
  contactName: string
}

export default function SalesCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAgentId, setSelectedAgentId] = useState("all")
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "meeting",
    leadId: "",
    location: "",
    meetingLink: ""
  })

  const fetchEvents = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        agentId: selectedAgentId
      })

      const [eventsRes, agentsRes, leadsRes] = await Promise.all([
        fetch(`/api/hq/sales/calendar?${params}`),
        fetch("/api/hq/sales/agents"),
        fetch("/api/hq/sales/leads?status=all")
      ])

      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || [])
      }
      if (agentsRes.ok) {
        const data = await agentsRes.json()
        setAgents(data.agents || [])
      }
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoading(false)
    }
  }, [currentDate, selectedAgentId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const createEvent = async () => {
    try {
      setSaving(true)
      
      const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}`)
      const endDateTime = new Date(`${newEvent.startDate}T${newEvent.endTime}`)

      const res = await fetch("/api/hq/sales/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: newEvent.type,
          leadId: newEvent.leadId || undefined,
          location: newEvent.location || undefined,
          meetingLink: newEvent.meetingLink || undefined
        })
      })

      if (res.ok) {
        setShowAddEvent(false)
        setNewEvent({
          title: "", description: "", startDate: "", startTime: "09:00",
          endTime: "10:00", type: "meeting", leadId: "", location: "", meetingLink: ""
        })
        fetchEvents()
      }
    } catch (error) {
      console.error("Failed to create event:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateEvent = async (eventId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/hq/sales/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...updates })
      })

      if (res.ok) {
        fetchEvents()
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error("Failed to update event:", error)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event?")) return

    try {
      const res = await fetch(`/api/hq/sales/calendar?eventId=${eventId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        fetchEvents()
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    
    // Previous month days
    const prevMonth = new Date(year, month, 0)
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "demo": return "bg-purple-100 text-purple-700 border-purple-200"
      case "call": return "bg-blue-100 text-blue-700 border-blue-200"
      case "meeting": return "bg-green-100 text-green-700 border-green-200"
      case "blocked": return "bg-gray-100 text-gray-700 border-gray-200"
      default: return "bg-violet-100 text-violet-700 border-violet-200"
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "demo": return <Video className="h-3 w-3" />
      case "call": return <Phone className="h-3 w-3" />
      case "meeting": return <Users className="h-3 w-3" />
      default: return <Calendar className="h-3 w-3" />
    }
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const today = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/hq/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="h-7 w-7 text-violet-600" />
              Sales Calendar
            </h1>
            <p className="text-gray-500 mt-1">Schedule and manage your sales activities</p>
          </div>
        </div>
        <Button onClick={() => setShowAddEvent(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-xl font-semibold">{monthName}</h2>
              <Button variant="ghost" size="sm" onClick={today}>Today</Button>
            </div>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.user.firstName} {a.user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Header */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="p-3 text-center font-medium text-gray-600 border-b bg-gray-50">
                  {day}
                </div>
              ))}
              
              {/* Days */}
              {days.map((day, index) => {
                const dayEvents = getEventsForDay(day.date)
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-b border-r ${
                      !day.isCurrentMonth ? "bg-gray-50/50" : ""
                    } ${isToday(day.date) ? "bg-violet-50" : ""}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      !day.isCurrentMonth ? "text-gray-400" : ""
                    } ${isToday(day.date) ? "text-violet-600" : ""}`}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`w-full text-left text-xs p-1 rounded border truncate ${getEventTypeColor(event.type)}`}
                        >
                          <span className="flex items-center gap-1">
                            {getEventIcon(event.type)}
                            {formatTime(event.startTime)} {event.title}
                          </span>
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events Sidebar would go here */}

      {/* Add Event Modal */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="blocked">Blocked Time</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related Lead</Label>
              <Select value={newEvent.leadId} onValueChange={(v) => setNewEvent({ ...newEvent, leadId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.studioName} - {l.contactName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meeting Link</Label>
              <Input
                value={newEvent.meetingLink}
                onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                placeholder="https://zoom.us/..."
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event details..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddEvent(false)}>Cancel</Button>
            <Button 
              onClick={createEvent}
              disabled={saving || !newEvent.title || !newEvent.startDate}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getEventIcon(selectedEvent.type)}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
              </div>
              {selectedEvent.lead && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-gray-400" />
                  <Link 
                    href={`/hq/sales/leads/${selectedEvent.lead.id}`}
                    className="text-violet-600 hover:underline"
                  >
                    {selectedEvent.lead.studioName} - {selectedEvent.lead.contactName}
                  </Link>
                </div>
              )}
              {selectedEvent.meetingLink && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-gray-400" />
                  <a 
                    href={selectedEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {selectedEvent.location}
                </div>
              )}
              {selectedEvent.description && (
                <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              )}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Badge className={getEventTypeColor(selectedEvent.type)}>
                  {selectedEvent.type}
                </Badge>
                <Badge variant="outline">{selectedEvent.status}</Badge>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => selectedEvent && deleteEvent(selectedEvent.id)}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              {selectedEvent?.status !== "completed" && (
                <Button 
                  variant="outline"
                  onClick={() => selectedEvent && updateEvent(selectedEvent.id, { status: "completed" })}
                >
                  Mark Complete
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}













