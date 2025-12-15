import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Mail } from "lucide-react"

export default async function TeachersPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const teachers = await db.teacher.findMany({
    where: { studioId: session.user.studioId },
    include: {
      user: true,
      _count: {
        select: { classSessions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1">Manage your teaching staff</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite Teacher
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {teacher.user.firstName} {teacher.user.lastName}
                </CardTitle>
                <Badge variant={teacher.isActive ? "success" : "secondary"}>
                  {teacher.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                {teacher.user.email}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {teacher._count.classSessions} classes scheduled
              </p>
              {teacher.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {teacher.specialties.map((specialty, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {teachers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No teachers yet. Invite your first teacher to get started.
          </div>
        )}
      </div>
    </div>
  )
}
