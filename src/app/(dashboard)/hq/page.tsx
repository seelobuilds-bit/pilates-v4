import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Calendar, DollarSign, Plus, ArrowRight, Target } from "lucide-react"

export default async function HQDashboardPage() {
  // Count only real studios (exclude demo)
  const studioCount = await db.studio.count({
    where: { subdomain: { not: "zenith" } }
  })
  
  // Count total clients across all real studios
  const clientCount = await db.client.count({
    where: { studio: { subdomain: { not: "zenith" } } }
  })
  
  // Count active leads
  const leadCount = await db.lead.count({
    where: { status: { notIn: ["WON", "LOST"] } }
  })
  
  // Count class sessions
  const classCount = await db.classSession.count({
    where: { studio: { subdomain: { not: "zenith" } } }
  })
  
  // Get recent studios
  const recentStudios = await db.studio.findMany({
    where: { subdomain: { not: "zenith" } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      _count: {
        select: { clients: true, teachers: true, locations: true }
      }
    }
  })

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HQ Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and management</p>
        </div>
        <Link href="/hq/studios/new">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Studio
          </Button>
        </Link>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Studios</p>
                <p className="text-3xl font-bold text-gray-900">{studioCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{clientCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Leads</p>
                <p className="text-3xl font-bold text-gray-900">{leadCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-gray-900">{classCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Recent Studios */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Recent Studios</h3>
            <Link href="/hq/studios" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {recentStudios.length > 0 ? (
            <div className="space-y-4">
              {recentStudios.map((studio) => (
                <div key={studio.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{studio.name}</p>
                      <p className="text-sm text-gray-500">
                        {studio.owner.firstName} {studio.owner.lastName} • {studio.subdomain}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{studio._count.locations} locations</p>
                    <p>{studio._count.teachers} teachers • {studio._count.clients} clients</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No studios yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
