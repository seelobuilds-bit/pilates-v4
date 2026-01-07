import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MapPin,
  Calendar,
  Users,
  Clock,
  Settings,
  ChevronRight
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoLocationsPage() {
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

  const locations = await db.location.findMany({
    where: { studioId: studio.id },
    include: {
      _count: {
        select: { classSessions: true }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  // Get this month's classes for each location
  const monthlyClassCounts = await Promise.all(
    locations.map(async (location) => {
      const count = await db.classSession.count({
        where: {
          locationId: location.id,
          startTime: { gte: startOfMonth }
        }
      })
      const upcomingCount = await db.classSession.count({
        where: {
          locationId: location.id,
          startTime: { gte: now }
        }
      })
      return { locationId: location.id, monthlyCount: count, upcomingCount }
    })
  )

  const monthlyClassMap = new Map(monthlyClassCounts.map(m => [m.locationId, m]))

  const activeLocations = locations.filter(l => l.isActive).length

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500 mt-1">Manage your studio locations</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
                <p className="text-sm text-gray-500">Total Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeLocations}</p>
                <p className="text-sm text-gray-500">Active</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {locations.reduce((sum, l) => sum + l._count.classSessions, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No locations found</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Add your first location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(location => {
            const stats = monthlyClassMap.get(location.id)
            
            return (
              <Link key={location.id} href={`/demo/locations/${location.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{location.name}</h3>
                            {location.isActive ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          {location.address && (
                            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[200px]">
                              {location.address}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.monthlyCount || 0}
                        </p>
                        <p className="text-xs text-gray-500">Classes this month</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.upcomingCount || 0}
                        </p>
                        <p className="text-xs text-gray-500">Upcoming</p>
                      </div>
                    </div>

                    {location.timezone && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {location.timezone}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}




