"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Mail, 
  Calendar, 
  CreditCard, 
  Filter, 
  X,
  Users,
  CheckSquare,
  Square,
  Minus,
  UserPlus,
  Loader2,
  ChevronDown
} from "lucide-react"

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  credits: number
  isActive: boolean
  createdAt: string
  _count: {
    bookings: number
  }
}

interface Segment {
  id: string
  name: string
  description: string
}

// Default segments to add clients to and filter by
const availableSegments: Segment[] = [
  { id: "all", name: "All Subscribers", description: "Everyone who has opted in" },
  { id: "vip", name: "VIP Clients", description: "Premium clients" },
  { id: "active", name: "Active Clients", description: "Recently active" },
  { id: "new", name: "New Clients", description: "Recently joined" },
  { id: "inactive", name: "Inactive Clients", description: "Need re-engagement" },
  { id: "birthday-month", name: "Birthday This Month", description: "Birthday specials" },
]

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter')
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    initialFilter === "at-risk" ? "inactive" : 
    initialFilter === "new" ? "all" : "all"
  )
  const [bookingsFilter, setBookingsFilter] = useState<"all" | "0" | "1-5" | "5-10" | "10+">("all")
  const [segmentFilter, setSegmentFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "bookings">("newest")
  
  // Selection
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false)
  const [addingToSegment, setAddingToSegment] = useState(false)

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/studio/clients')
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

  // Helper function to check if client belongs to a segment
  const clientInSegment = (client: Client, segmentId: string): boolean => {
    const bookings = client._count.bookings
    const daysSinceCreated = Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    
    switch (segmentId) {
      case "all":
        return true
      case "vip":
        return bookings >= 10
      case "active":
        return client.isActive && bookings > 0
      case "new":
        return daysSinceCreated <= 30
      case "inactive":
        return !client.isActive || bookings === 0
      case "birthday-month":
        // Simulate - in production would check actual birthday
        return client.id.charCodeAt(0) % 12 === new Date().getMonth()
      default:
        return true
    }
  }

  // Filter and sort clients
  const filteredClients = clients
    .filter(client => {
      // Search filter
      const matchesSearch = 
        `${client.firstName} ${client.lastName} ${client.email}`.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Status filter
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "active" ? client.isActive :
        !client.isActive
      
      // Bookings filter
      const bookings = client._count.bookings
      const matchesBookings = 
        bookingsFilter === "all" ? true :
        bookingsFilter === "0" ? bookings === 0 :
        bookingsFilter === "1-5" ? bookings >= 1 && bookings <= 5 :
        bookingsFilter === "5-10" ? bookings > 5 && bookings <= 10 :
        bookings > 10
      
      // Segment filter
      const matchesSegment = segmentFilter === "all" ? true : clientInSegment(client, segmentFilter)

      return matchesSearch && matchesStatus && matchesBookings && matchesSegment
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case "bookings":
          return b._count.bookings - a._count.bookings
        default:
          return 0
      }
    })

  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)))
    }
  }

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

  const handleAddToSegment = async (segmentId: string) => {
    if (selectedClients.size === 0) return
    
    setAddingToSegment(true)
    try {
      // In production, this would call an API to add clients to the segment
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Show success (in production this would be a toast)
      alert(`Added ${selectedClients.size} client(s) to segment`)
      setSelectedClients(new Set())
      setShowSegmentDropdown(false)
    } catch (error) {
      console.error("Failed to add to segment:", error)
    } finally {
      setAddingToSegment(false)
    }
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setBookingsFilter("all")
    setSegmentFilter("all")
    setSortBy("newest")
    setSearchQuery("")
  }

  const hasActiveFilters = statusFilter !== "all" || bookingsFilter !== "all" || segmentFilter !== "all"

  const isAllSelected = filteredClients.length > 0 && selectedClients.size === filteredClients.length
  const isPartialSelected = selectedClients.size > 0 && selectedClients.size < filteredClients.length

  if (loading) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">
            {filteredClients.length} of {clients.length} clients
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>
        <Link href="/studio/clients/new">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search clients by name or email..." 
                className="pl-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter Toggle */}
            <Button 
              variant={showFilters ? "default" : "outline"} 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-white text-violet-600 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="bookings">Most Bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label className="text-sm text-gray-500 mb-1.5 block">Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-sm text-gray-500 mb-1.5 block">Bookings</Label>
                  <Select value={bookingsFilter} onValueChange={(v) => setBookingsFilter(v as typeof bookingsFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Bookings</SelectItem>
                      <SelectItem value="0">No Bookings</SelectItem>
                      <SelectItem value="1-5">1-5 Bookings</SelectItem>
                      <SelectItem value="5-10">5-10 Bookings</SelectItem>
                      <SelectItem value="10+">10+ Bookings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-sm text-gray-500 mb-1.5 block">Segment</Label>
                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSegments.map(segment => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} className="text-gray-500">
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedClients.size > 0 && (
        <Card className="border-0 shadow-sm mb-4 bg-violet-50 border-l-4 border-l-violet-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-violet-600" />
                <span className="font-medium text-violet-900">
                  {selectedClients.size} client{selectedClients.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Add to Segment Dropdown */}
                <div className="relative">
                  <Button 
                    className="bg-violet-600 hover:bg-violet-700"
                    onClick={() => setShowSegmentDropdown(!showSegmentDropdown)}
                    disabled={addingToSegment}
                  >
                    {addingToSegment ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Add to Segment
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                  
                  {showSegmentDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSegmentDropdown(false)} 
                      />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-500 px-3 py-2">SELECT SEGMENT</p>
                          {availableSegments.map(segment => (
                            <button
                              key={segment.id}
                              onClick={() => handleAddToSegment(segment.id)}
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-violet-50 transition-colors"
                            >
                              <p className="font-medium text-gray-900">{segment.name}</p>
                              <p className="text-xs text-gray-500">{segment.description}</p>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 p-2">
                          <Link href="/studio/marketing/segments/new">
                            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-violet-600 font-medium flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Create New Segment
                            </button>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  variant="outline"
                  onClick={() => setSelectedClients(new Set())}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Table */}
      {filteredClients.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4 w-12">
                    <button 
                      onClick={handleSelectAll}
                      className="flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-5 w-5 text-violet-600" />
                      ) : isPartialSelected ? (
                        <div className="relative">
                          <Square className="h-5 w-5" />
                          <Minus className="h-3 w-3 absolute top-1 left-1" />
                        </div>
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Client</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Email</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Bookings</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Credits</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Status</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className={`hover:bg-violet-50 transition-colors ${
                      selectedClients.has(client.id) ? 'bg-violet-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectClient(client.id)
                        }}
                        className="flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                      >
                        {selectedClients.has(client.id) ? (
                          <CheckSquare className="h-5 w-5 text-violet-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/studio/clients/${client.id}`} className="flex items-center gap-3 hover:opacity-70">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </span>
                      </Link>
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
                        <span className="text-violet-600 text-sm font-medium hover:underline">View →</span>
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
              {hasActiveFilters ? (
                <Filter className="h-8 w-8 text-gray-400" />
              ) : (
                <Users className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? "No clients match your filters" : "No clients yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters 
                ? "Try adjusting your filters to see more results" 
                : "Clients will appear here when they book classes"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            ) : (
              <Link href="/studio/clients/new">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
