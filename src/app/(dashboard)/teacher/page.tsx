"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  TrendingUp, 
  DollarSign,
  ChevronRight,
  MapPin,
  AlertTriangle
} from "lucide-react"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"

interface ClassSession {
  id: string
  startTime: string
  endTime: string
  capacity: number
  classType: { name: string }
  location: { name: string }
  _count: { bookings: number }
  clientAlertCount?: number
}

interface TeacherStats {
  currency?: string
  totalClasses: number
  totalStudents: number
  avgRating: number | null
  revenue: number
  retentionRate?: number
  avgFillRate?: number
  completionRate?: number
  upcomingClasses: ClassSession[]
  recentClasses: ClassSession[]
}

export default function TeacherDashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/teacher/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Default empty stats if API is unavailable
  const displayStats = stats || {
    currency: "usd",
    totalClasses: 0,
    totalStudents: 0,
    avgRating: null,
    revenue: 0,
    retentionRate: 0,
    avgFillRate: 0,
    completionRate: 0,
    upcomingClasses: [],
    recentClasses: []
  }
  const hasRatingData = typeof displayStats.avgRating === "number" && displayStats.avgRating > 0

  return (
    <div className="min-h-screen bg-gray-50/50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Welcome Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Welcome back, {session?.user?.firstName || "Teacher"}!
        </h1>
        <p className="text-gray-500 mt-1">
          {session?.user?.studioName || "Your Studio"} • Teacher Portal
        </p>
        <p className="mt-2 text-xs text-gray-400 sm:text-sm">
          Your month-to-date teaching snapshot.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 xl:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 sm:h-12 sm:w-12">
                <Calendar className="h-5 w-5 text-violet-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">{displayStats.totalClasses}</p>
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
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">{displayStats.totalStudents}</p>
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
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {hasRatingData ? displayStats.avgRating!.toFixed(1) : "N/A"}
                </p>
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
                <p className="text-base font-bold text-gray-900 sm:text-xl lg:text-2xl">
                  {formatCurrency(displayStats.revenue, displayStats.currency || "usd")}
                </p>
                <p className="text-xs text-gray-500 sm:text-sm">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                Today
              </CardTitle>
              <Link href="/teacher/schedule">
                <Button variant="ghost" size="sm">
                  View schedule <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
              </div>
            ) : displayStats.upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {displayStats.upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-violet-600">
                          {new Date(cls.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cls.classType.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cls.location.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`w-fit ${cls._count.bookings >= cls.capacity ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                        {cls._count.bookings}/{cls.capacity}
                      </Badge>
                      {(cls.clientAlertCount ?? 0) > 0 && (
                        <Badge variant="destructive" className="w-fit gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {cls.clientAlertCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No classes scheduled for today</p>
                <Link href="/teacher/schedule">
                  <Button variant="outline" size="sm" className="mt-3">
                    View Full Schedule
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-emerald-700">Client Retention</span>
                  <span className="text-lg font-bold text-emerald-600">{displayStats.retentionRate || 0}%</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${displayStats.retentionRate || 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Average Class Fill Rate</span>
                  <span className="text-lg font-bold text-blue-600">{displayStats.avgFillRate || 0}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${displayStats.avgFillRate || 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-violet-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-violet-700">Completion Rate</span>
                  <span className="text-lg font-bold text-violet-600">{displayStats.completionRate || 0}%</span>
                </div>
                <div className="w-full bg-violet-200 rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full"
                    style={{ width: `${displayStats.completionRate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
              <CardTitle className="text-lg">Jump To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              <Link href="/teacher/schedule">
                <Button variant="outline" className="h-16 w-full flex-col gap-1 text-xs sm:h-20 sm:gap-2 sm:text-sm">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>My Schedule</span>
                </Button>
              </Link>
              <Link href="/teacher/clients">
                <Button variant="outline" className="h-16 w-full flex-col gap-1 text-xs sm:h-20 sm:gap-2 sm:text-sm">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Clients</span>
                </Button>
              </Link>
              <Link href="/teacher/reports">
                <Button variant="outline" className="h-16 w-full flex-col gap-1 text-xs sm:h-20 sm:gap-2 sm:text-sm">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Reports</span>
                </Button>
              </Link>
              <Link href="/teacher/settings">
                <Button variant="outline" className="h-16 w-full flex-col gap-1 text-xs sm:h-20 sm:gap-2 sm:text-sm">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




















