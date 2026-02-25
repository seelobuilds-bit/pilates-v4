"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  DollarSign, 
  Loader2, 
  MapPin, 
  GraduationCap, 
  Check, 
  Save,
  BarChart3,
  Calendar,
  TrendingUp,
  Star,
  Settings
} from "lucide-react"

interface ClassType {
  id: string
  name: string
  description: string | null
  duration: number
  capacity: number
  price: number
  isActive: boolean
}

interface Location {
  id: string
  name: string
  isActive: boolean
}

interface Teacher {
  id: string
  user: { firstName: string; lastName: string }
  specialties: string[]
  isActive: boolean
}

interface ClassTypeStats {
  totalBookings: number
  totalRevenue: number
  avgAttendance: number
  avgRating: number | null
  topTeachers: { name: string; classes: number; rating: number | null }[]
  topLocations: { name: string; bookings: number }[]
  monthlyBookings: { month: string; count: number }[]
  popularTimes: { time: string; count: number }[]
  recentClasses: { date: string; teacher: string; location: string; attendance: number; capacity: number }[]
}

const DEFAULT_REPORT_PERIOD = "30"
const CUSTOM_PERIOD_VALUE = "custom"

const emptyClassTypeStats: ClassTypeStats = {
  totalBookings: 0,
  totalRevenue: 0,
  avgAttendance: 0,
  avgRating: null,
  topTeachers: [],
  topLocations: [],
  monthlyBookings: [],
  popularTimes: [],
  recentClasses: []
}

export default function EditClassTypePage({
  params,
}: {
  params: Promise<{ classTypeId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [classType, setClassType] = useState<ClassType | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [stats, setStats] = useState<ClassTypeStats | null>(null)
  const [reportPeriod, setReportPeriod] = useState(DEFAULT_REPORT_PERIOD)
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    capacity: "",
    price: "",
    isActive: true
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams()
        if (reportPeriod === CUSTOM_PERIOD_VALUE && customStartDate && customEndDate) {
          params.set("startDate", customStartDate)
          params.set("endDate", customEndDate)
        } else {
          params.set("days", reportPeriod === CUSTOM_PERIOD_VALUE ? DEFAULT_REPORT_PERIOD : reportPeriod)
        }

        const [classTypeRes, locationsRes, teachersRes] = await Promise.all([
          fetch(`/api/demo/class-types/${resolvedParams.classTypeId}?${params.toString()}`),
          fetch("/api/demo/locations"),
          fetch("/api/demo/teachers")
        ])
        
        if (!classTypeRes.ok) {
          setError("We couldn't load this class right now.")
          return
        }

        const data = await classTypeRes.json()
        setClassType(data)
        setFormData({
          name: data.name,
          description: data.description || "",
          duration: data.duration.toString(),
          capacity: data.capacity.toString(),
          price: data.price.toString(),
          isActive: data.isActive
        })
        setSelectedLocations(data.locationIds || [])
        setSelectedTeachers(data.teacherIds || [])
        setStats(data.stats || emptyClassTypeStats)
        
        if (locationsRes.ok) {
          const locData = await locationsRes.json()
          setLocations(locData)
          // If no locations selected yet and we have locations, select all by default
          if (locData.length > 0) {
            setSelectedLocations(prev => prev.length === 0 ? locData.filter((l: Location) => l.isActive).map((l: Location) => l.id) : prev)
          }
        }
        
        if (teachersRes.ok) {
          const teacherData = await teachersRes.json()
          setTeachers(teacherData)
          // If no teachers selected yet and we have teachers, select all by default
          if (teacherData.length > 0) {
            setSelectedTeachers(prev => prev.length === 0 ? teacherData.filter((t: Teacher) => t.isActive).map((t: Teacher) => t.id) : prev)
          }
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        setError("We couldn't load this class right now.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resolvedParams.classTypeId, reportPeriod, customStartDate, customEndDate])

  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    )
  }

  const selectAllLocations = () => {
    setSelectedLocations(locations.filter(l => l.isActive).map(l => l.id))
  }

  const selectAllTeachers = () => {
    setSelectedTeachers(teachers.filter(t => t.isActive).map(t => t.id))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/demo/class-types/${resolvedParams.classTypeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          duration: parseInt(formData.duration),
          capacity: parseInt(formData.capacity),
          price: parseFloat(formData.price),
          isActive: formData.isActive,
          locationIds: selectedLocations.length === locations.filter(l => l.isActive).length ? [] : selectedLocations,
          teacherIds: selectedTeachers.length === teachers.filter(t => t.isActive).length ? [] : selectedTeachers
        })
      })

      if (res.ok) {
        router.push("/demo/classes")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update class type")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update class type")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="max-w-md mx-auto mt-12 text-center">
          <p className="text-gray-900 font-semibold mb-2">Unable to load class</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
            <Link href="/demo/classes">
              <Button variant="outline">Back to Classes</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!classType) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Class type not found</h1>
          <Link href="/demo/classes" className="text-violet-600 hover:text-violet-700 mt-4 inline-block">
            Back to Classes
          </Link>
        </div>
      </div>
    )
  }

  const activeLocations = locations.filter(l => l.isActive)
  const activeTeachers = teachers.filter(t => t.isActive)
  const allLocationsSelected = selectedLocations.length === 0 || selectedLocations.length === activeLocations.length
  const allTeachersSelected = selectedTeachers.length === 0 || selectedTeachers.length === activeTeachers.length
  const safeStats = stats || emptyClassTypeStats
  const hasClassReportData =
    safeStats.totalBookings > 0 ||
    safeStats.totalRevenue > 0 ||
    safeStats.topTeachers.length > 0 ||
    safeStats.monthlyBookings.some((month) => month.count > 0)

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/demo/classes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classType.name}</h1>
            <p className="text-gray-500 mt-1">{formData.duration} min • ${formData.price} • {formData.capacity} spots</p>
          </div>
          <Badge variant={formData.isActive ? "success" : "secondary"} className="text-sm">
            {formData.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      {stats && hasClassReportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{safeStats.totalBookings.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">${safeStats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{safeStats.avgAttendance}</p>
                  <p className="text-sm text-gray-500">Avg. Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{typeof safeStats.avgRating === "number" && safeStats.avgRating > 0 ? safeStats.avgRating.toFixed(1) : "N/A"}</p>
                  <p className="text-sm text-gray-500">Avg. Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-violet-100 bg-violet-50/60 p-1">
          <TabsTrigger value="settings" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="max-w-3xl space-y-6">
            {/* Basic Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Class Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Mat Pilates, Reformer Class"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this class involves..."
                      rows={3}
                    />
                  </div>

                  {/* Duration, Capacity, Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (min)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          className="pl-10"
                          min="15"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          className="pl-10"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="pl-10"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Active</p>
                      <p className="text-sm text-gray-500">Allow this class to be scheduled and booked</p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Location Assignment */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-violet-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Available Locations</h2>
                  </div>
                  {activeLocations.length > 0 && (
                    <Button variant="outline" size="sm" onClick={selectAllLocations} className="w-full sm:w-auto">
                      Select All
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Choose which locations offer this class. Customers booking will only see this class for selected locations.
                </p>

                {activeLocations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No locations found</p>
                    <Link href="/demo/locations/new">
                      <Button variant="outline" size="sm">Add a Location</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {allLocationsSelected && (
                      <div className="mb-4 p-3 bg-violet-50 rounded-lg">
                        <p className="text-sm text-violet-700">
                          <strong>All locations selected</strong> - This class will be available at all your locations
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeLocations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => toggleLocation(location.id)}
                          className={`p-4 border-2 rounded-xl text-left transition-all ${
                            selectedLocations.includes(location.id)
                              ? "border-violet-500 bg-violet-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedLocations.includes(location.id) ? "bg-violet-500" : "bg-gray-100"
                              }`}>
                                <MapPin className={`h-4 w-4 ${
                                  selectedLocations.includes(location.id) ? "text-white" : "text-gray-400"
                                }`} />
                              </div>
                              <span className="font-medium text-gray-900">{location.name}</span>
                            </div>
                            {selectedLocations.includes(location.id) && (
                              <Check className="h-5 w-5 text-violet-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Teacher Assignment */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Assigned Teachers</h2>
                  </div>
                  {activeTeachers.length > 0 && (
                    <Button variant="outline" size="sm" onClick={selectAllTeachers} className="w-full sm:w-auto">
                      Select All
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Choose which teachers can teach this class. Customers booking will only see selected teachers for this class.
                </p>

                {activeTeachers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <GraduationCap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No teachers found</p>
                    <Link href="/demo/teachers/invite">
                      <Button variant="outline" size="sm">Invite a Teacher</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {allTeachersSelected && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>All teachers selected</strong> - Any active teacher can be assigned to this class
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeTeachers.map((teacher) => (
                        <button
                          key={teacher.id}
                          type="button"
                          onClick={() => toggleTeacher(teacher.id)}
                          className={`p-4 border-2 rounded-xl text-left transition-all ${
                            selectedTeachers.includes(teacher.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                selectedTeachers.includes(teacher.id) 
                                  ? "bg-blue-500 text-white" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {teacher.user.firstName[0]}{teacher.user.lastName[0]}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{teacher.user.firstName} {teacher.user.lastName}</span>
                                {teacher.specialties && teacher.specialties.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {teacher.specialties.slice(0, 2).map((s, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {s}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedTeachers.includes(teacher.id) && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
              <Link href="/demo/classes">
                <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </Link>
              <Button 
                onClick={() => handleSubmit()}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label>Report period</Label>
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value={CUSTOM_PERIOD_VALUE}>Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {reportPeriod === CUSTOM_PERIOD_VALUE && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="class-custom-start">Start date</Label>
                      <Input id="class-custom-start" type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class-custom-end">End date</Label>
                      <Input id="class-custom-end" type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} />
                    </div>
                  </>
                )}
              </div>
              {reportPeriod === CUSTOM_PERIOD_VALUE && (!customStartDate || !customEndDate) && (
                <p className="text-sm text-gray-500">Choose both start and end dates to load custom report data.</p>
              )}
            </CardContent>
          </Card>
          {stats && hasClassReportData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Teachers for this Class */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Top Teachers</h3>
                  </div>
                  <div className="space-y-3">
                    {safeStats.topTeachers.map((teacher, i) => (
                      <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{teacher.name}</p>
                            <p className="text-sm text-gray-500">{teacher.classes} classes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-gray-900">{typeof teacher.rating === "number" && teacher.rating > 0 ? teacher.rating.toFixed(1) : "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Location Performance */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Bookings by Location</h3>
                  </div>
                  <div className="space-y-3">
                    {safeStats.topLocations.map((loc, i) => {
                      const total = safeStats.topLocations.reduce((a, l) => a + l.bookings, 0)
                      const pct = Math.round((loc.bookings / total) * 100)
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{loc.name}</span>
                            <span className="text-sm text-gray-500">{loc.bookings} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-violet-500 h-2 rounded-full" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Popular Times */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Popular Times</h3>
                  </div>
                  <div className="space-y-3">
                    {safeStats.popularTimes.map((slot, i) => (
                      <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-900">{slot.time}</span>
                        </div>
                        <span className="text-gray-500">{slot.count} bookings</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Classes */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Recent Classes</h3>
                  </div>
                  <div className="space-y-3">
                    {safeStats.recentClasses.map((cls, i) => (
                      <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{cls.date}</p>
                          <p className="text-sm text-gray-500">{cls.teacher} • {cls.location}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className={`text-sm font-medium ${
                            cls.attendance >= cls.capacity ? "text-emerald-600" : "text-gray-900"
                          }`}>
                            {cls.attendance}/{cls.capacity}
                          </span>
                          <p className="text-xs text-gray-500">attended</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Bookings Chart */}
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Booking Trends</h3>
                  </div>
                  <div className="flex items-end justify-between h-40 gap-2 sm:gap-4">
                    {safeStats.monthlyBookings.map((month, i) => {
                      const maxCount = Math.max(...safeStats.monthlyBookings.map(m => m.count))
                      const height = (month.count / maxCount) * 100
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{month.count}</span>
                          <div 
                            className="w-full bg-violet-500 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-gray-500">{month.month}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {(!stats || !hasClassReportData) && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10 text-center">
                <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No data in selected period</h3>
                <p className="text-gray-500">
                  Try changing your date range or check back once more activity is recorded.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
