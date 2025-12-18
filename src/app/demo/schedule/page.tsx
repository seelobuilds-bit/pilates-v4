// Demo Schedule Page - Mirrors /studio/schedule/page.tsx
// Keep in sync with the real schedule page

"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus } from "lucide-react"
import { demoScheduleClasses } from "../_data/demo-data"

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

const classColors: Record<string, string> = {
  "Reformer": "border-l-violet-500",
  "Mat": "border-l-teal-500",
  "Tower": "border-l-pink-500",
  "Beginner": "border-l-blue-500",
  "Advanced": "border-l-orange-500",
  "Power": "border-l-red-500",
  "Prenatal": "border-l-pink-500",
  "default": "border-l-gray-400"
}

function getClassColor(className: string): string {
  for (const [key, color] of Object.entries(classColors)) {
    if (className.toLowerCase().includes(key.toLowerCase())) {
      return color
    }
  }
  return classColors.default
}

function getWeekDates(offset: number = 0) {
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

export default function DemoSchedulePage() {
  const weekDates = getWeekDates(0)

  // Group classes by day
  const classesByDay: Record<number, typeof demoScheduleClasses> = {}
  for (let i = 0; i < 7; i++) {
    classesByDay[i] = []
  }
  
  demoScheduleClasses.forEach(cls => {
    const day = new Date(cls.startTime).getDay()
    classesByDay[day].push(cls)
  })

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    return `${weekDates[0].toLocaleDateString('en-US', options)} - ${weekDates[6].toLocaleDateString('en-US', options)}`
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 mt-1">Manage your class schedule</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Week Navigation */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{formatDateRange()}</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly View */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Weekly View</h3>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {/* Day Headers */}
            {weekDates.map((date, i) => {
              const isToday = new Date().toDateString() === date.toDateString()
              const isSaturday = i === 6
              return (
                <div 
                  key={i}
                  className={`text-center p-3 rounded-xl ${
                    isSaturday ? 'bg-emerald-50' : 'bg-gray-50'
                  }`}
                >
                  <p className={`text-xs font-medium ${
                    isSaturday ? 'text-emerald-600' : 'text-gray-500'
                  }`}>
                    {dayNames[i]}
                  </p>
                  <p className={`text-xl font-bold ${
                    isSaturday ? 'text-emerald-600' : isToday ? 'text-violet-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </p>
                </div>
              )
            })}

            {/* Classes for each day */}
            {weekDates.map((_, dayIndex) => (
              <div key={dayIndex} className="space-y-2 min-h-[400px]">
                {classesByDay[dayIndex].length > 0 ? (
                  classesByDay[dayIndex].map((cls) => (
                    <Link href={`/demo/schedule/${cls.id}`} key={cls.id}>
                      <div
                        className={`p-3 bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${getClassColor(cls.classType.name)}`}
                      >
                        <p className="font-medium text-sm text-gray-900 truncate">{cls.classType.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {cls.teacher.user.firstName} {cls.teacher.user.lastName[0]}.
                        </p>
                        <p className={`text-xs mt-1 ${
                          cls._count.bookings >= cls.capacity ? 'text-red-500' : 'text-teal-500'
                        }`}>
                          {cls._count.bookings}/{cls.capacity}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center pt-4">No classes</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
