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

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  dueDate: string
  completedAt: string | null
  assignedTo: {
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
  tasks: Task[]
}

interface Agent {
  id: string
  user: {
    firstName: string
    lastName: string
  }
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
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Activity modals
  const [showCallModal, setShowCallModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  
  // Activity forms
  const [activityContent, setActivityContent] = useState("")
  const [activitySubject, setActivitySubject] = useState("")
  const [activityOutcome, setActivityOutcome] = useState("")
  const [callDuration, setCallDuration] = useState("")
  
  // Task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    type: "follow_up",
    priority: "MEDIUM",
    dueDate: ""
  })

  // Convert to studio
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertSubdomain, setConvertSubdomain] = useState("")
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState("")

  const fetchLead = useCallback(async () => {
    try {
      const [leadRes, agentsRes] = await Promise.all([
        fetch(`/api/hq/sales/leads/${leadId}`),
        fetch("/api/hq/sales/agents")
      ])

      if (leadRes.ok) {
        const data = await leadRes.json()
        setLead(data.lead)
      }
      if (agentsRes.ok) {
        const data = await agentsRes.json()
        setAgents(data.agents || [])
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
      const res = await fetch(`/api/hq/sales/leads/${leadId}`, {
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
      const res = await fetch(`/api/hq/sales/leads/${leadId}/activities`, {
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

  const createTask = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/hq/sales/leads/${leadId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask)
      })

      if (res.ok) {
        setShowTaskModal(false)
        setNewTask({ title: "", description: "", type: "follow_up", priority: "MEDIUM", dueDate: "" })
        fetchLead()
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setSaving(false)
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/hq/sales/leads/${leadId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: "COMPLETED" })
      })

      if (res.ok) {
        fetchLead()
      }
    } catch (error) {
      console.error("Failed to complete task:", error)
    }
  }

  const convertToStudio = async () => {
    if (!convertSubdomain.trim()) {
      setConvertError("Subdomain is required")
      return
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(convertSubdomain.toLowerCase())) {
      setConvertError("Subdomain can only contain lowercase letters, numbers, and hyphens")
      return
    }

    setConverting(true)
    setConvertError("")

    try {
      const res = await fetch(`/api/hq/sales/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: convertSubdomain.toLowerCase() })
      })

      const data = await res.json()

      if (res.ok) {
        alert(`🎉 Studio created successfully!\n\nStudio: ${data.studioName}\nSubdomain: ${data.subdomain}\n\n${data.emailSent ? "Welcome email sent!" : "Note: Email failed to send. Setup URL: " + data.setupUrl}`)
        setShowConvertModal(false)
        setConvertSubdomain("")
        fetchLead()
      } else {
        setConvertError(data.error || "Failed to convert lead")
      }
    } catch (error) {
      console.error("Failed to convert lead:", error)
      setConvertError("Failed to convert lead")
    } finally {
      setConverting(false)
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
        <p>Lead not found</p>
      </div>
    )
  }

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
                <Select
                  value={lead.assignedTo?.id || ""}
                  onValueChange={(v) => updateLead({ assignedToId: v })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Assign to agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.user.firstName} {a.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Convert to Studio button - show when status allows */}
                {!lead.convertedStudioId && (lead.status === "WON" || lead.status === "DEMO_COMPLETED" || lead.status === "NEGOTIATING") && (
                  <Button 
                    onClick={() => {
                      // Suggest subdomain from studio name
                      const suggested = lead.studioName
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                      setConvertSubdomain(suggested)
                      setShowConvertModal(true)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 ml-auto"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Convert to Studio
                  </Button>
                )}
                
                {lead.convertedStudioId && (
                  <Link href={`/hq/studios/${lead.convertedStudioId}`} className="ml-auto">
                    <Button variant="outline" className="text-emerald-600 border-emerald-200">
                      <Building2 className="h-4 w-4 mr-2" />
                      View Studio
                    </Button>
                  </Link>
                )}
                
                {saving && <Loader2 className="h-4 w-4 animate-spin text-violet-600 ml-2" />}
              </div>
            </CardContent>
          </Card>

          {/* Activity & Tasks Tabs */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Activity ({lead.activities.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({lead.tasks.filter(t => t.status !== "COMPLETED").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {lead.activities.length === 0 ? (
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

            <TabsContent value="tasks">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Tasks</CardTitle>
                  <Button size="sm" onClick={() => setShowTaskModal(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </CardHeader>
                <CardContent>
                  {lead.tasks.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No tasks yet</p>
                  ) : (
                    <div className="space-y-3">
                      {lead.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            task.status === "COMPLETED" ? "bg-gray-50 opacity-60" : "bg-white"
                          }`}
                        >
                          <button
                            onClick={() => task.status !== "COMPLETED" && completeTask(task.id)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              task.status === "COMPLETED" 
                                ? "bg-green-500 border-green-500" 
                                : "border-gray-300 hover:border-green-500"
                            }`}
                          >
                            {task.status === "COMPLETED" && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${task.status === "COMPLETED" ? "line-through text-gray-500" : ""}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                Due: {formatDate(task.dueDate)}
                              </span>
                              <Badge className="text-xs">{task.type}</Badge>
                            </div>
                          </div>
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
                <p className="text-sm">{lead.source.replace(/_/g, " ")}</p>
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

      {/* Add Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Task Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Follow up call"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newTask.type} onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button 
              onClick={createTask}
              disabled={saving || !newTask.title || !newTask.dueDate}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Studio Modal */}
      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Active Studio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-700">
                <strong>🎉 Congratulations on closing this deal!</strong><br />
                This will create an active studio account and send the owner a welcome email with login setup instructions.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Studio Name</Label>
              <Input value={lead?.studioName || ""} disabled className="bg-gray-50" />
            </div>
            
            <div className="space-y-2">
              <Label>Owner Email</Label>
              <Input value={lead?.contactEmail || ""} disabled className="bg-gray-50" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subdomain">Studio Subdomain *</Label>
              <div className="flex">
                <Input
                  id="subdomain"
                  value={convertSubdomain}
                  onChange={(e) => {
                    setConvertSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    setConvertError("")
                  }}
                  placeholder="zenith-pilates"
                  className="rounded-r-none"
                />
                <span className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-500">
                  .thecurrent.app
                </span>
              </div>
              <p className="text-xs text-gray-500">
                This will be their booking URL: {convertSubdomain || "subdomain"}.thecurrent.app
              </p>
            </div>
            
            {convertError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {convertError}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConvertModal(false)}>Cancel</Button>
            <Button 
              onClick={convertToStudio}
              disabled={converting || !convertSubdomain.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {converting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Studio...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Studio & Send Welcome
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}













