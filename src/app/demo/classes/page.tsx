import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Calendar,
  Clock,
  DollarSign,
  ChevronRight,
  Dumbbell
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = process.env.DEMO_STUDIO_SUBDOMAIN || "zenith"

export default async function DemoClassesPage() {
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

  const classTypes = await db.classType.findMany({
    where: { studioId: studio.id },
    include: {
      _count: {
        select: { classSessions: true }
      }
    },
    orderBy: { name: "asc" }
  })

  // Get upcoming session counts
  const now = new Date()
  const upcomingCounts = await Promise.all(
    classTypes.map(async (ct) => {
      const count = await db.classSession.count({
        where: {
          classTypeId: ct.id,
          startTime: { gte: now }
        }
      })
      return { classTypeId: ct.id, upcoming: count }
    })
  )
  const upcomingMap = new Map(upcomingCounts.map(c => [c.classTypeId, c.upcoming]))

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Types</h1>
          <p className="text-gray-500 mt-1">Manage the types of classes you offer</p>
        </div>
        <Button className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Class Type
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{classTypes.length}</p>
                <p className="text-sm text-gray-500">Class Types</p>
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
                  {classTypes.reduce((sum, ct) => sum + ct._count.classSessions, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Sessions</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {classTypes.reduce((sum, ct) => sum + (upcomingMap.get(ct.id) || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Types Grid */}
      {classTypes.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No class types found</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Create your first class type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classTypes.map(classType => {
            const upcomingCount = upcomingMap.get(classType.id) || 0
            
            return (
              <Link key={classType.id} href={`/demo/classes/${classType.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: studio.primaryColor ? `${studio.primaryColor}20` : "#f3f4f6" }}
                        >
                          <Dumbbell 
                            className="h-6 w-6" 
                            style={{ color: studio.primaryColor || "#6b7280" }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{classType.name}</h3>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {classType.duration} min
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                    </div>

                    {classType.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {classType.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {classType._count.classSessions}
                        </p>
                        <p className="text-xs text-gray-500">Total sessions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {upcomingCount}
                        </p>
                        <p className="text-xs text-gray-500">Upcoming</p>
                      </div>
                    </div>

                    {classType.price > 0 && (
                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="text-sm text-gray-500">Price</span>
                        <span className="font-semibold text-violet-600 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {Number(classType.price).toFixed(2)}
                        </span>
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

