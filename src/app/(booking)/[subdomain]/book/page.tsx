"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock, User, Check, LogOut } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  city: string
}

interface ClassType {
  id: string
  name: string
  description: string
  duration: number
  price: number
}

interface Teacher {
  id: string
  user: { firstName: string; lastName: string }
}

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  teacher: Teacher
  classType: ClassType
  location: Location
  spotsLeft: number
}

interface StudioData {
  id: string
  name: string
  primaryColor: string
  locations: Location[]
  classTypes: ClassType[]
  teachers: Teacher[]
}

interface ClientInfo {
  id: string
  firstName: string
  lastName: string
  email: string
}

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

  // Selections
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [dateOffset, setDateOffset] = useState(0)

  // Booking options
  const [bookingType, setBookingType] = useState<"single" | "recurring" | "pack">("single")
  const [recurringWeeks, setRecurringWeeks] = useState(4)
  const [packSize, setPackSize] = useState(5)
  const [autoRenew, setAutoRenew] = useState(false)

  // Client state
  const [client, setClient] = useState<ClientInfo | null>(null)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Fetch studio data
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

  // Check if client is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`/api/booking/${subdomain}/me`)
        if (res.ok) {
          const data = await res.json()
          setClient(data)
        }
      } catch {
        // Not logged in
      }
    }
    checkAuth()
  }, [subdomain])

  // Fetch time slots when selections change
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
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
    }
  }

  function prevStep() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) {
      setStep(STEPS[idx - 1])
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const primaryColor = studioData.primaryColor

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
              {studioData.name}
            </h1>
            {client && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {client.firstName} {client.lastName}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2 overflow-hidden">
            {STEPS.slice(0, -1).map((s, i) => {
              const isActive = STEPS.indexOf(step) >= i
              const isCurrent = step === s
              return (
                <div key={s} className="flex items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                      isActive ? "text-white" : "bg-gray-200 text-gray-500"
                    }`}
                    style={{ backgroundColor: isActive ? primaryColor : undefined }}
                  >
                    {i + 1}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                  {i < STEPS.length - 2 && (
                    <ChevronRight className="h-4 w-4 mx-2 text-gray-300 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Location Step */}
        {step === "location" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Select Location</h2>
            <div className="grid gap-4">
              {studioData.locations.map((location) => (
                <Card
                  key={location.id}
                  className={`cursor-pointer transition-all ${
                    selectedLocation?.id === location.id ? "ring-2" : ""
                  }`}
                  style={{ borderColor: selectedLocation?.id === location.id ? primaryColor : undefined }}
                  onClick={() => setSelectedLocation(location)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.address}, {location.city}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              disabled={!selectedLocation}
              onClick={nextStep}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Class Step */}
        {step === "class" && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold">Select Class</h2>
            <div className="grid gap-4">
              {studioData.classTypes.map((classType) => (
                <Card
                  key={classType.id}
                  className={`cursor-pointer transition-all ${
                    selectedClass?.id === classType.id ? "ring-2" : ""
                  }`}
                  style={{ borderColor: selectedClass?.id === classType.id ? primaryColor : undefined }}
                  onClick={() => setSelectedClass(classType)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{classType.name}</p>
                        <p className="text-sm text-muted-foreground">{classType.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${classType.price}</p>
                        <p className="text-sm text-muted-foreground">{classType.duration} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              disabled={!selectedClass}
              onClick={nextStep}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Teacher Step */}
        {step === "teacher" && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold">Select Teacher (Optional)</h2>
            <Card
              className={`cursor-pointer transition-all ${!selectedTeacher ? "ring-2" : ""}`}
              style={{ borderColor: !selectedTeacher ? primaryColor : undefined }}
              onClick={() => setSelectedTeacher(null)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">Any Teacher</p>
              </CardContent>
            </Card>
            {studioData.teachers.map((teacher) => (
              <Card
                key={teacher.id}
                className={`cursor-pointer transition-all ${
                  selectedTeacher?.id === teacher.id ? "ring-2" : ""
                }`}
                style={{ borderColor: selectedTeacher?.id === teacher.id ? primaryColor : undefined }}
                onClick={() => setSelectedTeacher(teacher)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">
                    {teacher.user.firstName} {teacher.user.lastName}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              onClick={nextStep}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Time Step */}
        {step === "time" && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold">Select Time</h2>
            
            {/* Date selector with arrows */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDateOffset(Math.max(0, dateOffset - 5))}
                disabled={dateOffset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2 flex-1 overflow-hidden">
                {visibleDates.map((date) => {
                  const d = new Date(date + "T00:00:00")
                  const isSelected = selectedDate === date
                  return (
                    <button
                      key={date}
                      className={`flex-1 p-2 rounded-lg text-center transition-all shrink-0 ${
                        isSelected ? "text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                      style={{ backgroundColor: isSelected ? primaryColor : undefined }}
                      onClick={() => setSelectedDate(date)}
                    >
                      <p className="text-xs">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      <p className="font-medium">{d.getDate()}</p>
                    </button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDateOffset(Math.min(availableDates.length - 5, dateOffset + 5))}
                disabled={dateOffset >= availableDates.length - 5}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Time slots */}
            {slotsLoading ? (
              <p>Loading available times...</p>
            ) : timeSlots.length > 0 ? (
              <div className="grid gap-2">
                {timeSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id
                  return (
                    <Card
                      key={slot.id}
                      className={`cursor-pointer transition-all ${isSelected ? "ring-2" : ""}`}
                      style={{ borderColor: isSelected ? primaryColor : undefined }}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {slot.teacher.user.firstName} {slot.teacher.user.lastName}
                            </p>
                          </div>
                        </div>
                        <Badge variant={slot.spotsLeft > 3 ? "success" : "warning"}>
                          {slot.spotsLeft} spots
                        </Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No classes available for this selection</p>
            )}

            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              disabled={!selectedSlot}
              onClick={nextStep}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Details Step */}
        {step === "details" && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold">Booking Options</h2>

            {/* Booking Type */}
            <div className="grid gap-4">
              <Card
                className={`cursor-pointer transition-all ${bookingType === "single" ? "ring-2" : ""}`}
                style={{ borderColor: bookingType === "single" ? primaryColor : undefined }}
                onClick={() => setBookingType("single")}
              >
                <CardContent className="p-4">
                  <p className="font-medium">Single Class</p>
                  <p className="text-sm text-muted-foreground">Book just this one class</p>
                  <p className="text-lg font-bold mt-2">${selectedClass?.price}</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${bookingType === "recurring" ? "ring-2" : ""}`}
                style={{ borderColor: bookingType === "recurring" ? primaryColor : undefined }}
                onClick={() => setBookingType("recurring")}
              >
                <CardContent className="p-4">
                  <p className="font-medium">Weekly Recurring</p>
                  <p className="text-sm text-muted-foreground">Same class, same time every week</p>
                  {bookingType === "recurring" && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label>Number of weeks</Label>
                        <div className="flex items-center gap-2 mt-2">
                          {[4, 8, 12].map((w) => (
                            <Button
                              key={w}
                              variant={recurringWeeks === w ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setRecurringWeeks(w) }}
                              style={recurringWeeks === w ? { backgroundColor: primaryColor } : {}}
                            >
                              {w} weeks
                            </Button>
                          ))}
                        </div>
                      </div>
                      <p className="text-lg font-bold">
                        ${((selectedClass?.price || 0) * recurringWeeks * 0.9).toFixed(0)}/mo
                        <span className="text-sm font-normal text-muted-foreground ml-2">10% off</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${bookingType === "pack" ? "ring-2" : ""}`}
                style={{ borderColor: bookingType === "pack" ? primaryColor : undefined }}
                onClick={() => setBookingType("pack")}
              >
                <CardContent className="p-4">
                  <p className="font-medium">Class Pack</p>
                  <p className="text-sm text-muted-foreground">Buy multiple classes upfront</p>
                  {bookingType === "pack" && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label>Pack size</Label>
                        <div className="flex items-center gap-2 mt-2">
                          {[5, 10, 20].map((p) => (
                            <Button
                              key={p}
                              variant={packSize === p ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setPackSize(p) }}
                              style={packSize === p ? { backgroundColor: primaryColor } : {}}
                            >
                              {p} classes
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
                        <Label>Auto-renew when pack runs out</Label>
                      </div>
                      <p className="text-lg font-bold">
                        ${((selectedClass?.price || 0) * packSize * 0.85).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground ml-2">15% off</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              onClick={nextStep}
            >
              Continue to Checkout
            </Button>
          </div>
        )}

        {/* Checkout Step */}
        {step === "checkout" && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={prevStep} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold">Checkout</h2>

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Location</span>
                  <span className="font-medium">{selectedLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class</span>
                  <span className="font-medium">{selectedClass?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time</span>
                  <span className="font-medium">
                    {selectedSlot && new Date(selectedSlot.startTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Teacher</span>
                  <span className="font-medium">
                    {selectedSlot?.teacher.user.firstName} {selectedSlot?.teacher.user.lastName}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
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

            {/* Auth / Payment */}
            {!client ? (
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
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="4242 4242 4242 4242" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Demo mode - no real charges</p>
                  </CardContent>
                </Card>

                <Button
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                  onClick={handleConfirmBooking}
                >
                  Confirm Booking
                </Button>
              </>
            )}
          </div>
        )}

        {/* Confirmed Step */}
        {step === "confirmed" && (
          <div className="text-center space-y-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: primaryColor }}
            >
              <Check className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="flex justify-between">
                  <span>Class</span>
                  <span className="font-medium">{selectedClass?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span className="font-medium">{selectedLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time</span>
                  <span className="font-medium">
                    {selectedSlot && new Date(selectedSlot.startTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Teacher</span>
                  <span className="font-medium">
                    {selectedSlot?.teacher.user.firstName} {selectedSlot?.teacher.user.lastName}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              onClick={() => {
                setStep("location")
                setSelectedLocation(null)
                setSelectedClass(null)
                setSelectedTeacher(null)
                setSelectedSlot(null)
                setSelectedDate("")
              }}
            >
              Book Another Class
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}



