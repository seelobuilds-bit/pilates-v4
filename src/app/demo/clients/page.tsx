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
  Filter,
  Users,
  UserPlus,
  TrendingUp,
  AlertCircle
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoClientsPage() {
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
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [clients, totalClients, activeClients, newClients, atRiskCount] = await Promise.all([
    db.client.findMany({
      where: { studioId: studio.id },
      include: {
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    db.client.count({ where: { studioId: studio.id } }),
    db.client.count({ where: { studioId: studio.id, isActive: true } }),
    db.client.count({ where: { studioId: studio.id, createdAt: { gte: sevenDaysAgo } } }),
    db.client.count({
      where: {
        studioId: studio.id,
        isActive: true,
        bookings: {
          some: {},
          none: { createdAt: { gte: thirtyDaysAgo } }
        }
      }
    })
  ])

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your client base</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
                <p className="text-sm text-gray-500">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{newClients}</p>
                <p className="text-sm text-gray-500">New This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{atRiskCount}</p>
                <p className="text-sm text-gray-500">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No clients found</p>
            </div>
          ) : (
            <div className="divide-y">
              {clients.map(client => (
                <Link key={client.id} href={`/demo/clients/${client.id}`}>
                  <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-violet-600">
                            {client.firstName[0]}{client.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </p>
                            {!client.isActive && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </p>
                            {client.phone && (
                              <p className="text-sm text-gray-500">{client.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {client._count.bookings} bookings
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Joined {new Date(client.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {client.credits > 0 && (
                          <Badge className="bg-violet-100 text-violet-700">
                            {client.credits} credits
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {clients.length} of {totalClients} clients
      </div>
    </div>
  )
}




