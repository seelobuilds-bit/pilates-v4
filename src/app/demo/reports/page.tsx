// Demo Reports Page - Mirrors /studio/reports/page.tsx
// Keep in sync with the real reports page

"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ChevronRight,
  GraduationCap
} from "lucide-react"
import { demoReportsData, demoTeachers, demoClients } from "../_data/demo-data"

// Extended mock data for comprehensive reports
const mockReportsData = {
  revenue: {
    total: 45890,
    previousPeriod: 42150,
    percentChange: 8.9,
    bySource: [
      { name: "Memberships", amount: 28500, percent: 62, trend: "up", change: 12 },
      { name: "Class Packs", amount: 12400, percent: 27, trend: "up", change: 5 },
      { name: "Drop-ins", amount: 4990, percent: 11, trend: "down", change: -8 }
    ],
    monthly: [
      { month: "Jul", amount: 38200 },
      { month: "Aug", amount: 41500 },
      { month: "Sep", amount: 39800 },
      { month: "Oct", amount: 44200 },
      { month: "Nov", amount: 42150 },
      { month: "Dec", amount: 45890 }
    ],
    insights: [
      { type: "positive", message: "Membership revenue up 12% - highest growth in 6 months" },
      { type: "warning", message: "Drop-in revenue declining - consider promotional offers" }
    ]
  },
  utilisation: {
    averageFill: 72,
    previousPeriod: 68,
    totalClasses: 342,
    totalAttendance: 2467,
    byTimeSlot: [
      { time: "6:00 AM", fill: 58 },
      { time: "8:00 AM", fill: 85 },
      { time: "9:30 AM", fill: 92 },
      { time: "11:00 AM", fill: 68 },
      { time: "1:00 PM", fill: 45 },
      { time: "5:00 PM", fill: 88 },
      { time: "6:30 PM", fill: 94 },
      { time: "8:00 PM", fill: 72 }
    ],
    topClasses: [
      { name: "9:30 AM Reformer (Sat)", fill: 100, waitlist: 4 },
      { name: "6:30 PM Mat Pilates (Tue)", fill: 100, waitlist: 2 },
      { name: "8:00 AM Tower (Wed)", fill: 95, waitlist: 0 }
    ],
    underperforming: [
      { name: "1:00 PM Beginner (Mon)", fill: 35 },
      { name: "8:00 PM Advanced (Fri)", fill: 42 },
      { name: "6:00 AM Mat (Sun)", fill: 40 }
    ]
  },
  instructors: [
    { id: "1", name: "Sarah Mitchell", classes: 48, avgFill: 89, revenue: 8450, rating: 4.9 },
    { id: "2", name: "Jessica Taylor", classes: 36, avgFill: 82, revenue: 7120, rating: 4.8 },
    { id: "3", name: "Amanda Lopez", classes: 32, avgFill: 78, revenue: 5980, rating: 4.7 }
  ],
  retention: {
    totalClients: 248,
    activeClients: 198,
    churnRate: 5.2,
    atRiskClients: 23,
    newClients: 34,
    returningRate: 78,
    cohorts: [
      { month: "Jul", retained: 92 },
      { month: "Aug", retained: 88 },
      { month: "Sep", retained: 85 },
      { month: "Oct", retained: 90 },
      { month: "Nov", retained: 87 },
      { month: "Dec", retained: 91 }
    ]
  }
}

export default function DemoReportsPage() {
  const [period, setPeriod] = useState("30")

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Key Insights Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Revenue Growth</p>
                <p className="text-2xl font-bold">+8.9%</p>
              </div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Fill Rate</p>
                <p className="text-2xl font-bold">72%</p>
              </div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">New Clients</p>
                <p className="text-2xl font-bold">+34</p>
              </div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">At Risk</p>
                <p className="text-2xl font-bold">23</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Track your studio performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="classes" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Calendar className="h-4 w-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="instructors" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <GraduationCap className="h-4 w-4 mr-2" />
            Instructors
          </TabsTrigger>
          <TabsTrigger value="retention" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Users className="h-4 w-4 mr-2" />
            Retention
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +8.9%
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-gray-900">${mockReportsData.revenue.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-violet-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +14%
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-gray-900">{mockReportsData.retention.activeClients}</p>
                <p className="text-sm text-gray-500 mt-1">Active Clients</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +6%
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-gray-900">{mockReportsData.utilisation.totalClasses}</p>
                <p className="text-sm text-gray-500 mt-1">Classes Taught</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                <div className="flex items-end justify-between h-48 gap-4">
                  {mockReportsData.revenue.monthly.map((month, i) => {
                    const maxAmount = Math.max(...mockReportsData.revenue.monthly.map(m => m.amount))
                    const height = (month.amount / maxAmount) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">${(month.amount / 1000).toFixed(0)}k</span>
                        <div className="w-full bg-violet-500 rounded-t" style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-500">{month.month}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  {mockReportsData.revenue.bySource.map((source, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{source.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">${source.amount.toLocaleString()}</span>
                          <Badge className={source.trend === "up" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                            {source.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(source.change)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${source.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockReportsData.revenue.insights.map((insight, i) => (
                  <div key={i} className={`p-4 rounded-lg ${insight.type === "positive" ? "bg-emerald-50" : "bg-amber-50"}`}>
                    <div className="flex items-start gap-3">
                      {insight.type === "positive" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      )}
                      <p className={`text-sm ${insight.type === "positive" ? "text-emerald-800" : "text-amber-800"}`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilisation by Time */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Fill Rate by Time Slot</h3>
                <div className="space-y-3">
                  {mockReportsData.utilisation.byTimeSlot.map((slot, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-16 text-sm text-gray-600">{slot.time}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${slot.fill >= 80 ? 'bg-emerald-500' : slot.fill >= 60 ? 'bg-violet-500' : 'bg-amber-500'}`} 
                          style={{ width: `${slot.fill}%` }} 
                        />
                      </div>
                      <span className="w-12 text-sm font-medium text-gray-900 text-right">{slot.fill}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top & Underperforming */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    Top Performing Classes
                  </h3>
                  <div className="space-y-3">
                    {mockReportsData.utilisation.topClasses.map((cls, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                        <span className="font-medium text-gray-900">{cls.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700">{cls.fill}% full</Badge>
                          {cls.waitlist > 0 && (
                            <Badge variant="secondary">{cls.waitlist} waitlist</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Needs Attention
                  </h3>
                  <div className="space-y-3">
                    {mockReportsData.utilisation.underperforming.map((cls, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <span className="font-medium text-gray-900">{cls.name}</span>
                        <Badge className="bg-amber-100 text-amber-700">{cls.fill}% fill</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Instructor Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Instructor</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Classes</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Avg Fill</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Revenue</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Rating</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReportsData.instructors.map((instructor, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                              {instructor.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium text-gray-900">{instructor.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">{instructor.classes}</td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={instructor.avgFill >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                            {instructor.avgFill}%
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">${instructor.revenue.toLocaleString()}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            {instructor.rating}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/demo/teachers/${instructor.id}`}>
                            <Button variant="ghost" size="sm">
                              View <ChevronRight className="h-4 w-4 ml-1" />
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
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{mockReportsData.retention.activeClients}</p>
                <p className="text-sm text-gray-500">Active Clients</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{mockReportsData.retention.newClients}</p>
                <p className="text-sm text-gray-500">New This Month</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{mockReportsData.retention.atRiskClients}</p>
                <p className="text-sm text-gray-500">At Risk</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UserMinus className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{mockReportsData.retention.churnRate}%</p>
                <p className="text-sm text-gray-500">Churn Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Retention Chart */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Retention by Cohort</h3>
              <div className="flex items-end justify-between h-48 gap-4">
                {mockReportsData.retention.cohorts.map((cohort, i) => {
                  const height = cohort.retained
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{cohort.retained}%</span>
                      <div className="w-full bg-violet-500 rounded-t" style={{ height: `${height}%` }} />
                      <span className="text-xs text-gray-500">{cohort.month}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* At Risk Clients */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">At-Risk Clients</h3>
                <Link href="/demo/clients">
                  <Button variant="outline" size="sm">
                    View All Clients
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {demoClients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-sm font-medium text-amber-700">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <Link href="/demo/inbox">
                      <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-100">
                        <Mail className="h-4 w-4 mr-2" />
                        Reach Out
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}























