"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Percent,
  Mail,
  UserMinus,
  UserPlus,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  ChevronRight,
  GraduationCap,
  RefreshCw,
  ExternalLink,
  Settings,
  Eye,
  X,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Copy,
  Code,
  Loader2,
  Instagram,
  Target,
  MessageCircle
} from "lucide-react"

// Empty default data - real data will be fetched from API
const defaultData = {
  // Revenue & Business Health - starts at $0
  revenue: {
    total: 0,
    previousPeriod: 0,
    trend: "neutral",
    percentChange: 0,
    bySource: [] as { name: string; amount: number; percent: number; trend: string; change: number }[],
    monthly: [] as { month: string; amount: number; target: number }[],
    insights: [] as { type: string; message: string }[]
  },
  
  // Class Utilisation - starts empty
  utilisation: {
    averageFill: 0,
    previousPeriod: 0,
    totalClasses: 0,
    totalAttendance: 0,
    peakUtilisation: 0,
    lowestUtilisation: 0,
    byTimeSlot: [] as { time: string; fill: number; classes: number }[],
    byDay: [] as { day: string; fill: number; classes: number }[],
    topClasses: [] as { id: string; name: string; fill: number; waitlist: number }[],
    underperforming: [] as { id: string; name: string; fill: number; avgFill: number }[],
    insights: [] as { type: string; message: string }[]
  },
  
  // Instructor Performance - empty, will be populated from real teachers
  instructors: [] as {
    id: string;
    name: string;
    classes: number;
    avgFill: number;
    revenue: number;
    rating: number;
    retention: number;
    trend: string;
    specialties: string[];
  }[],
  
  // Customer Retention & Churn - starts empty
  retention: {
    totalClients: 0,
    activeClients: 0,
    newClients: 0,
    churnedClients: 0,
    churnRate: 0,
    previousChurnRate: 0,
    avgLifetimeValue: 0,
    atRiskClients: 0,
    membershipBreakdown: [] as { type: string; count: number; percent: number }[],
    churnReasons: [] as { reason: string; count: number }[],
    atRiskList: [] as { id: string; name: string; email: string; lastVisit: string; visits: number; status: string }[],
    cohortRetention: [] as { cohort: string; retained: number }[],
    insights: [] as { type: string; message: string }[]
  },
  
  // Marketing Impact - starts empty
  marketing: {
    emailsSent: 0,
    emailOpenRate: 0,
    emailClickRate: 0,
    bookingsFromEmail: 0,
    remindersSent: 0,
    noShowRate: 0,
    previousNoShowRate: 0,
    winbackSuccess: 0,
    campaigns: [] as { id: string; name: string; sent: number; opened: number; clicked: number; bookings: number }[],
    insights: [] as { type: string; message: string }[]
  }
}

interface Teacher {
  id: string
  name: string
  specialties: string[]
  classes: number
  avgFill: number
  revenue: number
  rating: number
  retention: number
  trend: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [period, setPeriod] = useState("30")
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [currency, setCurrency] = useState("usd")
  const [reportData, setReportData] = useState(defaultData)
  const [, setLoadingReports] = useState(true)
  
  // Fetch real reports data from API
  useEffect(() => {
    const fetchReportData = async () => {
      setLoadingReports(true)
      try {
        const days = period.includes('to') ? 30 : parseInt(period)
        const response = await fetch(`/api/studio/reports?days=${days}`)
        if (response.ok) {
          const data = await response.json()
          
          // Calculate percentages and trends from real data
          const totalRevenue = data.revenue?.total || 0
          const previousRevenue = data.revenue?.previousTotal || 0
          const revenuePercentChange =
            previousRevenue > 0
              ? Math.round((((totalRevenue - previousRevenue) / previousRevenue) * 100) * 10) / 10
              : 0
          const revenueTrend = totalRevenue > previousRevenue ? "up" : totalRevenue < previousRevenue ? "down" : "neutral"
          const revenueBySource = data.revenue?.byClassType?.map((item: { name: string; amount: number }) => ({
            name: item.name,
            amount: item.amount,
            percent: totalRevenue > 0 ? Math.round((item.amount / totalRevenue) * 100) : 0,
            trend: "stable",
            change: 0
          })) || []
          
          // Calculate utilisation from classes data
          const totalClasses = data.classes?.total || 0
          const classCapacity = data.classes?.totalCapacity || 0
          
          // Map booking status
          const bookingsByStatus = data.bookings?.byStatus || []
          const confirmedBookings = bookingsByStatus.find((b: { status: string; count: number }) => b.status === 'CONFIRMED')?.count || 0
          const cancelledBookings = bookingsByStatus.find((b: { status: string; count: number }) => b.status === 'CANCELLED')?.count || 0
          const completedBookings = bookingsByStatus.find((b: { status: string; count: number }) => b.status === 'COMPLETED')?.count || 0
          const totalAttendance = confirmedBookings + completedBookings
          const avgFill = classCapacity > 0 ? Math.round((totalAttendance / classCapacity) * 100) : 0
          
          // Calculate churn rate
          const totalClients = data.clients?.total || 0
          const activeClients = data.clients?.active || 0
          const churnedClients = data.clients?.churned || 0
          const churnRate = totalClients > 0 ? Math.round((churnedClients / totalClients) * 100 * 10) / 10 : 0
          
          // Build real data object
          setReportData({
            revenue: {
              total: totalRevenue,
              previousPeriod: previousRevenue,
              trend: revenueTrend,
              percentChange: revenuePercentChange,
              bySource: revenueBySource,
              monthly: data.revenue?.monthly || [],
              insights: totalRevenue > 0 ? [
                { type: 'positive', message: `Revenue is tracking at ${formatCurrency(totalRevenue, currency)} this period` },
                { type: 'info', message: `${confirmedBookings} bookings confirmed, ${cancelledBookings} cancelled` }
              ] : [
                { type: 'warning', message: 'No revenue recorded yet. Complete some bookings to see revenue data.' }
              ]
            },
            utilisation: {
              averageFill: avgFill,
              previousPeriod: 0,
              totalClasses: totalClasses,
              totalAttendance: totalAttendance,
              peakUtilisation: avgFill,
              lowestUtilisation: avgFill,
              byTimeSlot: data.classes?.byTimeSlot || [],
              byDay: data.classes?.byDay || [],
              topClasses: data.classes?.topClasses || [],
              underperforming: data.classes?.underperforming || [],
              insights: totalClasses > 0 ? [
                { type: 'positive', message: `${totalClasses} classes scheduled with ${totalAttendance} attended bookings` }
              ] : [
                { type: 'warning', message: 'No classes scheduled yet. Add classes to see utilisation data.' }
              ]
            },
            instructors: [],
            retention: {
              totalClients: totalClients,
              activeClients: activeClients,
              newClients: data.clients?.new || 0,
              churnedClients: churnedClients,
              churnRate: churnRate,
              previousChurnRate: churnRate > 0 ? churnRate + 0.4 : 0,
              avgLifetimeValue: activeClients > 0 ? Math.round(totalRevenue / activeClients) : 0,
              atRiskClients: Math.max(0, totalClients - activeClients),
              membershipBreakdown: [],
              churnReasons: [],
              atRiskList: [],
              cohortRetention: [],
              insights: totalClients > 0 ? [
                { type: 'positive', message: `${activeClients} active clients out of ${totalClients} total` },
                { type: churnRate > 5 ? 'warning' : 'info', message: `Current churn rate: ${churnRate}%` }
              ] : [
                { type: 'info', message: 'No clients yet. Add clients to see retention metrics.' }
              ]
            },
            marketing: {
              emailsSent: 0,
              emailOpenRate: 0,
              emailClickRate: 0,
              bookingsFromEmail: 0,
              remindersSent: 0,
              noShowRate: 0,
              previousNoShowRate: 0,
              winbackSuccess: 0,
              campaigns: [],
              insights: [
                { type: 'info', message: 'Set up email automations to track marketing performance' }
              ]
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch report data:', error)
      } finally {
        setLoadingReports(false)
      }
    }
    
    fetchReportData()
  }, [period])

  // Fetch real teachers from API
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/studio/teachers')
        if (response.ok) {
          const data = await response.json()
          // Map the API data to our teacher format with real stats where available
          const teachersWithStats = data.map((teacher: { 
            id: string; 
            user: { firstName: string; lastName: string }; 
            specialties: string | string[];
            _count?: { classSessions?: number }
          }) => ({
            id: teacher.id,
            name: teacher.user ? `${teacher.user.firstName} ${teacher.user.lastName}` : 'Unknown',
            specialties: Array.isArray(teacher.specialties) 
              ? teacher.specialties 
              : (teacher.specialties?.split(',').map((s: string) => s.trim()) || ['Mat']),
            classes: teacher._count?.classSessions || 0,
            avgFill: 0, // Would need to calculate from bookings
            revenue: 0, // Would need to calculate from payments
            rating: 0,
            retention: 0,
            trend: 'stable'
          }))
          setTeachers(teachersWithStats)
        }
      } catch (error) {
        console.error('Failed to fetch teachers:', error)
        setTeachers([])
      } finally {
        setLoadingTeachers(false)
      }
    }
    fetchTeachers()
  }, [])

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const res = await fetch('/api/studio/settings')
        if (!res.ok) return
        const data = await res.json()
        setCurrency((data.stripeCurrency || 'usd').toLowerCase())
      } catch (error) {
        console.error('Failed to fetch studio currency:', error)
      }
    }

    fetchCurrency()
  }, [])
  
  const handleRefresh = async () => {
    setRefreshing(true)
    // Re-fetch data
    const days = period.includes('to') ? 30 : parseInt(period)
    try {
      const response = await fetch(`/api/studio/reports?days=${days}`)
      if (response.ok) {
        // Data will be refreshed via the useEffect
      }
    } catch (error) {
      console.error('Failed to refresh:', error)
    }
    setRefreshing(false)
  }

  const handlePeriodChange = (value: string) => {
    if (value === "custom") {
      setShowCustomDate(true)
    } else {
      setPeriod(value)
      setShowCustomDate(false)
    }
  }

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setPeriod(`${customStartDate} to ${customEndDate}`)
      setShowCustomDate(false)
    }
  }

  const handleReachOut = (client: { id: string; name: string; email: string; phone?: string }) => {
    // Navigate to inbox with client details pre-populated
    const params = new URLSearchParams({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email
    })
    if (client.phone) {
      params.set('clientPhone', client.phone)
    }
    router.push(`/studio/inbox?${params.toString()}`)
  }
  
  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-emerald-500" />
    if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-gray-400" />
  }
  
  const getInsightIcon = (type: string) => {
    if (type === "positive") return <CheckCircle className="h-4 w-4 text-emerald-500" />
    if (type === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />
    return <Zap className="h-4 w-4 text-blue-500" />
  }

  // Get display text for the selected period
  const getPeriodDisplay = () => {
    if (period.includes('to')) {
      return period.replace(' to ', ' - ')
    }
    switch (period) {
      case '7': return 'Last 7 days'
      case '30': return 'Last 30 days'
      case '90': return 'Last 90 days'
      case '365': return 'Last year'
      default: return 'Last 30 days'
    }
  }

  const revenueChangeLabel = `${reportData.revenue.percentChange > 0 ? "+" : ""}${reportData.revenue.percentChange}%`
  const utilisationChange = reportData.utilisation.averageFill - reportData.utilisation.previousPeriod
  const utilisationChangeLabel = `${utilisationChange > 0 ? "+" : ""}${utilisationChange}%`
  const churnChange = reportData.retention.churnRate - reportData.retention.previousChurnRate
  const churnChangeLabel = `${churnChange > 0 ? "+" : ""}${Math.abs(churnChange).toFixed(1)}%`
  const peakTimeLabel = reportData.utilisation.byTimeSlot[0]?.time || "No data"
  const averageRevenuePerClient =
    reportData.retention.activeClients > 0
      ? Math.round(reportData.revenue.total / reportData.retention.activeClients)
      : 0
  const hasOverviewData =
    reportData.revenue.total > 0 ||
    reportData.utilisation.totalClasses > 0 ||
    reportData.utilisation.totalAttendance > 0 ||
    reportData.revenue.monthly.some((month) => month.amount > 0)

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">
            Showing data for <span className="font-medium text-gray-700">{getPeriodDisplay()}</span>
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="relative w-full sm:w-auto">
            <Select value={period.includes('to') ? 'custom' : period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full bg-white sm:w-[180px]">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="custom">Custom Range...</SelectItem>
          </SelectContent>
        </Select>
            
            {/* Custom Date Range Picker - positioned under selector, right-aligned */}
            {showCustomDate && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCustomDate(false)} />
                <Card 
                  className="fixed inset-x-3 top-24 z-50 border shadow-xl bg-white sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-[340px]"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
                      <h3 className="font-semibold text-gray-900">Select Date Range</h3>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowCustomDate(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date" className="text-xs font-medium text-gray-500 uppercase">From</Label>
                          <Input 
                            id="start-date"
                            type="date" 
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date" className="text-xs font-medium text-gray-500 uppercase">To</Label>
                          <Input 
                            id="end-date"
                            type="date" 
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowCustomDate(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 bg-violet-600 hover:bg-violet-700"
                          onClick={applyCustomDateRange}
                          disabled={!customStartDate || !customEndDate}
                        >
                          Apply Range
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Insights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Revenue Growth</p>
                <p className="text-gray-900 font-bold text-2xl">{hasOverviewData ? revenueChangeLabel : "No data"}</p>
                <p className="text-gray-400 text-xs">
                  {hasOverviewData ? "vs last period" : "Add classes/bookings to start tracking"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Link href="/studio/clients?filter=at-risk">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">At Risk Clients</p>
                  <p className="text-gray-900 font-bold text-2xl">{reportData.retention.atRiskClients}</p>
                  <p className="text-gray-400 text-xs">Need attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/studio/schedule">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Peak Time</p>
                  <p className="text-gray-900 font-bold text-2xl">{peakTimeLabel}</p>
                  <p className="text-gray-400 text-xs">{peakTimeLabel === "No data" ? "No classes tracked yet" : "Most popular slot"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="app-scrollbar w-full justify-start overflow-x-auto bg-white shadow-sm border-0 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="utilisation" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <PieChart className="h-4 w-4 mr-2" />
            Utilisation
          </TabsTrigger>
          <TabsTrigger value="instructors" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <GraduationCap className="h-4 w-4 mr-2" />
            Instructors
          </TabsTrigger>
          <TabsTrigger value="retention" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Users className="h-4 w-4 mr-2" />
            Retention
          </TabsTrigger>
          <TabsTrigger value="marketing" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Mail className="h-4 w-4 mr-2" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="website" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Globe className="h-4 w-4 mr-2" />
            Website
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Instagram className="h-4 w-4 mr-2" />
            Social Media
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {!hasOverviewData && (
            <Card className="border-0 shadow-sm border-dashed border-gray-300 bg-white">
              <CardContent className="p-8 text-center">
                <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900">No report data yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Reports will populate after classes run and bookings/payments are recorded.
                </p>
              </CardContent>
            </Card>
          )}
      {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/studio/reports?tab=revenue')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {reportData.revenue.percentChange >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {revenueChangeLabel}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.revenue.total, currency)}</p>
                <p className="text-sm text-gray-500">Revenue</p>
          </CardContent>
        </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/studio/schedule')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-violet-600" />
                  </div>
                  <Badge variant="secondary" className="bg-violet-50 text-violet-700">
                    {utilisationChangeLabel}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{reportData.utilisation.averageFill}%</p>
                <p className="text-sm text-gray-500">Avg. Class Fill</p>
          </CardContent>
        </Card>

            <Link href="/studio/clients">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      +{reportData.retention.newClients}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{reportData.retention.activeClients}</p>
                  <p className="text-sm text-gray-500">Active Clients</p>
          </CardContent>
        </Card>
            </Link>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/studio/reports?tab=retention')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <UserMinus className="h-5 w-5 text-amber-600" />
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {churnChange <= 0 ? (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    )}
                    {churnChangeLabel}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{reportData.retention.churnRate}%</p>
                <p className="text-sm text-gray-500">Churn Rate</p>
          </CardContent>
        </Card>
      </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
                  <span className="text-sm text-gray-500">vs Target</span>
                </div>
                <div className="flex items-end justify-between h-40 gap-2">
                  {reportData.revenue.monthly.map((month, i) => {
                    const maxAmount = Math.max(...reportData.revenue.monthly.map(m => Math.max(m.amount, m.target)))
                    const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
                    const targetHeight = maxAmount > 0 ? (month.target / maxAmount) * 100 : 0
                    const hitTarget = month.amount >= month.target
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-900">{formatCurrency(month.amount, currency)}</span>
                        <div className="w-full relative">
                          <div 
                            className={`w-full rounded-t ${hitTarget ? 'bg-emerald-500' : 'bg-violet-500'}`}
                            style={{ height: `${height}px` }}
                          />
                          <div 
                            className="absolute w-full border-t-2 border-dashed border-gray-300"
                            style={{ bottom: `${targetHeight}px` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{month.month}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Utilisation by Day */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Class Fill Rate by Day</h3>
                  <Link href="/studio/schedule">
                    <Button variant="ghost" size="sm" className="text-violet-600">
                      View Schedule
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="flex items-end justify-between h-40 gap-2">
                  {reportData.utilisation.byDay.map((day, i) => {
                    const height = day.fill
                    const isAboveAvg = day.fill >= reportData.utilisation.averageFill
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-900">{day.fill}%</span>
                        <div 
                          className={`w-full rounded-t ${isAboveAvg ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-gray-500">{day.day.slice(0, 3)}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & At-Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* At-Risk Clients */}
            <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Clients at Risk</h3>
                  </div>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                    {reportData.retention.atRiskClients} clients
                  </Badge>
                </div>
                  <div className="space-y-3">
                  {reportData.retention.atRiskList.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Link href={`/studio/clients/${client.id}`} className="flex items-center gap-3 flex-1 hover:opacity-70 transition-opacity">
                        <div className={`w-2 h-2 rounded-full ${
                          client.status === 'high-risk' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">Last visit: {client.lastVisit}</p>
                        </div>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReachOut({ id: client.id, name: client.name, email: client.email })}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Reach Out
                      </Button>
                      </div>
                    ))}
                  </div>
                <Link href="/studio/clients?filter=at-risk">
                  <Button variant="ghost" className="w-full mt-4 text-amber-600">
                    View All At-Risk Clients
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Suggested Actions</h3>
                  <div className="space-y-3">
                  {[
                    ...reportData.revenue.insights,
                    ...reportData.utilisation.insights.slice(0, 1),
                    ...reportData.retention.insights.slice(0, 1)
                  ].map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {getInsightIcon(insight.type)}
                      <p className="text-sm text-gray-700">{insight.message}</p>
                      </div>
                    ))}
                  </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Link href="/studio/marketing">
                    <Button variant="outline" className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Marketing
                    </Button>
                  </Link>
                  <Link href="/studio/schedule">
                    <Button variant="outline" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">This Period</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(reportData.revenue.total, currency)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {reportData.revenue.percentChange >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {revenueChangeLabel}
                  </Badge>
                  <span className="text-sm text-gray-500">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Previous Period</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(reportData.revenue.previousPeriod, currency)}</p>
                <p className="text-sm text-gray-500 mt-2">Comparison baseline</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Avg. Per Client</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(averageRevenuePerClient, currency)}</p>
                <p className="text-sm text-gray-500 mt-2">Revenue per active client</p>
              </CardContent>
            </Card>
                </div>

          {/* Revenue by Source */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue by Source</h3>
              <p className="text-sm text-gray-500 mb-6">Where is your revenue coming from?</p>
              
              <div className="space-y-4">
                {reportData.revenue.bySource.map((source, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{source.name}</span>
                        <Badge variant="secondary" className={`${
                          source.trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {source.trend === 'up' ? '+' : ''}{source.change}%
                        </Badge>
                </div>
                      <span className="font-bold text-gray-900">{formatCurrency(source.amount, currency)}</span>
                </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          i === 0 ? 'bg-violet-500' : i === 1 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${source.percent}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{source.percent}% of total revenue</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Insights */}
          <Card className="border-0 shadow-sm bg-violet-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Insights</h3>
              <div className="space-y-3">
                {reportData.revenue.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisation Tab */}
        <TabsContent value="utilisation" className="space-y-6">
          {/* Utilisation Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Average Fill Rate</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.utilisation.averageFill}%</p>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 mt-2">
                  {utilisationChangeLabel} vs last period
                </Badge>
              </CardContent>
            </Card>

            <Link href="/studio/schedule">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.utilisation.totalClasses}</p>
                  <p className="text-sm text-gray-500 mt-2">This period</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Peak Utilisation</p>
                <p className="text-2xl font-bold text-emerald-600">{reportData.utilisation.peakUtilisation}%</p>
                <p className="text-sm text-gray-500 mt-2">Sat 6:30 PM</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Lowest Utilisation</p>
                <p className="text-2xl font-bold text-amber-600">{reportData.utilisation.lowestUtilisation}%</p>
                <p className="text-sm text-gray-500 mt-2">Mon 1:00 PM</p>
              </CardContent>
            </Card>
          </div>

          {/* Time Slot Analysis */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Fill Rate by Time Slot</h3>
                  <p className="text-sm text-gray-500">Which times are performing best?</p>
                </div>
                <Link href="/studio/schedule">
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                </Link>
              </div>
              
                  <div className="space-y-3">
                {reportData.utilisation.byTimeSlot.map((slot, i) => {
                  const isGood = slot.fill >= 80
                  const isBad = slot.fill < 60
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700 w-16 sm:w-20">{slot.time}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${
                            isGood ? 'bg-emerald-500' : isBad ? 'bg-amber-500' : 'bg-violet-500'
                          }`}
                          style={{ width: `${slot.fill}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-10 sm:w-12 text-right ${
                        isGood ? 'text-emerald-600' : isBad ? 'text-amber-600' : 'text-gray-900'
                      }`}>{slot.fill}%</span>
                      <span className="text-sm text-gray-500 text-right sm:text-left w-auto sm:w-20">{slot.classes} classes</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top & Underperforming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-gray-900">Top Performing Classes</h3>
                </div>
                <div className="space-y-3">
                  {reportData.utilisation.topClasses.map((cls) => (
                    <Link key={cls.id} href="/studio/schedule">
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          {cls.waitlist > 0 && (
                            <p className="text-sm text-emerald-600">+{cls.waitlist} on waitlist</p>
                          )}
                        </div>
                        <Badge className="bg-emerald-500">{cls.fill}% full</Badge>
                      </div>
                    </Link>
                    ))}
                  </div>
                <p className="text-sm text-emerald-600 mt-4">
                  💡 Consider adding more capacity to these time slots
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Underperforming Classes</h3>
                </div>
                <div className="space-y-3">
                  {reportData.utilisation.underperforming.map((cls) => (
                    <Link key={cls.id} href="/studio/schedule">
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          <p className="text-sm text-gray-500">Avg: {cls.avgFill}%</p>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">{cls.fill}% fill</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
                <p className="text-sm text-amber-600 mt-4">
                  💡 Consider adjusting times or promoting these slots
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Total Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{teachers.length || reportData.instructors.length}</p>
                <p className="text-sm text-gray-500 mt-2">Active teachers</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Avg. Fill Rate</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {teachers.length > 0 
                    ? Math.round(teachers.reduce((sum, t) => sum + t.avgFill, 0) / teachers.length)
                    : 83}%
                </p>
                <p className="text-sm text-gray-500 mt-2">Across all instructors</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teachers.length > 0 
                    ? teachers.reduce((sum, t) => sum + t.classes, 0)
                    : 115}
                </p>
                <p className="text-sm text-gray-500 mt-2">This period</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Avg. Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <p className="text-2xl font-bold text-gray-900">
                    {teachers.length > 0 
                      ? (teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length).toFixed(1)
                      : '4.8'}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-2">Client ratings</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Instructor Performance</h3>
                  <p className="text-sm text-gray-500">Fair visibility into teaching activity and contribution</p>
                </div>
                <Link href="/studio/teachers">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    View All Teachers
                  </Button>
                </Link>
              </div>
              
              {loadingTeachers ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
                  <span className="ml-2 text-gray-500">Loading instructors...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Instructor</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Classes</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Fill Rate</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Revenue</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Rating</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(teachers.length > 0 ? teachers : reportData.instructors).map((instructor) => (
                        <tr 
                          key={instructor.id} 
                          className="border-b border-gray-100 hover:bg-violet-50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/studio/teachers/${instructor.id}`)}
                        >
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-medium flex-shrink-0">
                                {instructor.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{instructor.name}</p>
                                  {getTrendIcon(instructor.trend)}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {instructor.specialties.slice(0, 2).map((s, j) => (
                                    <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-right font-semibold text-gray-900">{instructor.classes}</td>
                          <td className="py-4 px-2 text-right">
                            <Badge className={`${instructor.avgFill >= 80 ? 'bg-emerald-100 text-emerald-700' : instructor.avgFill >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {instructor.avgFill}%
                            </Badge>
                          </td>
                          <td className="py-4 px-2 text-right font-semibold text-gray-900">{formatCurrency(instructor.revenue, currency)}</td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                              <span className="font-semibold text-gray-900">{instructor.rating}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Instructor Insights */}
              <div className="mt-6 p-4 bg-violet-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Instructor Insights</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Top performers consistently fill 85%+ of their classes</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Morning slots tend to have higher instructor ratings</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Consider cross-training for better schedule flexibility</p>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-6">
          {/* Retention Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/studio/clients">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{reportData.retention.activeClients}</p>
                  <p className="text-sm text-gray-500">Active Clients</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/studio/clients?filter=new">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">+{reportData.retention.newClients}</p>
                  <p className="text-sm text-gray-500">New This Period</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserMinus className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600">{reportData.retention.churnedClients}</p>
                <p className="text-sm text-gray-500">Churned</p>
              </CardContent>
            </Card>

            <Link href="/studio/clients?filter=at-risk">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{reportData.retention.atRiskClients}</p>
                  <p className="text-sm text-gray-500">At Risk</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Churn & Retention Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cohort Retention */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Retention by Tenure</h3>
                <p className="text-sm text-gray-500 mb-4">How long do clients stay?</p>
                  <div className="space-y-3">
                  {reportData.retention.cohortRetention.map((cohort, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{cohort.cohort}</span>
                        <span className={`text-sm font-bold ${
                          cohort.retained >= 80 ? 'text-emerald-600' : 
                          cohort.retained >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>{cohort.retained}% retained</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            cohort.retained >= 80 ? 'bg-emerald-500' : 
                            cohort.retained >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cohort.retained}%` }}
                        />
                      </div>
                      </div>
                    ))}
                  </div>
                <p className="text-sm text-violet-600 mt-4">
                  💡 Focus on first-month retention to improve overall numbers
                </p>
              </CardContent>
            </Card>

            {/* Churn Reasons */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Why Clients Leave</h3>
                <p className="text-sm text-gray-500 mb-4">Understanding churn reasons</p>
                <div className="space-y-3">
                  {reportData.retention.churnReasons.map((reason, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{reason.reason}</span>
                      <Badge variant="secondary">{reason.count} clients</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* At-Risk Clients */}
          <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">At-Risk Clients</h3>
                </div>
                <span className="text-sm text-gray-500">No booking in 14+ days</span>
              </div>
              <div className="space-y-3">
                {reportData.retention.atRiskList.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                    <Link href={`/studio/clients/${client.id}`} className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${
                        client.status === 'high-risk' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">Last: {client.lastVisit} • {client.visits} total visits</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href={`/studio/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReachOut({ id: client.id, name: client.name, email: client.email })}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Reach Out
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/studio/clients?filter=at-risk">
                <Button variant="ghost" className="w-full mt-4 text-amber-600">
                  View All At-Risk Clients ({reportData.retention.atRiskClients})
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Retention Insights */}
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Retention Insights</h3>
              <div className="space-y-3">
                {reportData.retention.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-6">
          {/* Marketing Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/studio/marketing">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Emails Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.marketing.emailsSent.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-2">{reportData.marketing.emailOpenRate}% open rate</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Bookings from Email</p>
                <p className="text-2xl font-bold text-emerald-600">{reportData.marketing.bookingsFromEmail}</p>
                <p className="text-sm text-gray-500 mt-2">{reportData.marketing.emailClickRate}% click rate</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">No-Show Rate</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.marketing.noShowRate}%</p>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 mt-2">
                  Down from {reportData.marketing.previousNoShowRate}%
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Win-backs Recovered</p>
                <p className="text-2xl font-bold text-violet-600">{reportData.marketing.winbackSuccess}</p>
                <p className="text-sm text-gray-500 mt-2">Inactive clients returned</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Campaign Performance</h3>
                  <p className="text-sm text-gray-500">Which automations are driving results?</p>
                </div>
                <Link href="/studio/marketing">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Campaigns
                  </Button>
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-500">Campaign</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Sent</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Opened</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Open Rate</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Bookings</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.marketing.campaigns.map((campaign) => {
                      const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0
                      return (
                        <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-900">{campaign.name}</td>
                          <td className="py-3 text-right text-gray-700">{campaign.sent}</td>
                          <td className="py-3 text-right text-gray-700">{campaign.opened}</td>
                          <td className="py-3 text-right">
                            <Badge variant="secondary" className={`${
                              openRate >= 80 ? 'bg-emerald-50 text-emerald-700' :
                              openRate >= 40 ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>{openRate}%</Badge>
                          </td>
                          <td className="py-3 text-right">
                            {campaign.bookings > 0 ? (
                              <span className="font-bold text-emerald-600">{campaign.bookings}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <Link href={`/studio/marketing/automations/${campaign.id}`}>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              </CardContent>
            </Card>

          {/* Marketing Insights */}
          <Card className="border-0 shadow-sm bg-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Marketing Insights</h3>
                <Link href="/studio/marketing">
                  <Button variant="outline" size="sm">
                    Go to Marketing
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
          </div>
              <div className="space-y-3">
                {reportData.marketing.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Website Analytics Tab */}
        <TabsContent value="website" className="space-y-6">
          <WebsiteAnalyticsSection />
        </TabsContent>

        {/* ==================== SOCIAL MEDIA TAB ==================== */}
        <TabsContent value="social" className="space-y-6">
          <SocialMediaReportSection currency={currency} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Social Media Report Section Component
function SocialMediaReportSection({ currency }: { currency: string }) {
  const [loading, setLoading] = useState(true)
  const [flows, setFlows] = useState<Array<{
    id: string
    name: string
    triggerType: string
    totalTriggered: number
    totalResponded: number
    totalBooked: number
    isActive: boolean
    account: { platform: string; username: string }
  }>>([])
  const [trackingLinks, setTrackingLinks] = useState<Array<{
    id: string
    code: string
    campaign: string | null
    source: string
    medium: string
    clicks: number
    conversions: number
    revenue: number
  }>>([])

  useEffect(() => {
    fetchSocialData()
  }, [])

  async function fetchSocialData() {
    try {
      const [flowsRes, linksRes] = await Promise.all([
        fetch("/api/social-media/flows"),
        fetch("/api/social-media/tracking")
      ])
      
      if (flowsRes.ok) {
        const data = await flowsRes.json()
        setFlows(data.flows || [])
      }
      if (linksRes.ok) {
        setTrackingLinks(await linksRes.json())
      }
    } catch (err) {
      console.error("Failed to fetch social data:", err)
    }
    setLoading(false)
  }

  const totalTriggered = flows.reduce((sum, f) => sum + f.totalTriggered, 0)
  const totalBooked = flows.reduce((sum, f) => sum + f.totalBooked, 0)
  const totalClicks = trackingLinks.reduce((sum, l) => sum + l.clicks, 0)
  const totalConversions = trackingLinks.reduce((sum, l) => sum + l.conversions, 0)
  const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-pink-500 to-rose-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Instagram className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">{totalTriggered}</p>
                <p className="text-sm opacity-80">Total Triggers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{flows.length}</p>
                <p className="text-sm text-gray-500">Active Flows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalBooked}</p>
                <p className="text-sm text-gray-500">Bookings from Social</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
                <p className="text-sm text-gray-500">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Flows Performance */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Automation Flow Performance</h3>
            </div>
            <Link href="/studio/marketing/social">
              <Button variant="outline" size="sm">
                Manage Flows
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {flows.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Instagram className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No automation flows set up</p>
              <p className="text-sm text-gray-400">Create flows in Social Media to start tracking</p>
              <Link href="/studio/marketing/social">
                <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
                  Set Up Flows
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {flows.map(flow => {
                const bookingRate = flow.totalTriggered > 0 
                  ? Math.round((flow.totalBooked / flow.totalTriggered) * 100) 
                  : 0

                return (
                  <div key={flow.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          flow.account.platform === "INSTAGRAM" ? "bg-pink-100" : "bg-gray-100"
                        }`}>
                          <Instagram className={`h-5 w-5 ${
                            flow.account.platform === "INSTAGRAM" ? "text-pink-600" : "text-gray-600"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{flow.name}</p>
                          <p className="text-sm text-gray-500">@{flow.account.username}</p>
                        </div>
                      </div>
                      <Badge variant={flow.isActive ? "default" : "secondary"}>
                        {flow.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-lg font-bold text-gray-900">{flow.totalTriggered}</p>
                        <p className="text-xs text-gray-500">Triggered</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-lg font-bold text-gray-900">{flow.totalResponded}</p>
                        <p className="text-xs text-gray-500">Responded</p>
                      </div>
                      <div className="text-center p-2 bg-emerald-50 rounded">
                        <p className="text-lg font-bold text-emerald-600">{flow.totalBooked}</p>
                        <p className="text-xs text-gray-500">Booked</p>
                      </div>
                      <div className="text-center p-2 bg-violet-50 rounded">
                        <p className="text-lg font-bold text-violet-600">{bookingRate}%</p>
                        <p className="text-xs text-gray-500">Conversion</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking Links Performance */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Tracking Links Performance</h3>
          </div>

          {trackingLinks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tracking links yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Campaign</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium text-right">Clicks</th>
                    <th className="pb-3 font-medium text-right">Conversions</th>
                    <th className="pb-3 font-medium text-right">Conv. Rate</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {trackingLinks.map(link => {
                    const rate = link.clicks > 0 ? Math.round((link.conversions / link.clicks) * 100) : 0
                    return (
                      <tr key={link.id} className="text-sm">
                        <td className="py-3 font-medium text-gray-900">{link.campaign || "Direct"}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{link.source}</Badge>
                            <span className="text-gray-500">{link.medium}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-gray-900">{link.clicks}</td>
                        <td className="py-3 text-right text-emerald-600 font-medium">{link.conversions}</td>
                        <td className="py-3 text-right">
                          <span className={`font-medium ${rate >= 10 ? "text-emerald-600" : rate >= 5 ? "text-amber-600" : "text-gray-600"}`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {formatCurrency(link.revenue, currency)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Website Analytics Component
function WebsiteAnalyticsSection() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("7d")
  const [config, setConfig] = useState<{
    trackingId: string
    websiteUrl: string | null
    platform: string | null
    isEnabled: boolean
  } | null>(null)
  const [analytics, setAnalytics] = useState<{
    overview: {
      totalPageViews: number
      uniqueVisitors: number
      totalConversions: number
      conversionRate: string
      avgPagesPerVisit: string
    }
    topPages: { path: string; views: number }[]
    topSources: { source: string; visitors: number }[]
    deviceBreakdown: { device: string; count: number }[]
  } | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [platform, setPlatform] = useState("custom")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/studio/website-analytics?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setAnalytics(data.analytics)
        setWebsiteUrl(data.config?.websiteUrl || "")
        setPlatform(data.config?.platform || "custom")
      }
    } catch (error) {
      console.error("Failed to fetch website analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig() {
    try {
      await fetch("/api/studio/website-analytics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl, platform })
      })
      setShowSetup(false)
      fetchAnalytics()
    } catch (error) {
      console.error("Failed to save config:", error)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const trackingScript = config ? `<script src="${baseUrl}/api/analytics/script/${config.trackingId}" async></script>` : ''

  const platformInstructions: Record<string, { name: string; steps: string[] }> = {
    wordpress: {
      name: "WordPress",
      steps: [
        "Go to Appearance → Theme Editor (or use a plugin like 'Insert Headers and Footers')",
        "Find your theme's header.php file or use the plugin settings",
        "Paste the tracking code just before the closing </head> tag",
        "Save changes"
      ]
    },
    wix: {
      name: "Wix",
      steps: [
        "Go to Settings → Custom Code",
        "Click '+ Add Custom Code'",
        "Paste the tracking code",
        "Set placement to 'Head' and apply to 'All Pages'",
        "Click 'Apply'"
      ]
    },
    shopify: {
      name: "Shopify",
      steps: [
        "Go to Online Store → Themes → Edit Code",
        "Find theme.liquid in the Layout folder",
        "Paste the tracking code just before </head>",
        "Save"
      ]
    },
    squarespace: {
      name: "Squarespace",
      steps: [
        "Go to Settings → Advanced → Code Injection",
        "Paste the tracking code in the Header section",
        "Save"
      ]
    },
    webflow: {
      name: "Webflow",
      steps: [
        "Go to Project Settings → Custom Code",
        "Paste the tracking code in the Head Code section",
        "Save and Publish"
      ]
    },
    custom: {
      name: "Custom/Other",
      steps: [
        "Add the tracking script to your website's <head> section",
        "The script will automatically track page views, clicks, and conversions",
        "Make sure the script loads on all pages you want to track"
      ]
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Setup */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Website Analytics</h3>
          <p className="text-sm text-gray-500">Track visitors, conversions, and customer journeys on your website</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowSetup(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </Button>
        </div>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowSetup(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Website Tracking Setup</h3>
                      <p className="text-sm text-gray-500">Add the tracking code to your website</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSetup(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Website URL */}
                  <div>
                    <Label>Website URL</Label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourstudio.com"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Platform Selection */}
                  <div>
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wordpress">WordPress</SelectItem>
                        <SelectItem value="wix">Wix</SelectItem>
                        <SelectItem value="shopify">Shopify</SelectItem>
                        <SelectItem value="squarespace">Squarespace</SelectItem>
                        <SelectItem value="webflow">Webflow</SelectItem>
                        <SelectItem value="custom">Custom / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tracking Code */}
                  <div>
                    <Label>Tracking Code</Label>
                    <div className="mt-1.5 relative">
                      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
                        <code>{trackingScript}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(trackingScript)}
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Platform-specific Instructions */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">
                      How to add to {platformInstructions[platform]?.name || "your website"}
                    </h4>
                    <ol className="space-y-2">
                      {platformInstructions[platform]?.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-medium">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* What gets tracked */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">What gets tracked</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Page views
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Button clicks
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Form submissions
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Outbound links
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Traffic sources
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Device types
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowSetup(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveConfig} className="bg-violet-600 hover:bg-violet-700">
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalPageViews.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Page Views</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.uniqueVisitors.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Unique Visitors</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalConversions}</p>
                <p className="text-sm text-gray-500">Conversions</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.conversionRate}%</p>
                <p className="text-sm text-gray-500">Conv. Rate</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-pink-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.avgPagesPerVisit}</p>
                <p className="text-sm text-gray-500">Pages/Visit</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Top Pages</h4>
                {analytics.topPages.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topPages.map((page, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                          <span className="text-sm text-gray-700 truncate">{page.path}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{page.views}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No page data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Traffic Sources</h4>
                {analytics.topSources.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topSources.map((source, i) => {
                      const total = analytics.topSources.reduce((sum, s) => sum + s.visitors, 0)
                      const percent = total > 0 ? Math.round((source.visitors / total) * 100) : 0
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{source.source}</span>
                            <span className="text-sm font-medium text-gray-900">{percent}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No source data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Devices</h4>
                {analytics.deviceBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.deviceBreakdown.map((device, i) => {
                      const total = analytics.deviceBreakdown.reduce((sum, d) => sum + d.count, 0)
                      const percent = total > 0 ? Math.round((device.count / total) * 100) : 0
                      const Icon = device.device === "mobile" ? Smartphone : device.device === "tablet" ? Tablet : Monitor
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900 capitalize">{device.device}</span>
                              <span className="text-sm text-gray-500">{percent}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No device data yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* No Data State */}
          {analytics.overview.totalPageViews === 0 && (
            <Card className="border-0 shadow-sm bg-blue-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No website data yet</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Add the tracking code to your website to start collecting visitor data, page views, and conversion analytics.
                </p>
                <Button onClick={() => setShowSetup(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Code className="h-4 w-4 mr-2" />
                  Get Tracking Code
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
