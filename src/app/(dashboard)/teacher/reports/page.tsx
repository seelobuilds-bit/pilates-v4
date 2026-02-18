"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, TrendingUp, Users, Star, Calendar, DollarSign, BarChart3 } from "lucide-react"

interface TeacherReportStats {
  totalClasses: number
  totalStudents: number
  avgRating: number
  revenue: number
  retentionRate: number
  avgFillRate: number
  monthlyClasses: { month: string; count: number }[]
  topClasses: { name: string; count: number }[]
  recentReviews: { clientName: string; rating: number; comment: string; date: string }[]
}

const emptyStats: TeacherReportStats = {
  totalClasses: 0,
  totalStudents: 0,
  avgRating: 0,
  revenue: 0,
  retentionRate: 0,
  avgFillRate: 0,
  monthlyClasses: [],
  topClasses: [],
  recentReviews: []
}

export default function TeacherReportsPage() {
  const [stats, setStats] = useState<TeacherReportStats>(emptyStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/teacher/stats")
        if (!response.ok) {
          setStats(emptyStats)
          return
        }
        const data = await response.json()
        setStats({
          totalClasses: data.totalClasses ?? 0,
          totalStudents: data.totalStudents ?? 0,
          avgRating: data.avgRating ?? 0,
          revenue: data.revenue ?? 0,
          retentionRate: data.retentionRate ?? 0,
          avgFillRate: data.avgFillRate ?? 0,
          monthlyClasses: Array.isArray(data.monthlyClasses) ? data.monthlyClasses : [],
          topClasses: Array.isArray(data.topClasses) ? data.topClasses : [],
          recentReviews: Array.isArray(data.recentReviews) ? data.recentReviews : []
        })
      } catch (error) {
        console.error("Failed to fetch teacher reports:", error)
        setStats(emptyStats)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const maxMonthlyCount = Math.max(1, ...stats.monthlyClasses.map((month) => month.count))
  const hasRatingData = stats.avgRating > 0

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-500 mt-1">Track your performance and growth</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
                <p className="text-sm text-gray-500">Classes This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-sm text-gray-500">Students Taught</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{hasRatingData ? stats.avgRating.toFixed(1) : "N/A"}</p>
                <p className="text-sm text-gray-500">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Revenue Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <span className="text-sm font-medium text-emerald-700">Client Retention</span>
                  <span className="text-lg font-bold text-emerald-600">{stats.retentionRate}%</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.retentionRate}%` }} />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Average Class Fill Rate</span>
                  <span className="text-lg font-bold text-blue-600">{stats.avgFillRate}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.avgFillRate}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Top Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topClasses.length > 0 ? (
              <div className="space-y-3">
                {stats.topClasses.map((cls, i) => (
                  <div key={`${cls.name}-${i}`} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <span className="font-medium text-gray-900 truncate">{cls.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{cls.count} classes</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No class data yet for this month.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Classes Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyClasses.length > 0 ? (
              <div className="flex items-end justify-between h-32 gap-2 sm:gap-4">
                {stats.monthlyClasses.map((month, i) => {
                  const height = (month.count / maxMonthlyCount) * 100
                  return (
                    <div key={`${month.month}-${i}`} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{month.count}</span>
                      <div className="w-full bg-violet-500 rounded-t" style={{ height: `${height}%` }} />
                      <span className="text-xs text-gray-500">{month.month}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No month-by-month class history available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-gray-400" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentReviews.length > 0 ? (
              <div className="space-y-4">
                {stats.recentReviews.map((review, i) => (
                  <div key={`${review.clientName}-${i}`} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-900">{review.clientName}</span>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No review data available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
