import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Users, Calendar, GraduationCap } from "lucide-react"

export default async function StudioDetailPage({
  params,
}: {
  params: { studioId: string }
}) {
  const studio = await db.studio.findUnique({
    where: { id: params.studioId },
    include: {
      owner: true,
      locations: true,
      teachers: {
        include: { user: true }
      },
      _count: {
        select: {
          clients: true,
          classSessions: true,
          bookings: true,
        }
      }
    }
  })

  if (!studio) {
    notFound()
  }

  return (
    <div className="p-8">
      <Link href="/hq/studios" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Studios
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{studio.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{studio.subdomain}</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">{studio.owner.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-violet-100 rounded-lg">
              <MapPin className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studio.locations.length}</p>
              <p className="text-sm text-gray-500">Locations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studio.teachers.length}</p>
              <p className="text-sm text-gray-500">Teachers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studio._count.clients}</p>
              <p className="text-sm text-gray-500">Clients</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studio._count.classSessions}</p>
              <p className="text-sm text-gray-500">Classes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {studio.locations.length > 0 ? (
              <div className="space-y-3">
                {studio.locations.map((location) => (
                  <div key={location.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{location.name}</p>
                    <p className="text-sm text-gray-500">
                      {location.address}, {location.city}, {location.state} {location.zipCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No locations configured</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            {studio.teachers.length > 0 ? (
              <div className="space-y-3">
                {studio.teachers.map((teacher) => (
                  <div key={teacher.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{teacher.user.firstName} {teacher.user.lastName}</p>
                    <p className="text-sm text-gray-500">{teacher.user.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No teachers yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
