"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Save, 
  Loader2,
  Clock,
  MapPin,
  Users,
  Star,
  TrendingUp,
  BarChart3,
  DollarSign,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Ban,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Teacher {
  id: string
  bio: string | null
  specialties: string[]
  isActive: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  upcomingClasses: ClassSession[]
  stats: {
    totalClasses: number
    totalStudents: number
    averageRating: number
    thisMonth: number
  }
}

interface ClassSession {
  id: string
  startTime: string
  endTime: string
  classType: { name: string }
  location: { name: string }
  _count: { bookings: number }
  capacity: number
}

interface TeacherStats {
  revenue: number
  retentionRate: number
  avgClassSize: number
  completionRate: number
  classBreakdown: { name: string; count: number }[]
  locationBreakdown: { name: string; count: number }[]
  monthlyClasses: { month: string; count: number }[]
  recentReviews: { clientName: string; rating: number; comment: string; date: string }[]
  topClients: { name: string; bookings: number }[]
}

const emptyTeacherStats: TeacherStats = {
  revenue: 0,
  retentionRate: 0,
  avgClassSize: 0,
  completionRate: 0,
  classBreakdown: [],
  locationBreakdown: [],
  monthlyClasses: [],
  recentReviews: [],
  topClients: []
}

interface BlockedTime {
  id: string
  startTime: string
  endTime: string
  reason: string | null
}

interface PayRate {
  type: "PER_CLASS" | "PER_HOUR" | "PER_STUDENT" | "PERCENTAGE"
  rate: number
  currency: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: "DRAFT" | "PENDING" | "SENT" | "PAID" | "CANCELLED"
  periodStart: string
  periodEnd: string
  lineItems: { description: string; quantity: number; rate: number; amount: number }[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  sentAt: string | null
  paidAt: string | null
  createdAt: string
}

export default function TeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [specialtiesInput, setSpecialtiesInput] = useState("")
  const [extendedStats, setExtendedStats] = useState<TeacherStats | null>(null)
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0)
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([])
  
  // Invoice state
  const [payRate, setPayRate] = useState<PayRate>({ type: "PER_CLASS", rate: 0, currency: "USD" })
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [savingPayRate, setSavingPayRate] = useState(false)

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const res = await fetch(`/api/studio/teachers/${resolvedParams.teacherId}`)
        if (res.ok) {
          const data = await res.json()
          setTeacher(data)
          setSpecialtiesInput(data.specialties?.join(", ") || "")
          setExtendedStats(data.extendedStats || emptyTeacherStats)
        }
      } catch (error) {
        console.error("Failed to fetch teacher:", error)
      }
      setLoading(false)
    }
    fetchTeacher()
  }, [resolvedParams.teacherId])

  // Fetch blocked times when week offset changes
  useEffect(() => {
    async function fetchBlockedTimes() {
      try {
        const today = new Date()
        const currentDay = today.getDay()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - currentDay + (scheduleWeekOffset * 7))
        startOfWeek.setHours(0, 0, 0, 0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const res = await fetch(
          `/api/studio/teachers/${resolvedParams.teacherId}/blocked-times?start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
        )
        if (res.ok) {
          const data = await res.json()
          setBlockedTimes(data)
        }
      } catch (error) {
        console.error("Failed to fetch blocked times:", error)
      }
    }
    fetchBlockedTimes()
  }, [resolvedParams.teacherId, scheduleWeekOffset])

  // Fetch pay rate and invoices
  useEffect(() => {
    async function fetchPayRateAndInvoices() {
      try {
        const [payRateRes, invoicesRes] = await Promise.all([
          fetch(`/api/studio/teachers/${resolvedParams.teacherId}/pay-rate`),
          fetch(`/api/studio/teachers/${resolvedParams.teacherId}/invoices`)
        ])
        
        if (payRateRes.ok) {
          const data = await payRateRes.json()
          setPayRate(data)
        }
        
        if (invoicesRes.ok) {
          const data = await invoicesRes.json()
          setInvoices(data)
        }
      } catch (error) {
        console.error("Failed to fetch pay rate/invoices:", error)
      }
    }
    fetchPayRateAndInvoices()
  }, [resolvedParams.teacherId])

  async function savePayRate() {
    setSavingPayRate(true)
    try {
      const res = await fetch(`/api/studio/teachers/${resolvedParams.teacherId}/pay-rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payRate)
      })
      if (!res.ok) throw new Error("Failed to save")
    } catch (error) {
      console.error("Failed to save pay rate:", error)
    }
    setSavingPayRate(false)
  }

  async function markInvoicePaid(invoiceId: string) {
    try {
      const res = await fetch(`/api/studio/teachers/${resolvedParams.teacherId}/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" })
      })
      if (res.ok) {
        const updated = await res.json()
        setInvoices(invoices.map(inv => inv.id === invoiceId ? updated : inv))
      }
    } catch (error) {
      console.error("Failed to update invoice:", error)
    }
  }

  const handleSave = async () => {
    if (!teacher) return
    setSaving(true)

    try {
      const specialties = specialtiesInput
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const res = await fetch(`/api/studio/teachers/${resolvedParams.teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: teacher.bio,
          specialties,
          isActive: teacher.isActive
        })
      })

      if (res.ok) {
        router.push("/studio/teachers")
      }
    } catch (error) {
      console.error("Failed to save:", error)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Teacher not found</p>
          <Link href="/studio/teachers">
            <Button variant="outline">Back to Teachers</Button>
          </Link>
        </div>
      </div>
    )
  }

  const safeExtendedStats = extendedStats || emptyTeacherStats
  const hasTeacherReportData =
    safeExtendedStats.revenue > 0 ||
    safeExtendedStats.classBreakdown.length > 0 ||
    safeExtendedStats.locationBreakdown.length > 0 ||
    safeExtendedStats.monthlyClasses.some((month) => month.count > 0)

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/teachers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Teachers
        </Link>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-xl font-semibold text-violet-700">
              {teacher.user.firstName[0]}{teacher.user.lastName[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">
                {teacher.user.firstName} {teacher.user.lastName}
              </h1>
              <p className="text-gray-500 flex items-center gap-1 truncate">
                <Mail className="h-4 w-4" />
                {teacher.user.email}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto">
            <Badge variant={teacher.isActive ? "success" : "secondary"} className="text-sm">
              {teacher.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className={`w-full sm:w-auto ${teacher.isActive ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
              onClick={async () => {
                if (!confirm(teacher.isActive 
                  ? "Remove access? This teacher won't be able to log in or see their schedule." 
                  : "Restore access? This teacher will be able to log in again.")) return
                try {
                  const res = await fetch(`/api/studio/teachers/${resolvedParams.teacherId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: !teacher.isActive })
                  })
                  if (res.ok) {
                    setTeacher({ ...teacher, isActive: !teacher.isActive })
                  }
                } catch (error) {
                  console.error("Failed to update teacher:", error)
                }
              }}
            >
              <Ban className="h-4 w-4 mr-1" />
              {teacher.isActive ? "Remove Access" : "Restore Access"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
              onClick={async () => {
                if (!confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) return
                try {
                  const res = await fetch(`/api/studio/teachers/${resolvedParams.teacherId}`, {
                    method: "DELETE"
                  })
                  if (res.ok) {
                    router.push("/studio/teachers")
                  } else {
                    const data = await res.json()
                    alert(data.error || "Failed to delete teacher")
                  }
                } catch (error) {
                  console.error("Failed to delete teacher:", error)
                  alert("Failed to delete teacher")
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {hasTeacherReportData && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teacher.stats.totalClasses}</p>
                <p className="text-sm text-gray-500">Total Classes</p>
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
                <p className="text-2xl font-bold text-gray-900">{teacher.stats.totalStudents}</p>
                <p className="text-sm text-gray-500">Students Taught</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {teacher.stats.averageRating > 0 ? teacher.stats.averageRating.toFixed(1) : "N/A"}
                </p>
                <p className="text-sm text-gray-500">Avg. Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${safeExtendedStats.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Revenue Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="app-scrollbar w-full justify-start overflow-x-auto bg-white shadow-sm border-0">
          <TabsTrigger value="reports" className="shrink-0 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="schedule" className="shrink-0 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="profile" className="shrink-0 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Users className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="invoices" className="shrink-0 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {extendedStats && hasTeacherReportData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-emerald-600">{safeExtendedStats.retentionRate}%</p>
                      <p className="text-sm text-emerald-700">Client Retention</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-600">{safeExtendedStats.avgClassSize}</p>
                      <p className="text-sm text-blue-700">Avg. Class Size</p>
                    </div>
                    <div className="p-4 bg-violet-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-violet-600">{safeExtendedStats.completionRate}%</p>
                      <p className="text-sm text-violet-700">Completion Rate</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-amber-600">{teacher.stats.thisMonth}</p>
                      <p className="text-sm text-amber-700">Classes This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Class Breakdown */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Classes Taught</h3>
                  </div>
                  <div className="space-y-3">
                    {safeExtendedStats.classBreakdown.map((cls, i) => {
                      const total = safeExtendedStats.classBreakdown.reduce((a, c) => a + c.count, 0)
                      const pct = Math.round((cls.count / total) * 100)
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                            <span className="text-sm text-gray-500">{cls.count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-violet-500 h-2 rounded-full" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Location Breakdown */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Location Split</h3>
                  </div>
                  <div className="space-y-3">
                    {safeExtendedStats.locationBreakdown.map((loc, i) => {
                      const total = safeExtendedStats.locationBreakdown.reduce((a, l) => a + l.count, 0)
                      const pct = Math.round((loc.count / total) * 100)
                      return (
                        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900 truncate">{loc.name}</span>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold text-gray-900">{loc.count}</p>
                            <p className="text-xs text-gray-500">{pct}%</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Clients */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Top Clients</h3>
                  </div>
                  <div className="space-y-3">
                    {safeExtendedStats.topClients.map((client, i) => (
                      <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-medium">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-900 truncate">{client.name}</span>
                        </div>
                        <span className="text-gray-500">{client.bookings} bookings</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews */}
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Recent Reviews</h3>
                  </div>
                  <div className="space-y-4">
                    {safeExtendedStats.recentReviews.map((review, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-gray-900">{review.clientName}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, j) => (
                                <Star 
                                  key={j} 
                                  className={`h-4 w-4 ${j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Classes Chart */}
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Classes Over Time</h3>
                  </div>
                  <div className="flex items-end justify-between h-32 gap-2 sm:gap-4">
                    {safeExtendedStats.monthlyClasses.map((month, i) => {
                      const maxCount = Math.max(...safeExtendedStats.monthlyClasses.map(m => m.count))
                      const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{month.count}</span>
                          <div 
                            className="w-full bg-violet-500 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-gray-500">{month.month}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {(!extendedStats || !hasTeacherReportData) && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10 text-center">
                <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No report data yet</h3>
                <p className="text-gray-500">
                  This teacher has no tracked class activity yet, so reporting is empty.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {/* Schedule Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{teacher.upcomingClasses.length}</p>
                <p className="text-sm text-gray-500">Classes This Week</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {teacher.upcomingClasses.reduce((sum, c) => sum + c._count.bookings, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-violet-600">
                  {teacher.upcomingClasses.length > 0 
                    ? Math.round(teacher.upcomingClasses.reduce((sum, c) => sum + (c._count.bookings / c.capacity) * 100, 0) / teacher.upcomingClasses.length)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">Avg. Fill Rate</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {teacher.upcomingClasses.reduce((sum, c) => sum + c.capacity, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Capacity</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Calendar View */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{teacher.user.firstName}&apos;s Weekly Schedule</h2>
                  <p className="text-sm text-gray-500">
                    {scheduleWeekOffset === 0 ? "This week" : scheduleWeekOffset > 0 ? `${scheduleWeekOffset} week${scheduleWeekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(scheduleWeekOffset)} week${Math.abs(scheduleWeekOffset) > 1 ? 's' : ''} ago`}
                  </p>
                </div>
                <Link href={`/studio/schedule?teacher=${resolvedParams.teacherId}`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Full Schedule
                  </Button>
                </Link>
              </div>

              {/* Week Navigation */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setScheduleWeekOffset(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {scheduleWeekOffset !== 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setScheduleWeekOffset(0)}
                    >
                      Today
                    </Button>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setScheduleWeekOffset(prev => prev + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Calendar Grid */}
              {(() => {
                // Get week dates based on offset
                const today = new Date()
                const currentDay = today.getDay()
                const startOfWeek = new Date(today)
                startOfWeek.setDate(today.getDate() - currentDay + (scheduleWeekOffset * 7))
                
                const weekDates: Date[] = []
                for (let i = 0; i < 7; i++) {
                  const date = new Date(startOfWeek)
                  date.setDate(startOfWeek.getDate() + i)
                  weekDates.push(date)
                }

                // Filter classes for this week and group by day
                const weekStart = weekDates[0]
                const weekEnd = new Date(weekDates[6])
                weekEnd.setHours(23, 59, 59, 999)
                
                const classesByDay: Record<number, typeof teacher.upcomingClasses> = {
                  0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
                }
                teacher.upcomingClasses.forEach(cls => {
                  const classDate = new Date(cls.startTime)
                  // Only include classes within the displayed week
                  if (classDate >= weekStart && classDate <= weekEnd) {
                    const day = classDate.getDay()
                    classesByDay[day].push(cls)
                  }
                })

                // Group blocked times by day
                const blockedByDay: Record<number, BlockedTime[]> = {
                  0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
                }
                blockedTimes.forEach(bt => {
                  const btDate = new Date(bt.startTime)
                  if (btDate >= weekStart && btDate <= weekEnd) {
                    const day = btDate.getDay()
                    blockedByDay[day].push(bt)
                  }
                })

                // Sort classes by time within each day
                Object.keys(classesByDay).forEach(day => {
                  classesByDay[parseInt(day)].sort((a, b) => 
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                  )
                })

                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

                // Format date range for display
                const formatDateRange = () => {
                  const start = weekDates[0]
                  const end = weekDates[6]
                  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
                  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
                  if (startMonth === endMonth) {
                    return `${startMonth} ${start.getDate()} - ${end.getDate()}`
                  }
                  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`
                }

                return (
                  <>
                    <p className="text-center text-sm font-medium text-gray-700 mb-4">{formatDateRange()}</p>
                    <div className="space-y-3 md:hidden">
                      {weekDates.map((date, dayIndex) => {
                        const isToday = today.toDateString() === date.toDateString()
                        return (
                          <div key={dayIndex} className="rounded-xl border bg-white p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-semibold ${isToday ? "text-violet-700" : "text-gray-900"}`}>
                                {dayNames[dayIndex]} {date.getDate()}
                              </p>
                              {blockedByDay[dayIndex].length > 0 && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                  <Ban className="h-2.5 w-2.5 mr-1" />
                                  Blocked
                                </Badge>
                              )}
                            </div>

                            {blockedByDay[dayIndex].map((bt) => (
                              <div key={bt.id} className="p-2 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                                <p className="text-xs text-red-700 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(bt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} -
                                  {new Date(bt.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </p>
                              </div>
                            ))}

                            {classesByDay[dayIndex].length > 0 ? (
                              <div className="space-y-2">
                                {classesByDay[dayIndex].map((cls) => (
                                  <Link key={cls.id} href={`/studio/schedule/${cls.id}`}>
                                    <div className="p-2 bg-violet-50 rounded-lg border-l-4 border-l-violet-500 hover:bg-violet-100 transition-colors">
                                      <p className="font-medium text-xs text-gray-900 truncate">{cls.classType.name}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ) : blockedByDay[dayIndex].length === 0 ? (
                              <p className="text-xs text-gray-400">No classes</p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>

                    <div className="hidden md:grid grid-cols-7 gap-3">
                      {/* Day Headers */}
                      {weekDates.map((date, i) => {
                        const isToday = today.toDateString() === date.toDateString()
                        const hasBlockedTime = blockedByDay[i].length > 0
                        return (
                          <div 
                            key={i}
                            className={`text-center p-3 rounded-xl ${
                              isToday ? 'bg-violet-100' : hasBlockedTime ? 'bg-red-50' : 'bg-gray-50'
                            }`}
                          >
                            <p className={`text-xs font-medium ${
                              isToday ? 'text-violet-600' : hasBlockedTime ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {dayNames[i]}
                            </p>
                            <p className={`text-lg font-bold ${
                              isToday ? 'text-violet-600' : hasBlockedTime ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {date.getDate()}
                            </p>
                            {hasBlockedTime && (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 mt-1">
                                <Ban className="h-2.5 w-2.5 mr-1" />
                                Blocked
                              </Badge>
                            )}
                          </div>
                        )
                      })}

                      {/* Classes and Blocked Times for each day */}
                      {weekDates.map((_, dayIndex) => (
                        <div key={dayIndex} className="space-y-2 min-h-[200px]">
                          {/* Blocked Times */}
                          {blockedByDay[dayIndex].map((bt) => (
                            <div key={bt.id} className="p-2 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                              <div className="flex items-center gap-1 text-red-600">
                                <Ban className="h-3 w-3" />
                                <span className="text-xs font-medium">Blocked</span>
                              </div>
                              <p className="text-xs text-red-700 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {new Date(bt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - 
                                {new Date(bt.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </p>
                              {bt.reason && (
                                <p className="text-xs text-red-500 mt-1 truncate">{bt.reason}</p>
                              )}
                            </div>
                          ))}
                          
                          {/* Classes */}
                          {classesByDay[dayIndex].length > 0 ? (
                            classesByDay[dayIndex].map((cls) => (
                              <Link
                                key={cls.id}
                                href={`/studio/schedule/${cls.id}`}
                              >
                                <div
                                  className="p-2 bg-violet-50 rounded-lg border-l-4 border-l-violet-500 hover:bg-violet-100 transition-colors cursor-pointer"
                                >
                                  <p className="font-medium text-xs text-gray-900 truncate">{cls.classType.name}</p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate mt-1">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {cls.location.name}
                                  </p>
                                  <p className={`text-xs mt-1 font-medium ${
                                    cls._count.bookings >= cls.capacity ? 'text-red-500' : 'text-emerald-500'
                                  }`}>
                                    {cls._count.bookings}/{cls.capacity} booked
                                  </p>
                                </div>
                              </Link>
                            ))
                          ) : blockedByDay[dayIndex].length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-xs text-gray-400">No classes</p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Profile Details</h2>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Link href="/studio/teachers">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">Cancel</Button>
                  </Link>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={teacher.user.firstName} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={teacher.user.lastName} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={teacher.user.email} disabled className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={teacher.bio || ""}
                    onChange={(e) => setTeacher({ ...teacher, bio: e.target.value })}
                    placeholder="Tell clients about this teacher's background and teaching style..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Specialties</Label>
                  <Input
                    value={specialtiesInput}
                    onChange={(e) => setSpecialtiesInput(e.target.value)}
                    placeholder="e.g., Reformer, Mat, Prenatal (comma separated)"
                  />
                  <p className="text-xs text-gray-500">Separate multiple specialties with commas</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Active Status</p>
                    <p className="text-sm text-gray-500">Allow this teacher to be assigned to classes</p>
                  </div>
                  <Switch
                    checked={teacher.isActive}
                    onCheckedChange={(checked) => setTeacher({ ...teacher, isActive: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Pay Rate Configuration */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Payment Rate</h3>
                </div>
                <Button
                  size="sm"
                  onClick={savePayRate}
                  disabled={savingPayRate}
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
                >
                  {savingPayRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Rate
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select
                    value={payRate.type}
                    onValueChange={(value) => setPayRate({ ...payRate, type: value as PayRate["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_CLASS">Per Class</SelectItem>
                      <SelectItem value="PER_HOUR">Per Hour</SelectItem>
                      <SelectItem value="PER_STUDENT">Per Student</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage of Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rate ({payRate.type === "PERCENTAGE" ? "%" : "$"})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={payRate.rate}
                    onChange={(e) => setPayRate({ ...payRate, rate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={payRate.currency}
                    onValueChange={(value) => setPayRate({ ...payRate, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {payRate.type === "PER_CLASS" && `This teacher earns $${payRate.rate.toFixed(2)} per class taught.`}
                  {payRate.type === "PER_HOUR" && `This teacher earns $${payRate.rate.toFixed(2)} per hour.`}
                  {payRate.type === "PER_STUDENT" && `This teacher earns $${payRate.rate.toFixed(2)} per student that attends.`}
                  {payRate.type === "PERCENTAGE" && `This teacher earns ${payRate.rate}% of class revenue.`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Submitted Invoices */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Submitted Invoices</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Teachers create and submit invoices from their portal
                </p>
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No invoices submitted yet</p>
                  <p className="text-sm text-gray-400">This teacher hasn&apos;t submitted any invoices</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          invoice.status === "PAID" ? "bg-emerald-100" :
                          invoice.status === "PENDING" ? "bg-amber-100" :
                          invoice.status === "SENT" ? "bg-blue-100" :
                          invoice.status === "DRAFT" ? "bg-gray-200" : "bg-red-100"
                        }`}>
                          {invoice.status === "PAID" ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          ) : invoice.status === "PENDING" ? (
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                          ) : invoice.status === "SENT" ? (
                            <Send className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{invoice.invoiceNumber}</p>
                            <Badge
                              className={`text-xs ${
                                invoice.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                                invoice.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                invoice.status === "SENT" ? "bg-blue-100 text-blue-700" :
                                invoice.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {invoice.status === "PENDING" ? "Pending Review" : invoice.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-gray-900">${invoice.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {invoice.lineItems?.length || 0} classes
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {(invoice.status === "SENT" || invoice.status === "PENDING") && (
                            <Button
                              size="sm"
                              onClick={() => markInvoicePaid(invoice.id)}
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          {invoice.status === "PAID" && invoice.paidAt && (
                            <span className="text-xs text-emerald-600">
                              Paid {new Date(invoice.paidAt).toLocaleDateString()}
                            </span>
                          )}
                          <Button size="sm" variant="ghost" className="w-full sm:w-auto">
                            <Eye className="h-4 w-4" />
                          </Button>
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
    </div>
  )
}
