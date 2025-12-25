"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
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
  Users,
  Plus,
  Search,
  Upload,
  Phone,
  Mail,
  Building2,
  Clock,
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
  Loader2,
  User,
  CheckCircle,
  Video,
  Bell,
  UserPlus,
  MessageSquare,
  ArrowRight,
  ExternalLink
} from "lucide-react"
import { PipelineBoard } from "@/components/sales/pipeline-board"

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
  status: string
  source: string
  priority: string
  estimatedValue: number | null
  probability: number | null
  expectedClose: string | null
  lastContactedAt: string | null
  nextFollowUpAt: string | null
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
  _count: {
    activities: number
    tasks: number
  }
}

interface Agent {
  id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  title: string | null
  isActive: boolean
  totalLeads: number
  totalWon: number
  totalLost: number
  totalRevenue: number
  _count: {
    leads: number
    tasks: number
  }
}

interface DemoBooking {
  id: string
  studioName: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  studioSize: string | null
  currentSoftware: string | null
  interests: string | null
  referralSource: string | null
  scheduledDate: string | null
  status: string
  assignedTo: {
    id: string
    user: { firstName: string; lastName: string }
  } | null
  lead: { id: string; studioName: string; status: string } | null
  createdAt: string
}

const LEAD_STATUSES = [
  { value: "NEW", label: "New", color: "bg-blue-500" },
  { value: "CONTACTED", label: "Contacted", color: "bg-cyan-500" },
  { value: "DEMO_REQUESTED", label: "Demo Requested", color: "bg-pink-500" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-indigo-500" },
  { value: "DEMO_SCHEDULED", label: "Demo Scheduled", color: "bg-purple-500" },
  { value: "DEMO_COMPLETED", label: "Demo Completed", color: "bg-violet-500" },
  { value: "WON", label: "Won", color: "bg-green-500" },
  { value: "LOST", label: "Lost", color: "bg-red-500" },
]

// Pipeline stages (active deals only - excludes won/lost)
const PIPELINE_STAGES = LEAD_STATUSES.slice(0, 6)

const LEAD_SOURCES = [
  { value: "INBOUND_WEBSITE", label: "Website" },
  { value: "INBOUND_DEMO", label: "Demo Request" },
  { value: "OUTBOUND_COLD", label: "Cold Outreach" },
  { value: "OUTBOUND_EMAIL", label: "Email Campaign" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "EVENT", label: "Event" },
  { value: "OTHER", label: "Other" },
]

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-600" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "HOT", label: "Hot", color: "bg-red-100 text-red-700" },
]

export default function HQSalesCRMPage() {
  const [activeTab, setActiveTab] = useState("pipeline")
  const [leads, setLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [demos, setDemos] = useState<DemoBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [showAddLead, setShowAddLead] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showAssignDemo, setShowAssignDemo] = useState<DemoBooking | null>(null)
  const [saving, setSaving] = useState(false)

  // New lead form
  const [newLead, setNewLead] = useState({
    studioName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactRole: "",
    city: "",
    state: "",
    source: "OTHER",
    priority: "MEDIUM",
    currentSoftware: "",
    studioSize: "",
    notes: "",
    estimatedValue: "",
    assignedToId: ""
  })

  // Import data
  const [importData, setImportData] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, agentsRes, demosRes] = await Promise.all([
        fetch(`/api/hq/sales/leads?status=${statusFilter}&source=${sourceFilter}&assignedToId=${assigneeFilter}&search=${searchQuery}`),
        fetch("/api/hq/sales/agents"),
        fetch("/api/hq/sales/demos")
      ])

      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
      }
      if (agentsRes.ok) {
        const data = await agentsRes.json()
        setAgents(data.agents || [])
      }
      if (demosRes.ok) {
        const data = await demosRes.json()
        setDemos(data.demos || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter, assigneeFilter, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createLead = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/hq/sales/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLead,
          estimatedValue: newLead.estimatedValue ? parseFloat(newLead.estimatedValue) : null
        })
      })

      if (res.ok) {
        setShowAddLead(false)
        setNewLead({
          studioName: "", contactName: "", contactEmail: "", contactPhone: "",
          contactRole: "", city: "", state: "", source: "OTHER", priority: "MEDIUM",
          currentSoftware: "", studioSize: "", notes: "", estimatedValue: "", assignedToId: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create lead:", error)
    } finally {
      setSaving(false)
    }
  }

  const importLeads = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/hq/sales/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: importData })
      })

      if (res.ok) {
        setShowImport(false)
        setImportData("")
        fetchData()
      }
    } catch (error) {
      console.error("Failed to import leads:", error)
    } finally {
      setSaving(false)
    }
  }

  const moveLeadToStage = async (leadId: string, newStatus: string) => {
    try {
      // Optimistically update UI
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, status: newStatus } : l
      ))

      const res = await fetch(`/api/hq/sales/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        // Revert on failure
        fetchData()
      }
    } catch (error) {
      console.error("Failed to move lead:", error)
      fetchData()
    }
  }

  const assignDemo = async (demoId: string, agentId: string) => {
    try {
      setSaving(true)
      const res = await fetch("/api/hq/sales/demos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId, assignedToId: agentId })
      })

      if (res.ok) {
        setShowAssignDemo(null)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to assign demo:", error)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
  }

  const getStatusColor = (status: string) => {
    return LEAD_STATUSES.find(s => s.value === status)?.color || "bg-gray-500"
  }

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.color || "bg-gray-100 text-gray-700"
  }

  // Pipeline calculations
  const getStageLeads = (status: string) => leads.filter(l => l.status === status)
  const getStageValue = (status: string) => getStageLeads(status).reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
  const wonLeads = leads.filter(l => l.status === "WON")
  const lostLeads = leads.filter(l => l.status === "LOST")
  
  const totalPipelineValue = leads.filter(l => !["WON", "LOST"].includes(l.status)).reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
  const totalWonValue = leads.filter(l => l.status === "WON").reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
  const pendingDemos = demos.filter(d => d.status === "pending" && !d.assignedTo)
  const unassignedLeads = leads.filter(l => !l.assignedTo)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="h-7 w-7 text-violet-600" />
            Sales CRM
          </h1>
          <p className="text-gray-500 mt-1">Manage leads, demos, and your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/hq/sales/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowAddLead(true)} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Alert Banners */}
      {(pendingDemos.length > 0 || unassignedLeads.length > 0) && (
        <div className="space-y-3 mb-6">
          {/* New Demo Requests */}
          {pendingDemos.length > 0 && (
            <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-violet-50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-purple-600 animate-pulse" />
                      <h3 className="font-bold text-purple-900 text-lg">
                        {pendingDemos.length} New Demo Request{pendingDemos.length > 1 ? "s" : ""}!
                      </h3>
                    </div>
                    <p className="text-purple-700 text-sm">Assign to sales agents to follow up immediately</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pendingDemos.slice(0, 2).map(demo => (
                      <Button
                        key={demo.id}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setShowAssignDemo(demo)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {demo.studioName.length > 15 ? demo.studioName.substring(0, 15) + "..." : demo.studioName}
                      </Button>
                    ))}
                    {pendingDemos.length > 2 && (
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("demos")}>
                        +{pendingDemos.length - 2} more
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unassigned Leads */}
          {unassignedLeads.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3 flex items-center gap-3">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  {unassignedLeads.length} lead{unassignedLeads.length > 1 ? "s" : ""} need{unassignedLeads.length === 1 ? "s" : ""} to be assigned
                </span>
                <Button variant="outline" size="sm" className="ml-auto border-orange-300 text-orange-700" onClick={() => setAssigneeFilter("unassigned")}>
                  View Unassigned
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Leads</p>
            <p className="text-2xl font-bold mt-1">{leads.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pipeline Value</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(totalPipelineValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Demos</p>
            <p className="text-2xl font-bold mt-1 text-purple-600">{demos.filter(d => d.status === "pending").length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Won Deals</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{leads.filter(l => l.status === "WON").length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Won Revenue</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalWonValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pipeline" className="px-6">Pipeline</TabsTrigger>
          <TabsTrigger value="leads" className="px-6">All Leads</TabsTrigger>
          <TabsTrigger value="demos" className="px-6 relative">
            Demo Requests
            {pendingDemos.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingDemos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="agents" className="px-6">Sales Team</TabsTrigger>
        </TabsList>

        {/* Pipeline View */}
        <TabsContent value="pipeline">
          {/* Draggable Pipeline Board */}
          <div className="mb-4 p-2 bg-violet-50 rounded-lg border border-violet-200">
            <p className="text-sm text-violet-700 flex items-center gap-2">
              <span>💡</span>
              <span>Drag and drop leads between stages to update their status</span>
            </p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Active Pipeline with Drag & Drop */}
            <PipelineBoard
              leads={leads.filter(l => !["WON", "LOST"].includes(l.status))}
              stages={PIPELINE_STAGES}
              onLeadMove={moveLeadToStage}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getPriorityColor={getPriorityColor}
              basePath="/hq/sales/leads"
            />

            {/* Won Column (static - final state) */}
            <div className="flex-shrink-0 w-72">
              <div className="h-2 bg-green-500 rounded-t-lg" />
              <Card className="rounded-t-none border-t-0 bg-green-50">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-700">🎉 Won</CardTitle>
                    <Badge className="bg-green-500 text-white">{wonLeads.length}</Badge>
                  </div>
                  <p className="text-xs text-green-600">{formatCurrency(getStageValue("WON"))}</p>
                </CardHeader>
                <CardContent className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                  {wonLeads.length === 0 ? (
                    <p className="text-xs text-green-400 text-center py-4">No won deals yet</p>
                  ) : (
                    wonLeads.map(lead => (
                      <Link key={lead.id} href={`/hq/sales/leads/${lead.id}`}>
                        <div className="p-3 bg-white border border-green-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <p className="font-medium text-sm truncate">{lead.studioName}</p>
                          <p className="text-xs text-gray-500 truncate">{lead.contactName}</p>
                          {lead.estimatedValue && (
                            <p className="text-sm font-semibold text-green-600 mt-2">{formatCurrency(lead.estimatedValue)}</p>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lost Column */}
            <div className="flex-shrink-0 w-72">
              <div className="h-2 bg-red-500 rounded-t-lg" />
              <Card className="rounded-t-none border-t-0 bg-red-50">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-red-700">Lost</CardTitle>
                    <Badge className="bg-red-500 text-white">{lostLeads.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                  {lostLeads.length === 0 ? (
                    <p className="text-xs text-red-400 text-center py-4">No lost deals</p>
                  ) : (
                    lostLeads.map(lead => (
                      <Link key={lead.id} href={`/hq/sales/leads/${lead.id}`}>
                        <div className="p-3 bg-white border border-red-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <p className="font-medium text-sm truncate">{lead.studioName}</p>
                          <p className="text-xs text-gray-500 truncate">{lead.contactName}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* All Leads View */}
        <TabsContent value="leads">
          {/* Filters */}
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leads..."
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {LEAD_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {LEAD_SOURCES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.user.firstName} {agent.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No leads found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Lead</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{lead.studioName}</p>
                            <p className="text-sm text-gray-500">{lead.contactName} • {lead.contactEmail}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusColor(lead.status)} text-white`}>
                            {lead.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{formatCurrency(lead.estimatedValue)}</span>
                        </td>
                        <td className="p-4">
                          {lead.assignedTo ? (
                            <span className="text-sm">{lead.assignedTo.user.firstName} {lead.assignedTo.user.lastName}</span>
                          ) : (
                            <span className="text-sm text-orange-500">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {LEAD_SOURCES.find(s => s.value === lead.source)?.label || lead.source}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{formatDate(lead.createdAt)}</td>
                        <td className="p-4">
                          <Link href={`/hq/sales/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demo Requests View */}
        <TabsContent value="demos">
          <div className="space-y-6">
            {/* Pending Demos */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Needs Assignment ({demos.filter(d => d.status === "pending" && !d.assignedTo).length})
              </h3>
              {demos.filter(d => d.status === "pending" && !d.assignedTo).length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-8 text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                    All demo requests have been assigned!
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {demos.filter(d => d.status === "pending" && !d.assignedTo).map(demo => (
                    <Card key={demo.id} className="border-2 border-purple-200 bg-white hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{demo.studioName}</h4>
                            <p className="text-sm text-gray-600">{demo.contactName}</p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700">New</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {demo.contactEmail}
                          </div>
                          {demo.contactPhone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4" />
                              {demo.contactPhone}
                            </div>
                          )}
                          {demo.studioSize && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="h-4 w-4" />
                              {demo.studioSize} instructors
                            </div>
                          )}
                        </div>
                        {demo.interests && (
                          <p className="text-sm text-gray-500 mt-3 italic border-l-2 border-purple-200 pl-3">
                            "{demo.interests}"
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <span className="text-xs text-gray-400">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDate(demo.createdAt)}
                          </span>
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => setShowAssignDemo(demo)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign Agent
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Demos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Demo Requests ({demos.length})</h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Studio</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Requested</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {demos.map(demo => (
                        <tr key={demo.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium">{demo.studioName}</td>
                          <td className="p-4 text-sm text-gray-600">{demo.contactName}</td>
                          <td className="p-4">
                            <Badge className={
                              demo.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              demo.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                              demo.status === "completed" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-700"
                            }>
                              {demo.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {demo.assignedTo ? (
                              <span className="text-sm">{demo.assignedTo.user.firstName} {demo.assignedTo.user.lastName}</span>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-purple-600 border-purple-300"
                                onClick={() => setShowAssignDemo(demo)}
                              >
                                Assign
                              </Button>
                            )}
                          </td>
                          <td className="p-4 text-sm">{demo.scheduledDate ? formatDate(demo.scheduledDate) : "-"}</td>
                          <td className="p-4 text-sm text-gray-500">{formatDate(demo.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Sales Team View */}
        <TabsContent value="agents">
          <div className="grid grid-cols-3 gap-6">
            {agents.map(agent => (
              <Card key={agent.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-lg font-medium text-violet-700">
                      {agent.user.firstName[0]}{agent.user.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.user.firstName} {agent.user.lastName}</h3>
                      <p className="text-sm text-gray-500">{agent.title || "Sales Agent"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-violet-600">{agent._count.leads}</p>
                      <p className="text-xs text-gray-500">Active Leads</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-600">{agent.totalWon}</p>
                      <p className="text-xs text-gray-500">Won Deals</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Revenue Generated</span>
                      <span className="font-semibold text-green-600">{formatCurrency(agent.totalRevenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Lead Modal */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Studio Name *</Label>
                <Input
                  value={newLead.studioName}
                  onChange={(e) => setNewLead({ ...newLead, studioName: e.target.value })}
                  placeholder="Pilates Plus"
                />
              </div>
              <div>
                <Label>Contact Name *</Label>
                <Input
                  value={newLead.contactName}
                  onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Email *</Label>
                <Input
                  type="email"
                  value={newLead.contactEmail}
                  onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })}
                  placeholder="john@pilatesplus.com"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={newLead.contactPhone}
                  onChange={(e) => setNewLead({ ...newLead, contactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={newLead.city}
                  onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                  placeholder="Los Angeles"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={newLead.state}
                  onChange={(e) => setNewLead({ ...newLead, state: e.target.value })}
                  placeholder="CA"
                />
              </div>
              <div>
                <Label>Contact Role</Label>
                <Input
                  value={newLead.contactRole}
                  onChange={(e) => setNewLead({ ...newLead, contactRole: e.target.value })}
                  placeholder="Owner"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Source</Label>
                <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={newLead.priority} onValueChange={(v) => setNewLead({ ...newLead, priority: v })}>
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
              <div>
                <Label>Assign To</Label>
                <Select value={newLead.assignedToId} onValueChange={(v) => setNewLead({ ...newLead, assignedToId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.user.firstName} {agent.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Studio Size</Label>
                <Select value={newLead.studioSize} onValueChange={(v) => setNewLead({ ...newLead, studioSize: v })}>
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
                <Label>Estimated Deal Value ($)</Label>
                <Input
                  type="number"
                  value={newLead.estimatedValue}
                  onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddLead(false)}>Cancel</Button>
            <Button 
              onClick={createLead}
              disabled={saving || !newLead.studioName || !newLead.contactName || !newLead.contactEmail}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Paste your leads in CSV format: <code className="bg-gray-100 px-1 rounded">Name, Email, Phone, Studio Name</code>
            </p>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="John Doe, john@example.com, 555-1234, Pilates Plus
Jane Smith, jane@studio.com, 555-5678, Core Fitness"
              rows={10}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button 
              onClick={importLeads}
              disabled={saving || !importData.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Demo Modal */}
      <Dialog open={!!showAssignDemo} onOpenChange={() => setShowAssignDemo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              Assign Demo Request
            </DialogTitle>
          </DialogHeader>
          {showAssignDemo && (
            <div className="space-y-4 py-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">{showAssignDemo.studioName}</h3>
                <p className="text-sm text-gray-600">{showAssignDemo.contactName} • {showAssignDemo.contactEmail}</p>
                {showAssignDemo.contactPhone && (
                  <p className="text-sm text-gray-600">{showAssignDemo.contactPhone}</p>
                )}
                {showAssignDemo.studioSize && (
                  <p className="text-sm text-gray-500 mt-2">Studio Size: {showAssignDemo.studioSize}</p>
                )}
                {showAssignDemo.interests && (
                  <p className="text-sm text-gray-600 mt-2 italic">"{showAssignDemo.interests}"</p>
                )}
              </div>
              <div>
                <Label>Assign to Sales Agent</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {agents.map(agent => (
                    <Button
                      key={agent.id}
                      variant="outline"
                      className="justify-start h-auto p-3"
                      onClick={() => assignDemo(showAssignDemo.id, agent.id)}
                      disabled={saving}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-700">
                          {agent.user.firstName[0]}{agent.user.lastName[0]}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium">{agent.user.firstName} {agent.user.lastName}</p>
                          <p className="text-xs text-gray-500">{agent.title || "Sales Agent"} • {agent._count.leads} leads</p>
                        </div>
                        <UserPlus className="h-4 w-4 text-gray-400" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
