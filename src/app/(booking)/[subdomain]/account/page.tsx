"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, User, LogOut, Zap, X } from "lucide-react"

interface ClientInfo {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Booking {
  id: string
  status: string
  paidAmount: number
  createdAt: string
  classSession: {
    startTime: string
    endTime: string
    classType: { name: string }
    teacher: { user: { firstName: string; lastName: string } }
    location: { name: string }
  }
}

export default function AccountPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [subdomain])

  async function checkAuth() {
    try {
      const res = await fetch(`/api/booking/${subdomain}/me`)
      if (res.ok) {
        const data = await res.json()
        setClient(data)
        fetchBookings()
      }
    } catch {}
    setLoading(false)
  }

  async function fetchBookings() {
    try {
      const res = await fetch(`/api/booking/${subdomain}/my-bookings`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch {}
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    const endpoint = authMode === "login"
      ? `/api/booking/${subdomain}/login`
      : `/api/booking/${subdomain}/register`

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Authentication failed")
      }

      const data = await res.json()
      setClient(data)
      fetchBookings()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed")
    }
    setAuthLoading(false)
  }

  async function handleLogout() {
    await fetch(`/api/booking/${subdomain}/logout`, { method: "POST" })
    setClient(null)
    setBookings([])
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const res = await fetch(`/api/booking/${subdomain}/my-bookings/${bookingId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        fetchBookings()
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(b => new Date(b.classSession.startTime) > new Date() && b.status === "CONFIRMED")
  const pastBookings = bookings.filter(b => new Date(b.classSession.startTime) <= new Date() || b.status !== "CONFIRMED")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${subdomain}`} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">My Account</span>
            </Link>
            {client && (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!client ? (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>{authMode === "login" ? "Sign In" : "Create Account"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {authError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{authError}</div>}
                {authMode === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={authForm.firstName} onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={authForm.lastName} onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} required />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? "Loading..." : authMode === "login" ? "Sign In" : "Create Account"}
                </Button>
                <p className="text-center text-sm text-gray-500">
                  {authMode === "login" ? (
                    <>Don&apos;t have an account? <button type="button" className="text-violet-600 hover:underline" onClick={() => setAuthMode("register")}>Sign up</button></>
                  ) : (
                    <>Already have an account? <button type="button" className="text-violet-600 hover:underline" onClick={() => setAuthMode("login")}>Sign in</button></>
                  )}
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-violet-600">
                      {client.firstName[0]}{client.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{client.firstName} {client.lastName}</h2>
                    <p className="text-gray-500">{client.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="upcoming">
              <TabsList className="w-full">
                <TabsTrigger value="upcoming" className="flex-1">Upcoming ({upcomingBookings.length})</TabsTrigger>
                <TabsTrigger value="past" className="flex-1">Past ({pastBookings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-3 mt-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="font-semibold text-gray-900">{booking.classSession.classType.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(booking.classSession.startTime).toLocaleDateString()} at {new Date(booking.classSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {booking.classSession.location.name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {booking.classSession.teacher.user.firstName} {booking.classSession.teacher.user.lastName}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => cancelBooking(booking.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming bookings</p>
                    <Link href={`/${subdomain}/book`}>
                      <Button className="mt-4">Book a Class</Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-3 mt-4">
                {pastBookings.length > 0 ? (
                  pastBookings.map((booking) => (
                    <Card key={booking.id} className="border-0 shadow-sm opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{booking.classSession.classType.name}</p>
                              <Badge variant={booking.status === "CONFIRMED" ? "secondary" : "destructive"}>
                                {booking.status === "CONFIRMED" ? "Completed" : booking.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.classSession.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-12 text-gray-500">No past bookings</p>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-center">
              <Link href={`/${subdomain}/book`}>
                <Button>Book Another Class</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
