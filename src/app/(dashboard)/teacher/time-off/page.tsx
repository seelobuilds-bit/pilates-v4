"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, Loader2, Plus, XCircle } from "lucide-react"

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
type RequestType = "HOLIDAY" | "SICK" | "UNPAID" | "OTHER"

interface TimeOffRequest {
  id: string
  status: RequestStatus
  type: RequestType
  startDate: string
  endDate: string
  isHalfDayStart: boolean
  isHalfDayEnd: boolean
  reasonText: string
  durationDays: number
  adminNotes?: string | null
  createdAt: string
}

interface BalanceResponse {
  isPaidLeaveTracked?: boolean
  balance: {
    annualLeaveEntitledDays: number
    annualLeaveUsedDays: number
    annualLeaveRemainingDays: number
    sickPaidEntitledDays: number
    sickPaidUsedDays: number
    sickPaidRemainingDays: number
  }
}

function statusBadgeClass(status: RequestStatus) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700"
  if (status === "REJECTED") return "bg-red-100 text-red-700"
  if (status === "CANCELLED") return "bg-gray-200 text-gray-700"
  return "bg-amber-100 text-amber-700"
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString()
}

export default function TeacherTimeOffPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [balance, setBalance] = useState<BalanceResponse["balance"] | null>(null)
  const [isPaidLeaveTracked, setIsPaidLeaveTracked] = useState(true)

  const [formType, setFormType] = useState<RequestType>("HOLIDAY")
  const [formStartDate, setFormStartDate] = useState("")
  const [formEndDate, setFormEndDate] = useState("")
  const [formHalfDayStart, setFormHalfDayStart] = useState(false)
  const [formHalfDayEnd, setFormHalfDayEnd] = useState(false)
  const [formReasonText, setFormReasonText] = useState("")

  const load = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      const [moduleRes, requestsRes, balanceRes] = await Promise.all([
        fetch("/api/studio/module-access"),
        fetch("/api/time-off/requests"),
        fetch("/api/time-off/balance"),
      ])

      if (!moduleRes.ok) {
        setModuleEnabled(false)
        return
      }
      const moduleData = await moduleRes.json()
      if (moduleData?.timeOffEnabled !== true) {
        setModuleEnabled(false)
        return
      }
      setModuleEnabled(true)

      if (requestsRes.ok) {
        const requestData = await requestsRes.json()
        setRequests(Array.isArray(requestData) ? requestData : [])
      } else {
        setRequests([])
      }

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        setBalance(balanceData?.balance ?? null)
        setIsPaidLeaveTracked(balanceData?.isPaidLeaveTracked !== false)
      } else {
        setBalance(null)
        setIsPaidLeaveTracked(true)
      }
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    load(true)
  }, [])

  const canSubmit = useMemo(
    () => formReasonText.trim().length >= 2 && formStartDate.length > 0 && formEndDate.length > 0,
    [formEndDate, formReasonText, formStartDate]
  )

  const submitRequest = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await fetch("/api/time-off/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          startDate: formStartDate,
          endDate: formEndDate,
          isHalfDayStart: formHalfDayStart,
          isHalfDayEnd: formHalfDayEnd,
          reasonText: formReasonText.trim(),
        }),
      })

      setFormReasonText("")
      setFormHalfDayStart(false)
      setFormHalfDayEnd(false)
      await load(false)
    } finally {
      setSubmitting(false)
    }
  }

  const cancelPending = async (requestId: string) => {
    await fetch(`/api/time-off/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL" }),
    })
    await load(false)
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
            <h1 className="text-xl font-semibold text-gray-900">Time Off Not Enabled</h1>
            <p className="text-sm text-gray-600">
              Your studio has not enabled the Time Off module yet.
            </p>
            <Link href="/teacher" className="text-sm font-medium text-violet-700 hover:text-violet-600">
              Return to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Off</h1>
        <p className="text-gray-500 mt-1">Request leave, monitor status, and track your allowance balance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>My Balance</CardTitle>
            <CardDescription>
              {isPaidLeaveTracked
                ? "Current yearly entitlement, usage, and remaining totals."
                : "Contractor mode: requests are tracked for approval only (no paid leave accrual)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPaidLeaveTracked ? (
              <>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-700">Annual Leave</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Entitled: {balance?.annualLeaveEntitledDays ?? 0} days
                  </p>
                  <p className="text-sm text-gray-600">Used: {balance?.annualLeaveUsedDays ?? 0} days</p>
                  <p className={`text-sm font-semibold ${(balance?.annualLeaveRemainingDays ?? 0) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    Remaining: {balance?.annualLeaveRemainingDays ?? 0} days
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-700">Paid Sick Leave</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Entitled: {balance?.sickPaidEntitledDays ?? 0} days
                  </p>
                  <p className="text-sm text-gray-600">Used: {balance?.sickPaidUsedDays ?? 0} days</p>
                  <p className={`text-sm font-semibold ${(balance?.sickPaidRemainingDays ?? 0) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    Remaining: {balance?.sickPaidRemainingDays ?? 0} days
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
                As a contractor, you can submit time-off requests, but paid leave balances are not applied.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Request Time Off</CardTitle>
            <CardDescription>Submit a new request for owner approval.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formType} onValueChange={(value) => setFormType(value as RequestType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  <SelectItem value="SICK">Sick</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formStartDate} onChange={(event) => setFormStartDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formEndDate} onChange={(event) => setFormEndDate(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                <Label htmlFor="half-day-start">Half Day (Start)</Label>
                <Switch id="half-day-start" checked={formHalfDayStart} onCheckedChange={setFormHalfDayStart} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                <Label htmlFor="half-day-end">Half Day (End)</Label>
                <Switch id="half-day-end" checked={formHalfDayEnd} onCheckedChange={setFormHalfDayEnd} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason / Notes</Label>
              <Textarea
                value={formReasonText}
                onChange={(event) => setFormReasonText(event.target.value)}
                placeholder="Reason for the request..."
              />
            </div>

            <Button onClick={submitRequest} disabled={!canSubmit || submitting} className="bg-violet-600 hover:bg-violet-700">
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Submit Request
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>View status history and cancel pending requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(request.startDate)} → {formatDate(request.endDate)}
                    </p>
                    <Badge className={statusBadgeClass(request.status)}>{request.status}</Badge>
                    <Badge variant="outline">{request.type}</Badge>
                    <Badge variant="secondary">{request.durationDays} day(s)</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{request.reasonText}</p>
                  {request.adminNotes ? (
                    <p className="text-xs text-gray-500">Admin notes: {request.adminNotes}</p>
                  ) : null}
                </div>

                {request.status === "PENDING" ? (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => cancelPending(request.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {requests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
              You have no time off requests yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
