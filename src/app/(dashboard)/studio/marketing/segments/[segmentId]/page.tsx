"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  Users,
  Mail,
  MessageSquare,
  Search,
  Send,
  Download,
  Star,
  UserMinus,
  Sparkles,
  Gift,
  Filter,
  Loader2,
  CheckSquare,
  Square,
  Minus,
  Trash2,
  X,
  AlertTriangle
} from "lucide-react"

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  bookings: number
  lastBooking?: string
  credits: number
}

interface Segment {
  id: string
  name: string
  description: string
  type: "dynamic" | "static"
  count: number
  icon: string
  conditions?: string[]
  clients: Client[]
}

const segmentData: Record<string, Segment> = {
  all: {
    id: "all",
    name: "All Subscribers",
    description: "Everyone who has opted in to marketing",
    type: "dynamic",
    count: 248,
    icon: "users",
    clients: [
      { id: "1", firstName: "Alice", lastName: "Brown", email: "alice.brown@email.com", bookings: 15, lastBooking: "Dec 15, 2024", credits: 5 },
      { id: "2", firstName: "Bob", lastName: "Taylor", email: "bob.taylor@email.com", bookings: 8, lastBooking: "Dec 10, 2024", credits: 2 },
      { id: "3", firstName: "Carol", lastName: "Martinez", email: "carol.martinez@email.com", bookings: 22, lastBooking: "Dec 17, 2024", credits: 10 },
      { id: "4", firstName: "David", lastName: "Garcia", email: "david.garcia@email.com", bookings: 5, lastBooking: "Nov 28, 2024", credits: 0 },
      { id: "5", firstName: "Emma", lastName: "Rodriguez", email: "emma.rodriguez@email.com", bookings: 12, lastBooking: "Dec 14, 2024", credits: 3 },
    ]
  },
  active: {
    id: "active",
    name: "Active Clients",
    description: "Clients who booked in the last 30 days",
    type: "dynamic",
    count: 89,
    icon: "star",
    conditions: ["Last booking within 30 days"],
    clients: [
      { id: "1", firstName: "Alice", lastName: "Brown", email: "alice.brown@email.com", bookings: 15, lastBooking: "Dec 15, 2024", credits: 5 },
      { id: "3", firstName: "Carol", lastName: "Martinez", email: "carol.martinez@email.com", bookings: 22, lastBooking: "Dec 17, 2024", credits: 10 },
      { id: "5", firstName: "Emma", lastName: "Rodriguez", email: "emma.rodriguez@email.com", bookings: 12, lastBooking: "Dec 14, 2024", credits: 3 },
    ]
  },
  inactive: {
    id: "inactive",
    name: "Inactive Clients",
    description: "Clients who haven't booked in 30+ days",
    type: "dynamic",
    count: 67,
    icon: "user-minus",
    conditions: ["No booking in last 30 days"],
    clients: [
      { id: "4", firstName: "David", lastName: "Garcia", email: "david.garcia@email.com", bookings: 5, lastBooking: "Nov 28, 2024", credits: 0 },
    ]
  },
  new: {
    id: "new",
    name: "New Clients",
    description: "Clients who joined in the last 30 days",
    type: "dynamic",
    count: 24,
    icon: "sparkles",
    conditions: ["Signed up within 30 days"],
    clients: [
      { id: "6", firstName: "Frank", lastName: "Lee", email: "frank.lee@email.com", bookings: 2, lastBooking: "Dec 12, 2024", credits: 8 },
    ]
  },
  vip: {
    id: "vip",
    name: "VIP Clients",
    description: "Clients with 10+ bookings",
    type: "dynamic",
    count: 42,
    icon: "star",
    conditions: ["Total bookings >= 10"],
    clients: [
      { id: "1", firstName: "Alice", lastName: "Brown", email: "alice.brown@email.com", bookings: 15, lastBooking: "Dec 15, 2024", credits: 5 },
      { id: "3", firstName: "Carol", lastName: "Martinez", email: "carol.martinez@email.com", bookings: 22, lastBooking: "Dec 17, 2024", credits: 10 },
      { id: "5", firstName: "Emma", lastName: "Rodriguez", email: "emma.rodriguez@email.com", bookings: 12, lastBooking: "Dec 14, 2024", credits: 3 },
    ]
  },
  "birthday-month": {
    id: "birthday-month",
    name: "Birthday This Month",
    description: "Clients celebrating birthdays this month",
    type: "dynamic",
    count: 12,
    icon: "gift",
    conditions: ["Birthday month = current month"],
    clients: [
      { id: "2", firstName: "Bob", lastName: "Taylor", email: "bob.taylor@email.com", bookings: 8, lastBooking: "Dec 10, 2024", credits: 2 },
    ]
  }
}

const iconMap: Record<string, React.ElementType> = {
  users: Users,
  star: Star,
  "user-minus": UserMinus,
  sparkles: Sparkles,
  gift: Gift,
  filter: Filter
}

export default function SegmentDetailPage({
  params,
}: {
  params: Promise<{ segmentId: string }>
}) {
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [segment, setSegment] = useState<Segment | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Selection state
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    const data = segmentData[resolvedParams.segmentId]
    if (data) {
      setSegment(data)
    }
    setLoading(false)
  }, [resolvedParams.segmentId])

  if (loading) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!segment) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Segment not found</p>
          <Link href="/studio/marketing">
            <Button variant="outline">Back to Marketing</Button>
          </Link>
        </div>
      </div>
    )
  }

  const Icon = iconMap[segment.icon] || Users
  const filteredClients = segment.clients.filter(client =>
    `${client.firstName} ${client.lastName} ${client.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isAllSelected = filteredClients.length > 0 && selectedClients.size === filteredClients.length
  const isPartialSelected = selectedClients.size > 0 && selectedClients.size < filteredClients.length

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

  const handleRemoveFromSegment = async () => {
    if (selectedClients.size === 0) return
    
    setRemoving(true)
    try {
      // In production, this would call an API to remove clients from the segment
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update local state to remove clients
      if (segment) {
        const updatedClients = segment.clients.filter(c => !selectedClients.has(c.id))
        setSegment({
          ...segment,
          clients: updatedClients,
          count: updatedClients.length
        })
      }
      
      setSelectedClients(new Set())
      setShowRemoveConfirm(false)
    } catch (error) {
      console.error("Failed to remove from segment:", error)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing?tab=segments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Segments
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Icon className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{segment.name}</h1>
                <Badge variant="secondary">{segment.type}</Badge>
              </div>
              <p className="text-gray-500">{segment.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href={`/studio/marketing/campaigns/new?segment=${segment.id}`}>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Send className="h-4 w-4 mr-2" />
                Send Campaign
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{segment.clients.length}</p>
                <p className="text-xs text-gray-500">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{segment.clients.length}</p>
                <p className="text-xs text-gray-500">Email Reachable</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(segment.clients.length * 0.75)}</p>
                <p className="text-xs text-gray-500">SMS Reachable</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {segment.clients.length > 0 
                    ? Math.round(segment.clients.reduce((acc, c) => acc + c.bookings, 0) / segment.clients.length)
                    : 0}
                </p>
                <p className="text-xs text-gray-500">Avg. Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditions */}
      {segment.conditions && segment.conditions.length > 0 && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Segment Conditions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {segment.conditions.map((condition, i) => (
                <span key={i} className="text-sm text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
                  {condition}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Actions */}
      {selectedClients.size > 0 && (
        <Card className="border-0 shadow-sm mb-4 bg-red-50 border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">
                  {selectedClients.size} client{selectedClients.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="destructive"
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={removing}
                >
                  {removing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Remove from Segment
                </Button>
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

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRemoveConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Remove from Segment</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove {selectedClients.size} client{selectedClients.size > 1 ? 's' : ''} from the <strong>{segment.name}</strong> segment?
                </p>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleRemoveFromSegment}
                    disabled={removing}
                  >
                    {removing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Client List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">Clients in Segment</h3>
              {segment.type === "static" && (
                <Badge variant="secondary" className="text-xs">
                  Manual membership
                </Badge>
              )}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 w-12">
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Bookings</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Last Booking</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr 
                      key={client.id} 
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        selectedClients.has(client.id) ? 'bg-violet-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => handleSelectClient(client.id)}
                          className="flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                        >
                          {selectedClients.has(client.id) ? (
                            <CheckSquare className="h-5 w-5 text-violet-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/studio/clients/${client.id}`}>
                          <div className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                              {client.firstName[0]}{client.lastName[0]}
                            </div>
                            <span className="font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{client.email}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{client.bookings}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{client.lastBooking || "-"}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{client.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? "No clients match your search" : "No clients in this segment"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
