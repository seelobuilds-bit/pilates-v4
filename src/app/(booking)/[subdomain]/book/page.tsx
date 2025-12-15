"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  MapPin, Link2, User, Calendar, CreditCard, ChevronLeft, ChevronRight, 
  Check, Clock, Dumbbell, RefreshCw, Sparkles, Lock, LogOut
} from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
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
  bio?: string
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

type Step = "location" | "class" | "teacher" | "time" | "checkout"
const STEPS: Step[] = ["location", "class", "teacher", "time", "checkout"]

const stepIcons = {
  location: MapPin,
  class: Link2,
  teacher: User,
  time: Calendar,
  checkout: CreditCard
}

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
  const [packSize, setPackSize] = useState(5)
  const [autoRenew, setAutoRenew] = useState(false)

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

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
      const searchParams = new URLSearchParams({
        locationId: selectedLocation!.id,
        classTypeId: selectedClass!.id,
        ...(selectedTeacher && { teacherId: selectedTeacher.id }),
        ...(selectedDate && { date: selectedDate })
      })
      const res = await fetch(`/api/booking/${subdomain}/slots?${searchParams}`)
      const data = await res.json()
      setTimeSlots(data)
    } catch {
      setTimeSlots([])
    }
    setSlotsLoading(false)
  }

  function getAvailableDates() {
    const dates: { date: string; label: string; isToday: boolean; isTomorrow: boolean }[] = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      const label = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      dates.push({
        date: dateStr,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : label,
        isToday: i === 0,
        isTomorrow: i === 1
      })
    }
    return dates
  }

  const availableDates = getAvailableDates()
  const visibleDates = availableDates.slice(dateOffset, dateOffset + 5)

  function goToStep(s: Step) {
    setStep(s)
  }

  function selectLocationAndContinue(loc: Location) {
    setSelectedLocation(loc)
    setStep("class")
  }

  function selectClassAndContinue(ct: ClassType) {
    setSelectedClass(ct)
    setStep("teacher")
  }

  function selectTeacherAndContinue(t: Teacher | null) {
    setSelectedTeacher(t)
    setStep("time")
  }

  function selectSlotAndContinue(slot: TimeSlot) {
    setSelectedSlot(slot)
    setStep("checkout")
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
    setBookingLoading(true)

    try {
      const res = await fetch(`/api/booking/${subdomain}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: selectedSlot.id,
          bookingType,
          packSize: bookingType === "pack" ? packSize : undefined,
          autoRenew: bookingType === "pack" ? autoRenew : undefined
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Booking failed")
      }

      router.push(`/${subdomain}/account`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Booking failed")
    }
    setBookingLoading(false)
  }

  function calculatePrice() {
    if (!selectedClass) return 0
    const base = selectedClass.price
    if (bookingType === "recurring") return base * 0.85
    if (bookingType === "pack") {
      const discount = packSize === 5 ? 0.9 : packSize === 10 ? 0.8 : 0.75
      return base * packSize * discount
    }
    return base
  }

  if (loading || !studioData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const currentStepIndex = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Book a Class</h1>
          <p className="text-gray-500 mt-1">{studioData.name}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            {STEPS.map((s, i) => {
              const Icon = stepIcons[s]
              const isCompleted = i < currentStepIndex
              const isCurrent = i === currentStepIndex
              return (
                <div
                  key={s}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted || isCurrent
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedLocation || selectedClass) && step !== "location" && (
        <div className="bg-white border-b">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4 text-sm">
              {selectedLocation && (
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {selectedLocation.name}
                </span>
              )}
              {selectedClass && (
                <span className="flex items-center gap-1 text-gray-600">
                  <Dumbbell className="w-4 h-4" />
                  {selectedClass.name}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Button */}
        {step !== "location" && (
          <button
            onClick={() => setStep(STEPS[currentStepIndex - 1])}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Location Step */}
        {step === "location" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Location</h2>
              </div>
              <div className="space-y-3">
                {studioData.locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => selectLocationAndContinue(loc)}
                    className="w-full p-4 border rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all flex items-center justify-between text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{loc.name}</p>
                      <p className="text-sm text-gray-500">{loc.address}, {loc.city}, {loc.state}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Step */}
        {step === "class" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Dumbbell className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Class Type</h2>
              </div>
              <div className="space-y-3">
                {studioData.classTypes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => selectClassAndContinue(ct)}
                    className="w-full p-4 border rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ct.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{ct.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {ct.duration} min
                          </span>
                          <span className="font-medium text-gray-900">${ct.price}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teacher Step */}
        {step === "teacher" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Teacher</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => selectTeacherAndContinue(null)}
                  className="w-full p-4 border rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all flex items-center justify-between text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">Any Available Teacher</p>
                    <p className="text-sm text-gray-500">Show all available time slots</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                {studioData.teachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTeacherAndContinue(t)}
                    className="w-full p-4 border rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-medium">
                        {t.user.firstName[0]}{t.user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t.user.firstName} {t.user.lastName}</p>
                        <p className="text-sm text-gray-500">{t.bio || "Certified Pilates instructor"}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Step */}
        {step === "time" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Date & Time</h2>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Select Date</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDateOffset(Math.max(0, dateOffset - 1))}
                    disabled={dateOffset === 0}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-2 flex-1 overflow-hidden">
                    {visibleDates.map((d) => {
                      const isSelected = selectedDate === d.date
                      return (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          className={`flex-1 py-2 px-3 rounded-lg text-center transition-all ${
                            isSelected
                              ? "bg-violet-600 text-white"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                        >
                          <p className="text-xs">{d.isToday || d.isTomorrow ? d.label : d.label.split(",")[0]}</p>
                          {!d.isToday && !d.isTomorrow && (
                            <p className="font-medium text-sm">{d.label.split(" ").slice(1).join(" ")}</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setDateOffset(Math.min(availableDates.length - 5, dateOffset + 1))}
                    disabled={dateOffset >= availableDates.length - 5}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Available Times</p>
                {slotsLoading ? (
                  <p className="text-gray-500 text-center py-8">Loading times...</p>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => selectSlotAndContinue(slot)}
                        className="p-4 border rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all text-center"
                      >
                        <p className="font-semibold text-gray-900">
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <p className="text-sm text-gray-500">{slot.teacher.user.firstName}</p>
                        <p className="text-sm text-gray-400">{slot.spotsLeft} spots</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No classes available. Try another date.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkout Step */}
        {step === "checkout" && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Complete Booking</h2>
                </div>

                {/* Plan Selection */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Choose Your Plan</p>
                  <div className="space-y-3">
                    {/* Drop-in */}
                    <button
                      onClick={() => setBookingType("single")}
                      className={`w-full p-4 border rounded-xl transition-all flex items-center justify-between ${
                        bookingType === "single" ? "border-violet-600 bg-violet-50" : "hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          bookingType === "single" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Drop-in Class</p>
                          <p className="text-sm text-gray-500">Pay for just this class</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">${selectedClass?.price}</p>
                    </button>

                    {/* Weekly Subscription */}
                    <button
                      onClick={() => setBookingType("recurring")}
                      className={`w-full p-4 border rounded-xl transition-all ${
                        bookingType === "recurring" ? "border-violet-600 bg-violet-50" : "hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            bookingType === "recurring" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                          }`}>
                            <RefreshCw className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">Weekly Subscription</p>
                              <Badge className="bg-emerald-100 text-emerald-700 border-0">Save 15%</Badge>
                            </div>
                            <p className="text-sm text-gray-500">Same class, same time, every week</p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">${((selectedClass?.price || 0) * 0.85).toFixed(0)}<span className="text-sm font-normal text-gray-500">/week</span></p>
                      </div>
                    </button>

                    {/* Class Pack */}
                    <button
                      onClick={() => setBookingType("pack")}
                      className={`w-full p-4 border rounded-xl transition-all ${
                        bookingType === "pack" ? "border-violet-600 bg-violet-50" : "hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            bookingType === "pack" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                          }`}>
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">Class Pack</p>
                              <Badge className="bg-emerald-100 text-emerald-700 border-0">Up to 25% off</Badge>
                            </div>
                            <p className="text-sm text-gray-500">Buy classes in bulk & save</p>
                          </div>
                        </div>
                        <p className="text-sm text-violet-600 font-medium">Choose size →</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Weekly Details */}
                {bookingType === "recurring" && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-4 h-4 text-violet-600" />
                      <p className="font-medium text-gray-900">Weekly Subscription</p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-violet-600" />
                        Same class every {selectedSlot ? new Date(selectedSlot.startTime).toLocaleDateString("en-US", { weekday: "long" }) : "week"} at {selectedSlot ? new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-violet-600" />
                        Charged weekly - cancel anytime
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-violet-600" />
                        15% discount on every class
                      </p>
                    </div>
                  </div>
                )}

                {/* Pack Selection */}
                {bookingType === "pack" && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <p className="font-medium text-gray-900">Choose Your Pack</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[5, 10, 20].map((size) => {
                        const discount = size === 5 ? 10 : size === 10 ? 20 : 25
                        return (
                          <button
                            key={size}
                            onClick={() => setPackSize(size)}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              packSize === size ? "border-violet-600 bg-white" : "hover:border-gray-300"
                            }`}
                          >
                            <p className="font-bold text-gray-900">{size}</p>
                            <p className="text-xs text-gray-500">classes</p>
                            <p className="text-xs text-emerald-600">{discount}% off</p>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Auto-renew pack</p>
                          <p className="text-xs text-gray-500">Automatically buy another when empty</p>
                        </div>
                      </div>
                      <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <p className="font-medium text-gray-900 mb-3">Order Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Class</span>
                      <span className="text-gray-900">{selectedClass?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="text-gray-900">{selectedLocation?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{bookingType === "pack" ? "First Class" : "Date & Time"}</span>
                      <span className="text-gray-900">
                        {selectedSlot && new Date(selectedSlot.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {selectedSlot && new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    {bookingType === "recurring" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Schedule</span>
                        <span className="text-gray-900">Every {selectedSlot && new Date(selectedSlot.startTime).toLocaleDateString("en-US", { weekday: "long" })}</span>
                      </div>
                    )}
                    {bookingType === "pack" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pack Size</span>
                          <span className="text-gray-900">{packSize} classes</span>
                        </div>
                        {autoRenew && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Auto-renew</span>
                            <span className="text-emerald-600">Enabled</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Instructor</span>
                      <span className="text-gray-900">{selectedSlot?.teacher.user.firstName} {selectedSlot?.teacher.user.lastName}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-500">{bookingType === "recurring" ? "Weekly Payment" : bookingType === "pack" ? `Total (${packSize} classes)` : "Total"}</span>
                      <span className="text-lg font-semibold text-violet-600">${calculatePrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auth / Booking */}
            {!client ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <p className="font-medium text-gray-900 mb-4">{authMode === "login" ? "Sign in to complete booking" : "Create an account"}</p>
                  <form onSubmit={handleAuth} className="space-y-4">
                    {authError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{authError}</div>}
                    {authMode === "register" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>First Name</Label>
                          <Input value={authForm.firstName} onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input value={authForm.lastName} onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} required />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={authLoading}>
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
                {/* Booking As */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Booking as</p>
                      <p className="text-sm text-violet-600">{client.email}</p>
                    </div>
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <LogOut className="w-4 h-4" />
                      Change
                    </button>
                  </CardContent>
                </Card>

                {/* Payment */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-violet-600" />
                      <p className="font-medium text-gray-900">Payment Details</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Card Number</Label>
                        <Input placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Expiry</Label>
                          <Input placeholder="MM/YY" />
                        </div>
                        <div>
                          <Label>CVC</Label>
                          <Input placeholder="123" defaultValue="123" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Your payment info is secure. This is a demo - no real charges.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {bookingLoading ? "Processing..." : `Pay $${calculatePrice().toFixed(2)}`}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
