"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  MapPin, 
  Clock, 
  LogOut, 
  ChevronLeft,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react"

interface Booking {
  id: string
  status: string
  createdAt: string
  classSession: {
    id: string
    startTime: string
    endTime: string
    classType: {
      name: string
      duration: number
    }
    teacher: {
      user: {
        firstName: string
        lastName: string
      }
    }
    location: {
      name: string
      address?: string
    }
  }
}

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function EmbedAccountPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    fetchClientAndBookings()
  }, [subdomain])

  async function fetchClientAndBookings() {
    try {
      const meRes = await fetch(`/api/booking/${subdomain}/me`)
      if (!meRes.ok) {
        setLoading(false)
        return
      }
      const meData = await meRes.json()
      setClient(meData)

      const bookingsRes = await fetch(`/api/booking/${subdomain}/my-bookings`)
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    
    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/booking/${subdomain}/my-bookings/${bookingId}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        // Refresh bookings
        fetchClientAndBookings()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to cancel booking")
      }
    } catch {
      alert("Failed to cancel booking")
    } finally {
      setCancellingId(null)
    }
  }

  async function handleLogout() {
    await fetch(`/api/booking/${subdomain}/logout`, { method: "POST" })
    window.location.href = `/${subdomain}/embed`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Signed In</h2>
            <p className="text-gray-500 mb-4">Please sign in to view your bookings.</p>
            <Button 
              onClick={() => window.location.href = `/${subdomain}/embed`}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Go to Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(
    b => b.status !== "CANCELLED" && new Date(b.classSession.startTime) > new Date()
  )
  const pastBookings = bookings.filter(
    b => b.status === "CANCELLED" || new Date(b.classSession.startTime) <= new Date()
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => window.location.href = `/${subdomain}/embed`}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Book Class</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Signed in as</p>
            <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
            <p className="text-sm text-violet-600">{client.email}</p>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Classes</h2>
          {upcomingBookings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming bookings</p>
                <Button 
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.href = `/${subdomain}/embed`}
                >
                  Book a Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {booking.classSession.classType.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          with {booking.classSession.teacher.user.firstName} {booking.classSession.teacher.user.lastName}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirmed
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.classSession.startTime).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric"
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {new Date(booking.classSession.startTime).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit"
                        })} - {new Date(booking.classSession.endTime).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {booking.classSession.location.name}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Cancel Booking
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Past Classes</h2>
            <div className="space-y-3">
              {pastBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id} className="border-0 shadow-sm opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-700">
                          {booking.classSession.classType.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.classSession.startTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          })} at {new Date(booking.classSession.startTime).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={booking.status === "CANCELLED" 
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                        }
                      >
                        {booking.status === "CANCELLED" ? "Cancelled" : "Completed"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
