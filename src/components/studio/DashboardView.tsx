"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  TrendingUp,
  ArrowRight,
  Mail,
  Star,
  Activity,
  BarChart3,
  Target,
  Zap,
  UserPlus,
  CalendarPlus,
  MessageSquare,
  ChevronRight,
  CheckCircle,
  XCircle,
  GripVertical,
  Eye,
  EyeOff,
  Settings2,
} from "lucide-react"
import { DashboardData } from "./types"

interface DashboardViewProps {
  data: DashboardData
  linkPrefix?: string // "/studio" or "/demo"
}

type WidgetId =
  | "overview"
  | "stats"
  | "quickActions"
  | "todaySchedule"
  | "atRisk"
  | "comingUp"
  | "recentActivity"
  | "studioStats"

const STORAGE_KEY = "studio-dashboard-layout-v1"

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  "overview",
  "stats",
  "quickActions",
  "todaySchedule",
  "atRisk",
  "comingUp",
  "recentActivity",
  "studioStats",
]

function reorderWidgets(order: WidgetId[], draggedId: WidgetId, targetId: WidgetId) {
  if (draggedId === targetId) return order
  const next = [...order]
  const draggedIndex = next.indexOf(draggedId)
  const targetIndex = next.indexOf(targetId)
  if (draggedIndex === -1 || targetIndex === -1) return order
  next.splice(draggedIndex, 1)
  next.splice(targetIndex, 0, draggedId)
  return next
}

export function DashboardView({ data, linkPrefix = "/studio" }: DashboardViewProps) {
  const now = new Date()
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER)
  const [hiddenWidgets, setHiddenWidgets] = useState<WidgetId[]>([])
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null)
  const [showLayoutControls, setShowLayoutControls] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as { order?: WidgetId[]; hidden?: WidgetId[] }
      const storedOrder = parsed.order ?? []
      const validStoredOrder = storedOrder.filter((id): id is WidgetId => DEFAULT_WIDGET_ORDER.includes(id))
      const missing = DEFAULT_WIDGET_ORDER.filter((id) => !validStoredOrder.includes(id))
      const mergedOrder = [...validStoredOrder, ...missing]

      const storedHidden = (parsed.hidden ?? []).filter((id): id is WidgetId => DEFAULT_WIDGET_ORDER.includes(id))

      setWidgetOrder(mergedOrder)
      setHiddenWidgets(storedHidden)
    } catch {
      setWidgetOrder(DEFAULT_WIDGET_ORDER)
      setHiddenWidgets([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        order: widgetOrder,
        hidden: hiddenWidgets,
      })
    )
  }, [widgetOrder, hiddenWidgets])

  const visibleWidgets = useMemo(
    () => widgetOrder.filter((widget) => !hiddenWidgets.includes(widget)),
    [widgetOrder, hiddenWidgets]
  )

  const toggleWidgetVisibility = (widget: WidgetId) => {
    setHiddenWidgets((prev) =>
      prev.includes(widget) ? prev.filter((id) => id !== widget) : [...prev, widget]
    )
  }

  const widgetMeta: Record<WidgetId, { title: string; className?: string }> = {
    overview: { title: "Today's Overview", className: "lg:col-span-3" },
    stats: { title: "Stats", className: "lg:col-span-3" },
    quickActions: { title: "Quick Actions", className: "lg:col-span-3" },
    todaySchedule: { title: "Today's Schedule", className: "lg:col-span-2" },
    atRisk: { title: "Needs Attention", className: "lg:col-span-1" },
    comingUp: { title: "Coming Up", className: "lg:col-span-1" },
    recentActivity: { title: "Recent Activity", className: "lg:col-span-1" },
    studioStats: { title: "Studio Stats", className: "lg:col-span-1" },
  }

  const renderWidget = (widgetId: WidgetId) => {
    switch (widgetId) {
      case "overview":
        return (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-600 to-purple-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-lg font-semibold mb-1">Today&apos;s Overview</h2>
                  <p className="text-violet-200 text-sm">
                    {data.todayOverview.classCount} classes scheduled • {data.todayOverview.bookingsCount} bookings • {data.todayOverview.fillRate}% fill rate
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 border-r border-white/20">
                    <p className="text-3xl font-bold text-white">{data.todayOverview.classCount}</p>
                    <p className="text-xs text-violet-200">Classes</p>
                  </div>
                  <div className="text-center px-4 border-r border-white/20">
                    <p className="text-3xl font-bold text-white">{data.todayOverview.bookingsCount}</p>
                    <p className="text-xs text-violet-200">Bookings</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-3xl font-bold text-white">{data.todayOverview.fillRate}%</p>
                    <p className="text-xs text-violet-200">Fill Rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "stats":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${data.stats.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-sm mt-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">+{data.stats.revenueChange}%</span>
                      <span className="text-gray-400">vs last month</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Active Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.activeClients}</p>
                    <p className="text-sm mt-1.5 flex items-center gap-1">
                      <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-blue-500 font-medium">+{data.stats.newClientsThisWeek}</span>
                      <span className="text-gray-400">this week</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.weekBookings} bookings</p>
                    <p className="text-sm mt-1.5 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-violet-500 font-medium">{data.stats.todayBookings}</span>
                      <span className="text-gray-400">today</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">At Risk</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.atRiskClientsCount} clients</p>
                    <p className="text-sm mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-amber-500 font-medium">{data.stats.churnRate}%</span>
                      <span className="text-gray-400">churn rate</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "quickActions":
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href={`${linkPrefix}/inbox`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Messages</p>
                    <p className="text-xs text-gray-500">View inbox</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`${linkPrefix}/marketing`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Marketing</p>
                    <p className="text-xs text-gray-500">Campaigns</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`${linkPrefix}/reports`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Reports</p>
                    <p className="text-xs text-gray-500">Analytics</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`${linkPrefix}/settings`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Settings</p>
                    <p className="text-xs text-gray-500">Configure</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )

      case "todaySchedule":
        return (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Today&apos;s Schedule</h3>
                    <p className="text-sm text-gray-500">{data.todayClasses.length} classes today</p>
                  </div>
                </div>
                <Link href={`${linkPrefix}/schedule`} className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                  View full schedule
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {data.todayClasses.length > 0 ? (
                <div className="space-y-3">
                  {data.todayClasses.map((cls) => {
                    const startTime = new Date(cls.startTime)
                    const isPast = startTime < now
                    const fillPercent = Math.round((cls._count.bookings / cls.capacity) * 100)

                    return (
                      <Link key={cls.id} href={`${linkPrefix}/schedule/${cls.id}`}>
                        <div className={`flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer ${
                          isPast ? "bg-gray-50 opacity-60" : "bg-gray-50 hover:bg-violet-50"
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`text-center min-w-[60px] p-2 rounded-lg ${isPast ? "bg-gray-200" : "bg-violet-100"}`}>
                              <p className={`text-lg font-bold ${isPast ? "text-gray-500" : "text-violet-600"}`}>
                                {startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{cls.classType.name}</p>
                              <p className="text-sm text-gray-500">
                                {cls.teacher.user.firstName} {cls.teacher.user.lastName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {cls.location.name}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              fillPercent >= 100 ? "text-red-500" : fillPercent >= 80 ? "text-amber-500" : "text-emerald-500"
                            }`}>
                              {cls._count.bookings}/{cls.capacity}
                            </div>
                            <p className="text-xs text-gray-500">{fillPercent}% full</p>
                            {isPast && <Badge variant="secondary" className="mt-1 text-xs">Completed</Badge>}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No classes scheduled today</p>
                  <p className="text-sm text-gray-400 mt-1">Add a class to get started</p>
                  <Link href={`${linkPrefix}/schedule/new`}>
                    <Button className="mt-4 bg-violet-600 hover:bg-violet-700" size="sm">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Add Class
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "atRisk":
        return (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Needs Attention</h3>
                    <p className="text-sm text-gray-500">Inactive 21+ days</p>
                  </div>
                </div>
              </div>

              {data.atRiskClients.length > 0 ? (
                <div className="space-y-3">
                  {data.atRiskClients.map((client) => (
                    <Link key={client.id} href={`${linkPrefix}/clients/${client.id}`}>
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium text-sm">
                            {client.firstName[0]}
                            {client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {client.firstName} {client.lastName}
                            </p>
                            <p className="text-xs text-amber-600">Last active 21+ days ago</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-amber-700 hover:text-amber-800 hover:bg-amber-200">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </Link>
                  ))}
                  <Link href={`${linkPrefix}/clients?filter=at-risk`} className="block">
                    <Button variant="outline" className="w-full mt-2 text-amber-700 border-amber-200 hover:bg-amber-50">
                      View all at-risk clients
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 bg-emerald-50 rounded-xl">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-emerald-700 font-medium">All clients active!</p>
                  <p className="text-sm text-emerald-600 mt-1">No clients need attention</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "comingUp":
        return (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Coming Up</h3>
                    <p className="text-sm text-gray-500">Next {data.upcomingClasses.length} classes</p>
                  </div>
                </div>
              </div>

              {data.upcomingClasses.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingClasses.slice(0, 4).map((cls) => (
                    <Link key={cls.id} href={`${linkPrefix}/schedule/${cls.id}`}>
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 text-sm">{cls.classType.name}</p>
                          <span className={`text-xs font-medium ${cls._count.bookings >= cls.capacity ? "text-red-500" : "text-teal-500"}`}>
                            {cls._count.bookings}/{cls.capacity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(cls.startTime).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {new Date(cls.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {cls.teacher.user.firstName} {cls.teacher.user.lastName[0]}. • {cls.location.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No upcoming classes</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "recentActivity":
        return (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <p className="text-sm text-gray-500">Latest bookings</p>
                  </div>
                </div>
                <Link href={`${linkPrefix}/clients`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all
                </Link>
              </div>

              {data.recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {data.recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center gap-3 p-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
                        {booking.client.firstName[0]}
                        {booking.client.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.client.firstName} {booking.client.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{booking.classSession.classType.name}</p>
                      </div>
                      <div className="text-right">
                        {booking.status === "CONFIRMED" ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : booking.status === "CANCELLED" ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "studioStats":
        return (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Studio Stats</h3>
                    <p className="text-sm text-gray-500">Quick overview</p>
                  </div>
                </div>
                <Link href={`${linkPrefix}/reports`} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  Reports
                </Link>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Locations</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.studioStats.locations}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Instructors</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.studioStats.teachers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Class Types</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.studioStats.classTypes}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Total Clients</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.studioStats.totalClients}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">All-time Bookings</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.studioStats.totalBookings}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.greeting}!</h1>
          <p className="text-gray-500 mt-1">{data.currentDate}</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <Link href={`${linkPrefix}/clients/new`}>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
            <Link href={`${linkPrefix}/schedule/new`}>
              <Button variant="outline" size="sm">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </Link>
            <Link href={`${linkPrefix}/schedule`}>
              <Button className="bg-violet-600 hover:bg-violet-700" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
            </Link>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowLayoutControls((prev) => !prev)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Customize dashboard
          </Button>
        </div>
      </div>

      {showLayoutControls && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">Show / Hide Widgets</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {DEFAULT_WIDGET_ORDER.map((widget) => {
                const isVisible = !hiddenWidgets.includes(widget)
                return (
                  <button
                    key={widget}
                    type="button"
                    onClick={() => toggleWidgetVisibility(widget)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      isVisible
                        ? "bg-white border-gray-200 text-gray-800"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    <span>{widgetMeta[widget].title}</span>
                    {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibleWidgets.map((widgetId) => (
          <div
            key={widgetId}
            draggable
            onDragStart={() => setDraggedWidget(widgetId)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!draggedWidget) return
              setWidgetOrder((prev) => reorderWidgets(prev, draggedWidget, widgetId))
              setDraggedWidget(null)
            }}
            onDragEnd={() => setDraggedWidget(null)}
            className={`${widgetMeta[widgetId].className ?? ""} ${draggedWidget === widgetId ? "opacity-70" : ""}`}
          >
            <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
              <span>{widgetMeta[widgetId].title}</span>
              <div className="flex items-center gap-1">
                <GripVertical className="h-3.5 w-3.5" />
                <span>Drag to reorder</span>
              </div>
            </div>
            {renderWidget(widgetId)}
          </div>
        ))}
      </div>
    </div>
  )
}
