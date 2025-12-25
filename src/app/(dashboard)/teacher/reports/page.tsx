"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp,
  Users,
  Star,
  Calendar,
  DollarSign,
  BarChart3
} from "lucide-react"

export default function TeacherReportsPage() {
  // Mock data - in production this would come from API
  const stats = {
    totalClasses: 48,
    totalStudents: 287,
    avgRating: 4.9,
    revenue: 8450,
    retentionRate: 87,
    avgFillRate: 82,
    monthlyClasses: [
      { month: "Jul", count: 8 },
      { month: "Aug", count: 10 },
      { month: "Sep", count: 9 },
      { month: "Oct", count: 12 },
      { month: "Nov", count: 11 },
      { month: "Dec", count: 8 }
    ],
    topClasses: [
      { name: "Reformer Pilates", count: 24, rating: 4.9 },
      { name: "Mat Pilates", count: 16, rating: 4.8 },
      { name: "Tower Class", count: 8, rating: 4.7 }
    ],
    recentReviews: [
      { clientName: "Emma W.", rating: 5, comment: "Amazing class! So attentive and helpful.", date: "2 days ago" },
      { clientName: "John D.", rating: 5, comment: "Best instructor I've had.", date: "1 week ago" },
      { clientName: "Lisa M.", rating: 4, comment: "Great energy and clear instructions.", date: "2 weeks ago" }
    ]
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-500 mt-1">Track your performance and growth</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
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
        {/* Performance Metrics */}
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-emerald-700">Client Retention</span>
                  <span className="text-lg font-bold text-emerald-600">{stats.retentionRate}%</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.retentionRate}%` }} />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
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

        {/* Top Classes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Top Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topClasses.map((cls, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900">{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{cls.count} classes</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-gray-900">{cls.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Classes Over Time */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Classes Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-32 gap-4">
              {stats.monthlyClasses.map((month, i) => {
                const maxCount = Math.max(...stats.monthlyClasses.map(m => m.count))
                const height = (month.count / maxCount) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{month.count}</span>
                    <div className="w-full bg-violet-500 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-gray-400" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentReviews.map((review, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
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
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}














