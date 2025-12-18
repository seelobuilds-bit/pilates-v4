"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface ClassSession {
  id: string
  startTime: string
  endTime: string
  capacity: number
  classType: { name: string }
  location: { name: string }
  _count: { bookings: number }
}

export default function TeacherSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch(`/api/teacher/schedule?weekOffset=${weekOffset}`)
        if (res.ok) {
          const data = await res.json()
          setClasses(data)
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [weekOffset])

  // Generate week dates
  const getWeekDates = (offset: number) => {
    const today = new Date()
    const currentDay = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay + (offset * 7))

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(weekOffset)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Group classes by day
  const classesByDay: Record<number, ClassSession[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  classes.forEach(cls => {
    const day = new Date(cls.startTime).getDay()
    classesByDay[day].push(cls)
  })

  const formatDateRange = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-500 mt-1">View and manage your upcoming classes</p>
      </div>

      {/* Week Navigation */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setWeekOffset(prev => prev - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Week
            </Button>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{formatDateRange()}</p>
              <p className="text-sm text-gray-500">
                {weekOffset === 0 ? "This week" : weekOffset > 0 ? `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setWeekOffset(prev => prev + 1)}>
              Next Week
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {weekOffset !== 0 && (
            <div className="text-center mt-2">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                Go to This Week
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            <p className="text-sm text-gray-500">Classes This Week</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {classes.reduce((sum, c) => sum + c._count.bookings, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Bookings</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">
              {classes.length > 0
                ? Math.round(classes.reduce((sum, c) => sum + (c._count.bookings / c.capacity) * 100, 0) / classes.length)
                : 0}%
            </p>
            <p className="text-sm text-gray-500">Avg. Fill Rate</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {classes.reduce((sum, c) => sum + c.capacity, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calendar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {/* Day Headers */}
              {weekDates.map((date, i) => {
                const isToday = new Date().toDateString() === date.toDateString()
                return (
                  <div key={i} className={`text-center p-3 rounded-xl ${isToday ? 'bg-violet-100' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium ${isToday ? 'text-violet-600' : 'text-gray-500'}`}>
                      {dayNames[i]}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-violet-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                )
              })}

              {/* Classes for each day */}
              {weekDates.map((_, dayIndex) => (
                <div key={dayIndex} className="space-y-2 min-h-[200px]">
                  {classesByDay[dayIndex].length > 0 ? (
                    classesByDay[dayIndex].map((cls) => (
                      <div key={cls.id} className="p-3 bg-violet-50 rounded-lg border-l-4 border-l-violet-500">
                        <p className="font-medium text-sm text-gray-900">{cls.classType.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cls.location.name}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className={`text-xs font-medium ${cls._count.bookings >= cls.capacity ? 'text-emerald-600' : 'text-gray-600'}`}>
                            {cls._count.bookings}/{cls.capacity}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-gray-400">No classes</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
