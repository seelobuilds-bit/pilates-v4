// Demo Class Type Detail Page - Mirrors /studio/classes/[classTypeId]/page.tsx
// Keep in sync with the real class type detail page

"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  DollarSign, 
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
import { demoClassTypes, demoLocations, demoTeachers } from "../../_data/demo-data"

// Mock stats for class type
const mockClassTypeStats = {
  totalBookings: 847,
  totalRevenue: 25410,
  avgAttendance: 7.2,
  avgRating: 4.8,
  topTeachers: [
    { name: "Sarah Mitchell", classes: 45, rating: 4.9 },
    { name: "Jessica Taylor", classes: 32, rating: 4.8 },
    { name: "Amanda Lopez", classes: 28, rating: 4.7 }
  ],
  topLocations: [
    { name: "Main Studio", bookings: 523 },
    { name: "Downtown", bookings: 324 }
  ],
  monthlyBookings: [
    { month: "Jul", count: 112 },
    { month: "Aug", count: 134 },
    { month: "Sep", count: 128 },
    { month: "Oct", count: 156 },
    { month: "Nov", count: 167 },
    { month: "Dec", count: 150 }
  ],
  popularTimes: [
    { time: "9:00 AM", count: 189 },
    { time: "6:00 PM", count: 167 },
    { time: "10:30 AM", count: 145 },
    { time: "5:00 PM", count: 134 },
    { time: "7:30 AM", count: 98 }
  ],
  recentClasses: [
    { date: "Today, 9:00 AM", teacher: "Sarah M.", location: "Main Studio", attendance: 8, capacity: 10 },
    { date: "Yesterday, 6:00 PM", teacher: "Jessica T.", location: "Downtown", attendance: 10, capacity: 10 },
    { date: "Dec 15, 10:30 AM", teacher: "Amanda L.", location: "Main Studio", attendance: 7, capacity: 10 },
    { date: "Dec 14, 5:00 PM", teacher: "Sarah M.", location: "Main Studio", attendance: 9, capacity: 10 }
  ]
}

export default function DemoClassTypeDetailPage({ params }: { params: Promise<{ classTypeId: string }> }) {
  const { classTypeId } = use(params)
  const classType = demoClassTypes.find(c => c.id === classTypeId) || demoClassTypes[0]
  const [selectedLocations, setSelectedLocations] = useState<string[]>(demoLocations.map(l => l.id))
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(demoTeachers.map(t => t.id))
  const [formData, setFormData] = useState({
    name: classType.name,
    description: classType.description || "",
    duration: classType.duration.toString(),
    capacity: classType.capacity.toString(),
    price: classType.price.toString(),
    isActive: classType.isActive
  })

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

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/demo/classes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classType.name}</h1>
            <p className="text-gray-500 mt-1">{formData.duration} min • ${formData.price} • {formData.capacity} spots</p>
          </div>
          <Badge className={formData.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
            {formData.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockClassTypeStats.totalBookings.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">${mockClassTypeStats.totalRevenue.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">{mockClassTypeStats.avgAttendance}</p>
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
                <p className="text-2xl font-bold text-gray-900">{mockClassTypeStats.avgRating}</p>
                <p className="text-sm text-gray-500">Avg. Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-white shadow-sm border-0">
          <TabsTrigger value="settings" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
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
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Class Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Active</p>
                      <p className="text-sm text-gray-500">Allow this class to be scheduled and booked</p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Assignment */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-violet-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Available Locations</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedLocations(demoLocations.map(l => l.id))}>
                    Select All
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Choose which locations offer this class.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoLocations.map((location) => (
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
              </CardContent>
            </Card>

            {/* Teacher Assignment */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Assigned Teachers</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTeachers(demoTeachers.map(t => t.id))}>
                    Select All
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Choose which teachers can teach this class.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoTeachers.map((teacher) => (
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
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/demo/classes">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Teachers for this Class */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Top Teachers</h3>
                </div>
                <div className="space-y-3">
                  {mockClassTypeStats.topTeachers.map((teacher, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{teacher.name}</p>
                          <p className="text-sm text-gray-500">{teacher.classes} classes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-gray-900">{teacher.rating}</span>
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
                  {mockClassTypeStats.topLocations.map((loc, i) => {
                    const total = mockClassTypeStats.topLocations.reduce((a, l) => a + l.bookings, 0)
                    const pct = Math.round((loc.bookings / total) * 100)
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{loc.name}</span>
                          <span className="text-sm text-gray-500">{loc.bookings} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
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
                  {mockClassTypeStats.popularTimes.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
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
                  {mockClassTypeStats.recentClasses.map((cls, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{cls.date}</p>
                        <p className="text-sm text-gray-500">{cls.teacher} • {cls.location}</p>
                      </div>
                      <div className="text-right">
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
                <div className="flex items-end justify-between h-40 gap-4">
                  {mockClassTypeStats.monthlyBookings.map((month, i) => {
                    const maxCount = Math.max(...mockClassTypeStats.monthlyBookings.map(m => m.count))
                    const height = (month.count / maxCount) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{month.count}</span>
                        <div className="w-full bg-violet-500 rounded-t" style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-500">{month.month}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}




