"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { ArrowLeft, Calendar, Clock, Repeat, Info } from "lucide-react"

interface ClassType {
  id: string
  name: string
  duration: number
  capacity: number
}

interface Teacher {
  id: string
  user: { firstName: string; lastName: string }
}

interface Location {
  id: string
  name: string
}

const DAYS_OF_WEEK = [
  { id: 0, name: "Sun", fullName: "Sunday" },
  { id: 1, name: "Mon", fullName: "Monday" },
  { id: 2, name: "Tue", fullName: "Tuesday" },
  { id: 3, name: "Wed", fullName: "Wednesday" },
  { id: 4, name: "Thu", fullName: "Thursday" },
  { id: 5, name: "Fri", fullName: "Friday" },
  { id: 6, name: "Sat", fullName: "Saturday" },
]

function padTime(value: number) {
  return value.toString().padStart(2, "0")
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`
}

function toTimeInputValue(date: Date) {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`
}

export default function NewSchedulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  
  const [formData, setFormData] = useState({
    classTypeId: "",
    teacherId: "",
    locationId: "",
    date: "",
    time: "",
    capacity: ""
  })

  // Recurring options
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [endDate, setEndDate] = useState("")
  const [createdCount, setCreatedCount] = useState<number | null>(null)
  const [dateTimeDialogOpen, setDateTimeDialogOpen] = useState(false)
  const [pickerDate, setPickerDate] = useState("")
  const [pickerHour, setPickerHour] = useState("07")
  const [pickerMinute, setPickerMinute] = useState("00")

  useEffect(() => {
    async function fetchData() {
      try {
        const [classTypesRes, teachersRes, locationsRes] = await Promise.all([
          fetch("/api/studio/class-types"),
          fetch("/api/studio/teachers"),
          fetch("/api/studio/locations")
        ])
        
        if (classTypesRes.ok) setClassTypes(await classTypesRes.json())
        if (teachersRes.ok) setTeachers(await teachersRes.json())
        if (locationsRes.ok) setLocations(await locationsRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [])

  // When start date is selected, auto-select that day of week for recurring
  useEffect(() => {
    if (formData.date && isRecurring && selectedDays.length === 0) {
      const startDate = new Date(formData.date + "T00:00:00")
      setSelectedDays([startDate.getDay()])
    }
  }, [formData.date, isRecurring, selectedDays.length])

  // Set default end date to 4 weeks from start date
  useEffect(() => {
    if (formData.date && isRecurring && !endDate) {
      const startDate = new Date(formData.date + "T00:00:00")
      const defaultEnd = new Date(startDate)
      defaultEnd.setDate(defaultEnd.getDate() + 28) // 4 weeks
      setEndDate(defaultEnd.toISOString().split("T")[0])
    }
  }, [formData.date, isRecurring, endDate])

  const selectedClassType = classTypes.find(ct => ct.id === formData.classTypeId)
  const startDateTimeLabel = (() => {
    if (!formData.date || !formData.time) return "Select date & time"
    const dateTime = new Date(`${formData.date}T${formData.time}`)
    if (Number.isNaN(dateTime.getTime())) return `${formData.date} ${formData.time}`
    return dateTime.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })
  })()

  const applyStartDateTime = (value: string) => {
    if (!value) {
      setFormData((prev) => ({ ...prev, date: "", time: "" }))
      return
    }

    const [date, rawTime = ""] = value.split("T")
    const time = rawTime.slice(0, 5)
    setFormData((prev) => ({ ...prev, date, time }))
  }

  const applyQuickDateTime = (dayOffset: number, hour: number, minute: number) => {
    const next = new Date()
    next.setDate(next.getDate() + dayOffset)
    next.setHours(hour, minute, 0, 0)
    applyStartDateTime(`${toDateInputValue(next)}T${toTimeInputValue(next)}`)
  }

  const applyDialogDateTime = () => {
    if (!pickerDate) return
    applyStartDateTime(`${pickerDate}T${pickerHour}:${pickerMinute}`)
    setDateTimeDialogOpen(false)
  }

  useEffect(() => {
    if (!dateTimeDialogOpen) return
    const now = new Date()
    const [hour = "07", minute = "00"] = (formData.time || "07:00").split(":")
    setPickerDate(formData.date || toDateInputValue(now))
    setPickerHour(hour)
    setPickerMinute(minute)
  }, [dateTimeDialogOpen, formData.date, formData.time])

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort((a, b) => a - b)
    )
  }

  // Calculate how many classes will be created
  const calculateClassCount = () => {
    if (!formData.date || !formData.time || !endDate || selectedDays.length === 0) return 0
    
    const start = new Date(formData.date + "T00:00:00")
    const end = new Date(endDate + "T23:59:59")
    let count = 0
    
    const current = new Date(start)
    while (current <= end) {
      if (selectedDays.includes(current.getDay())) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setCreatedCount(null)

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`)
      const duration = selectedClassType?.duration || 60
      const endTime = new Date(startTime.getTime() + duration * 60000)

      const payload: Record<string, unknown> = {
        classTypeId: formData.classTypeId,
        teacherId: formData.teacherId,
        locationId: formData.locationId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: parseInt(formData.capacity) || selectedClassType?.capacity || 10
      }

      // Add recurring options if enabled
      if (isRecurring && selectedDays.length > 0 && endDate) {
        payload.recurring = {
          days: selectedDays,
          endDate: endDate,
          time: formData.time,
          duration: duration
        }
      }

      const res = await fetch("/api/studio/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        if (data.count && data.count > 1) {
          setCreatedCount(data.count)
          // Show success briefly then redirect
          setTimeout(() => {
            router.push("/studio/schedule")
          }, 2000)
        } else {
          router.push("/studio/schedule")
        }
      } else {
        const data = await res.json()
        alert(data.error || "Failed to create class")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to create class")
    } finally {
      setLoading(false)
    }
  }

  const expectedCount = isRecurring ? calculateClassCount() : 1

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/schedule" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Schedule
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Class to Schedule</h1>
        <p className="text-gray-500 mt-1">Schedule a new class session</p>
      </div>

      {/* Success Message */}
      {createdCount !== null && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-emerald-800 font-medium">
            ✓ Successfully created {createdCount} class{createdCount > 1 ? "es" : ""}!
          </p>
          <p className="text-emerald-600 text-sm mt-1">Redirecting to schedule...</p>
        </div>
      )}

      <Card className="border-0 shadow-sm max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Type */}
            <div className="space-y-2">
              <Label htmlFor="classType">Class Type</Label>
              <Select
                value={formData.classTypeId}
                onValueChange={(value) => {
                  const ct = classTypes.find(c => c.id === value)
                  setFormData({ 
                    ...formData, 
                    classTypeId: value,
                    capacity: ct?.capacity?.toString() || ""
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class type" />
                </SelectTrigger>
                <SelectContent>
                  {classTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.name} ({ct.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher */}
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={formData.teacherId}
                onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) => setFormData({ ...formData, locationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date/Time */}
            <div className="space-y-2">
              <Label htmlFor="startDate">{isRecurring ? "Start Date & Time" : "Date & Time"}</Label>
              <Dialog open={dateTimeDialogOpen} onOpenChange={setDateTimeDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start text-left font-normal h-11">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {startDateTimeLabel}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Date and Time</DialogTitle>
                    <DialogDescription>Choose when this class should start.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickerDate">Date</Label>
                      <Input
                        id="pickerDate"
                        type="date"
                        value={pickerDate}
                        onChange={(event) => setPickerDate(event.target.value)}
                        min={toDateInputValue(new Date())}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Hour</Label>
                        <Select value={pickerHour} onValueChange={setPickerHour}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, hour) => padTime(hour)).map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Minute</Label>
                        <Select value={pickerMinute} onValueChange={setPickerMinute}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["00", "15", "30", "45"].map((minute) => (
                              <SelectItem key={minute} value={minute}>
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        const now = new Date()
                        setPickerDate(toDateInputValue(now))
                        setPickerHour("07")
                        setPickerMinute("00")
                      }}>
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Today 7:00
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        setPickerDate(toDateInputValue(tomorrow))
                        setPickerHour("18")
                        setPickerMinute("00")
                      }}>
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Tomorrow 18:00
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDateTimeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="bg-violet-600 hover:bg-violet-700"
                      onClick={applyDialogDateTime}
                      disabled={!pickerDate}
                    >
                      Apply
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.date}
                  onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
                  min={toDateInputValue(new Date())}
                  required
                />
                <Input
                  id="startTime"
                  type="time"
                  value={formData.time}
                  onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickDateTime(0, 7, 0)}>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Today 7:00
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickDateTime(0, 18, 0)}>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Today 18:00
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickDateTime(1, 7, 0)}>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Tomorrow 7:00
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickDateTime(1, 18, 0)}>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Tomorrow 18:00
                </Button>
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder={selectedClassType?.capacity?.toString() || "10"}
                min="1"
              />
              <p className="text-xs text-gray-500">Maximum number of students for this session</p>
            </div>

            {/* Recurring Toggle */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between p-4 bg-violet-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Repeat className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Recurring Class</p>
                    <p className="text-sm text-gray-500">Repeat this class on selected days</p>
                  </div>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setIsRecurring(checked)
                    if (!checked) {
                      setSelectedDays([])
                      setEndDate("")
                    }
                  }}
                />
              </div>
            </div>

            {/* Recurring Options */}
            {isRecurring && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {/* Days of Week */}
                <div className="space-y-2">
                  <Label>Repeat on</Label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          selectedDays.includes(day.id)
                            ? "bg-violet-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300"
                        }`}
                        title={day.fullName}
                      >
                        {day.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Select which days to repeat this class</p>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">Repeat until</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={formData.date}
                      className="pl-10"
                      required={isRecurring}
                    />
                  </div>
                </div>

                {/* Preview */}
                {expectedCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="text-blue-800 font-medium">
                        This will create {expectedCount} class{expectedCount > 1 ? "es" : ""}
                      </p>
                      <p className="text-blue-600">
                        Every {selectedDays.map(d => DAYS_OF_WEEK.find(day => day.id === d)?.fullName).join(", ")}
                        {" "}at {formData.time} until {new Date(endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/studio/schedule">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
                <Button 
                  type="submit" 
                  className="bg-violet-600 hover:bg-violet-700"
                  disabled={loading || !formData.classTypeId || !formData.teacherId || !formData.locationId || !formData.date || !formData.time || (isRecurring && selectedDays.length === 0)}
                >
                {loading ? "Creating..." : isRecurring ? `Create ${expectedCount} Classes` : "Create Class"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
