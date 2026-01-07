"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Send
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

interface BlockedTime {
  id: string
  startTime: string
  endTime: string
  reason: string | null
}

export default function TeacherSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([])
  const [loading, setLoading] = useState(true)
  
  // Block time modal state
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockMode, setBlockMode] = useState<"single" | "range">("single")
  const [blockDate, setBlockDate] = useState("")
  const [blockEndDate, setBlockEndDate] = useState("")
  const [blockStartTime, setBlockStartTime] = useState("09:00")
  const [blockEndTime, setBlockEndTime] = useState("17:00")
  const [blockReason, setBlockReason] = useState("")
  const [blockingTime, setBlockingTime] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true)
      try {
        // Fetch classes
        const res = await fetch(`/api/teacher/schedule?weekOffset=${weekOffset}`)
        if (res.ok) {
          const data = await res.json()
          setClasses(data)
        }

        // Fetch blocked times
        const weekDates = getWeekDates(weekOffset)
        const start = weekDates[0].toISOString()
        const end = new Date(weekDates[6])
        end.setHours(23, 59, 59, 999)
        
        const blockedRes = await fetch(`/api/teacher/blocked-times?start=${start}&end=${end.toISOString()}`)
        if (blockedRes.ok) {
          const blockedData = await blockedRes.json()
          setBlockedTimes(blockedData)
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

  // Group blocked times by day
  const blockedByDay: Record<number, BlockedTime[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  blockedTimes.forEach(bt => {
    const day = new Date(bt.startTime).getDay()
    blockedByDay[day].push(bt)
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

  const handleBlockTime = async () => {
    if (!blockDate || !blockStartTime || !blockEndTime) return
    if (blockMode === "range" && !blockEndDate) return
    
    setBlockingTime(true)
    setBlockError(null)
    
    try {
      let requestBody: Record<string, unknown>
      
      if (blockMode === "range") {
        // Date range mode
        requestBody = {
          startDate: blockDate,
          endDate: blockEndDate,
          dailyStartTime: blockStartTime,
          dailyEndTime: blockEndTime,
          reason: blockReason || null
        }
      } else {
        // Single day mode
        const startDateTime = new Date(`${blockDate}T${blockStartTime}:00`)
        const endDateTime = new Date(`${blockDate}T${blockEndTime}:00`)
        requestBody = {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          reason: blockReason || null
        }
      }
      
      const res = await fetch('/api/teacher/blocked-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (res.ok) {
        const data = await res.json()
        // Refresh blocked times from server
        const weekDates = getWeekDates(weekOffset)
        const start = weekDates[0].toISOString()
        const end = new Date(weekDates[6])
        end.setHours(23, 59, 59, 999)
        
        const blockedRes = await fetch(`/api/teacher/blocked-times?start=${start}&end=${end.toISOString()}`)
        if (blockedRes.ok) {
          const blockedData = await blockedRes.json()
          setBlockedTimes(blockedData)
        }
        
        setShowBlockModal(false)
        setBlockDate("")
        setBlockEndDate("")
        setBlockStartTime("09:00")
        setBlockEndTime("17:00")
        setBlockReason("")
        setBlockMode("single")
      } else {
        const data = await res.json()
        setBlockError(data.error || "Failed to block time")
      }
    } catch (error) {
      console.error("Failed to block time:", error)
      setBlockError("Failed to block time")
    } finally {
      setBlockingTime(false)
    }
  }

  const handleDeleteBlockedTime = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/teacher/blocked-times?id=${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setBlockedTimes(prev => prev.filter(bt => bt.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete blocked time:", error)
    } finally {
      setDeletingId(null)
    }
  }

  // Set default block date to tomorrow
  const openBlockModal = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setBlockDate(tomorrow.toISOString().split('T')[0])
    setBlockEndDate("")
    setBlockMode("single")
    setBlockError(null)
    setShowBlockModal(true)
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-500 mt-1">View and manage your upcoming classes</p>
        </div>
        <Button 
          onClick={openBlockModal}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <Ban className="h-4 w-4 mr-2" />
          Block Time Off
        </Button>
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
            <p className="text-2xl font-bold text-red-600">
              {blockedTimes.length}
            </p>
            <p className="text-sm text-gray-500">Blocked Times</p>
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
                const hasBlockedTime = blockedByDay[i].length > 0
                return (
                  <div key={i} className={`text-center p-3 rounded-xl ${isToday ? 'bg-violet-100' : hasBlockedTime ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium ${isToday ? 'text-violet-600' : hasBlockedTime ? 'text-red-600' : 'text-gray-500'}`}>
                      {dayNames[i]}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-violet-600' : hasBlockedTime ? 'text-red-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </p>
                    {hasBlockedTime && (
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 mt-1">
                        <Ban className="h-2.5 w-2.5 mr-1" />
                        Blocked
                      </Badge>
                    )}
                  </div>
                )
              })}

              {/* Classes and Blocked Times for each day */}
              {weekDates.map((_, dayIndex) => (
                <div key={dayIndex} className="space-y-2 min-h-[200px]">
                  {/* Blocked Times */}
                  {blockedByDay[dayIndex].map((bt) => (
                    <div key={bt.id} className="p-3 bg-red-50 rounded-lg border-l-4 border-l-red-500 group relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-red-600">
                          <Ban className="h-3 w-3" />
                          <span className="text-xs font-medium">Blocked</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteBlockedTime(bt.id)}
                          disabled={deletingId === bt.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                        >
                          {deletingId === bt.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-red-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-red-700 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(bt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - 
                        {new Date(bt.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      {bt.reason && (
                        <p className="text-xs text-red-500 mt-1 truncate">{bt.reason}</p>
                      )}
                    </div>
                  ))}
                  
                  {/* Classes */}
                  {classesByDay[dayIndex].length > 0 ? (
                    classesByDay[dayIndex].map((cls) => (
                      <Link key={cls.id} href={`/teacher/schedule/${cls.id}`}>
                        <div className="p-3 bg-violet-50 rounded-lg border-l-4 border-l-violet-500 hover:bg-violet-100 hover:shadow-md transition-all cursor-pointer">
                          <p className="font-medium text-sm text-gray-900">{cls.classType.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(cls.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cls.location.name}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span className={`text-xs font-medium ${cls._count.bookings >= cls.capacity ? 'text-emerald-600' : 'text-gray-600'}`}>
                                {cls._count.bookings}/{cls.capacity}
                              </span>
                            </div>
                            {cls._count.bookings > 0 && (
                              <Send className="h-3 w-3 text-violet-400" />
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : blockedByDay[dayIndex].length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-gray-400">No classes</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Time Modal */}
      {showBlockModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowBlockModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Ban className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Block Time Off</h3>
                      <p className="text-sm text-gray-500">Mark yourself as unavailable</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowBlockModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {blockError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{blockError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Mode Toggle */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setBlockMode("single")}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        blockMode === "single" 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Single Day
                    </button>
                    <button
                      onClick={() => setBlockMode("range")}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        blockMode === "range" 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Date Range
                    </button>
                  </div>

                  {blockMode === "single" ? (
                    <div>
                      <Label>Date</Label>
                      <div className="relative mt-1.5">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="date"
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <div className="relative mt-1.5">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="date"
                            value={blockDate}
                            onChange={(e) => {
                              setBlockDate(e.target.value)
                              // Auto-set end date if not set or earlier
                              if (!blockEndDate || e.target.value > blockEndDate) {
                                setBlockEndDate(e.target.value)
                              }
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <div className="relative mt-1.5">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="date"
                            value={blockEndDate}
                            onChange={(e) => setBlockEndDate(e.target.value)}
                            min={blockDate || new Date().toISOString().split('T')[0]}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{blockMode === "range" ? "Daily Start Time" : "Start Time"}</Label>
                      <div className="relative mt-1.5">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="time"
                          value={blockStartTime}
                          onChange={(e) => setBlockStartTime(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{blockMode === "range" ? "Daily End Time" : "End Time"}</Label>
                      <div className="relative mt-1.5">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="time"
                          value={blockEndTime}
                          onChange={(e) => setBlockEndTime(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {blockMode === "range" && blockDate && blockEndDate && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>
                          {Math.ceil((new Date(blockEndDate).getTime() - new Date(blockDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                        </strong> will be blocked from {blockStartTime} to {blockEndTime} each day
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Reason (Optional)</Label>
                    <Textarea
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="e.g., Personal appointment, Vacation, Training..."
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowBlockModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBlockTime}
                    disabled={blockingTime || !blockDate || !blockStartTime || !blockEndTime || (blockMode === "range" && !blockEndDate)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {blockingTime ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Blocking...
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        {blockMode === "range" ? "Block Days" : "Block Time"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}



























