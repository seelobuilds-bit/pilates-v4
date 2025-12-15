import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Calendar, DollarSign } from "lucide-react"

export default async function HQDashboardPage() {
  const [studioCount, userCount, classCount, bookingCount] = await Promise.all([
    db.studio.count(),
    db.user.count(),
    db.classSession.count(),
    db.booking.count(),
  ])

  const stats = [
    { title: "Total Studios", value: studioCount, icon: Building2, color: "text-violet-600", bg: "bg-violet-100" },
    { title: "Total Users", value: userCount, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Classes", value: classCount, icon: Calendar, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Bookings", value: bookingCount, icon: DollarSign, color: "text-orange-600", bg: "bg-orange-100" },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HQ Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of all studios on Cadence</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
