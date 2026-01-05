"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Phone,
  Mail,
  MessageSquare,
  Send,
  Building2,
  MapPin,
  Clock,
  Calendar,
  User,
  Edit,
  Trash2,
  CheckCircle,
  Plus,
  Loader2,
  ExternalLink,
  Globe,
  DollarSign,
  Target,
  FileText,
  AlertCircle
} from "lucide-react"
import { CommunicationPanel } from "@/components/sales/communication-panel"

interface Activity {
  id: string
  type: string
  subject: string | null
  content: string
  direction: string | null
  duration: number | null
  outcome: string | null
  createdAt: string
  agent: {
    user: {
      firstName: string
      lastName: string
    }
  } | null
}

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  type: string
  startTime: string
  endTime: string
  status: string
  agent: {
    user: {
      firstName: string
      lastName: string
    }
  } | null
}

interface Lead {
  id: string
  studioName: string
  website: string | null
  contactName: string
  contactEmail: string
  contactPhone: string | null
  contactRole: string | null
  city: string | null
  state: string | null
  country: string
  status: string
  source: string
  priority: string
  currentSoftware: string | null
  studioSize: string | null
  monthlyRevenue: string | null
  painPoints: string | null
  notes: string | null
  estimatedValue: number | null
  probability: number | null
  expectedClose: string | null
  lostReason: string | null
  lastContactedAt: string | null
  nextFollowUpAt: string | null
  totalCalls: number
  totalEmails: number
  totalSms: number
  tags: string[]
  createdAt: string
  updatedAt: string
  assignedTo: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  } | null
  activities: Activity[]
  calendarEvents: CalendarEvent[]
}

const LEAD_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "DEMO_REQUESTED", label: "Demo Requested" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "DEMO_SCHEDULED", label: "Demo Scheduled" },
  { value: "DEMO_COMPLETED", label: "Demo Completed" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
]

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "HOT", label: "Hot" }
]

export default function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = use(params)
  const router = useRouter()
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Activity modals
  const [showCallModal, setShowCallModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  
  // Activity forms
  const [activityContent, setActivityContent] = useState("")
  const [activitySubject, setActivitySubject] = useState("")
  const [activityOutcome, setActivityOutcome] = useState("")
  const [callDuration, setCallDuration] = useState("")
  
  // Event form
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventType: "call",
    startTime: "",
    endTime: ""
  })

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/sales/leads/${leadId}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data.lead)
      }
    } catch (error) {
      console.error("Failed to fetch lead:", error)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchLead()
  }, [fetchLead])

  const updateLead = async (updates: Record<string, unknown>) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      if (res.ok) {
        fetchLead()
      }
    } catch (error) {
      console.error("Failed to update lead:", error)
    } finally {
      setSaving(false)
    }
  }

  const logActivity = async (type: string) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/sales/leads/${leadId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subject: activitySubject || undefined,
          content: activityContent,
          outcome: activityOutcome || undefined,
          duration: callDuration ? parseInt(callDuration) * 60 : undefined,
          direction: "outbound"
        })
      })

      if (res.ok) {
        setShowCallModal(false)
        setShowEmailModal(false)
        setShowSmsModal(false)
        setShowNoteModal(false)
        setActivityContent("")
        setActivitySubject("")
        setActivityOutcome("")
        setCallDuration("")
        fetchLead()
      }
    } catch (error) {
      console.error("Failed to log activity:", error)
    } finally {
      setSaving(false)
    }
  }

  const createEvent = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/sales/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          leadId: lead?.id // Attach this lead to the event
        })
      })

      if (res.ok) {
        setShowEventModal(false)
        setNewEvent({ title: "", description: "", eventType: "call", startTime: "", endTime: "" })
        fetchLead()
      }
    } catch (error) {
      console.error("Failed to create event:", error)
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700",
      CONTACTED: "bg-cyan-100 text-cyan-700",
      DEMO_REQUESTED: "bg-pink-100 text-pink-700",
      QUALIFIED: "bg-indigo-100 text-indigo-700",
      DEMO_SCHEDULED: "bg-purple-100 text-purple-700",
      DEMO_COMPLETED: "bg-violet-100 text-violet-700",
      WON: "bg-green-100 text-green-700",
      LOST: "bg-red-100 text-red-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-600",
      MEDIUM: "bg-yellow-100 text-yellow-700",
      HIGH: "bg-orange-100 text-orange-700",
      HOT: "bg-red-100 text-red-700"
    }
    return colors[priority] || "bg-gray-100 text-gray-700"
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CALL": return <Phone className="h-4 w-4 text-blue-600" />
      case "EMAIL": return <Mail className="h-4 w-4 text-green-600" />
      case "SMS": return <MessageSquare className="h-4 w-4 text-purple-600" />
      case "NOTE": return <FileText className="h-4 w-4 text-gray-600" />
      case "STATUS_CHANGE": return <Target className="h-4 w-4 text-orange-600" />
      case "TASK_COMPLETED": return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString()
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-8">
        <p>Lead not found or you don&apos;t have access to it.</p>
        <Link href="/sales">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.studioName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={getStatusColor(lead.status)}>
                {LEAD_STATUSES.find(s => s.value === lead.status)?.label}
              </Badge>
              <Badge className={getPriorityColor(lead.priority)}>
                {lead.priority} Priority
              </Badge>
              {lead.city && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {lead.city}, {lead.state}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCallModal(true)}>
            <Phone className="h-4 w-4 mr-2" />
            Log Call
          </Button>
          <Button variant="outline" onClick={() => setShowEmailModal(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Log Email
          </Button>
          <Button variant="outline" onClick={() => setShowSmsModal(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Log SMS
          </Button>
          <Button variant="outline" onClick={() => setShowNoteModal(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Lead Info */}
        <div className="col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select
                  value={lead.status}
                  onValueChange={(v) => updateLead({ status: v })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={lead.priority}
                  onValueChange={(v) => updateLead({ priority: v })}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {saving && <Loader2 className="h-4 w-4 animate-spin text-violet-600" />}
              </div>
            </CardContent>
          </Card>

          {/* Activity & Schedule Tabs */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Activity ({lead.activities?.length || 0})</TabsTrigger>
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule ({lead.calendarEvents?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {!lead.activities || lead.activities.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No activity yet</p>
                  ) : (
                    <div className="space-y-4">
                      {lead.activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-gray-900">
                                {activity.type.replace("_", " ")}
                                {activity.subject && `: ${activity.subject}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(activity.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                              {activity.content}
                            </p>
                            {activity.outcome && (
                              <p className="text-xs text-gray-500 mt-1">
                                Outcome: {activity.outcome}
                              </p>
                            )}
                            {activity.agent && (
                              <p className="text-xs text-gray-400 mt-1">
                                by {activity.agent.user.firstName} {activity.agent.user.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Events
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowEventModal(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule Event
                  </Button>
                </CardHeader>
                <CardContent>
                  {!lead.calendarEvents || lead.calendarEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No upcoming events scheduled</p>
                      <Button variant="link" className="mt-2 text-violet-600" onClick={() => setShowEventModal(true)}>
                        Schedule an event
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lead.calendarEvents.map((event) => (
                        <div 
                          key={event.id} 
                          className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            event.type === "call" ? "bg-blue-100" :
                            event.type === "demo" ? "bg-purple-100" :
                            event.type === "meeting" ? "bg-green-100" :
                            "bg-gray-100"
                          }`}>
                            {event.type === "call" ? (
                              <Phone className="h-5 w-5 text-blue-600" />
                            ) : event.type === "demo" ? (
                              <Target className="h-5 w-5 text-purple-600" />
                            ) : (
                              <Calendar className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate">{event.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Notes */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Notes & Pain Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pain Points</Label>
                <Textarea
                  value={lead.painPoints || ""}
                  onChange={(e) => updateLead({ painPoints: e.target.value })}
                  placeholder="What problems are they trying to solve?"
                  rows={3}
                />
              </div>
              <div>
                <Label>General Notes</Label>
                <Textarea
                  value={lead.notes || ""}
                  onChange={(e) => updateLead({ notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Contact & Deal Info */}
        <div className="space-y-6">
          {/* Communication Panel */}
          <CommunicationPanel
            leadId={lead.id}
            contactName={lead.contactName}
            contactEmail={lead.contactEmail}
            contactPhone={lead.contactPhone}
            onActivityLogged={fetchLead}
          />

          {/* Contact Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-medium">{lead.contactName}</p>
                {lead.contactRole && (
                  <p className="text-sm text-gray-500">{lead.contactRole}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <a href={`mailto:${lead.contactEmail}`} className="block text-violet-600 hover:underline">
                  {lead.contactEmail}
                </a>
              </div>
              {lead.contactPhone && (
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <a href={`tel:${lead.contactPhone}`} className="block text-violet-600 hover:underline">
                    {lead.contactPhone}
                  </a>
                </div>
              )}
              {lead.website && (
                <div>
                  <Label className="text-xs text-gray-500">Website</Label>
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="block text-violet-600 hover:underline flex items-center gap-1">
                    {lead.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <div className="pt-2 border-t">
                <Label className="text-xs text-gray-500">Communication Stats</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-bold text-blue-600">{lead.totalCalls}</p>
                    <p className="text-xs text-gray-500">Calls</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-bold text-green-600">{lead.totalEmails}</p>
                    <p className="text-xs text-gray-500">Emails</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-bold text-purple-600">{lead.totalSms}</p>
                    <p className="text-xs text-gray-500">SMS</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Deal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Estimated Value</Label>
                <Input
                  type="number"
                  value={lead.estimatedValue || ""}
                  onChange={(e) => updateLead({ estimatedValue: parseFloat(e.target.value) || null })}
                  placeholder="$0"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Win Probability (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={lead.probability || ""}
                  onChange={(e) => updateLead({ probability: parseInt(e.target.value) || null })}
                  placeholder="0-100"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Expected Close Date</Label>
                <Input
                  type="date"
                  value={lead.expectedClose ? lead.expectedClose.split("T")[0] : ""}
                  onChange={(e) => updateLead({ expectedClose: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Next Follow-up</Label>
                <Input
                  type="date"
                  value={lead.nextFollowUpAt ? lead.nextFollowUpAt.split("T")[0] : ""}
                  onChange={(e) => updateLead({ nextFollowUpAt: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Studio Size</Label>
                <Select
                  value={lead.studioSize || ""}
                  onValueChange={(v) => updateLead({ studioSize: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 instructors</SelectItem>
                    <SelectItem value="6-15">6-15 instructors</SelectItem>
                    <SelectItem value="16-30">16-30 instructors</SelectItem>
                    <SelectItem value="30+">30+ instructors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Current Software</Label>
                <Input
                  value={lead.currentSoftware || ""}
                  onChange={(e) => updateLead({ currentSoftware: e.target.value })}
                  placeholder="What are they using now?"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Source</Label>
                <p className="text-sm">{lead.source?.replace(/_/g, " ") || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Created</Label>
                <p className="text-sm">{formatDate(lead.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Call Modal */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Log Call
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                placeholder="5"
              />
            </div>
            <div>
              <Label>Outcome</Label>
              <Select value={activityOutcome} onValueChange={setActivityOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">Connected - Spoke with contact</SelectItem>
                  <SelectItem value="voicemail">Left voicemail</SelectItem>
                  <SelectItem value="no_answer">No answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="wrong_number">Wrong number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Call Notes</Label>
              <Textarea
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                placeholder="What was discussed?"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCallModal(false)}>Cancel</Button>
            <Button 
              onClick={() => logActivity("CALL")}
              disabled={saving || !activityContent}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Log Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={activitySubject}
                onChange={(e) => setActivitySubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Email Content/Summary</Label>
              <Textarea
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                placeholder="Email content or summary..."
                rows={6}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>Cancel</Button>
            <Button 
              onClick={() => logActivity("EMAIL")}
              disabled={saving || !activityContent}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log SMS Modal */}
      <Dialog open={showSmsModal} onOpenChange={setShowSmsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Log SMS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message</Label>
              <Textarea
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                placeholder="SMS message content..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSmsModal(false)}>Cancel</Button>
            <Button 
              onClick={() => logActivity("SMS")}
              disabled={saving || !activityContent}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Add Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Note</Label>
              <Textarea
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                placeholder="Add a note..."
                rows={6}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>Cancel</Button>
            <Button 
              onClick={() => logActivity("NOTE")}
              disabled={saving || !activityContent}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-600" />
              Schedule Event for {lead.studioName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Event Title *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="e.g., Follow up call with Chris"
              />
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={newEvent.eventType} onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="demo">🎯 Demo</SelectItem>
                  <SelectItem value="meeting">📅 Meeting</SelectItem>
                  <SelectItem value="follow_up">🔄 Follow Up</SelectItem>
                  <SelectItem value="other">📌 Other</SelectItem>
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
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add notes about this event..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancel</Button>
            <Button 
              onClick={createEvent}
              disabled={saving || !newEvent.title || !newEvent.startTime}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}











