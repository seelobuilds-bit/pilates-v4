"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, MapPin, Clock, User, Check } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
}

interface ClassType {
  id: string
  name: string
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
  teacher: Teacher
  classType: ClassType
  location: Location
  spotsLeft: number
}

interface StudioData {
  name: string
  primaryColor: string
  locations: Location[]
  classTypes: ClassType[]
  teachers: Teacher[]
}

type Step = "location" | "class" | "teacher" | "time" | "confirmed"

export default function EmbedBookingPage() {
  const params = useParams()
  const subdomain = params.subdomain as string

  const [step, setStep] = useState<Step>("location")
  const [studioData, setStudioData] = useState<StudioData | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [dateOffset, setDateOffset] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/booking/${subdomain}/data`)
        if (res.ok) {
          const data = await res.json()
          setStudioData(data)
        }
      } catch {
        // Error
      }
      setLoading(false)
    }
    fetchData()
  }, [subdomain])

  useEffect(() => {
    if (step === "time" && selectedLocation && selectedClass) {
      fetchSlots()
    }
  }, [step, selectedLocation, selectedClass, selectedTeacher, selectedDate])

  async function fetchSlots() {
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

  if (loading || !studioData) {
    return <div className="p-4 text-center">Loading...</div>
  }

  const primaryColor = studioData.primaryColor

  return (
    <div className="p-4 space-y-4">
      {/* Location */}
      {step === "location" && (
        <>
          <h3 className="font-semibold">Select Location</h3>
          {studioData.locations.map((loc) => (
            <Card
              key={loc.id}
              className={`cursor-pointer ${selectedLocation?.id === loc.id ? "ring-2" : ""}`}
              style={{ borderColor: selectedLocation?.id === loc.id ? primaryColor : undefined }}
              onClick={() => setSelectedLocation(loc)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <MapPin className="h-4 w-4" />
                <span>{loc.name}</span>
              </CardContent>
            </Card>
          ))}
          <Button
            className="w-full"
            style={{ backgroundColor: primaryColor }}
            disabled={!selectedLocation}
            onClick={() => setStep("class")}
          >
            Continue
          </Button>
        </>
      )}

      {/* Class */}
      {step === "class" && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setStep("location")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <h3 className="font-semibold">Select Class</h3>
          {studioData.classTypes.map((ct) => (
            <Card
              key={ct.id}
              className={`cursor-pointer ${selectedClass?.id === ct.id ? "ring-2" : ""}`}
              style={{ borderColor: selectedClass?.id === ct.id ? primaryColor : undefined }}
              onClick={() => setSelectedClass(ct)}
            >
              <CardContent className="p-3 flex justify-between">
                <span>{ct.name}</span>
                <span>${ct.price}</span>
              </CardContent>
            </Card>
          ))}
          <Button
            className="w-full"
            style={{ backgroundColor: primaryColor }}
            disabled={!selectedClass}
            onClick={() => setStep("teacher")}
          >
            Continue
          </Button>
        </>
      )}

      {/* Teacher */}
      {step === "teacher" && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setStep("class")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <h3 className="font-semibold">Select Teacher (Optional)</h3>
          <Card
            className={`cursor-pointer ${!selectedTeacher ? "ring-2" : ""}`}
            style={{ borderColor: !selectedTeacher ? primaryColor : undefined }}
            onClick={() => setSelectedTeacher(null)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <User className="h-4 w-4" />
              <span>Any Teacher</span>
            </CardContent>
          </Card>
          {studioData.teachers.map((t) => (
            <Card
              key={t.id}
              className={`cursor-pointer ${selectedTeacher?.id === t.id ? "ring-2" : ""}`}
              style={{ borderColor: selectedTeacher?.id === t.id ? primaryColor : undefined }}
              onClick={() => setSelectedTeacher(t)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <User className="h-4 w-4" />
                <span>{t.user.firstName} {t.user.lastName}</span>
              </CardContent>
            </Card>
          ))}
          <Button
            className="w-full"
            style={{ backgroundColor: primaryColor }}
            onClick={() => setStep("time")}
          >
            Continue
          </Button>
        </>
      )}

      {/* Time */}
      {step === "time" && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setStep("teacher")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <h3 className="font-semibold">Select Time</h3>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDateOffset(Math.max(0, dateOffset - 5))}
              disabled={dateOffset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1 flex-1 overflow-hidden">
              {visibleDates.map((date) => {
                const d = new Date(date + "T00:00:00")
                const isSelected = selectedDate === date
                return (
                  <button
                    key={date}
                    className={`flex-1 p-2 rounded text-center text-sm shrink-0 ${
                      isSelected ? "text-white" : "bg-gray-100"
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

          {timeSlots.length > 0 ? (
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <Card
                  key={slot.id}
                  className={`cursor-pointer ${selectedSlot?.id === slot.id ? "ring-2" : ""}`}
                  style={{ borderColor: selectedSlot?.id === slot.id ? primaryColor : undefined }}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <Badge variant={slot.spotsLeft > 3 ? "success" : "warning"}>
                      {slot.spotsLeft} spots
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No classes available</p>
          )}

          <Button
            className="w-full"
            style={{ backgroundColor: primaryColor }}
            disabled={!selectedSlot}
            onClick={() => setStep("confirmed")}
          >
            Book Now
          </Button>
        </>
      )}

      {/* Confirmed */}
      {step === "confirmed" && (
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: primaryColor }}
          >
            <Check className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-semibold">Booking Confirmed!</h3>
          <p className="text-sm text-muted-foreground">
            {selectedClass?.name} at {selectedLocation?.name}
          </p>
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
            Book Another
          </Button>
        </div>
      )}
    </div>
  )
}



