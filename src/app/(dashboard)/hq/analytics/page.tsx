import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Zap,
  Target,
  BarChart3
} from "lucide-react"

export default async function HQAnalyticsPage() {
  const [studioCount, clientCount, bookingCount] = await Promise.all([
    db.studio.count(),
    db.client.count(),
    db.booking.count(),
  ])

  const studios = await db.studio.findMany({
    include: {
      _count: {
        select: { clients: true, teachers: true, locations: true, classSessions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Mock additional data for comprehensive analytics
  const platformMetrics = {
    monthlyRevenue: 125400,
    previousMonthRevenue: 118200,
    revenueGrowth: 6.1,
    avgRevenuePerStudio: Math.round(125400 / (studioCount || 1)),
    totalActiveClients: Math.round(clientCount * 0.75),
    newClientsThisMonth: Math.round(clientCount * 0.1),
    churnedClientsThisMonth: Math.round(clientCount * 0.04),
    avgClassUtilisation: 72,
    totalBookingsThisMonth: Math.round(bookingCount * 0.15),
    onboardingInProgress: 2,
    atRiskStudios: 1
  }

  const studioHealth = studios.map((studio, i) => ({
    ...studio,
    health: i === 0 ? 'healthy' : i === 1 ? 'growing' : i === 2 ? 'at-risk' : 'healthy',
    revenue: Math.round(25000 - (i * 3000) + (i * 750)),
    utilisation: Math.round(75 - (i * 5) + (i * 2)),
    churnRate: Math.round(3 + (i * 1.5)),
    lastActive: i === 2 ? '3 days ago' : 'Today',
    trend: i === 2 ? 'down' : i === 1 ? 'up' : 'stable'
  }))

  const recentActivity = [
    { studio: "Zenith Pilates", action: "New client signup", time: "2 min ago", type: "positive" },
    { studio: "Harmony Studio", action: "Class booking", time: "15 min ago", type: "neutral" },
    { studio: "Balance & Flow", action: "Owner login", time: "1 hour ago", type: "neutral" },
    { studio: "Core Strength", action: "Low utilisation alert", time: "2 hours ago", type: "warning" },
    { studio: "Pure Motion", action: "Win-back email sent", time: "3 hours ago", type: "neutral" }
  ]

  const onboardingStatus = [
    { studio: "New Studio A", step: 3, totalSteps: 5, status: "Setting up locations", daysOld: 2 },
    { studio: "New Studio B", step: 1, totalSteps: 5, status: "Account created", daysOld: 5 }
  ]

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-500 mt-1">Monitor studio health at scale and identify opportunities</p>
      </div>

      {/* Quick Alerts Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="h-5 w-5" />
            <h2 className="font-semibold">Platform Health Summary</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-sm">{studioCount - platformMetrics.atRiskStudios} studios healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-sm">{platformMetrics.atRiskStudios} studio at risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-sm">{platformMetrics.onboardingInProgress} onboarding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-sm">Revenue up {platformMetrics.revenueGrowth}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {platformMetrics.revenueGrowth}%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">${platformMetrics.monthlyRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Platform Revenue (MTD)</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{studioCount}</p>
            <p className="text-sm text-gray-500">Active Studios</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                +{platformMetrics.newClientsThisMonth}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">{platformMetrics.totalActiveClients.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Active Clients</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{platformMetrics.avgClassUtilisation}%</p>
            <p className="text-sm text-gray-500">Avg. Utilisation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Studio Health Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Studio Health Overview</h3>
                  <p className="text-sm text-gray-500">Monitor each studio&apos;s performance</p>
                </div>
                <Link href="/hq/studios">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {studioHealth.slice(0, 5).map((studio, i) => (
                  <Link key={i} href={`/hq/studios/${studio.id}`}>
                    <div className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                      studio.health === 'at-risk' 
                        ? 'border-red-200 bg-red-50/50' 
                        : studio.health === 'growing'
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-gray-100 bg-white hover:border-violet-200'
                    }`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            studio.health === 'at-risk' ? 'bg-red-100' :
                            studio.health === 'growing' ? 'bg-emerald-100' :
                            'bg-violet-100'
                          }`}>
                            <Building2 className={`h-5 w-5 ${
                              studio.health === 'at-risk' ? 'text-red-600' :
                              studio.health === 'growing' ? 'text-emerald-600' :
                              'text-violet-600'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{studio.name}</p>
                            <p className="text-sm text-gray-500">Last active: {studio.lastActive}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <Badge variant="secondary" className={`${
                            studio.health === 'at-risk' ? 'bg-red-100 text-red-700' :
                            studio.health === 'growing' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {studio.health === 'at-risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {studio.health === 'growing' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {studio.health}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-lg font-bold text-gray-900">${(studio.revenue / 1000).toFixed(1)}k</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{studio._count.clients}</p>
                          <p className="text-xs text-gray-500">Clients</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{studio.utilisation}%</p>
                          <p className="text-xs text-gray-500">Utilisation</p>
                        </div>
                        <div>
                          <p className={`text-lg font-bold ${
                            studio.churnRate > 5 ? 'text-red-600' : 'text-gray-900'
                          }`}>{studio.churnRate}%</p>
                          <p className="text-xs text-gray-500">Churn</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* At-Risk Alert */}
          {platformMetrics.atRiskStudios > 0 && (
            <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">At-Risk Studios</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {platformMetrics.atRiskStudios} studio showing churn risk signals
                </p>
                {studioHealth.filter(s => s.health === 'at-risk').map((studio, i) => (
                  <Link key={i} href={`/hq/studios/${studio.id}`}>
                    <div className="p-3 bg-red-50 rounded-lg mb-2 hover:bg-red-100 transition-all">
                      <p className="font-medium text-gray-900">{studio.name}</p>
                      <p className="text-sm text-red-600">{studio.churnRate}% churn rate • Low activity</p>
                    </div>
                  </Link>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2 text-red-600 border-red-200">
                  View Risk Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Onboarding Progress */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">Onboarding</h3>
              </div>
              <div className="space-y-3">
                {onboardingStatus.map((studio, i) => (
                  <div key={i} className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{studio.studio}</p>
                      <span className="text-xs text-amber-600">{studio.daysOld} days</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-amber-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${(studio.step / studio.totalSteps) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{studio.step}/{studio.totalSteps}</span>
                    </div>
                    <p className="text-xs text-gray-500">{studio.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'positive' ? 'bg-emerald-500' :
                      activity.type === 'warning' ? 'bg-amber-500' :
                      'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.studio} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Product Usage</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Studios using automations</span>
                <span className="font-bold text-gray-900">80%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg. classes/week/studio</span>
                <span className="font-bold text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Mobile app usage</span>
                <span className="font-bold text-gray-900">45%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-gray-900">Client Growth</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">New clients (MTD)</span>
                <span className="font-bold text-emerald-600">+{platformMetrics.newClientsThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Churned clients (MTD)</span>
                <span className="font-bold text-red-600">-{platformMetrics.churnedClientsThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Net growth</span>
                <span className="font-bold text-gray-900">+{platformMetrics.newClientsThisMonth - platformMetrics.churnedClientsThisMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Booking Activity</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Bookings (MTD)</span>
                <span className="font-bold text-gray-900">{platformMetrics.totalBookingsThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg. per studio</span>
                <span className="font-bold text-gray-900">{Math.round(platformMetrics.totalBookingsThisMonth / studioCount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Cancellation rate</span>
                <span className="font-bold text-gray-900">8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-gray-900">Revenue Health</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg. revenue/studio</span>
                <span className="font-bold text-gray-900">${platformMetrics.avgRevenuePerStudio.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">MoM growth</span>
                <span className="font-bold text-emerald-600">+{platformMetrics.revenueGrowth}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Studios growing</span>
                <span className="font-bold text-gray-900">{studioCount - 1}/{studioCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Studio Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-6">All Studios Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Studio</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Health</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Clients</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Utilisation</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Churn</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Trend</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {studioHealth.map((studio, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{studio.name}</p>
                          <p className="text-sm text-gray-500">{studio.subdomain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <Badge variant="secondary" className={`${
                        studio.health === 'at-risk' ? 'bg-red-100 text-red-700' :
                        studio.health === 'growing' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {studio.health}
                      </Badge>
                    </td>
                    <td className="text-right py-4 px-4 font-medium text-gray-900">
                      ${studio.revenue.toLocaleString()}
                    </td>
                    <td className="text-center py-4 px-4 text-gray-900">{studio._count.clients}</td>
                    <td className="text-center py-4 px-4">
                      <span className={`font-medium ${
                        studio.utilisation >= 80 ? 'text-emerald-600' :
                        studio.utilisation >= 60 ? 'text-gray-900' :
                        'text-amber-600'
                      }`}>{studio.utilisation}%</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`font-medium ${
                        studio.churnRate > 5 ? 'text-red-600' : 'text-gray-900'
                      }`}>{studio.churnRate}%</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      {studio.trend === 'up' && <ArrowUpRight className="h-5 w-5 text-emerald-500 mx-auto" />}
                      {studio.trend === 'down' && <ArrowDownRight className="h-5 w-5 text-red-500 mx-auto" />}
                      {studio.trend === 'stable' && <Activity className="h-5 w-5 text-gray-400 mx-auto" />}
                    </td>
                    <td className="text-right py-4 px-4">
                      <Link href={`/hq/studios/${studio.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
