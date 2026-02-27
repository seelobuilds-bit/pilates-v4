"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, CheckCircle2, Clock3, Loader2, RefreshCcw, XCircle } from "lucide-react"

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
type RequestType = "HOLIDAY" | "SICK" | "UNPAID" | "OTHER"

interface TimeOffRequestRow {
  id: string
  status: RequestStatus
  type: RequestType
  startDate: string
  endDate: string
  isHalfDayStart: boolean
  isHalfDayEnd: boolean
  reasonText: string
  createdAt: string
  adminNotes?: string | null
  durationDays: number
  teacher: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

interface CalendarRow {
  teacherId: string
  teacherName: string
  requests: Array<{
    id: string
    type: RequestType
    status: RequestStatus
    startDate: string
    endDate: string
    durationDays: number
  }>
}

function monthString(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function getMonthRange(month: string) {
  const [yearRaw, monthRaw] = month.split("-")
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999))
  return { start, end }
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString()
}

function statusBadgeClass(status: RequestStatus) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700"
  if (status === "REJECTED") return "bg-red-100 text-red-700"
  if (status === "CANCELLED") return "bg-gray-200 text-gray-700"
  return "bg-amber-100 text-amber-700"
}

export default function StudioEmployeesTimeOffPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [month, setMonth] = useState(monthString())

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [teacherFilter, setTeacherFilter] = useState<string>("all")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")

  const [requests, setRequests] = useState<TimeOffRequestRow[]>([])
  const [calendarRows, setCalendarRows] = useState<CalendarRow[]>([])

  const monthRange = useMemo(() => getMonthRange(month), [month])

  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of requests) {
      const fullName = `${row.teacher.user.firstName} ${row.teacher.user.lastName}`
      map.set(row.teacher.id, fullName)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [requests])

  const summary = useMemo(() => {
    const now = new Date()
    const in30 = new Date()
    in30.setDate(now.getDate() + 30)

    const pending = requests.filter((item) => item.status === "PENDING").length
    const approvedThisMonth = requests.filter((item) => {
      if (item.status !== "APPROVED") return false
      const date = new Date(item.startDate)
      return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
    }).length
    const upcomingDays = requests
      .filter((item) => {
        if (item.status !== "APPROVED" && item.status !== "PENDING") return false
        const start = new Date(item.startDate)
        return start >= now && start <= in30
      })
      .reduce((sum, item) => sum + item.durationDays, 0)

    const sickUsedThisYear = requests
      .filter((item) => {
        if (item.status !== "APPROVED" || item.type !== "SICK") return false
        const date = new Date(item.startDate)
        return date.getUTCFullYear() === now.getUTCFullYear()
      })
      .reduce((sum, item) => sum + item.durationDays, 0)

    return {
      pending,
      approvedThisMonth,
      upcomingDays: Number(upcomingDays.toFixed(1)),
      sickUsedThisYear: Number(sickUsedThisYear.toFixed(1)),
    }
  }, [requests])

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const moduleRes = await fetch("/api/studio/module-access")
      if (!moduleRes.ok) {
        setModuleEnabled(false)
        return
      }

      const moduleData = await moduleRes.json()
      if (moduleData?.employeesEnabled !== true) {
        setModuleEnabled(false)
        return
      }
      setModuleEnabled(true)

      const requestsParams = new URLSearchParams()
      if (statusFilter !== "all") requestsParams.set("status", statusFilter)
      if (typeFilter !== "all") requestsParams.set("type", typeFilter)
      if (teacherFilter !== "all") requestsParams.set("teacherId", teacherFilter)
      if (startDateFilter) requestsParams.set("startDate", startDateFilter)
      if (endDateFilter) requestsParams.set("endDate", endDateFilter)

      const [requestsRes, calendarRes] = await Promise.all([
        fetch(`/api/time-off/requests${requestsParams.toString() ? `?${requestsParams.toString()}` : ""}`),
        fetch(`/api/time-off/calendar?month=${encodeURIComponent(month)}`),
      ])

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        setRequests(Array.isArray(requestsData) ? requestsData : [])
      } else {
        setRequests([])
      }

      if (calendarRes.ok) {
        const calendarData = await calendarRes.json()
        setCalendarRows(Array.isArray(calendarData?.rows) ? calendarData.rows : [])
      } else {
        setCalendarRows([])
      }
    } finally {
      if (isInitial) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    loadData(true)
  }, [])

  useEffect(() => {
    if (loading) return
    loadData(false)
  }, [statusFilter, typeFilter, teacherFilter, startDateFilter, endDateFilter, month])

  const handleDecision = async (requestId: string, action: "APPROVE" | "REJECT") => {
    const adminNotes = window.prompt("Add admin notes (optional):") || ""
    await fetch(`/api/time-off/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        adminNotes,
      }),
    })
    await loadData(false)
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!moduleEnabled) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
        <Card className="border-0 shadow-sm max-w-2xl">
          <CardContent className="p-6 space-y-3">
            <h1 className="text-xl font-semibold text-gray-900">Employees Module Disabled</h1>
            <p className="text-sm text-gray-600">
              Enable Employees in settings to manage time off requests.
            </p>
            <Link href="/studio/settings" className="text-sm font-medium text-violet-700 hover:text-violet-600">
              Open settings
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysInMonth = monthRange.end.getUTCDate()
  const dayLabels = Array.from({ length: daysInMonth }, (_, idx) => idx + 1)

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees • Time Off</h1>
          <p className="text-gray-500 mt-1">Review requests, approve/decline, and track upcoming leave.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-[170px] bg-white"
          />
          <Button variant="outline" onClick={() => loadData(false)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.approvedThisMonth}</p>
              <p className="text-sm text-gray-500">Approved This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.upcomingDays}</p>
              <p className="text-sm text-gray-500">Days Off Next 30</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.sickUsedThisYear}</p>
              <p className="text-sm text-gray-500">Sick Days Used (YTD)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Calendar Timeline</CardTitle>
          <CardDescription>Month view with teachers as rows and time-off periods as bars.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <div className="min-w-[920px]">
            <div
              className="grid gap-2 text-[10px] uppercase tracking-wide text-gray-500"
              style={{ gridTemplateColumns: "180px 1fr" }}
            >
              <div>Teacher</div>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))` }}>
                {dayLabels.map((day) => (
                  <div key={day} className="text-center">{day}</div>
                ))}
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {calendarRows.map((row) => (
                <div
                  key={row.teacherId}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: "180px 1fr" }}
                >
                  <div className="truncate text-sm font-medium text-gray-700">{row.teacherName}</div>
                  <div className="relative h-8 rounded-md bg-gray-100">
                    {row.requests.map((request) => {
                      const reqStart = new Date(request.startDate)
                      const reqEnd = new Date(request.endDate)
                      const clipStart = reqStart > monthRange.start ? reqStart : monthRange.start
                      const clipEnd = reqEnd < monthRange.end ? reqEnd : monthRange.end
                      if (clipEnd < clipStart) return null

                      const startIndex = clipStart.getUTCDate() - 1
                      const endIndex = clipEnd.getUTCDate() - 1
                      const leftPercent = (startIndex / daysInMonth) * 100
                      const widthPercent = ((endIndex - startIndex + 1) / daysInMonth) * 100
                      const colorClass =
                        request.status === "APPROVED"
                          ? "bg-emerald-500"
                          : request.status === "PENDING"
                            ? "bg-amber-500"
                            : "bg-gray-400"

                      return (
                        <div
                          key={request.id}
                          className={`absolute top-1 h-6 rounded-sm px-1 text-[10px] text-white ${colorClass}`}
                          style={{ left: `${leftPercent}%`, width: `${Math.max(widthPercent, 2)}%` }}
                          title={`${request.type} • ${request.status} • ${formatDate(request.startDate)}-${formatDate(request.endDate)}`}
                        >
                          <span className="truncate block leading-6">{request.type}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>Filter and process requests in list view.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="All status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  <SelectItem value="SICK">Sick</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Teacher</Label>
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger><SelectValue placeholder="All teachers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {teacherOptions.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            {requests.map((request) => {
              const teacherName = `${request.teacher.user.firstName} ${request.teacher.user.lastName}`
              return (
                <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{teacherName}</p>
                        <Badge className={statusBadgeClass(request.status)}>{request.status}</Badge>
                        <Badge variant="outline">{request.type}</Badge>
                        <Badge variant="secondary">{request.durationDays} day(s)</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(request.startDate)} → {formatDate(request.endDate)}
                      </p>
                      <p className="text-sm text-gray-600">{request.reasonText}</p>
                      {request.adminNotes ? (
                        <p className="text-xs text-gray-500">Admin notes: {request.adminNotes}</p>
                      ) : null}
                    </div>
                    {request.status === "PENDING" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleDecision(request.id, "APPROVE")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDecision(request.id, "REJECT")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
            {requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                No requests found for the current filters.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
