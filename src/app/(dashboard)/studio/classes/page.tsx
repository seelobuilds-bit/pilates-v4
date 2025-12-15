import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Users, MapPin } from "lucide-react"

export default async function ClassesPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const studioId = session.user.studioId

  const [classTypes, upcomingSessions] = await Promise.all([
    db.classType.findMany({
      where: { studioId },
      orderBy: { name: "asc" }
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
      take: 20
    })
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Manage class types and schedules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Class Type
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Class Types</CardTitle>
          </CardHeader>
          <CardContent>
            {classTypes.length > 0 ? (
              <div className="space-y-3">
                {classTypes.map((classType) => (
                  <div key={classType.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{classType.name}</p>
                      <Badge variant={classType.isActive ? "success" : "secondary"}>
                        {classType.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {classType.duration}min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {classType.capacity}
                      </span>
                      <span>${classType.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No class types configured</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Classes</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Class
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{session.classType.name}</p>
                        <p className="text-sm text-gray-500">
                          {session.teacher.user.firstName} {session.teacher.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {session.location.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(session.startTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {session._count.bookings}/{session.capacity} booked
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming sessions scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
