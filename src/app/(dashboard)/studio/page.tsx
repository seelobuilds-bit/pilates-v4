import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, DollarSign, MapPin, TrendingUp } from "lucide-react"

export default async function StudioDashboardPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const studioId = session.user.studioId

  const [clientCount, classCount, locationCount, bookingCount, recentBookings] = await Promise.all([
    db.client.count({ where: { studioId } }),
    db.classSession.count({ where: { studioId, startTime: { gte: new Date() } } }),
    db.location.count({ where: { studioId } }),
    db.booking.count({ where: { studioId } }),
    db.booking.findMany({
      where: { studioId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        classSession: {
          include: { classType: true, location: true }
        }
      }
    })
  ])

  const stats = [
    { title: "Total Clients", value: clientCount, icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
    { title: "Upcoming Classes", value: classCount, icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Locations", value: locationCount, icon: MapPin, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Bookings", value: bookingCount, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {session.user.firstName}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.client.firstName} {booking.client.lastName}</p>
                    <p className="text-sm text-gray-500">
                      {booking.classSession.classType.name} • {booking.classSession.location.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(booking.classSession.startTime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">{booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No bookings yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
