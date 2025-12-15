"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, MapPin, Clock, User } from "lucide-react"

interface Location { id: string; name: string }
interface ClassType { id: string; name: string; duration: number; price: number }
interface Teacher { id: string; user: { firstName: string; lastName: string } }
interface TimeSlot { id: string; startTime: string; teacher: Teacher; spotsLeft: number }
interface StudioData { id: string; name: string; locations: Location[]; classTypes: ClassType[] }

type Step = "location" | "class" | "time"

export default function EmbedBookingPage() {
  const params = useParams()
  const subdomain = params.subdomain as string

  const [step, setStep] = useState<Step>("location")
  const [studioData, setStudioData] = useState<StudioData | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [dateOffset, setDateOffset] = useState(0)
  const [slotsLoading, setSlotsLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/booking/${subdomain}/data`)
        const data = await res.json()
        setStudioData(data)
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [subdomain])

  useEffect(() => {
    if (step === "time" && selectedLocation && selectedClass) {
      fetchSlots()
    }
  }, [step, selectedLocation, selectedClass, selectedDate])

  async function fetchSlots() {
    setSlotsLoading(true)
    try {
      const params = new URLSearchParams({
        locationId: selectedLocation!.id,
        classTypeId: selectedClass!.id,
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

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  if (!studioData) {
    return <div className="p-8 text-center text-gray-500">Studio not found</div>
  }

  return (
    <div className="p-4 bg-white min-h-full">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{studioData.name} - Book a Class</h2>

      {step === "location" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">Select Location</p>
          {studioData.locations.map((loc) => (
            <Card
              key={loc.id}
              className={`cursor-pointer transition-all border-2 ${selectedLocation?.id === loc.id ? "border-violet-600" : "border-transparent hover:border-gray-200"}`}
              onClick={() => { setSelectedLocation(loc); setStep("class") }}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <MapPin className="h-4 w-4 text-violet-600" />
                <span className="font-medium">{loc.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === "class" && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setStep("location")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <p className="text-sm text-gray-500 mb-4">Select Class</p>
          {studioData.classTypes.map((ct) => (
            <Card
              key={ct.id}
              className={`cursor-pointer transition-all border-2 ${selectedClass?.id === ct.id ? "border-violet-600" : "border-transparent hover:border-gray-200"}`}
              onClick={() => { setSelectedClass(ct); setStep("time") }}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <span className="font-medium">{ct.name}</span>
                <span className="text-sm text-gray-500">${ct.price} • {ct.duration}min</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === "time" && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep("class")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDateOffset(Math.max(0, dateOffset - 5))} disabled={dateOffset === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1 flex-1 overflow-hidden">
              {visibleDates.map((date) => {
                const d = new Date(date + "T00:00:00")
                const isSelected = selectedDate === date
                return (
                  <button
                    key={date}
                    className={`flex-1 p-2 rounded text-center text-xs shrink-0 ${isSelected ? "bg-violet-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <p>{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
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
            <p className="text-center text-gray-500 py-4">Loading...</p>
          ) : timeSlots.length > 0 ? (
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <Card key={slot.id} className="cursor-pointer hover:border-violet-600 border-2 border-transparent transition-all">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-violet-600" />
                      <div>
                        <p className="font-medium">{new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-xs text-gray-500">{slot.teacher.user.firstName} {slot.teacher.user.lastName}</p>
                      </div>
                    </div>
                    <Badge variant={slot.spotsLeft > 3 ? "success" : "warning"}>{slot.spotsLeft} spots</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No classes available</p>
          )}
        </div>
      )}
    </div>
  )
}
