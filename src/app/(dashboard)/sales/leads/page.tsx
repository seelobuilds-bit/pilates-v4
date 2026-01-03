"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Calendar,
  ChevronRight,
  Loader2,
  Target,
  Clock,
  DollarSign
} from "lucide-react"

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
  _count: {
    activities: number
    tasks: number
  }
}

const LEAD_STATUSES = [
  { value: "NEW", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "CONTACTED", label: "Contacted", color: "bg-cyan-100 text-cyan-700" },
  { value: "DEMO_REQUESTED", label: "Demo Requested", color: "bg-pink-100 text-pink-700" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-indigo-100 text-indigo-700" },
  { value: "DEMO_SCHEDULED", label: "Demo Scheduled", color: "bg-purple-100 text-purple-700" },
  { value: "DEMO_COMPLETED", label: "Demo Completed", color: "bg-violet-100 text-violet-700" },
  { value: "WON", label: "Won", color: "bg-green-100 text-green-700" },
  { value: "LOST", label: "Lost", color: "bg-red-100 text-red-700" },
]

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (searchQuery) params.set("search", searchQuery)

      const res = await fetch(`/api/sales/leads?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const getStatusColor = (status: string) => {
    return LEAD_STATUSES.find(s => s.value === status)?.color || "bg-gray-100 text-gray-700"
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

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "-"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

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
            My Leads
          </h1>
          <p className="text-gray-500 mt-1">Manage your assigned leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-2xl font-bold">{leads.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Need Follow-up</p>
            <p className="text-2xl font-bold text-orange-600">
              {leads.filter(l => l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= new Date()).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pipeline Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(leads.filter(l => !["WON", "LOST"].includes(l.status)).reduce((sum, l) => sum + (l.estimatedValue || 0), 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Won</p>
            <p className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.status === "WON").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No leads assigned to you</p>
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
                      <div>
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
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                        {lead.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={`text-xs ${getPriorityColor(lead.priority)}`}>
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
    </div>
  )
}









