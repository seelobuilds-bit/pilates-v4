"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resolveStudioPrimaryColor } from "@/lib/brand-color"
import { resolveEmbedFontFamily, resolveEmbedFontGoogleHref, resolveEmbedFontKey } from "@/lib/embed-fonts"
import { startEmbedAutoResize } from "@/lib/embed-resize"
import {
  Calendar,
  MapPin,
  Clock,
  LogOut,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"

interface StudioData {
  name: string
  primaryColor: string | null
}

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
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const embedFontKey = resolveEmbedFontKey(searchParams.get("font"))
  const embedFontFamily = resolveEmbedFontFamily(embedFontKey)
  const embedFontHref = resolveEmbedFontGoogleHref(embedFontKey)

  const [studio, setStudio] = useState<StudioData | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "" })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const primaryColor = useMemo(
    () => resolveStudioPrimaryColor(studio?.primaryColor),
    [studio?.primaryColor]
  )

  useEffect(() => {
    const stopResize = startEmbedAutoResize()
    void fetchStudio()
    void fetchClientAndBookings()
    return stopResize
  }, [subdomain])

  useEffect(() => {
    if (!embedFontHref || typeof window === "undefined" || typeof document === "undefined") return
    const existing = document.querySelector(`link[data-embed-font="${embedFontKey}"]`)
    if (existing) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = embedFontHref
    link.setAttribute("data-embed-font", embedFontKey)
    document.head.appendChild(link)
  }, [embedFontHref, embedFontKey])

  async function fetchStudio() {
    try {
      const res = await fetch(`/api/booking/${subdomain}/data`)
      if (!res.ok) return
      const data = await res.json()
      setStudio({
        name: data.name,
        primaryColor: data.primaryColor,
      })
    } catch (error) {
      console.error("Failed to fetch studio info:", error)
    }
  }

  async function fetchClientAndBookings() {
    try {
      const meRes = await fetch(`/api/booking/${subdomain}/me`)
      if (!meRes.ok) {
        setClient(null)
        setBookings([])
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
        body: JSON.stringify(authForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Authentication failed")
      }

      setAuthForm({ email: "", password: "", firstName: "", lastName: "" })
      await fetchClientAndBookings()
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/booking/${subdomain}/my-bookings/${bookingId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchClientAndBookings()
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
    setClient(null)
    setBookings([])
  }

  const upcomingBookings = bookings.filter(
    (booking) => booking.status !== "CANCELLED" && new Date(booking.classSession.startTime) > new Date()
  )
  const pastBookings = bookings.filter(
    (booking) => booking.status === "CANCELLED" || new Date(booking.classSession.startTime) <= new Date()
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-transparent py-10" style={{ fontFamily: embedFontFamily }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-4 bg-transparent" style={{ fontFamily: embedFontFamily }}>
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">{studio?.name || "Studio Account"}</p>
            <h1 className="text-xl font-semibold text-gray-900 mt-1">
              {authMode === "login" ? "Sign In" : "Create Account"}
            </h1>
          </div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <form onSubmit={handleAuth} className="space-y-3">
                {authError && (
                  <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded">
                    {authError}
                  </div>
                )}
                {authMode === "register" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">First Name</Label>
                      <Input
                        className="h-10"
                        value={authForm.firstName}
                        onChange={(e) => setAuthForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Last Name</Label>
                      <Input
                        className="h-10"
                        value={authForm.lastName}
                        onChange={(e) => setAuthForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    className="h-10"
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Password</Label>
                  <Input
                    className="h-10"
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10"
                  style={{ backgroundColor: primaryColor }}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Please wait...
                    </>
                  ) : authMode === "login" ? "Sign In" : "Create Account"}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  {authMode === "login" ? (
                    <>
                      No account?{" "}
                      <button type="button" className="hover:underline" style={{ color: primaryColor }} onClick={() => setAuthMode("register")}>
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" className="hover:underline" style={{ color: primaryColor }} onClick={() => setAuthMode("login")}>
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

  return (
    <div className="bg-transparent p-4" style={{ fontFamily: embedFontFamily }}>
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link href={`/${subdomain}/embed`} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Book Class</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Signed in as</p>
            <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
            <p className="text-sm" style={{ color: primaryColor }}>{client.email}</p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Classes</h2>
          {upcomingBookings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming bookings</p>
                <Link href={`/${subdomain}/embed`}>
                  <Button variant="outline" className="mt-4">Book a Class</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div>
                        <Link
                          href={`/${subdomain}/book?classSessionId=${booking.classSession.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {booking.classSession.classType.name}
                        </Link>
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
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {new Date(booking.classSession.startTime).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })} - {new Date(booking.classSession.endTime).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
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

        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Past Classes</h2>
            <div className="space-y-3">
              {pastBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id} className="border-0 shadow-sm opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/${subdomain}/book?classSessionId=${booking.classSession.id}`}
                          className="font-medium text-gray-700 hover:underline"
                        >
                          {booking.classSession.classType.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.classSession.startTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })} at {new Date(booking.classSession.startTime).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={booking.status === "CANCELLED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"}
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
