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
import { formatCurrency } from "@/lib/utils"

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

type BaseStatCardId = "monthlyRevenue" | "activeClients" | "weekBookings" | "atRiskClients"
type StatCardId = BaseStatCardId | string

const STORAGE_KEY_PREFIX = "studio-dashboard-layout-v1"

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

const DEFAULT_BASE_STAT_CARD_ORDER: BaseStatCardId[] = [
  "monthlyRevenue",
  "activeClients",
  "weekBookings",
  "atRiskClients",
]

const DEFAULT_VISIBLE_STAT_CARDS: BaseStatCardId[] = DEFAULT_BASE_STAT_CARD_ORDER

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
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}:${linkPrefix}`, [linkPrefix])
  const reportStatCardIds = useMemo(() => data.reportDatapoints.map((datapoint) => datapoint.id), [data.reportDatapoints])
  const availableStatCardIds = useMemo<StatCardId[]>(
    () => [...DEFAULT_BASE_STAT_CARD_ORDER, ...reportStatCardIds],
    [reportStatCardIds]
  )

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER)
  const [hiddenWidgets, setHiddenWidgets] = useState<WidgetId[]>([])
  const [statCardOrder, setStatCardOrder] = useState<StatCardId[]>(availableStatCardIds)
  const [hiddenStatCards, setHiddenStatCards] = useState<StatCardId[]>(
    availableStatCardIds.filter((id) => !DEFAULT_VISIBLE_STAT_CARDS.includes(id as BaseStatCardId))
  )
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null)
  const [showLayoutControls, setShowLayoutControls] = useState(false)

  useEffect(() => {
    const defaultHiddenStats = availableStatCardIds.filter(
      (id) => !DEFAULT_VISIBLE_STAT_CARDS.includes(id as BaseStatCardId)
    )
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      setStatCardOrder(availableStatCardIds)
      setHiddenStatCards(defaultHiddenStats)
      return
    }

    try {
      const parsed = JSON.parse(stored) as {
        order?: WidgetId[]
        hidden?: WidgetId[]
        statOrder?: StatCardId[]
        hiddenStats?: StatCardId[]
      }
      const storedOrder = parsed.order ?? []
      const validStoredOrder = storedOrder.filter((id): id is WidgetId => DEFAULT_WIDGET_ORDER.includes(id))
      const missing = DEFAULT_WIDGET_ORDER.filter((id) => !validStoredOrder.includes(id))
      const mergedOrder = [...validStoredOrder, ...missing]

      const storedHidden = (parsed.hidden ?? []).filter((id): id is WidgetId => DEFAULT_WIDGET_ORDER.includes(id))

      const storedStatOrder = parsed.statOrder ?? []
      const validStoredStatOrder = storedStatOrder.filter((id): id is StatCardId => availableStatCardIds.includes(id))
      const missingStatCards = availableStatCardIds.filter((id) => !validStoredStatOrder.includes(id))
      const mergedStatOrder = [...validStoredStatOrder, ...missingStatCards]

      const storedHiddenStats = (parsed.hiddenStats ?? defaultHiddenStats).filter((id): id is StatCardId =>
        availableStatCardIds.includes(id)
      )

      setWidgetOrder(mergedOrder)
      setHiddenWidgets(storedHidden)
      setStatCardOrder(mergedStatOrder)
      setHiddenStatCards(storedHiddenStats)
    } catch {
      setWidgetOrder(DEFAULT_WIDGET_ORDER)
      setHiddenWidgets([])
      setStatCardOrder(availableStatCardIds)
      setHiddenStatCards(availableStatCardIds.filter((id) => !DEFAULT_VISIBLE_STAT_CARDS.includes(id as BaseStatCardId)))
    }
  }, [storageKey, availableStatCardIds])

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        order: widgetOrder,
        hidden: hiddenWidgets,
        statOrder: statCardOrder,
        hiddenStats: hiddenStatCards,
      })
    )
  }, [storageKey, widgetOrder, hiddenWidgets, statCardOrder, hiddenStatCards])

  const visibleWidgets = useMemo(
    () => widgetOrder.filter((widget) => !hiddenWidgets.includes(widget)),
    [widgetOrder, hiddenWidgets]
  )

  const toggleWidgetVisibility = (widget: WidgetId) => {
    setHiddenWidgets((prev) =>
      prev.includes(widget) ? prev.filter((id) => id !== widget) : [...prev, widget]
    )
  }

  const visibleStatCards = useMemo(
    () => statCardOrder.filter((card) => !hiddenStatCards.includes(card)),
    [statCardOrder, hiddenStatCards]
  )

  const toggleStatCardVisibility = (card: StatCardId) => {
    setHiddenStatCards((prev) =>
      prev.includes(card) ? prev.filter((id) => id !== card) : [...prev, card]
    )
  }

  const statCardMeta = useMemo<Record<StatCardId, { title: string; source: "dashboard" | "reports" }>>(() => {
    const baseMeta: Record<BaseStatCardId, { title: string; source: "dashboard" }> = {
      monthlyRevenue: { title: "Monthly Revenue", source: "dashboard" },
      activeClients: { title: "Active Clients", source: "dashboard" },
      weekBookings: { title: "This Week Bookings", source: "dashboard" },
      atRiskClients: { title: "At Risk Clients", source: "dashboard" },
    }

    const reportMeta = data.reportDatapoints.reduce<Record<string, { title: string; source: "reports" }>>((acc, datapoint) => {
      acc[datapoint.id] = { title: datapoint.title, source: "reports" }
      return acc
    }, {})

    return {
      ...baseMeta,
      ...reportMeta,
    }
  }, [data.reportDatapoints])

  const reportDatapointsById = useMemo(
    () => new Map(data.reportDatapoints.map((datapoint) => [datapoint.id, datapoint])),
    [data.reportDatapoints]
  )

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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-white">
                  <h2 className="text-lg font-semibold mb-1">Today&apos;s Overview</h2>
                  <p className="text-violet-200 text-sm">
                    {data.todayOverview.classCount} classes scheduled • {data.todayOverview.bookingsCount} bookings • {data.todayOverview.fillRate}% fill rate
                  </p>
                </div>
                <div className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:flex lg:items-center lg:gap-4">
                  <div className="text-center px-2 py-2 lg:px-4 border-r border-white/20">
                    <p className="text-3xl font-bold text-white">{data.todayOverview.classCount}</p>
                    <p className="text-xs text-violet-200">Classes</p>
                  </div>
                  <div className="text-center px-2 py-2 lg:px-4 border-r border-white/20">
                    <p className="text-3xl font-bold text-white">{data.todayOverview.bookingsCount}</p>
                    <p className="text-xs text-violet-200">Bookings</p>
                  </div>
                  <div className="text-center px-2 py-2 lg:px-4">
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
            {visibleStatCards.map((cardId) => {
              switch (cardId) {
                case "monthlyRevenue":
                  return (
                    <Card key={cardId} className="border-0 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.monthlyRevenue, data.currency)}</p>
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
                  )

                case "activeClients":
                  return (
                    <Card key={cardId} className="border-0 shadow-sm">
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
                  )

                case "weekBookings":
                  return (
                    <Card key={cardId} className="border-0 shadow-sm">
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
                  )

                case "atRiskClients":
                  return (
                    <Card key={cardId} className="border-0 shadow-sm">
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
                  )

                default: {
                  const reportDatapoint = reportDatapointsById.get(cardId)
                  if (!reportDatapoint) return null

                  return (
                    <Card key={cardId} className="border-0 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">{reportDatapoint.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{reportDatapoint.value}</p>
                            <p className="text-sm mt-1.5 text-gray-400">{reportDatapoint.description ?? "Report datapoint"}</p>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-violet-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }
              }
            })}
          </div>
        )

      case "quickActions":
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Link href={`${linkPrefix}/inbox`} className="block min-w-0">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">Messages</p>
                    <p className="truncate text-xs text-gray-500">View inbox</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`${linkPrefix}/marketing`} className="block min-w-0">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">Marketing</p>
                    <p className="truncate text-xs text-gray-500">Campaigns</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`${linkPrefix}/reports`} className="block min-w-0">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">Reports</p>
                    <p className="truncate text-xs text-gray-500">Analytics</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`${linkPrefix}/settings`} className="block min-w-0">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">Settings</p>
                    <p className="truncate text-xs text-gray-500">Configure</p>
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
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">Today&apos;s Schedule</h3>
                    <p className="text-sm text-gray-500">{data.todayClasses.length} classes today</p>
                  </div>
                </div>
                <Link href={`${linkPrefix}/schedule`} className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
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
                        <div className={`cursor-pointer rounded-xl p-4 transition-colors ${
                          isPast ? "bg-gray-50 opacity-60" : "bg-gray-50 hover:bg-violet-50"
                        }`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                              <div className={`rounded-lg p-2 text-center ${isPast ? "bg-gray-200" : "bg-violet-100"}`}>
                              <p className={`text-lg font-bold ${isPast ? "text-gray-500" : "text-violet-600"}`}>
                                {startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">{cls.classType.name}</p>
                                <p className="text-sm text-gray-500">
                                {cls.teacher.user.firstName} {cls.teacher.user.lastName}
                              </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <Badge variant="secondary" className="max-w-full text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                    <span className="truncate">{cls.location.name}</span>
                                </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="sm:text-right">
                              <div className={`text-lg font-bold ${
                              fillPercent >= 100 ? "text-red-500" : fillPercent >= 80 ? "text-amber-500" : "text-emerald-500"
                            }`}>
                              {cls._count.bookings}/{cls.capacity}
                            </div>
                            <p className="text-xs text-gray-500">{fillPercent}% full</p>
                            {isPast && <Badge variant="secondary" className="mt-1 text-xs">Completed</Badge>}
                            </div>
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
    <div className="min-h-screen overflow-x-hidden bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.greeting}!</h1>
          <p className="text-gray-500 mt-1">{data.currentDate}</p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
            <Link href={`${linkPrefix}/clients/new`} className="min-w-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
            <Link href={`${linkPrefix}/schedule/new`} className="min-w-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </Link>
            <Link href={`${linkPrefix}/schedule`} className="min-w-0">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
            </Link>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setShowLayoutControls((prev) => !prev)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Customize dashboard
          </Button>
        </div>
      </div>

      {showLayoutControls && (
          <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Show / Hide Widgets</p>
              <p className="text-xs text-gray-500 mb-3">Drag to reorder is enabled while this panel is open.</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
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
                      <span className="min-w-0 truncate">{widgetMeta[widget].title}</span>
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Stats cards</p>
              <p className="text-xs text-gray-500 mb-3">Show or hide individual cards. Includes report datapoints from Reports.</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                {statCardOrder.map((card) => {
                  const isVisible = !hiddenStatCards.includes(card)
                  return (
                    <button
                      key={card}
                      type="button"
                      onClick={() => toggleStatCardVisibility(card)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        isVisible
                          ? "bg-white border-gray-200 text-gray-800"
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 truncate">{statCardMeta[card].title}</span>
                        {statCardMeta[card].source === "reports" && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Report</Badge>
                        )}
                      </span>
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        {visibleWidgets.map((widgetId) => (
          <div
            key={widgetId}
            draggable={showLayoutControls}
            onDragStart={() => {
              if (!showLayoutControls) return
              setDraggedWidget(widgetId)
            }}
            onDragOver={(e) => {
              if (showLayoutControls) {
                e.preventDefault()
              }
            }}
            onDrop={() => {
              if (!showLayoutControls || !draggedWidget) return
              setWidgetOrder((prev) => reorderWidgets(prev, draggedWidget, widgetId))
              setDraggedWidget(null)
            }}
            onDragEnd={() => setDraggedWidget(null)}
            className={`min-w-0 ${widgetMeta[widgetId].className ?? ""} ${draggedWidget === widgetId ? "opacity-70" : ""} ${showLayoutControls ? "cursor-move" : ""}`}
          >
            <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
              <span>{widgetMeta[widgetId].title}</span>
              {showLayoutControls && (
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3.5 w-3.5" />
                  <span>Drag to reorder</span>
                </div>
              )}
              </div>
            {renderWidget(widgetId)}
          </div>
        ))}
      </div>
    </div>
  )
}
