import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  Target,
  Activity,
  PieChart
} from "lucide-react"

export const dynamic = "force-dynamic"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoReportsPage() {
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalClients,
    newClientsThisMonth,
    totalBookingsThisMonth,
    totalClassesThisMonth,
    totalTeachers,
    locations
  ] = await Promise.all([
    db.client.count({ where: { studioId: studio.id } }),
    db.client.count({ where: { studioId: studio.id, createdAt: { gte: startOfMonth } } }),
    db.booking.count({ where: { studioId: studio.id, createdAt: { gte: startOfMonth } } }),
    db.classSession.count({ where: { studioId: studio.id, startTime: { gte: startOfMonth } } }),
    db.teacher.count({ where: { studioId: studio.id, isActive: true } }),
    db.location.findMany({ where: { studioId: studio.id, isActive: true } })
  ])

  // Calculate average fill rate
  const classesWithBookings = await db.classSession.findMany({
    where: { studioId: studio.id, startTime: { gte: startOfMonth } },
    select: { capacity: true, _count: { select: { bookings: true } } }
  })

  const avgFillRate = classesWithBookings.length > 0
    ? Math.round(classesWithBookings.reduce((sum, c) => sum + (c._count.bookings / c.capacity * 100), 0) / classesWithBookings.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Analytics and insights for your studio</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{newClientsThisMonth} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalBookingsThisMonth}</p>
                <p className="text-sm text-gray-500">Bookings This Month</p>
                <p className="text-xs text-gray-400 mt-1">{totalClassesThisMonth} classes held</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgFillRate}%</p>
                <p className="text-sm text-gray-500">Avg Fill Rate</p>
                <p className="text-xs text-gray-400 mt-1">Class capacity utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
                <p className="text-sm text-gray-500">Active Teachers</p>
                <p className="text-xs text-gray-400 mt-1">{locations.length} locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto border bg-white p-1">
          <TabsTrigger value="overview" className="shrink-0">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="shrink-0">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="clients" className="shrink-0">
            <Users className="h-4 w-4 mr-2" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="classes" className="shrink-0">
            <Calendar className="h-4 w-4 mr-2" />
            Classes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings Chart Placeholder */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Bookings Over Time</h3>
                <div className="h-52 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 sm:h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-violet-300 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization</p>
                    <p className="text-sm text-gray-400">Coming soon with real data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Popularity */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Class Popularity</h3>
                <div className="h-52 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 sm:h-64 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-blue-300 mx-auto mb-2" />
                    <p className="text-gray-500">Distribution chart</p>
                    <p className="text-sm text-gray-400">Coming soon with real data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Teachers */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Top Performing Teachers</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-medium text-sm">
                          {i}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Teacher {i}</p>
                          <p className="text-xs text-gray-500">Based on bookings</p>
                        </div>
                      </div>
                      <Badge className="w-fit bg-violet-100 text-violet-700">
                        {100 - i * 15} bookings
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Performance */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Location Performance</h3>
                <div className="space-y-3">
                  {locations.map((location, i) => (
                    <div key={location.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{location.name}</p>
                          <p className="text-xs text-gray-500">{Math.round(avgFillRate - i * 5)}% fill rate</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {Math.round(totalClassesThisMonth / (locations.length || 1))} classes
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="py-8 text-center sm:py-12">
                <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Revenue Analytics</h3>
                <p className="text-gray-500">Detailed revenue reports and projections</p>
                <p className="text-sm text-gray-400 mt-1">Connect Stripe for full analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Client Analytics</h3>
                <p className="text-gray-500">Retention, churn, and engagement metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Class Analytics</h3>
                <p className="text-gray-500">Attendance patterns and popular times</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

