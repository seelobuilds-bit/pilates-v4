"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Search,
  Phone,
  Mail,
  Clock,
  Target,
  Calendar,
  ChevronRight,
  Loader2,
  Video,
  Bell,
} from "lucide-react"
import { PipelineBoard } from "@/components/sales/pipeline-board"

interface Lead {
  id: string
  studioName: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  city: string | null
  state: string | null
  status: string
  priority: string
  estimatedValue: number | null
  lastContactedAt: string | null
  nextFollowUpAt: string | null
  createdAt: string
  assignedTo: {
    user: {
      firstName: string
      lastName: string
    }
  } | null
  _count: {
    activities: number
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
  interests: string | null
  scheduledDate: string | null
  status: string
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

const PIPELINE_STAGES = LEAD_STATUSES.slice(0, 6)

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-600" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "HOT", label: "Hot", color: "bg-red-100 text-red-700" },
]

export default function SalesDashboardPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("pipeline")
  const [leads, setLeads] = useState<Lead[]>([])
  const [demos, setDemos] = useState<DemoBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, demosRes] = await Promise.all([
        fetch(`/api/sales/leads?status=${statusFilter}&search=${searchQuery}`),
        fetch("/api/sales/demos")
      ])

      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
      }
      if (demosRes.ok) {
        const data = await demosRes.json()
        setDemos([...(data.demos || []), ...(data.unassignedDemos || [])])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const moveLeadToStage = async (leadId: string, newStatus: string) => {
    try {
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, status: newStatus } : l
      ))

      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Failed to move lead:", error)
      fetchData()
    }
  }

  const getStatusColor = (status: string) => {
    return LEAD_STATUSES.find(s => s.value === status)?.color || "bg-gray-500"
  }

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.color || "bg-gray-100 text-gray-700"
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
  }

  // Calculations
  const getStageLeads = (status: string) => leads.filter(l => l.status === status)
  const getStageValue = (status: string) => getStageLeads(status).reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
  const wonLeads = leads.filter(l => l.status === "WON")
  const lostLeads = leads.filter(l => l.status === "LOST")
  const totalPipelineValue = leads.filter(l => !["WON", "LOST"].includes(l.status)).reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
  const totalWonValue = leads.filter(l => l.status === "WON").reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
  const pendingDemos = demos.filter(d => d.status === "pending")
  const scheduledDemos = demos.filter(d => d.status === "scheduled")

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
            My Sales Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Welcome back, {session?.user?.firstName}! Here&apos;s your pipeline.</p>
        </div>
        <Link href="/sales/calendar">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            My Calendar
          </Button>
        </Link>
      </div>

      {/* Upcoming Demos Alert */}
      {scheduledDemos.length > 0 && (
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-violet-50 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900 text-lg">
                  {scheduledDemos.length} Upcoming Demo{scheduledDemos.length > 1 ? "s" : ""}
                </h3>
                <p className="text-purple-700 text-sm">Check your calendar for scheduled demo calls</p>
              </div>
              <Link href="/sales/demos">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  View Demos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">My Leads</p>
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
            <p className="text-2xl font-bold mt-1 text-purple-600">{pendingDemos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Won Deals</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{wonLeads.length}</p>
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
            My Demos
            {pendingDemos.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingDemos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pipeline View */}
        <TabsContent value="pipeline">
          <div className="mb-4 p-2 bg-violet-50 rounded-lg border border-violet-200">
            <p className="text-sm text-violet-700 flex items-center gap-2">
              <span>💡</span>
              <span>Drag and drop leads between stages to update their status</span>
            </p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            <PipelineBoard
              leads={leads.filter(l => !["WON", "LOST"].includes(l.status))}
              stages={PIPELINE_STAGES}
              onLeadMove={moveLeadToStage}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getPriorityColor={getPriorityColor}
              basePath="/sales/leads"
            />

            {/* Won Column */}
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
                      <Link key={lead.id} href={`/sales/leads/${lead.id}`}>
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
                      <Link key={lead.id} href={`/sales/leads/${lead.id}`}>
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
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No leads assigned to you yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Lead</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Follow Up</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{lead.studioName}</p>
                            {lead.city && lead.state && (
                              <p className="text-sm text-gray-500">{lead.city}, {lead.state}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{lead.contactName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <a href={`mailto:${lead.contactEmail}`} className="text-gray-400 hover:text-violet-600">
                              <Mail className="h-4 w-4" />
                            </a>
                            {lead.contactPhone && (
                              <a href={`tel:${lead.contactPhone}`} className="text-gray-400 hover:text-violet-600">
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusColor(lead.status)} text-white`}>
                            {lead.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{formatCurrency(lead.estimatedValue)}</span>
                        </td>
                        <td className="p-4">
                          {lead.nextFollowUpAt ? (
                            <span className={`text-sm flex items-center gap-1 ${
                              new Date(lead.nextFollowUpAt) < new Date() ? "text-red-600" : "text-gray-600"
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatDate(lead.nextFollowUpAt)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Not set</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Link href={`/sales/leads/${lead.id}`}>
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

        {/* Demos View */}
        <TabsContent value="demos">
          <div className="space-y-6">
            {/* Pending Demos */}
            {pendingDemos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-600" />
                  Needs Scheduling ({pendingDemos.length})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {pendingDemos.map(demo => (
                    <Card key={demo.id} className="border-2 border-yellow-200 bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold">{demo.studioName}</h4>
                            <p className="text-sm text-gray-600">{demo.contactName}</p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><Mail className="h-3 w-3 inline mr-1" />{demo.contactEmail}</p>
                          {demo.contactPhone && <p><Phone className="h-3 w-3 inline mr-1" />{demo.contactPhone}</p>}
                        </div>
                        {demo.interests && (
                          <p className="text-sm text-gray-500 mt-3 italic">&quot;{demo.interests}&quot;</p>
                        )}
                        <div className="mt-4">
                          <Link href="/sales/demos">
                            <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700">
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule Demo
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Demos */}
            {scheduledDemos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-600" />
                  Upcoming Demos ({scheduledDemos.length})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {scheduledDemos.map(demo => (
                    <Card key={demo.id} className="border-2 border-purple-200 bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold">{demo.studioName}</h4>
                            <p className="text-sm text-gray-600">{demo.contactName}</p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>
                        </div>
                        <p className="text-lg font-semibold text-purple-600">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {demo.scheduledDate ? new Date(demo.scheduledDate).toLocaleString() : "-"}
                        </p>
                        <div className="mt-4">
                          <Link href="/sales/demos">
                            <Button size="sm" variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Demos */}
            {demos.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No demo requests assigned to you yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}











