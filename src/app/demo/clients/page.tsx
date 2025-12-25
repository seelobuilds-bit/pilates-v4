// Demo Clients Page - Mirrors /studio/clients/page.tsx
// Keep in sync with the real clients page

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Mail, Calendar, CreditCard } from "lucide-react"
import { demoClients } from "../_data/demo-data"

export default function DemoClientsPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your client base</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
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
              {demoClients.map((client) => (
                <Link key={client.id} href={`/demo/clients/${client.id}`} className="contents">
                  <tr className="hover:bg-violet-50 transition-colors cursor-pointer">
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
                      <Badge className={client.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                        {client.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-violet-600 text-sm font-medium">View →</span>
                    </td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}














