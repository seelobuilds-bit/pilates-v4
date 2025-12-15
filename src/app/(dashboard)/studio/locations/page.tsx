import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Calendar } from "lucide-react"

export default async function LocationsPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const locations = await db.location.findMany({
    where: { studioId: session.user.studioId },
    include: {
      _count: {
        select: { classSessions: true }
      }
    },
    orderBy: { name: "asc" }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500 mt-1">Manage your studio locations</p>
        </div>
        <Link href="/studio/locations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Card key={location.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-violet-600" />
                  {location.name}
                </CardTitle>
                <Badge variant={location.isActive ? "success" : "secondary"}>
                  {location.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">{location.address}</p>
              <p className="text-sm text-gray-500 mb-4">{location.city}, {location.state} {location.zipCode}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{location._count.classSessions} classes scheduled</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No locations yet. Add your first location to get started.
          </div>
        )}
      </div>
    </div>
  )
}
