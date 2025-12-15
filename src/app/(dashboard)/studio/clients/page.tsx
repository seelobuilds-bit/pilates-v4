import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Mail } from "lucide-react"

export default async function ClientsPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const clients = await db.client.findMany({
    where: { studioId: session.user.studioId },
    include: {
      _count: {
        select: { bookings: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{clients.length} total clients</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search clients..." className="pl-9" />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length > 0 ? (
            <div className="space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-violet-600">
                        {client.firstName[0]}{client.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {client._count.bookings} bookings
                    </span>
                    <Badge variant={client.isActive ? "success" : "secondary"}>
                      {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No clients yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
