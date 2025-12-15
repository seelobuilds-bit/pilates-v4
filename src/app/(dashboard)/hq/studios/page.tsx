import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Users, Calendar } from "lucide-react"

export default async function StudiosPage() {
  const studios = await db.studio.findMany({
    include: {
      owner: true,
      locations: true,
      _count: {
        select: {
          teachers: true,
          clients: true,
          classSessions: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Studios</h1>
          <p className="text-gray-500 mt-1">Manage all studios on the platform</p>
        </div>
        <Link href="/hq/studios/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Studio
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studios.map((studio) => (
          <Link key={studio.id} href={`/hq/studios/${studio.id}`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{studio.name}</CardTitle>
                  <Badge variant="secondary">{studio.subdomain}</Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {studio.owner.firstName} {studio.owner.lastName}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {studio.locations.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {studio._count.clients}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {studio._count.classSessions}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {studios.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No studios yet. Create your first studio to get started.
          </div>
        )}
      </div>
    </div>
  )
}
