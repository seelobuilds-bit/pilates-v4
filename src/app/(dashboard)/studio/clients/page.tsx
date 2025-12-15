import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Mail, Calendar, CreditCard } from "lucide-react"

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
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your client base</p>
        </div>
        <Link href="/studio/clients/new">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search clients by name or email..." 
              className="pl-10 border-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      {clients.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Client</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Email</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Bookings</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Credits</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Status</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {client.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {client._count.bookings}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 flex items-center gap-1">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        {client.credits}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={client.isActive ? "success" : "secondary"}>
                        {client.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/studio/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-500 mb-6">Clients will appear here when they book classes</p>
            <Link href="/studio/clients/new">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
