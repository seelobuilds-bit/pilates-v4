import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Users, DollarSign } from "lucide-react"

export default async function ClassesPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const classTypes = await db.classType.findMany({
    where: { studioId: session.user.studioId },
    orderBy: { name: "asc" }
  })

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Manage your class types and pricing</p>
        </div>
        <Link href="/studio/classes/new" className="w-full sm:w-auto">
          <Button className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Class Type
          </Button>
        </Link>
      </div>

      {/* Class Types Grid */}
      {classTypes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classTypes.map((classType) => (
            <Card key={classType.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{classType.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{classType.description || "No description"}</p>
                  </div>
                  <Badge variant={classType.isActive ? "success" : "secondary"}>
                    {classType.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{classType.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Max {classType.capacity} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>${classType.price} per class</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/studio/classes/${classType.id}`}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Edit Class Type
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No class types yet</h3>
            <p className="text-gray-500 mb-6">Create your first class type to start scheduling</p>
            <Link href="/studio/classes/new">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Class Type
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
