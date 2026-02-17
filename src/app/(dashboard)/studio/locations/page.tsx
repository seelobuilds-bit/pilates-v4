import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin } from "lucide-react"

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
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-bold">Locations</h1>
        <Link href="/studio/locations/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Link key={location.id} href={`/studio/locations/${location.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {location.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{location.address}</p>
                  <p>{location.city}, {location.state} {location.zipCode}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span>{location._count.classSessions} classes</span>
                    <Badge variant={location.isActive ? "success" : "secondary"}>
                      {location.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No locations yet. Add your first location to get started.
          </div>
        )}
      </div>
    </div>
  )
}


