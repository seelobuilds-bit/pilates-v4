"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, TrendingUp, Users, Star, Calendar, DollarSign, BarChart3 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface TeacherReportStats {
  currency: string
  totalClasses: number
  totalStudents: number
  avgRating: number | null
  revenue: number
  retentionRate: number
  avgFillRate: number
  monthlyClasses: { month: string; count: number }[]
  topClasses: { name: string; count: number }[]
  recentReviews: { clientName: string; rating: number; comment: string; date: string }[]
}

const emptyStats: TeacherReportStats = {
  currency: "usd",
  totalClasses: 0,
  totalStudents: 0,
  avgRating: null,
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
          currency: data.currency ?? "usd",
          totalClasses: data.totalClasses ?? 0,
          totalStudents: data.totalStudents ?? 0,
          avgRating: typeof data.avgRating === "number" ? data.avgRating : null,
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
  const hasRatingData = typeof stats.avgRating === "number" && stats.avgRating > 0

  return (
    <div className="min-h-screen bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Numbers</h1>
        <p className="mt-1 text-gray-500">A simple month-to-date view of your teaching performance.</p>
        <p className="mt-2 text-xs text-gray-400">Classes, revenue and client retention for the current month.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 sm:h-12 sm:w-12">
                <Calendar className="h-5 w-5 text-violet-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.totalClasses}</p>
                <p className="text-xs text-gray-500 sm:text-sm">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 sm:h-12 sm:w-12">
                <Users className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500 sm:text-sm">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 sm:h-12 sm:w-12">
                <Star className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">{hasRatingData ? stats.avgRating!.toFixed(1) : "N/A"}</p>
                <p className="text-xs text-gray-500 sm:text-sm">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 sm:h-12 sm:w-12">
                <DollarSign className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 sm:text-xl lg:text-2xl">{formatCurrency(stats.revenue, stats.currency)}</p>
                <p className="text-xs text-gray-500 sm:text-sm">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-gray-400" />
                Performance
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
              <CardTitle className="flex items-center gap-2 text-lg">
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
                Monthly Trend
              </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyClasses.length > 0 ? (
              <div className="app-scrollbar overflow-x-auto pb-1">
                <div className="flex min-w-[320px] items-end justify-between gap-2 sm:gap-4 h-32">
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
              <CardTitle className="flex items-center gap-2 text-lg">
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
