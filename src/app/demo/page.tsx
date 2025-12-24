// Demo Dashboard Page - Mirrors /studio/page.tsx
// Keep in sync with the real dashboard page

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
  XCircle
} from "lucide-react"
import { 
  demoStats, 
  demoTodayClasses, 
  demoUpcomingClasses, 
  demoRecentBookings, 
  demoAtRiskClients,
  demoLocations,
  demoTeachers,
  demoClassTypes
} from "./_data/demo-data"

export default function DemoDashboardPage() {
  const now = new Date()
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = now.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}!</h1>
          <p className="text-gray-500 mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/demo/clients">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </Link>
          <Link href="/demo/schedule">
            <Button variant="outline" size="sm">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </Link>
          <Link href="/demo/schedule">
            <Button className="bg-violet-600 hover:bg-violet-700" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Today's Overview Banner */}
      <Card className="border-0 shadow-sm mb-6 bg-gradient-to-r from-violet-600 to-purple-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-lg font-semibold mb-1">Today&apos;s Overview</h2>
              <p className="text-violet-200 text-sm">
                {demoStats.todayClasses} classes scheduled • {demoStats.todayTotalBookings} bookings • {demoStats.todayFillRate}% fill rate
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 border-r border-white/20">
                <p className="text-3xl font-bold text-white">{demoStats.todayClasses}</p>
                <p className="text-xs text-violet-200">Classes</p>
              </div>
              <div className="text-center px-4 border-r border-white/20">
                <p className="text-3xl font-bold text-white">{demoStats.todayTotalBookings}</p>
                <p className="text-xs text-violet-200">Bookings</p>
              </div>
              <div className="text-center px-4">
                <p className="text-3xl font-bold text-white">{demoStats.todayFillRate}%</p>
                <p className="text-xs text-violet-200">Fill Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Monthly Revenue */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${demoStats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm mt-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">+{demoStats.revenueChange}%</span>
                  <span className="text-gray-400">vs last month</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">{demoStats.activeClients}</p>
                <p className="text-sm mt-1.5 flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-blue-500 font-medium">+{demoStats.newClientsThisWeek}</span>
                  <span className="text-gray-400">this week</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Bookings */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{demoStats.weekBookings} bookings</p>
                <p className="text-sm mt-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-violet-500 font-medium">{demoStats.todayBookings}</span>
                  <span className="text-gray-400">today</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* At Risk Clients */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">At Risk</p>
                <p className="text-2xl font-bold text-gray-900">{demoAtRiskClients.length} clients</p>
                <p className="text-sm mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-amber-500 font-medium">{demoStats.churnRate}%</span>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link href="/demo/inbox">
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
        <Link href="/demo/marketing">
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
        <Link href="/demo/reports">
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
        <Link href="/demo/settings">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Today&apos;s Schedule</h3>
                  <p className="text-sm text-gray-500">{demoTodayClasses.length} classes today</p>
                </div>
              </div>
              <Link href="/demo/schedule" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                View full schedule
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {demoTodayClasses.map((cls) => {
                const startTime = new Date(cls.startTime)
                const isPast = startTime < now
                const fillPercent = Math.round((cls._count.bookings / cls.capacity) * 100)
                
                return (
                  <Link key={cls.id} href={`/demo/schedule/${cls.id}`}>
                    <div className={`flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer ${
                      isPast ? 'bg-gray-50 opacity-60' : 'bg-gray-50 hover:bg-violet-50'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`text-center min-w-[60px] p-2 rounded-lg ${isPast ? 'bg-gray-200' : 'bg-violet-100'}`}>
                          <p className={`text-lg font-bold ${isPast ? 'text-gray-500' : 'text-violet-600'}`}>
                            {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
                          fillPercent >= 100 ? 'text-red-500' : 
                          fillPercent >= 80 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {cls._count.bookings}/{cls.capacity}
                        </div>
                        <p className="text-xs text-gray-500">{fillPercent}% full</p>
                        {isPast && (
                          <Badge variant="secondary" className="mt-1 text-xs">Completed</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* At Risk Clients */}
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
            
            <div className="space-y-3">
              {demoAtRiskClients.map((client) => (
                <Link key={client.id} href={`/demo/clients/${client.id}`}>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium text-sm">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{client.firstName} {client.lastName}</p>
                        <p className="text-xs text-amber-600">Last active {client.lastActive}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-amber-700 hover:text-amber-800 hover:bg-amber-200">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              ))}
              <Link href="/demo/clients" className="block">
                <Button variant="outline" className="w-full mt-2 text-amber-700 border-amber-200 hover:bg-amber-50">
                  View all at-risk clients
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Classes */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Coming Up</h3>
                  <p className="text-sm text-gray-500">Next {demoUpcomingClasses.length} classes</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {demoUpcomingClasses.slice(0, 4).map((cls) => (
                <Link key={cls.id} href={`/demo/schedule/${cls.id}`}>
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm">{cls.name}</p>
                      <span className={`text-xs font-medium ${
                        cls._count.bookings >= cls.capacity ? 'text-red-500' : 'text-teal-500'
                      }`}>
                        {cls._count.bookings}/{cls.capacity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(cls.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{cls.teacher.user.firstName} {cls.teacher.user.lastName[0]}.</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
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
              <Link href="/demo/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {demoRecentBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center gap-3 p-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
                    {booking.client.firstName[0]}{booking.client.lastName[0]}
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
          </CardContent>
        </Card>

        {/* Studio Stats */}
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
              <Link href="/demo/reports" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Reports
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Locations</span>
                </div>
                <span className="font-semibold text-gray-900">{demoLocations.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Instructors</span>
                </div>
                <span className="font-semibold text-gray-900">{demoTeachers.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Class Types</span>
                </div>
                <span className="font-semibold text-gray-900">{demoClassTypes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Total Clients</span>
                </div>
                <span className="font-semibold text-gray-900">{demoStats.totalClients}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">All-time Bookings</span>
                </div>
                <span className="font-semibold text-gray-900">{demoStats.bookings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}











