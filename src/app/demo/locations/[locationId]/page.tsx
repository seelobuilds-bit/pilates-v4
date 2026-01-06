// Demo Location Detail Page - Mirrors /studio/locations/[locationId]/page.tsx
// Keep in sync with the real location detail page

"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  MapPin, 
  Save,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  BarChart3,
  Star,
  BookOpen
} from "lucide-react"
import { demoLocations, demoScheduleClasses } from "../../_data/demo-data"

// Mock stats for location
const mockLocationStats = {
  totalBookings: 1247,
  totalRevenue: 45890,
  activeClients: 156,
  avgClassSize: 7.2,
  topClasses: [
    { name: "Reformer Pilates", bookings: 342 },
    { name: "Mat Pilates", bookings: 289 },
    { name: "Tower Class", bookings: 198 },
    { name: "Beginner Flow", bookings: 156 }
  ],
  topTeachers: [
    { name: "Sarah Mitchell", classes: 89, rating: 4.9 },
    { name: "Jessica Taylor", classes: 67, rating: 4.8 },
    { name: "Amanda Lopez", classes: 54, rating: 4.7 }
  ],
  recentBookings: [
    { clientName: "John Smith", className: "Reformer Pilates", date: "Today, 9:00 AM" },
    { clientName: "Emma Wilson", className: "Mat Pilates", date: "Today, 10:30 AM" },
    { clientName: "Alex Brown", className: "Tower Class", date: "Today, 2:00 PM" },
    { clientName: "Lisa Park", className: "Beginner Flow", date: "Tomorrow, 9:00 AM" }
  ],
  bookingsByDay: [
    { day: "Mon", count: 45 },
    { day: "Tue", count: 52 },
    { day: "Wed", count: 48 },
    { day: "Thu", count: 56 },
    { day: "Fri", count: 42 },
    { day: "Sat", count: 68 },
    { day: "Sun", count: 32 }
  ],
  monthlyRevenue: [
    { month: "Jul", revenue: 6200 },
    { month: "Aug", revenue: 7100 },
    { month: "Sep", revenue: 7800 },
    { month: "Oct", revenue: 8200 },
    { month: "Nov", revenue: 8400 },
    { month: "Dec", revenue: 8190 }
  ]
}

export default function DemoLocationDetailPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = use(params)
  const location = demoLocations.find(l => l.id === locationId) || demoLocations[0]
  const [formData, setFormData] = useState({
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode,
    phone: "",
    isActive: location.isActive
  })
  
  // Filter classes for this location
  const locationClasses = demoScheduleClasses.filter(c => c.location.name === location.name)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/demo/locations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Locations
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center">
              <MapPin className="h-7 w-7 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
              <p className="text-gray-500">{location.address}, {location.city}</p>
            </div>
          </div>
          <Badge className={location.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
            {location.isActive ? "Active" : "Inactive"}
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
                <p className="text-2xl font-bold text-gray-900">{mockLocationStats.totalBookings.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">${mockLocationStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
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
                <p className="text-2xl font-bold text-gray-900">{mockLocationStats.activeClients}</p>
                <p className="text-sm text-gray-500">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockLocationStats.avgClassSize}</p>
                <p className="text-sm text-gray-500">Avg. Class Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="bg-white shadow-sm border-0">
          <TabsTrigger value="reports" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <MapPin className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Classes */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Top Classes</h3>
                </div>
                <div className="space-y-3">
                  {mockLocationStats.topClasses.map((cls, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-900">{cls.name}</span>
                      </div>
                      <span className="text-gray-500">{cls.bookings} bookings</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Teachers */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Top Teachers</h3>
                </div>
                <div className="space-y-3">
                  {mockLocationStats.topTeachers.map((teacher, i) => (
                    <div key={i} className="flex items-center justify-between">
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
                        <span className="text-gray-900 font-medium">{teacher.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bookings by Day */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Bookings by Day</h3>
                </div>
                <div className="flex items-end justify-between h-32 gap-2">
                  {mockLocationStats.bookingsByDay.map((day, i) => {
                    const maxCount = Math.max(...mockLocationStats.bookingsByDay.map(d => d.count))
                    const height = (day.count / maxCount) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-violet-500 rounded-t" style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-500">{day.day}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                </div>
                <div className="space-y-3">
                  {mockLocationStats.recentBookings.map((booking, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{booking.clientName}</p>
                        <p className="text-sm text-gray-500">{booking.className}</p>
                      </div>
                      <span className="text-sm text-gray-500">{booking.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue Chart */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
                </div>
                <div className="flex items-end justify-between h-40 gap-4">
                  {mockLocationStats.monthlyRevenue.map((month, i) => {
                    const maxRevenue = Math.max(...mockLocationStats.monthlyRevenue.map(m => m.revenue))
                    const height = (month.revenue / maxRevenue) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">${(month.revenue / 1000).toFixed(1)}k</span>
                        <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-500">{month.month}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Active Status</p>
                    <p className="text-sm text-gray-500">Allow classes to be scheduled at this location</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Link href="/demo/locations">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="button" className="bg-violet-600 hover:bg-violet-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


























