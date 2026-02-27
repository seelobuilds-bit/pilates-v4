"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock3, Loader2, Users } from "lucide-react"

interface TimeOffRequestSummary {
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  startDate: string
}

export default function StudioEmployeesOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [requestSummary, setRequestSummary] = useState<TimeOffRequestSummary[]>([])
  const [teacherCount, setTeacherCount] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [moduleRes, requestsRes, teachersRes] = await Promise.all([
          fetch("/api/studio/module-access"),
          fetch("/api/time-off/requests"),
          fetch("/api/studio/teachers"),
        ])

        if (!active) return

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

        if (requestsRes.ok) {
          const requestsData = await requestsRes.json()
          setRequestSummary(
            (Array.isArray(requestsData) ? requestsData : []).map((item) => ({
              status: item.status,
              startDate: item.startDate,
            }))
          )
        } else {
          setRequestSummary([])
        }

        if (teachersRes.ok) {
          const teachersData = await teachersRes.json()
          setTeacherCount(Array.isArray(teachersData?.teachers) ? teachersData.teachers.length : 0)
        } else {
          setTeacherCount(0)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const summary = useMemo(() => {
    const now = new Date()
    const in30Days = new Date()
    in30Days.setDate(now.getDate() + 30)

    const pending = requestSummary.filter((item) => item.status === "PENDING").length
    const approvedThisMonth = requestSummary.filter((item) => {
      if (item.status !== "APPROVED") return false
      const date = new Date(item.startDate)
      return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
    }).length
    const upcoming30Days = requestSummary.filter((item) => {
      if (item.status !== "APPROVED" && item.status !== "PENDING") return false
      const date = new Date(item.startDate)
      return date >= now && date <= in30Days
    }).length

    return { pending, approvedThisMonth, upcoming30Days }
  }, [requestSummary])

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
              Enable Employees in settings to access Time Off and Payroll.
            </p>
            <Link href="/studio/settings" className="text-sm font-medium text-violet-700 hover:text-violet-600">
              Open settings
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage staffing operations, time off, and payroll settings.</p>
        </div>
        <Badge className="bg-violet-100 text-violet-700">{teacherCount} Teachers</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
                <p className="text-sm text-gray-500">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.approvedThisMonth}</p>
                <p className="text-sm text-gray-500">Approved This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.upcoming30Days}</p>
                <p className="text-sm text-gray-500">Upcoming (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Time Off</CardTitle>
            <CardDescription>Calendar timeline, approvals, and request review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/studio/employees/time-off">
              <Button className="bg-violet-600 hover:bg-violet-700">Open Time Off</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Payroll Settings</CardTitle>
            <CardDescription>Set engagement type and pay metadata per teacher.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/studio/employees/payroll">
              <Button variant="outline">Open Payroll Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
