import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

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
        <h1 className="text-3xl font-bold">Classes</h1>
        <Link href="/studio/classes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Class Type
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Class Types</CardTitle>
          </CardHeader>
          <CardContent>
            {classTypes.length > 0 ? (
              <div className="space-y-3">
                {classTypes.map((classType) => (
                  <div key={classType.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{classType.name}</p>
                      <Badge variant={classType.isActive ? "default" : "secondary"}>
                        {classType.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {classType.duration} min • ${classType.price} • {classType.capacity} spots
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No class types configured</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Sessions</CardTitle>
            <Link href="/studio/classes/schedule">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Class
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{session.classType.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.teacher.user.firstName} {session.teacher.user.lastName} • {session.location.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(session.startTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session._count.bookings}/{session.capacity} booked
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming sessions scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



