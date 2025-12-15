import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Users, Calendar, AlertCircle, Clock, Sparkles } from "lucide-react"

export default async function StudioDashboardPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const studioId = session.user.studioId

  const [clientCount, totalClients, bookingCount, weekBookings, upcomingClasses, recentBookings] = await Promise.all([
    db.client.count({ where: { studioId, isActive: true } }),
    db.client.count({ where: { studioId } }),
    db.booking.count({ where: { studioId } }),
    db.booking.count({ 
      where: { 
        studioId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      } 
    }),
    db.classSession.findMany({
      where: { 
        studioId,
        startTime: { gte: new Date() }
      },
      include: {
        classType: true,
        teacher: { include: { user: true } },
        location: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" },
      take: 5
    }),
    db.booking.findMany({
      where: { studioId },
      include: {
        client: true,
        classSession: { include: { classType: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ])

  // Calculate churn (clients who haven't booked in 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const activeClientsWithRecentBookings = await db.client.count({
    where: {
      studioId,
      bookings: {
        some: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    }
  })
  const churnRate = totalClients > 0 
    ? ((totalClients - activeClientsWithRecentBookings) / totalClients * 100).toFixed(1)
    : "0.0"

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/studio/schedule/new">
            <Button variant="outline">Add Class</Button>
          </Link>
          <Link href="/studio/schedule">
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">$0.00</p>
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                  <span className="text-emerald-500">↗</span> This month
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Clients</p>
                <p className="text-3xl font-bold text-gray-900">{clientCount}</p>
                <p className="text-sm text-gray-400 mt-2">{totalClients} total clients</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{bookingCount}</p>
                <p className="text-sm mt-2 flex items-center gap-1">
                  <span className="text-teal-500">↗</span>
                  <span className="text-teal-500">{weekBookings} this week</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Churn Rate</p>
                <p className="text-3xl font-bold text-gray-900">{churnRate}%</p>
                <p className="text-sm text-gray-400 mt-2">30-day inactive rate</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">Upcoming Classes</h3>
                  <p className="text-sm text-gray-500">Next classes on the schedule</p>
                </div>
              </div>
              <Link href="/studio/schedule" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                View all →
              </Link>
            </div>
            
            {upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{cls.classType.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(cls.startTime).toLocaleDateString()} at {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{cls.teacher.user.firstName} {cls.teacher.user.lastName[0]}.</p>
                      <p className="text-sm text-gray-400">{cls._count.bookings}/{cls.capacity}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming classes</p>
                <Link href="/studio/schedule/new" className="text-violet-600 hover:text-violet-700 font-medium text-sm">
                  Add a class
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                  <p className="text-sm text-gray-500">Latest booking activity</p>
                </div>
              </div>
              <Link href="/studio/clients" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                View all →
              </Link>
            </div>
            
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.client.firstName} {booking.client.lastName}</p>
                      <p className="text-sm text-gray-500">{booking.classSession.classType.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{booking.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No bookings yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
