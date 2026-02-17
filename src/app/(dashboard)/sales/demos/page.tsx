"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Video,
  Calendar,
  Clock,
  Loader2,
  Mail,
  Phone,
  Building2,
  ExternalLink,
  CheckCircle,
  XCircle,
  UserPlus,
  Bell,
  Sparkles
} from "lucide-react"

interface Demo {
  id: string
  studioName: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  studioSize: string | null
  interests: string | null
  scheduledDate: string | null
  meetingLink: string | null
  status: string
  outcome: string | null
  notes: string | null
  lead: {
    id: string
    studioName: string
    status: string
  } | null
  createdAt: string
}

export default function SalesDemosPage() {
  const [demos, setDemos] = useState<Demo[]>([])
  const [unassignedDemos, setUnassignedDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(true)
  const [schedulingDemo, setSchedulingDemo] = useState<Demo | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [saving, setSaving] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)

  const fetchDemos = useCallback(async () => {
    try {
      const res = await fetch("/api/sales/demos")
      if (res.ok) {
        const data = await res.json()
        setDemos(data.demos || [])
        setUnassignedDemos(data.unassignedDemos || [])
      }
    } catch (error) {
      console.error("Failed to fetch demos:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDemos()
  }, [fetchDemos])

  const claimDemo = async (demoId: string) => {
    try {
      setClaiming(demoId)
      const res = await fetch("/api/sales/demos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoId,
          action: "claim"
        })
      })
      if (res.ok) {
        fetchDemos()
      }
    } catch (error) {
      console.error("Failed to claim demo:", error)
    } finally {
      setClaiming(null)
    }
  }

  const scheduleDemo = async () => {
    if (!schedulingDemo || !scheduleDate) return

    try {
      setSaving(true)
      const res = await fetch("/api/sales/demos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoId: schedulingDemo.id,
          scheduledDate: scheduleDate,
          meetingLink: meetingLink || null,
          status: "scheduled"
        })
      })
      if (res.ok) {
        setSchedulingDemo(null)
        setScheduleDate("")
        setMeetingLink("")
        fetchDemos()
      }
    } catch (error) {
      console.error("Failed to schedule demo:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateDemoStatus = async (demoId: string, status: string, outcome?: string) => {
    try {
      setSaving(true)
      const res = await fetch("/api/sales/demos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId, status, outcome })
      })
      if (res.ok) {
        fetchDemos()
      }
    } catch (error) {
      console.error("Failed to update demo:", error)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })
  }

  const pendingDemos = demos.filter(d => d.status === "pending")
  const scheduledDemos = demos.filter(d => d.status === "scheduled")
  const completedDemos = demos.filter(d => d.status === "completed" || d.status === "cancelled" || d.status === "no_show")

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Video className="h-7 w-7 text-purple-600" />
            Demo Requests
          </h1>
          <p className="text-gray-500 mt-1">Manage your demo calls</p>
        </div>
      </div>

      {/* New Inbound Demos Alert */}
      {unassignedDemos.length > 0 && (
        <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-600 animate-pulse" />
                  <h3 className="font-bold text-green-900 text-lg">
                    {unassignedDemos.length} New Demo Request{unassignedDemos.length > 1 ? "s" : ""} Available!
                  </h3>
                </div>
                <p className="text-green-700 text-sm">Claim these demos to add them to your pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-600">Available to Claim</p>
            <p className="text-2xl font-bold text-green-700">{unassignedDemos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-600">My Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{pendingDemos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">Scheduled</p>
            <p className="text-2xl font-bold text-blue-700">{scheduledDemos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-700">{completedDemos.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Demos - Available to Claim */}
      {unassignedDemos.length > 0 && (
        <Card className="border-2 border-green-200 shadow-sm mb-6">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-600" />
              New Demo Requests - Claim Yours!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              {unassignedDemos.map(demo => (
                <Card key={demo.id} className="border border-green-200 bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{demo.studioName}</h4>
                        <p className="text-sm text-gray-600">{demo.contactName}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">New</Badge>
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
                      <p className="text-sm text-gray-500 mt-3 italic border-l-2 border-green-200 pl-3">
                        &quot;{demo.interests}&quot;
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <span className="text-xs text-gray-400">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(demo.createdAt)}
                      </span>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => claimDemo(demo.id)}
                        disabled={claiming === demo.id}
                      >
                        {claiming === demo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Claim Demo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Demos */}
      {pendingDemos.length > 0 && (
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Needs Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y md:hidden">
              {pendingDemos.map(demo => (
                <div key={demo.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{demo.studioName}</p>
                      <p className="text-sm text-gray-600">{demo.contactName}</p>
                      <p className="text-xs text-gray-500">{demo.contactEmail}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(demo.createdAt)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <span>Size: {demo.studioSize || "-"}</span>
                    <span className="truncate">Interest: {demo.interests || "-"}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setSchedulingDemo(demo)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Studio</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Contact</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Size</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Interests</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Requested</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingDemos.map(demo => (
                  <tr key={demo.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{demo.studioName}</td>
                    <td className="p-4">
                      <p className="text-sm">{demo.contactName}</p>
                      <p className="text-xs text-gray-500">{demo.contactEmail}</p>
                    </td>
                    <td className="p-4 text-sm">{demo.studioSize || "-"}</td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{demo.interests || "-"}</td>
                    <td className="p-4 text-sm text-gray-500">{formatDate(demo.createdAt)}</td>
                    <td className="p-4">
                      <Button 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setSchedulingDemo(demo)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Demos */}
      {scheduledDemos.length > 0 && (
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Upcoming Demos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y md:hidden">
              {scheduledDemos.map(demo => (
                <div key={demo.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{demo.studioName}</p>
                      <p className="text-sm text-gray-600">{demo.contactName}</p>
                    </div>
                    <p className="text-sm font-medium text-blue-600">{formatDate(demo.scheduledDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${demo.contactEmail}`} className="text-gray-400 hover:text-violet-600">
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                    {demo.contactPhone && (
                      <a href={`tel:${demo.contactPhone}`} className="text-gray-400 hover:text-violet-600">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {demo.meetingLink ? (
                      <a href={demo.meetingLink} target="_blank" rel="noopener noreferrer" className="ml-auto text-violet-600 hover:underline text-sm flex items-center gap-1">
                        Join <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="ml-auto text-sm text-gray-400">No link</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-green-600 border-green-300"
                      onClick={() => updateDemoStatus(demo.id, "completed", "successful")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-300"
                      onClick={() => updateDemoStatus(demo.id, "no_show")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      No Show
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Studio</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Contact</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Scheduled</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500">Meeting Link</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scheduledDemos.map(demo => (
                  <tr key={demo.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{demo.studioName}</td>
                    <td className="p-4">
                      <p className="text-sm">{demo.contactName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <a href={`mailto:${demo.contactEmail}`} className="text-gray-400 hover:text-violet-600">
                          <Mail className="h-3 w-3" />
                        </a>
                        {demo.contactPhone && (
                          <a href={`tel:${demo.contactPhone}`} className="text-gray-400 hover:text-violet-600">
                            <Phone className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-blue-600">{formatDate(demo.scheduledDate)}</p>
                    </td>
                    <td className="p-4">
                      {demo.meetingLink ? (
                        <a href={demo.meetingLink} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline text-sm flex items-center gap-1">
                          Join <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-300"
                          onClick={() => updateDemoStatus(demo.id, "completed", "successful")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-300"
                          onClick={() => updateDemoStatus(demo.id, "no_show")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          No Show
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Demos */}
      {demos.length === 0 && unassignedDemos.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No demo requests available</p>
            <p className="text-sm text-gray-400 mt-2">New demos from the website will appear here</p>
          </CardContent>
        </Card>
      )}

      {/* Schedule Demo Dialog */}
      <Dialog open={!!schedulingDemo} onOpenChange={() => setSchedulingDemo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Schedule Demo
            </DialogTitle>
          </DialogHeader>
          {schedulingDemo && (
            <div className="space-y-4 py-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold">{schedulingDemo.studioName}</h3>
                <p className="text-sm text-gray-600">{schedulingDemo.contactName}</p>
                <p className="text-sm text-gray-500">{schedulingDemo.contactEmail}</p>
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Meeting Link (optional)</Label>
                <Input
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSchedulingDemo(null)}>Cancel</Button>
            <Button 
              onClick={scheduleDemo}
              disabled={saving || !scheduleDate}
              className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule Demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}










