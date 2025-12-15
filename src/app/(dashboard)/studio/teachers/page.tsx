import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

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
        <h1 className="text-3xl font-bold">Teachers</h1>
        <Link href="/studio/teachers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {teacher.user.firstName} {teacher.user.lastName}
                <Badge variant={teacher.isActive ? "success" : "secondary"}>
                  {teacher.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{teacher.user.email}</p>
                <p>{teacher._count.classSessions} classes scheduled</p>
                {teacher.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {teacher.specialties.map((specialty, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {teachers.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No teachers yet. Add your first teacher to get started.
          </div>
        )}
      </div>
    </div>
  )
}



