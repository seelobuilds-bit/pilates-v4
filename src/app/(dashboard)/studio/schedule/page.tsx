"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, MapPin, Filter, X, Users, RefreshCw } from "lucide-react"

interface Location {
  id: string
  name: string
  isActive: boolean
}

interface Teacher {
  id: string
  user: {
    firstName: string
    lastName: string
  }
}

interface ClassType {
  id: string
  name: string
}

interface ClassSession {
  id: string
  startTime: string
  endTime: string
  capacity: number
  locationId: string
  classType: ClassType
  teacher: Teacher
  location: Location
  _count: { bookings: number }
}

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

const classColors: Record<string, string> = {
  "Reformer": "border-l-violet-500",
  "Mat": "border-l-teal-500",
  "Tower": "border-l-pink-500",
  "Beginner": "border-l-blue-500",
  "Advanced": "border-l-orange-500",
  "Power": "border-l-red-500",
  "default": "border-l-gray-400"
}

const locationColors: Record<number, string> = {
  0: "bg-violet-100 text-violet-700",
  1: "bg-blue-100 text-blue-700",
  2: "bg-emerald-100 text-emerald-700",
  3: "bg-amber-100 text-amber-700",
  4: "bg-pink-100 text-pink-700",
  5: "bg-teal-100 text-teal-700"
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

function getClassColor(className: string): string {
  for (const [key, color] of Object.entries(classColors)) {
    if (className.toLowerCase().includes(key.toLowerCase())) {
      return color
    }
  }
  return classColors.default
}

export default function SchedulePage() {
  const searchParams = useSearchParams()
  const initialTeacher = searchParams.get("teacher") || ""
  
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<Location[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [classes, setClasses] = useState<ClassSession[]>([])
  
  // Filters
  const [filterLocation, setFilterLocation] = useState<string>("all")
  const [filterTeacher, setFilterTeacher] = useState<string>(initialTeacher || "all")
  const [filterClassType, setFilterClassType] = useState<string>("all")

  const weekDates = getWeekDates(weekOffset)

  // Create location color map
  const locationColorMap: Record<string, string> = {}
  locations.forEach((loc, index) => {
    locationColorMap[loc.id] = locationColors[index % Object.keys(locationColors).length]
  })

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch locations
        const locRes = await fetch('/api/studio/locations')
        if (locRes.ok) {
          const locData = await locRes.json()
          setLocations(locData)
        }

        // Fetch teachers
        const teacherRes = await fetch('/api/studio/teachers')
        if (teacherRes.ok) {
          const teacherData = await teacherRes.json()
          setTeachers(teacherData)
        }

        // Fetch class types
        const classTypeRes = await fetch('/api/studio/class-types')
        if (classTypeRes.ok) {
          const classTypeData = await classTypeRes.json()
          setClassTypes(classTypeData)
        }

        // Fetch classes for the week
        const startDate = weekDates[0].toISOString()
        const endDate = new Date(weekDates[6])
        endDate.setHours(23, 59, 59, 999)
        
        const classesRes = await fetch(`/api/studio/schedule?start=${startDate}&end=${endDate.toISOString()}`)
        if (classesRes.ok) {
          const classesData = await classesRes.json()
          setClasses(classesData)
        }
      } catch (error) {
        console.error("Failed to fetch schedule data:", error)
      }
      setLoading(false)
    }
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    if (filterLocation !== "all" && cls.locationId !== filterLocation) return false
    if (filterTeacher !== "all" && cls.teacher.id !== filterTeacher) return false
    if (filterClassType !== "all" && cls.classType.id !== filterClassType) return false
    return true
  })

  // Group classes by day
  const classesByDay: Record<number, ClassSession[]> = {}
  for (let i = 0; i < 7; i++) {
    classesByDay[i] = []
  }
  
  filteredClasses.forEach(cls => {
    const day = new Date(cls.startTime).getDay()
    classesByDay[day].push(cls)
  })

  // Sort classes by time within each day
  Object.keys(classesByDay).forEach(day => {
    classesByDay[parseInt(day)].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
  })

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    return `${weekDates[0].toLocaleDateString('en-US', options)} - ${weekDates[6].toLocaleDateString('en-US', options)}`
  }

  const hasMultipleLocations = locations.length > 1
  const hasActiveFilters = filterLocation !== "all" || filterTeacher !== "all" || filterClassType !== "all"

  const clearFilters = () => {
    setFilterLocation("all")
    setFilterTeacher("all")
    setFilterClassType("all")
  }

  // Get selected teacher name for header
  const selectedTeacher = teachers.find(t => t.id === filterTeacher)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedTeacher 
              ? `${selectedTeacher.user.firstName}'s Schedule` 
              : 'Schedule'}
          </h1>
          <p className="text-gray-500 mt-1">
            {selectedTeacher 
              ? `Viewing classes taught by ${selectedTeacher.user.firstName} ${selectedTeacher.user.lastName}`
              : 'Manage your class schedule'}
          </p>
        </div>
        <Link href="/studio/schedule/new">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>
            
            {/* Location Filter */}
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-40">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Teacher Filter */}
            <Select value={filterTeacher} onValueChange={setFilterTeacher}>
              <SelectTrigger className="w-44">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class Type Filter */}
            <Select value={filterClassType} onValueChange={setFilterClassType}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classTypes.map(ct => (
                  <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}

            {/* Location Legend */}
            {hasMultipleLocations && filterLocation === "all" && (
              <div className="flex items-center gap-2 ml-auto">
                {locations.map((location) => (
                  <Badge
                    key={location.id}
                    variant="secondary"
                    className={`${locationColorMap[location.id]} border-0 cursor-pointer hover:opacity-80`}
                    onClick={() => setFilterLocation(location.id)}
                  >
                    {location.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setWeekOffset(prev => prev - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{formatDateRange()}</p>
              <p className="text-sm text-gray-500">
                {weekOffset === 0 ? "This Week" : weekOffset > 0 ? `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {weekOffset !== 0 && (
                <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                  Today
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setWeekOffset(prev => prev + 1)}
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly View */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
              <span className="ml-3 text-gray-500">Loading schedule...</span>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-4">
                {/* Day Headers */}
                {weekDates.map((date, i) => {
                  const isToday = new Date().toDateString() === date.toDateString()
                  const dayClasses = classesByDay[i] || []
                  return (
                    <div 
                      key={i}
                      className={`text-center p-3 rounded-xl ${
                        isToday ? 'bg-violet-100' : 'bg-gray-50'
                      }`}
                    >
                      <p className={`text-xs font-medium ${
                        isToday ? 'text-violet-600' : 'text-gray-500'
                      }`}>
                        {dayNames[i]}
                      </p>
                      <p className={`text-xl font-bold ${
                        isToday ? 'text-violet-600' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dayClasses.length} class{dayClasses.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  )
                })}

                {/* Classes for each day */}
                {weekDates.map((_, dayIndex) => (
                  <div key={dayIndex} className="space-y-2 min-h-[400px]">
                    {(classesByDay[dayIndex] || []).length > 0 ? (
                      (classesByDay[dayIndex] || []).map((cls) => (
                        <Link key={cls.id} href={`/studio/schedule/${cls.id}`}>
                          <div
                            className={`p-3 bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md hover:bg-violet-50 transition-all cursor-pointer ${getClassColor(cls.classType.name)}`}
                          >
                            <p className="font-medium text-sm text-gray-900 truncate">{cls.classType.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {cls.teacher.user.firstName} {cls.teacher.user.lastName[0]}.
                            </p>
                            {hasMultipleLocations && filterLocation === "all" && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs mt-1.5 ${locationColorMap[cls.locationId]} border-0`}
                              >
                                <MapPin className="h-2.5 w-2.5 mr-1" />
                                {cls.location.name}
                              </Badge>
                            )}
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

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500">
                      Showing <strong className="text-gray-900">{filteredClasses.length}</strong> classes
                      {hasActiveFilters && ` (filtered from ${classes.length})`}
                    </span>
                    <span className="text-gray-500">
                      Total bookings: <strong className="text-gray-900">{filteredClasses.reduce((sum, c) => sum + c._count.bookings, 0)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Location Stats */}
      {hasMultipleLocations && filterLocation === "all" && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {locations.map((location) => {
            const locationClasses = filteredClasses.filter(c => c.locationId === location.id)
            const totalBookings = locationClasses.reduce((acc, c) => acc + c._count.bookings, 0)
            return (
              <Card 
                key={location.id} 
                className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                  filterLocation === location.id ? 'ring-2 ring-violet-500' : ''
                }`}
                onClick={() => setFilterLocation(filterLocation === location.id ? "all" : location.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${locationColorMap[location.id]}`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{location.name}</p>
                      <p className="text-sm text-gray-500">
                        {locationClasses.length} classes • {totalBookings} bookings
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
