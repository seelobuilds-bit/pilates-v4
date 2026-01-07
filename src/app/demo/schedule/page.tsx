import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, MapPin, Filter, Users } from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

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

const locationColors: Record<number, string> = {
  0: "bg-violet-100 text-violet-700",
  1: "bg-blue-100 text-blue-700",
  2: "bg-emerald-100 text-emerald-700",
  3: "bg-amber-100 text-amber-700",
  4: "bg-pink-100 text-pink-700",
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

export default async function DemoSchedulePage() {
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  const weekDates = getWeekDates(0)
  const startDate = weekDates[0]
  const endDate = new Date(weekDates[6])
  endDate.setHours(23, 59, 59, 999)

  const [locations, teachers, classTypes, classes] = await Promise.all([
    db.location.findMany({ where: { studioId: studio.id, isActive: true } }),
    db.teacher.findMany({ 
      where: { studioId: studio.id, isActive: true },
      include: { user: { select: { firstName: true, lastName: true } } }
    }),
    db.classType.findMany({ where: { studioId: studio.id } }),
    db.classSession.findMany({
      where: {
        studioId: studio.id,
        startTime: { gte: startDate, lte: endDate }
      },
      include: {
        classType: true,
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        location: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" }
    })
  ])

  // Create location color map
  const locationColorMap: Record<string, string> = {}
  locations.forEach((loc, index) => {
    locationColorMap[loc.id] = locationColors[index % Object.keys(locationColors).length]
  })

  // Group classes by day
  const classesByDay: Record<number, typeof classes> = {}
  for (let i = 0; i < 7; i++) {
    classesByDay[i] = []
  }
  
  classes.forEach(cls => {
    const day = new Date(cls.startTime).getDay()
    classesByDay[day].push(cls)
  })

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    return `${weekDates[0].toLocaleDateString('en-US', options)} - ${weekDates[6].toLocaleDateString('en-US', options)}`
  }

  const hasMultipleLocations = locations.length > 1

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 mt-1">Manage your class schedule</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>
            
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              All Locations
            </Button>

            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              All Teachers
            </Button>

            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              All Classes
            </Button>

            {/* Location Legend */}
            {hasMultipleLocations && (
              <div className="flex items-center gap-2 ml-auto">
                {locations.map((location, index) => (
                  <Badge
                    key={location.id}
                    variant="secondary"
                    className={`${locationColors[index % Object.keys(locationColors).length]} border-0`}
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
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{formatDateRange()}</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
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
                    <Link href={`/demo/schedule/${cls.id}`} key={cls.id}>
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
                        {hasMultipleLocations && (
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
                  Showing <strong className="text-gray-900">{classes.length}</strong> classes
                </span>
                <span className="text-gray-500">
                  Total bookings: <strong className="text-gray-900">{classes.reduce((sum, c) => sum + c._count.bookings, 0)}</strong>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Stats */}
      {hasMultipleLocations && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {locations.map((location, index) => {
            const locationClasses = classes.filter(c => c.locationId === location.id)
            const totalBookings = locationClasses.reduce((acc, c) => acc + c._count.bookings, 0)
            return (
              <Card 
                key={location.id} 
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${locationColors[index % Object.keys(locationColors).length]}`}>
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




