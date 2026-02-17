"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, MapPin, Filter, X, Users, RefreshCw, Ban, CheckSquare, Square, Trash2, UserCog, Loader2, List, Search, MoreHorizontal, Eye, Pencil, XCircle } from "lucide-react"

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
  recurringGroupId?: string | null
  classType: ClassType
  teacher: Teacher
  location: Location
  _count: { bookings: number }
}

interface BlockedTime {
  id: string
  startTime: string
  endTime: string
  reason: string | null
  teacherId: string
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
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
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([])
  
  // Filters
  const [filterLocation, setFilterLocation] = useState<string>("all")
  const [filterTeacher, setFilterTeacher] = useState<string>(initialTeacher || "all")
  const [filterClassType, setFilterClassType] = useState<string>("all")
  const [showBlockedTimes, setShowBlockedTimes] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [searchQuery, setSearchQuery] = useState("")
  const [timeScope, setTimeScope] = useState<"upcoming" | "past">("upcoming")
  
  // Multi-select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [reassignTeacherId, setReassignTeacherId] = useState<string>("")

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(max-width: 767px)").matches) {
      setViewMode("list")
    }
  }, [])

  const weekDates = getWeekDates(weekOffset)
  
  // Toggle selection for a class
  const toggleSelectClass = (classId: string, e: React.MouseEvent) => {
    if (!selectMode) return
    e.preventDefault()
    e.stopPropagation()
    
    const newSelected = new Set(selectedClasses)
    if (newSelected.has(classId)) {
      newSelected.delete(classId)
    } else {
      newSelected.add(classId)
    }
    setSelectedClasses(newSelected)
  }
  
  // Select all visible classes
  const selectAllClasses = () => {
    const visibleClasses = viewMode === "list" ? listFilteredClasses : filteredClasses
    setSelectedClasses(new Set(visibleClasses.map(c => c.id)))
  }
  
  // Clear selection
  const clearSelection = () => {
    setSelectedClasses(new Set())
    setSelectMode(false)
  }
  
  // Bulk delete selected classes
  const handleBulkDelete = async () => {
    if (selectedClasses.size === 0) return
    
    const hasBookings = filteredClasses
      .filter(c => selectedClasses.has(c.id))
      .some(c => c._count.bookings > 0)
    
    const confirmMsg = hasBookings
      ? `Some of the ${selectedClasses.size} selected classes have bookings. Are you sure you want to delete them? Clients will need to be notified.`
      : `Are you sure you want to delete ${selectedClasses.size} classes? This cannot be undone.`
    
    if (!confirm(confirmMsg)) return
    
    setBulkActionLoading(true)
    try {
      const res = await fetch('/api/studio/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classIds: Array.from(selectedClasses) })
      })
      
      if (res.ok) {
        const data = await res.json()
        alert(`Successfully deleted ${data.deleted} classes`)
        setClasses(classes.filter(c => !selectedClasses.has(c.id)))
        clearSelection()
      } else {
        const data = await res.json()
        alert(data.message || data.error || 'Failed to delete classes')
      }
    } catch (error) {
      console.error('Failed to delete classes:', error)
      alert('Failed to delete classes')
    } finally {
      setBulkActionLoading(false)
    }
  }
  
  // Bulk reassign selected classes
  const handleBulkReassign = async () => {
    if (selectedClasses.size === 0 || !reassignTeacherId) return
    
    setBulkActionLoading(true)
    try {
      const res = await fetch('/api/studio/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          classIds: Array.from(selectedClasses),
          teacherId: reassignTeacherId
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        alert(`Successfully reassigned ${data.updated} classes`)
        // Update local state
        const newTeacher = teachers.find(t => t.id === reassignTeacherId)
        if (newTeacher) {
          setClasses(classes.map(c => 
            selectedClasses.has(c.id) 
              ? { ...c, teacher: newTeacher }
              : c
          ))
        }
        clearSelection()
        setShowReassignModal(false)
        setReassignTeacherId("")
      } else {
        const data = await res.json()
        alert(data.message || data.error || 'Failed to reassign classes')
      }
    } catch (error) {
      console.error('Failed to reassign classes:', error)
      alert('Failed to reassign classes')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Create location color map
  const locationColorMap: Record<string, string> = {}
  locations.forEach((loc, index) => {
    locationColorMap[loc.id] = locationColors[index % Object.keys(locationColors).length]
  })

  // Fetch schedule classes only (for refresh)
  const fetchSchedule = async () => {
    const startDate = weekDates[0].toISOString()
    const endDate = new Date(weekDates[6])
    endDate.setHours(23, 59, 59, 999)
    
    const classesRes = await fetch(`/api/studio/schedule?start=${startDate}&end=${endDate.toISOString()}`)
    if (classesRes.ok) {
      const classesData = await classesRes.json()
      setClasses(classesData)
    }

    const blockedRes = await fetch(`/api/studio/blocked-times?start=${startDate}&end=${endDate.toISOString()}`)
    if (blockedRes.ok) {
      const blockedData = await blockedRes.json()
      setBlockedTimes(blockedData)
    }
  }

  // Fetch all data on initial load and week change
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
        await fetchSchedule()
      } catch (error) {
        console.error("Failed to fetch schedule data:", error)
      }
      setLoading(false)
    }
    fetchData()
  }, [weekOffset])

  // Auto-refresh schedule every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSchedule()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [weekOffset])

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    if (filterLocation !== "all" && cls.locationId !== filterLocation) return false
    if (filterTeacher !== "all" && cls.teacher.id !== filterTeacher) return false
    if (filterClassType !== "all" && cls.classType.id !== filterClassType) return false
    return true
  })

  const listFilteredClasses = useMemo(() => {
    const now = new Date()
    const query = searchQuery.trim().toLowerCase()

    return filteredClasses
      .filter((cls) => {
        const classStart = new Date(cls.startTime)
        if (timeScope === "upcoming" && classStart < now) return false
        if (timeScope === "past" && classStart >= now) return false
        return true
      })
      .filter((cls) => {
        if (!query) return true
        const instructor = `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`.toLowerCase()
        return (
          cls.classType.name.toLowerCase().includes(query) ||
          instructor.includes(query) ||
          cls.location.name.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [filteredClasses, searchQuery, timeScope])

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

  // Filter and group blocked times by day
  const filteredBlockedTimes = blockedTimes.filter(bt => {
    if (filterTeacher !== "all" && bt.teacherId !== filterTeacher) return false
    return true
  })

  const blockedByDay: Record<number, BlockedTime[]> = {}
  for (let i = 0; i < 7; i++) {
    blockedByDay[i] = []
  }
  
  if (showBlockedTimes) {
    filteredBlockedTimes.forEach(bt => {
      const day = new Date(bt.startTime).getDay()
      blockedByDay[day].push(bt)
    })
  }

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

  const handleViewChipSelect = (nextView: "calendar" | "list") => {
    setViewMode(nextView)
  }

  const handleCancelClass = async (classId: string) => {
    const selectedClass = classes.find((cls) => cls.id === classId)
    if (!selectedClass) return

    const hasBookings = selectedClass._count.bookings > 0
    const confirmMessage = hasBookings
      ? `Cancel this class and notify ${selectedClass._count.bookings} booked client${selectedClass._count.bookings > 1 ? "s" : ""}?`
      : "Cancel this class?"

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/studio/schedule/${classId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Failed to cancel class")
        return
      }

      const data = await response.json()
      if (typeof data.notifiedClients === "number") {
        alert(`Class cancelled. ${data.notifiedClients} client(s) notified.`)
      }
      setClasses((prev) => prev.filter((cls) => cls.id !== classId))
    } catch (error) {
      console.error("Failed to cancel class:", error)
      alert("Failed to cancel class")
    }
  }

  // Get selected teacher name for header
  const selectedTeacher = teachers.find(t => t.id === filterTeacher)

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-[92vw] max-w-[400px] shadow-xl">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg text-gray-900 mb-4">
                Reassign {selectedClasses.size} Classes
              </h2>
              <p className="text-gray-500 mb-4">
                Select a new teacher for the selected classes:
              </p>
              <Select value={reassignTeacherId} onValueChange={setReassignTeacherId}>
                <SelectTrigger className="mb-4">
                  <SelectValue placeholder="Select teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowReassignModal(false)
                    setReassignTeacherId("")
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={handleBulkReassign}
                  disabled={!reassignTeacherId || bulkActionLoading}
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reassign"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewChipSelect("calendar")}
                className={viewMode === "calendar" ? "bg-violet-100 text-violet-700" : "text-gray-600"}
              >
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewChipSelect("list")}
                className={viewMode === "list" ? "bg-violet-100 text-violet-700" : "text-gray-600"}
              >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
          <Button 
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              if (selectMode) {
                clearSelection()
              } else {
                setSelectMode(true)
              }
            }}
            className={`w-full sm:w-auto ${selectMode ? "bg-violet-600 hover:bg-violet-700" : ""}`}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {selectMode ? "Cancel Select" : "Select Multiple"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fetchSchedule()}
            className="w-full text-gray-600 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/studio/schedule/new" className="w-full sm:w-auto">
            <Button className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Bulk Actions Bar */}
      {selectMode && selectedClasses.size > 0 && (
        <Card className="border-0 shadow-sm mb-4 bg-violet-50 border-l-4 border-l-violet-500">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-violet-600" />
                <span className="font-medium text-violet-900">
                  {selectedClasses.size} class{selectedClasses.size > 1 ? 'es' : ''} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAllClasses}
                  className="w-full sm:w-auto"
                >
                  Select All ({viewMode === "list" ? listFilteredClasses.length : filteredClasses.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-violet-600 border-violet-200 hover:bg-violet-100 sm:w-auto"
                  onClick={() => setShowReassignModal(true)}
                  disabled={bulkActionLoading}
                >
                  <UserCog className="h-4 w-4 mr-1" />
                  Reassign
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 sm:w-auto"
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-44">
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
              <SelectTrigger className="w-full sm:w-40">
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

            {/* Blocked Times Toggle */}
            <Button 
              variant={showBlockedTimes ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowBlockedTimes(!showBlockedTimes)}
              className={showBlockedTimes ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-200 hover:bg-red-50"}
            >
              <Ban className="h-4 w-4 mr-2" />
              Blocked Times
              {blockedTimes.length > 0 && (
                <Badge className="ml-2 bg-white text-red-600 h-5 min-w-5 px-1">
                  {blockedTimes.length}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}

            {/* Location Legend */}
            {hasMultipleLocations && filterLocation === "all" && (
              <div className="flex w-full items-center gap-2 pt-1 sm:ml-auto sm:w-auto sm:pt-0">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="w-full justify-start sm:w-auto"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>
            <div className="text-center sm:flex-1">
              <p className="font-semibold text-gray-900">{formatDateRange()}</p>
              <p className="text-sm text-gray-500">
                {weekOffset === 0 ? "This Week" : weekOffset > 0 ? `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {weekOffset !== 0 && (
                <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} className="w-full sm:w-auto">
                  Today
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="w-full justify-end sm:w-auto"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "list" && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search class, instructor, or location"
                  className="pl-9"
                />
              </div>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 self-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeScope("upcoming")}
                  className={`flex-1 ${timeScope === "upcoming" ? "bg-violet-100 text-violet-700" : "text-gray-600"}`}
                >
                  Upcoming
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeScope("past")}
                  className={`flex-1 ${timeScope === "past" ? "bg-violet-100 text-violet-700" : "text-gray-600"}`}
                >
                  Past
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              {viewMode === "calendar" ? (
                <div className="grid grid-cols-7 gap-2 sm:gap-4 overflow-x-auto pb-1">
                  {/* Day Headers */}
                  {weekDates.map((date, i) => {
                    const isToday = new Date().toDateString() === date.toDateString()
                    const dayClasses = classesByDay[i] || []
                    const dayBlocked = blockedByDay[i] || []
                    const hasBlockedTime = showBlockedTimes && dayBlocked.length > 0
                    return (
                      <div 
                        key={i}
                        className={`text-center p-2 sm:p-3 rounded-xl min-w-[104px] sm:min-w-[120px] ${
                          isToday ? 'bg-violet-100' : hasBlockedTime ? 'bg-red-50' : 'bg-gray-50'
                        }`}
                      >
                        <p className={`text-xs font-medium ${
                          isToday ? 'text-violet-600' : hasBlockedTime ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {dayNames[i]}
                        </p>
                        <p className={`text-xl font-bold ${
                          isToday ? 'text-violet-600' : hasBlockedTime ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {dayClasses.length} class{dayClasses.length !== 1 ? 'es' : ''}
                        </p>
                        {hasBlockedTime && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 mt-1">
                            <Ban className="h-2.5 w-2.5 mr-1" />
                            {dayBlocked.length} blocked
                          </Badge>
                        )}
                      </div>
                    )
                  })}

                  {/* Classes and Blocked Times for each day */}
                  {weekDates.map((_, dayIndex) => (
                    <div key={dayIndex} className="space-y-2 min-h-[260px] sm:min-h-[400px] min-w-[104px] sm:min-w-[120px]">
                      {/* Blocked Times */}
                      {showBlockedTimes && (blockedByDay[dayIndex] || []).map((bt) => (
                        <div
                          key={bt.id}
                          className="p-3 bg-red-50 rounded-lg border-l-4 border-l-red-500 shadow-sm"
                        >
                          <div className="flex items-center gap-1 text-red-600">
                            <Ban className="h-3 w-3" />
                            <span className="text-xs font-medium">Blocked</span>
                          </div>
                          <p className="text-xs text-red-700 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(bt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - 
                            {new Date(bt.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                          <p className="text-xs text-red-500 mt-1">
                            {bt.teacher.user.firstName} {bt.teacher.user.lastName[0]}.
                          </p>
                          {bt.reason && (
                            <p className="text-xs text-red-400 mt-1 truncate">{bt.reason}</p>
                          )}
                        </div>
                      ))}
                      
                      {/* Classes */}
                      {(classesByDay[dayIndex] || []).length > 0 ? (
                        (classesByDay[dayIndex] || []).map((cls) => {
                          const isSelected = selectedClasses.has(cls.id)
                          
                          if (selectMode) {
                            return (
                              <div
                                key={cls.id}
                                onClick={(e) => toggleSelectClass(cls.id, e)}
                                className={`p-3 rounded-lg border-l-4 shadow-sm transition-all cursor-pointer ${getClassColor(cls.classType.name)} ${
                                  isSelected 
                                    ? 'bg-violet-100 ring-2 ring-violet-500' 
                                    : 'bg-white hover:bg-violet-50'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <p className="font-medium text-sm text-gray-900 truncate flex-1">{cls.classType.name}</p>
                                  {isSelected ? (
                                    <CheckSquare className="h-4 w-4 text-violet-600 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-gray-300 shrink-0" />
                                  )}
                                </div>
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
                            )
                          }
                          
                          return (
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
                          )
                        })
                      ) : (blockedByDay[dayIndex] || []).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center pt-4">No classes</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 md:hidden">
                    {listFilteredClasses.length === 0 ? (
                      <div className="rounded-lg border border-gray-100 bg-white px-4 py-8 text-center">
                        <p className="text-base font-medium text-gray-700">No classes match your filters.</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting search, time scope, or filter selections.</p>
                      </div>
                    ) : (
                      listFilteredClasses.map((cls) => {
                        const isSelected = selectedClasses.has(cls.id)
                        const cardClass = `rounded-lg border border-gray-100 bg-white p-4 ${
                          selectMode ? "cursor-pointer" : ""
                        } ${isSelected ? "ring-2 ring-violet-500 bg-violet-50" : ""}`
                        const content = (
                          <div className={cardClass}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{cls.classType.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(cls.startTime).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                                </p>
                              </div>
                              <Badge className={cls._count.bookings >= cls.capacity ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"}>
                                {cls._count.bookings}/{cls.capacity}
                              </Badge>
                            </div>
                            <div className="mt-3 space-y-1 text-sm text-gray-600">
                              <p>
                                {new Date(cls.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })} -{" "}
                                {new Date(cls.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                              </p>
                              <p>{cls.teacher.user.firstName} {cls.teacher.user.lastName}</p>
                              <p>{cls.location.name}</p>
                            </div>
                          </div>
                        )

                        if (selectMode) {
                          return (
                            <div key={cls.id} onClick={(e) => toggleSelectClass(cls.id, e)}>
                              {content}
                            </div>
                          )
                        }

                        return (
                          <Link key={cls.id} href={`/studio/schedule/${cls.id}`}>
                            {content}
                          </Link>
                        )
                      })
                    )}
                  </div>
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-100">
                    <div className="min-w-[820px]">
                      <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium bg-white sticky top-0 z-10 border-b">
                        <div className="col-span-3">Date / Time</div>
                        <div className="col-span-3">Class</div>
                        <div className="col-span-2">Instructor</div>
                        <div className="col-span-2">Location</div>
                        <div className="col-span-1">Signups</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>

                      {listFilteredClasses.length === 0 ? (
                        <div className="px-4 py-12 text-center bg-white">
                          <p className="text-base font-medium text-gray-700">No classes match your filters.</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting search, time scope, or filter selections.</p>
                        </div>
                      ) : (
                        listFilteredClasses.map((cls) => {
                          const isSelected = selectedClasses.has(cls.id)
                          const rowClass = `grid grid-cols-12 gap-3 px-4 py-3 items-center border-b border-gray-100 bg-white hover:bg-violet-50 transition-colors`

                          if (selectMode) {
                            return (
                              <div
                                key={cls.id}
                                onClick={(e) => toggleSelectClass(cls.id, e)}
                                className={`${rowClass} cursor-pointer ${isSelected ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
                              >
                                <div className="col-span-3 text-sm text-gray-700">
                                  <p className="font-medium">{new Date(cls.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                  <p className="text-xs text-gray-500">{new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(cls.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                </div>
                                <div className="col-span-3">
                                  <p className="font-medium text-gray-900">{cls.classType.name}</p>
                                </div>
                                <div className="col-span-2 text-sm text-gray-700">{cls.teacher.user.firstName} {cls.teacher.user.lastName}</div>
                                <div className="col-span-2 text-sm text-gray-700">{cls.location.name}</div>
                                <div className="col-span-1 flex items-center gap-2">
                                  <span className={`text-sm font-medium ${cls._count.bookings >= cls.capacity ? 'text-red-600' : 'text-teal-600'}`}>{cls._count.bookings}/{cls.capacity}</span>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  {isSelected ? <CheckSquare className="h-4 w-4 text-violet-600" /> : <Square className="h-4 w-4 text-gray-300" />}
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={cls.id} className={rowClass}>
                              <Link href={`/studio/schedule/${cls.id}`} className="col-span-11 grid grid-cols-11 gap-3 items-center">
                                <div className="col-span-3 text-sm text-gray-700">
                                  <p className="font-medium">{new Date(cls.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                  <p className="text-xs text-gray-500">{new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(cls.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                </div>
                                <div className="col-span-3">
                                  <p className="font-medium text-gray-900">{cls.classType.name}</p>
                                </div>
                                <div className="col-span-2 text-sm text-gray-700">{cls.teacher.user.firstName} {cls.teacher.user.lastName}</div>
                                <div className="col-span-2 text-sm text-gray-700">{cls.location.name}</div>
                                <div className={`col-span-1 text-sm font-medium ${cls._count.bookings >= cls.capacity ? 'text-red-600' : 'text-teal-600'}`}>{cls._count.bookings}/{cls.capacity}</div>
                              </Link>
                              <div className="col-span-1 flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/studio/schedule/${cls.id}`} className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        View
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/studio/schedule/${cls.id}`} className="flex items-center gap-2">
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => handleCancelClass(cls.id)}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                    <span className="text-gray-500">
                      Showing <strong className="text-gray-900">{viewMode === "list" ? listFilteredClasses.length : filteredClasses.length}</strong> classes
                      {hasActiveFilters && ` (filtered from ${classes.length})`}
                    </span>
                    <span className="text-gray-500">
                      Total bookings: <strong className="text-gray-900">{(viewMode === "list" ? listFilteredClasses : filteredClasses).reduce((sum, c) => sum + c._count.bookings, 0)}</strong>
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
