"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, MapPin, Clock, User, Check, LogOut, Zap } from "lucide-react"

interface Location { id: string; name: string; address: string; city: string }
interface ClassType { id: string; name: string; description: string; duration: number; price: number }
interface Teacher { id: string; user: { firstName: string; lastName: string } }
interface TimeSlot { id: string; startTime: string; endTime: string; teacher: Teacher; classType: ClassType; location: Location; spotsLeft: number }
interface StudioData { id: string; name: string; primaryColor: string; locations: Location[]; classTypes: ClassType[]; teachers: Teacher[] }
interface ClientInfo { id: string; firstName: string; lastName: string; email: string }

type Step = "location" | "class" | "teacher" | "time" | "details" | "checkout" | "confirmed"
const STEPS: Step[] = ["location", "class", "teacher", "time", "details", "checkout", "confirmed"]

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string

  const [step, setStep] = useState<Step>("location")
  const [studioData, setStudioData] = useState<StudioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [dateOffset, setDateOffset] = useState(0)

  const [bookingType, setBookingType] = useState<"single" | "recurring" | "pack">("single")
  const [recurringWeeks, setRecurringWeeks] = useState(4)
  const [packSize, setPackSize] = useState(5)
  const [autoRenew, setAutoRenew] = useState(false)

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/booking/${subdomain}/data`)
        if (!res.ok) throw new Error("Studio not found")
        const data = await res.json()
        setStudioData(data)
      } catch {
        router.push("/")
      }
      setLoading(false)
    }
    fetchData()
  }, [subdomain, router])

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`/api/booking/${subdomain}/me`)
        if (res.ok) {
          const data = await res.json()
          setClient(data)
        }
      } catch {}
    }
    checkAuth()
  }, [subdomain])

  useEffect(() => {
    if (step === "time" && selectedLocation && selectedClass) {
      fetchSlots()
    }
  }, [step, selectedLocation, selectedClass, selectedTeacher, selectedDate])

  async function fetchSlots() {
    setSlotsLoading(true)
    try {
      const params = new URLSearchParams({
        locationId: selectedLocation!.id,
        classTypeId: selectedClass!.id,
        ...(selectedTeacher && { teacherId: selectedTeacher.id }),
        ...(selectedDate && { date: selectedDate })
      })
      const res = await fetch(`/api/booking/${subdomain}/slots?${params}`)
      const data = await res.json()
      setTimeSlots(data)
    } catch {
      setTimeSlots([])
    }
    setSlotsLoading(false)
  }

  function getAvailableDates() {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split("T")[0])
    }
    return dates
  }

  const availableDates = getAvailableDates()
  const visibleDates = availableDates.slice(dateOffset, dateOffset + 5)

  function nextStep() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function prevStep() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
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
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed")
    }
    setAuthLoading(false)
  }

  async function handleLogout() {
    await fetch(`/api/booking/${subdomain}/logout`, { method: "POST" })
    setClient(null)
  }

  async function handleConfirmBooking() {
    if (!selectedSlot || !client) return

    try {
      const res = await fetch(`/api/booking/${subdomain}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: selectedSlot.id,
          bookingType,
          recurringWeeks: bookingType === "recurring" ? recurringWeeks : undefined,
          packSize: bookingType === "pack" ? packSize : undefined,
          autoRenew
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Booking failed")
      }

      setStep("confirmed")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Booking failed")
    }
  }

  if (loading || !studioData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">{studioData.name}</span>
            </div>
            {client && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{client.firstName}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      {step !== "confirmed" && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              {STEPS.slice(0, -1).map((s, i) => {
                const isActive = STEPS.indexOf(step) >= i
                const isCurrent = step === s
                return (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isActive ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {i + 1}
                    </div>
                    <span className={`ml-2 text-sm hidden md:inline ${isCurrent ? "font-medium text-gray-900" : "text-gray-500"}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                    {i < STEPS.length - 2 && <ChevronRight className="h-4 w-4 mx-2 text-gray-300" />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Location */}
        {step === "location" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Select Location</h2>
            <div className="space-y-3">
              {studioData.locations.map((loc) => (
                <Card
                  key={loc.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedLocation?.id === loc.id ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"
                  }`}
                  onClick={() => setSelectedLocation(loc)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{loc.name}</p>
                      <p className="text-sm text-gray-500">{loc.address}, {loc.city}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button className="w-full" disabled={!selectedLocation} onClick={nextStep}>
              Continue
            </Button>
          </div>
        )}

        {/* Class */}
        {step === "class" && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Select Class</h2>
            <div className="space-y-3">
              {studioData.classTypes.map((ct) => (
                <Card
                  key={ct.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedClass?.id === ct.id ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"
                  }`}
                  onClick={() => setSelectedClass(ct)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{ct.name}</p>
                        <p className="text-sm text-gray-500">{ct.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${ct.price}</p>
                        <p className="text-sm text-gray-500">{ct.duration} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button className="w-full" disabled={!selectedClass} onClick={nextStep}>
              Continue
            </Button>
          </div>
        )}

        {/* Teacher */}
        {step === "teacher" && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Select Teacher</h2>
            <p className="text-gray-500">Optional - leave unselected to see all available times</p>
            <div className="space-y-3">
              <Card
                className={`cursor-pointer transition-all border-2 ${
                  !selectedTeacher ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"
                }`}
                onClick={() => setSelectedTeacher(null)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="font-medium text-gray-900">Any Teacher</p>
                </CardContent>
              </Card>
              {studioData.teachers.map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedTeacher?.id === t.id ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"
                  }`}
                  onClick={() => setSelectedTeacher(t)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <User className="h-5 w-5 text-violet-600" />
                    </div>
                    <p className="font-medium text-gray-900">{t.user.firstName} {t.user.lastName}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button className="w-full" onClick={nextStep}>
              Continue
            </Button>
          </div>
        )}

        {/* Time */}
        {step === "time" && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Select Time</h2>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setDateOffset(Math.max(0, dateOffset - 5))} disabled={dateOffset === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2 flex-1">
                {visibleDates.map((date) => {
                  const d = new Date(date + "T00:00:00")
                  const isSelected = selectedDate === date
                  return (
                    <button
                      key={date}
                      className={`flex-1 p-3 rounded-lg text-center transition-all ${
                        isSelected ? "bg-violet-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <p className="text-xs opacity-75">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      <p className="font-bold">{d.getDate()}</p>
                    </button>
                  )
                })}
              </div>
              <Button variant="outline" size="icon" onClick={() => setDateOffset(Math.min(availableDates.length - 5, dateOffset + 5))} disabled={dateOffset >= availableDates.length - 5}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {slotsLoading ? (
              <p className="text-center text-gray-500 py-8">Loading times...</p>
            ) : timeSlots.length > 0 ? (
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <Card
                    key={slot.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedSlot?.id === slot.id ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-violet-100 rounded-lg">
                          <Clock className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-sm text-gray-500">{slot.teacher.user.firstName} {slot.teacher.user.lastName}</p>
                        </div>
                      </div>
                      <Badge variant={slot.spotsLeft > 3 ? "success" : "warning"}>
                        {slot.spotsLeft} spots
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No classes available for this selection</p>
            )}

            <Button className="w-full" disabled={!selectedSlot} onClick={nextStep}>
              Continue
            </Button>
          </div>
        )}

        {/* Details */}
        {step === "details" && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Booking Options</h2>

            <div className="space-y-3">
              <Card
                className={`cursor-pointer transition-all border-2 ${bookingType === "single" ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"}`}
                onClick={() => setBookingType("single")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Single Class</p>
                      <p className="text-sm text-gray-500">Book just this one class</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">${selectedClass?.price}</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-2 ${bookingType === "recurring" ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"}`}
                onClick={() => setBookingType("recurring")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Recurring</p>
                      <p className="text-sm text-gray-500">Same class, same time every week</p>
                    </div>
                    <Badge variant="success">10% off</Badge>
                  </div>
                  {bookingType === "recurring" && (
                    <div className="pt-3 border-t space-y-3">
                      <div className="flex gap-2">
                        {[4, 8, 12].map((w) => (
                          <Button key={w} variant={recurringWeeks === w ? "default" : "outline"} size="sm" onClick={(e) => { e.stopPropagation(); setRecurringWeeks(w) }}>
                            {w} weeks
                          </Button>
                        ))}
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        ${((selectedClass?.price || 0) * recurringWeeks * 0.9).toFixed(0)} total
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-2 ${bookingType === "pack" ? "border-violet-600 bg-violet-50" : "border-transparent hover:border-gray-200"}`}
                onClick={() => setBookingType("pack")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">Class Pack</p>
                      <p className="text-sm text-gray-500">Buy multiple classes upfront</p>
                    </div>
                    <Badge variant="success">15% off</Badge>
                  </div>
                  {bookingType === "pack" && (
                    <div className="pt-3 border-t space-y-3">
                      <div className="flex gap-2">
                        {[5, 10, 20].map((p) => (
                          <Button key={p} variant={packSize === p ? "default" : "outline"} size="sm" onClick={(e) => { e.stopPropagation(); setPackSize(p) }}>
                            {p} classes
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
                        <Label className="text-sm">Auto-renew when pack runs out</Label>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        ${((selectedClass?.price || 0) * packSize * 0.85).toFixed(0)} total
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Button className="w-full" onClick={nextStep}>
              Continue to Checkout
            </Button>
          </div>
        )}

        {/* Checkout */}
        {step === "checkout" && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium">{selectedLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Class</span>
                  <span className="font-medium">{selectedClass?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-medium">
                    {selectedSlot && new Date(selectedSlot.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teacher</span>
                  <span className="font-medium">{selectedSlot?.teacher.user.firstName} {selectedSlot?.teacher.user.lastName}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      ${bookingType === "single" 
                        ? selectedClass?.price
                        : bookingType === "recurring"
                        ? ((selectedClass?.price || 0) * recurringWeeks * 0.9).toFixed(0)
                        : ((selectedClass?.price || 0) * packSize * 0.85).toFixed(0)
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!client ? (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{authMode === "login" ? "Sign In" : "Create Account"}</CardTitle>
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
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input placeholder="4242 4242 4242 4242" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry</Label>
                        <Input placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label>CVC</Label>
                        <Input placeholder="123" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Demo mode - no real charges</p>
                  </CardContent>
                </Card>
                <Button className="w-full" size="lg" onClick={handleConfirmBooking}>
                  Confirm Booking
                </Button>
              </>
            )}
          </div>
        )}

        {/* Confirmed */}
        {step === "confirmed" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
            <Card className="border-0 shadow-sm text-left mb-8">
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Class</span>
                  <span className="font-medium">{selectedClass?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium">{selectedLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-medium">{selectedSlot && new Date(selectedSlot.startTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teacher</span>
                  <span className="font-medium">{selectedSlot?.teacher.user.firstName} {selectedSlot?.teacher.user.lastName}</span>
                </div>
              </CardContent>
            </Card>
            <Button variant="outline" onClick={() => { setStep("location"); setSelectedLocation(null); setSelectedClass(null); setSelectedTeacher(null); setSelectedSlot(null); setSelectedDate("") }}>
              Book Another Class
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
