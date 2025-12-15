import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

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
        <h1 className="text-3xl font-bold">Studios</h1>
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {studio.name}
                  <Badge variant="secondary">{studio.subdomain}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Owner: {studio.owner.firstName} {studio.owner.lastName}</p>
                  <p>Locations: {studio.locations.length}</p>
                  <p>Teachers: {studio._count.teachers}</p>
                  <p>Clients: {studio._count.clients}</p>
                  <p>Classes: {studio._count.classSessions}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {studios.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No studios yet. Create your first studio to get started.
          </div>
        )}
      </div>
    </div>
  )
}



