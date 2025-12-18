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
import { Calendar, MapPin, Clock, LogOut, User } from "lucide-react"

interface ClientInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

interface Booking {
  id: string
  status: string
  createdAt: string
  classSession: {
    startTime: string
    endTime: string
    classType: { name: string }
    teacher: { user: { firstName: string; lastName: string } }
    location: { name: string; address: string }
  }
}

interface Studio {
  id: string
  name: string
  primaryColor: string
}

export default function AccountPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Check auth and fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Get studio info
        const studioRes = await fetch(`/api/booking/${subdomain}/data`)
        if (!studioRes.ok) {
          router.push("/")
          return
        }
        const studioData = await studioRes.json()
        setStudio(studioData)

        // Check if logged in
        const meRes = await fetch(`/api/booking/${subdomain}/me`)
        if (meRes.ok) {
          const clientData = await meRes.json()
          setClient(clientData)

          // Fetch bookings
          const bookingsRes = await fetch(`/api/booking/${subdomain}/my-bookings`)
          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json()
            setBookings(bookingsData)
          }
        }
      } catch {
        // Error loading
      }
      setLoading(false)
    }
    fetchData()
  }, [subdomain, router])

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

      // Fetch bookings
      const bookingsRes = await fetch(`/api/booking/${subdomain}/my-bookings`)
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }
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

  async function handleCancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const res = await fetch(`/api/booking/${subdomain}/my-bookings/${bookingId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        ))
      }
    } catch {
      alert("Failed to cancel booking")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!studio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Studio not found</p>
      </div>
    )
  }

  const primaryColor = studio.primaryColor

  // Not logged in - show login/register
  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
              {studio.name}
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>{authMode === "login" ? "Sign In" : "Create Account"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {authError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {authError}
                  </div>
                )}
                {authMode === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={authForm.firstName}
                        onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={authForm.lastName}
                        onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                  disabled={authLoading}
                >
                  {authLoading ? "Loading..." : authMode === "login" ? "Sign In" : "Create Account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {authMode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button type="button" className="text-violet-600 hover:underline" onClick={() => setAuthMode("register")}>
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" className="text-violet-600 hover:underline" onClick={() => setAuthMode("login")}>
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(b => 
    b.status === "CONFIRMED" && new Date(b.classSession.startTime) > new Date()
  )
  const pastBookings = bookings.filter(b => 
    b.status === "COMPLETED" || b.status === "CANCELLED" || new Date(b.classSession.startTime) <= new Date()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
              {studio.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {client.firstName} {client.lastName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">My Account</h2>
          <Link href={`/${subdomain}/book`}>
            <Button style={{ backgroundColor: primaryColor }}>Book a Class</Button>
          </Link>
        </div>

        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{booking.classSession.classType.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(booking.classSession.startTime).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(booking.classSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {booking.classSession.location.name}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {booking.classSession.teacher.user.firstName} {booking.classSession.teacher.user.lastName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">Confirmed</Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming classes</p>
                )}
              </CardContent>
            </Card>

            {/* Past */}
            <Card>
              <CardHeader>
                <CardTitle>Past Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {pastBookings.length > 0 ? (
                  <div className="space-y-4">
                    {pastBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                        <div className="space-y-1">
                          <p className="font-medium">{booking.classSession.classType.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.classSession.startTime).toLocaleDateString()} • {booking.classSession.location.name}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {booking.status === "CANCELLED" ? "Cancelled" : "Completed"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No past classes</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <p className="mt-1">{client.firstName}</p>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <p className="mt-1">{client.lastName}</p>
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="mt-1">{client.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="mt-1">{client.phone || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



