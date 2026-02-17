// Demo Teacher Detail Page - Mirrors /studio/teachers/[teacherId]/page.tsx
// Keep in sync with the real teacher detail page

"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Save,
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
  ChevronRight
} from "lucide-react"
import { demoTeachers, demoScheduleClasses } from "../../_data/demo-data"

// Mock extended stats
const mockExtendedStats = {
  revenue: 12450,
  retentionRate: 87,
  avgClassSize: 7.8,
  completionRate: 96,
  classBreakdown: [
    { name: "Reformer Pilates", count: 45 },
    { name: "Mat Pilates", count: 32 },
    { name: "Tower Class", count: 12 }
  ],
  locationBreakdown: [
    { name: "Downtown Studio", count: 56 },
    { name: "Westside Location", count: 33 }
  ],
  monthlyClasses: [
    { month: "Jul", count: 12 },
    { month: "Aug", count: 15 },
    { month: "Sep", count: 14 },
    { month: "Oct", count: 18 },
    { month: "Nov", count: 16 },
    { month: "Dec", count: 14 }
  ],
  recentReviews: [
    { clientName: "Emma W.", rating: 5, comment: "Amazing class! Sarah is so attentive and helpful.", date: "2 days ago" },
    { clientName: "John D.", rating: 5, comment: "Best instructor I've had. Really knows her stuff.", date: "1 week ago" },
    { clientName: "Lisa M.", rating: 4, comment: "Great energy and clear instructions.", date: "2 weeks ago" }
  ],
  topClients: [
    { name: "Emma Wilson", bookings: 24 },
    { name: "John Davis", bookings: 18 },
    { name: "Lisa Martinez", bookings: 15 },
    { name: "Alex Brown", bookings: 12 }
  ]
}

export default function DemoTeacherDetailPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = use(params)
  const teacher = demoTeachers.find(t => t.id === teacherId) || demoTeachers[0]
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0)
  const [specialtiesInput, setSpecialtiesInput] = useState(teacher.specialties?.join(", ") || "")
  
  // Filter classes for this teacher
  const teacherClasses = demoScheduleClasses.filter(
    c => c.teacher.user.firstName === teacher.user.firstName && c.teacher.user.lastName === teacher.user.lastName
  )

  // Generate week dates
  const getWeekDates = (offset: number) => {
    const today = new Date()
    const currentDay = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay + (offset * 7))
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(scheduleWeekOffset)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Group classes by day
  const classesByDay: Record<number, typeof teacherClasses> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  teacherClasses.forEach(cls => {
    const day = new Date(cls.startTime).getDay()
    classesByDay[day].push(cls)
  })

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
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/demo/teachers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Teachers
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
          <Badge className={teacher.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
            {teacher.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teacher._count.classSessions}</p>
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
                <p className="text-2xl font-bold text-gray-900">287</p>
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
                <p className="text-2xl font-bold text-gray-900">4.9</p>
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
                <p className="text-2xl font-bold text-gray-900">${mockExtendedStats.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Revenue Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="app-scrollbar w-full justify-start overflow-x-auto bg-white shadow-sm border-0">
          <TabsTrigger value="reports" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Users className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
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
                    <p className="text-2xl font-bold text-emerald-600">{mockExtendedStats.retentionRate}%</p>
                    <p className="text-sm text-emerald-700">Client Retention</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600">{mockExtendedStats.avgClassSize}</p>
                    <p className="text-sm text-blue-700">Avg. Class Size</p>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-violet-600">{mockExtendedStats.completionRate}%</p>
                    <p className="text-sm text-violet-700">Completion Rate</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-600">14</p>
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
                  {mockExtendedStats.classBreakdown.map((cls, i) => {
                    const total = mockExtendedStats.classBreakdown.reduce((a, c) => a + c.count, 0)
                    const pct = Math.round((cls.count / total) * 100)
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                          <span className="text-sm text-gray-500">{cls.count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
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
                  {mockExtendedStats.locationBreakdown.map((loc, i) => {
                    const total = mockExtendedStats.locationBreakdown.reduce((a, l) => a + l.count, 0)
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
                  {mockExtendedStats.topClients.map((client, i) => (
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
                  {mockExtendedStats.recentReviews.map((review, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-gray-900">{review.clientName}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className={`h-4 w-4 ${j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
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
                  {mockExtendedStats.monthlyClasses.map((month, i) => {
                    const maxCount = Math.max(...mockExtendedStats.monthlyClasses.map(m => m.count))
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
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {/* Schedule Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{teacherClasses.length}</p>
                <p className="text-sm text-gray-500">Classes This Week</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {teacherClasses.reduce((sum, c) => sum + c._count.bookings, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-violet-600">
                  {teacherClasses.length > 0 
                    ? Math.round(teacherClasses.reduce((sum, c) => sum + (c._count.bookings / c.capacity) * 100, 0) / teacherClasses.length)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">Avg. Fill Rate</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {teacherClasses.reduce((sum, c) => sum + c.capacity, 0)}
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
                <Link href={`/demo/schedule`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Full Schedule
                  </Button>
                </Link>
              </div>

              {/* Week Navigation */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                <Button variant="ghost" size="sm" onClick={() => setScheduleWeekOffset(prev => prev - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {scheduleWeekOffset !== 0 && (
                    <Button variant="outline" size="sm" onClick={() => setScheduleWeekOffset(0)}>
                      Today
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setScheduleWeekOffset(prev => prev + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <p className="text-center text-sm font-medium text-gray-700 mb-4">{formatDateRange()}</p>

              {/* Calendar Grid */}
              <div className="space-y-3 md:hidden">
                {weekDates.map((date, dayIndex) => (
                  <div key={dayIndex} className="rounded-xl border bg-white p-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {dayNames[dayIndex]} {date.getDate()}
                    </p>
                    {classesByDay[dayIndex].length > 0 ? (
                      <div className="space-y-2">
                        {classesByDay[dayIndex].map((cls) => (
                          <Link key={cls.id} href={`/demo/schedule/${cls.id}`}>
                            <div className="p-2 bg-violet-50 rounded-lg border-l-4 border-l-violet-500 hover:bg-violet-100 transition-colors">
                              <p className="font-medium text-xs text-gray-900 truncate">{cls.classType.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No classes</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:grid grid-cols-7 gap-3">
                {/* Day Headers */}
                {weekDates.map((date, i) => {
                  const isToday = new Date().toDateString() === date.toDateString()
                  return (
                    <div key={i} className={`text-center p-3 rounded-xl ${isToday ? 'bg-violet-100' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-medium ${isToday ? 'text-violet-600' : 'text-gray-500'}`}>
                        {dayNames[i]}
                      </p>
                      <p className={`text-lg font-bold ${isToday ? 'text-violet-600' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </p>
                    </div>
                  )
                })}

                {/* Classes for each day */}
                {weekDates.map((_, dayIndex) => (
                  <div key={dayIndex} className="space-y-2 min-h-[200px]">
                    {classesByDay[dayIndex].length > 0 ? (
                      classesByDay[dayIndex].map((cls) => (
                        <Link key={cls.id} href={`/demo/schedule/${cls.id}`}>
                          <div className="p-2 bg-violet-50 rounded-lg border-l-4 border-l-violet-500 hover:bg-violet-100 transition-colors cursor-pointer">
                            <p className="font-medium text-xs text-gray-900 truncate">{cls.classType.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {cls.location.name}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${cls._count.bookings >= cls.capacity ? 'text-red-500' : 'text-emerald-500'}`}>
                              {cls._count.bookings}/{cls.capacity} booked
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-gray-400">No classes</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                  <Link href="/demo/teachers">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">Cancel</Button>
                  </Link>
                  <Button size="sm" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save
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
                    defaultValue="Passionate pilates instructor with 8 years of experience. Specializes in rehabilitative exercises and helping clients achieve their wellness goals."
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
                  <Switch checked={teacher.isActive} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


























