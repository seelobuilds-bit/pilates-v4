import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

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
      <Link href="/hq/studios" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Studios
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{studio.name}</h1>
          <Badge variant="secondary" className="mt-2">{studio.subdomain}</Badge>
        </div>
        <Button variant="outline">Edit Studio</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{studio.owner.firstName} {studio.owner.lastName}</p>
            <p className="text-sm text-muted-foreground">{studio.owner.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Locations: {studio.locations.length}</p>
            <p>Teachers: {studio.teachers.length}</p>
            <p>Clients: {studio._count.clients}</p>
            <p>Classes: {studio._count.classSessions}</p>
            <p>Bookings: {studio._count.bookings}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {studio.locations.length > 0 ? (
              <div className="space-y-4">
                {studio.locations.map((location) => (
                  <div key={location.id} className="p-4 border rounded-lg">
                    <p className="font-medium">{location.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {location.address}, {location.city}, {location.state} {location.zipCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No locations configured</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            {studio.teachers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {studio.teachers.map((teacher) => (
                  <div key={teacher.id} className="p-4 border rounded-lg">
                    <p className="font-medium">{teacher.user.firstName} {teacher.user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{teacher.user.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No teachers yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



