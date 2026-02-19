import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Mail, 
  Calendar,
  Users,
  Star,
  Clock
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = process.env.DEMO_STUDIO_SUBDOMAIN || "zenith"

export default async function DemoTeachersPage() {
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

  const teachers = await db.teacher.findMany({
    where: { studioId: studio.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      _count: {
        select: {
          classSessions: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Get this month's classes for each teacher
  const monthlyClassCounts = await Promise.all(
    teachers.map(async (teacher) => {
      const count = await db.classSession.count({
        where: {
          teacherId: teacher.id,
          startTime: { gte: startOfMonth }
        }
      })
      return { teacherId: teacher.id, count }
    })
  )

  const monthlyClassMap = new Map(monthlyClassCounts.map(m => [m.teacherId, m.count]))

  const activeTeachers = teachers.filter(t => t.isActive).length

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1">Manage your teaching staff</p>
        </div>
        <Button className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Invite Teacher
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                <p className="text-sm text-gray-500">Total Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeTeachers}</p>
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
                  {teachers.reduce((sum, t) => sum + (monthlyClassMap.get(t.id) || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Classes This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teachers..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Grid */}
      {teachers.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No teachers found</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Invite your first teacher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map(teacher => {
            const monthlyClasses = monthlyClassMap.get(teacher.id) || 0
            
            return (
              <Link key={teacher.id} href={`/demo/teachers/${teacher.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-semibold">
                        {teacher.user.firstName[0]}{teacher.user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {teacher.user.firstName} {teacher.user.lastName}
                          </h3>
                          {teacher.isActive ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          {teacher.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {monthlyClasses} this month
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {teacher._count.classSessions} total
                        </span>
                      </div>
                    </div>

                    {teacher.specialties && (teacher.specialties as string[]).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(teacher.specialties as string[]).slice(0, 3).map((specialty, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {(teacher.specialties as string[]).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(teacher.specialties as string[]).length - 3}
                          </Badge>
                        )}
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

