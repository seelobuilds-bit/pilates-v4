"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock } from "lucide-react"

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

  const selectedClassType = classTypes.find(ct => ct.id === formData.classTypeId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`)
      const duration = selectedClassType?.duration || 60
      const endTime = new Date(startTime.getTime() + duration * 60000)

      const res = await fetch("/api/studio/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classTypeId: formData.classTypeId,
          teacherId: formData.teacherId,
          locationId: formData.locationId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          capacity: parseInt(formData.capacity) || selectedClassType?.capacity || 10
        })
      })

      if (res.ok) {
        router.push("/studio/schedule")
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

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/schedule" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Schedule
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Class to Schedule</h1>
        <p className="text-gray-500 mt-1">Schedule a new class session</p>
      </div>

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

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/studio/schedule">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-violet-600 hover:bg-violet-700"
                disabled={loading || !formData.classTypeId || !formData.teacherId || !formData.locationId}
              >
                {loading ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
