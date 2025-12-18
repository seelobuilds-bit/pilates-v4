"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Users,
  Calendar,
  Clock
} from "lucide-react"

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  bookingsCount: number
  lastBooking: string | null
}

export default function TeacherClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/teacher/clients")
        if (res.ok) {
          const data = await res.json()
          setClients(data)
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  const filteredClients = clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
        <p className="text-gray-500 mt-1">Students who have taken classes with you</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search clients..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                <p className="text-sm text-gray-500">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + c.bookingsCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.length > 0 ? (clients.reduce((sum, c) => sum + c.bookingsCount, 0) / clients.length).toFixed(1) : 0}
                </p>
                <p className="text-sm text-gray-500">Avg. Bookings/Client</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Client List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{client.bookingsCount} classes</p>
                      {client.lastBooking && (
                        <p className="text-sm text-gray-500">
                          Last: {new Date(client.lastBooking).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 border-0">
                      Regular
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {search ? "No clients match your search" : "No clients yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
