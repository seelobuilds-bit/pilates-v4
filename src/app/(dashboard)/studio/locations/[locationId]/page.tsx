"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Loader2, 
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

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string | null
  isActive: boolean
}

interface LocationStats {
  totalBookings: number
  totalRevenue: number
  activeClients: number
  avgClassSize: number
  topClasses: { name: string; bookings: number }[]
  topTeachers: { name: string; classes: number; rating: number }[]
  recentBookings: { clientName: string; className: string; date: string }[]
  bookingsByDay: { day: string; count: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
}

const emptyLocationStats: LocationStats = {
  totalBookings: 0,
  totalRevenue: 0,
  activeClients: 0,
  avgClassSize: 0,
  topClasses: [],
  topTeachers: [],
  recentBookings: [],
  bookingsByDay: [],
  monthlyRevenue: []
}

export default function EditLocationPage({
  params,
}: {
  params: Promise<{ locationId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [stats, setStats] = useState<LocationStats | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    isActive: true
  })

  useEffect(() => {
    async function fetchLocation() {
      try {
        const res = await fetch(`/api/studio/locations/${resolvedParams.locationId}`)
        if (res.ok) {
          const data = await res.json()
          setLocation(data)
          setStats(data.stats || emptyLocationStats)
          setFormData({
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            phone: data.phone || "",
            isActive: data.isActive
          })
        }
      } catch (error) {
        console.error("Error fetching location:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLocation()
  }, [resolvedParams.locationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/studio/locations/${resolvedParams.locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push("/studio/locations")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update location")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update location")
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

  if (!location) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Location not found</h1>
          <Link href="/studio/locations" className="text-violet-600 hover:text-violet-700 mt-4 inline-block">
            Back to Locations
          </Link>
        </div>
      </div>
    )
  }

  const safeStats = stats || emptyLocationStats
  const hasLocationReportData =
    safeStats.totalBookings > 0 ||
    safeStats.totalRevenue > 0 ||
    safeStats.topClasses.length > 0 ||
    safeStats.monthlyRevenue.some((month) => month.revenue > 0)

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/locations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
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
          <Badge variant={location.isActive ? "success" : "secondary"} className="text-sm">
            {location.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      {stats && hasLocationReportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                  <p className="text-2xl font-bold text-gray-900">{safeStats.activeClients}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{safeStats.avgClassSize}</p>
                  <p className="text-sm text-gray-500">Avg. Class Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          {stats && hasLocationReportData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Classes */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Top Classes</h3>
                  </div>
                  <div className="space-y-3">
                    {safeStats.topClasses.map((cls, i) => (
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
                    {safeStats.topTeachers.map((teacher, i) => (
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
                          <span className="text-gray-900 font-medium">{teacher.rating > 0 ? teacher.rating.toFixed(1) : "N/A"}</span>
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
                    {safeStats.bookingsByDay.map((day, i) => {
                      const maxCount = Math.max(...safeStats.bookingsByDay.map(d => d.count))
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-violet-500 rounded-t"
                            style={{ height: `${height}%` }}
                          />
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
                    {safeStats.recentBookings.map((booking, i) => (
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
                    {safeStats.monthlyRevenue.map((month, i) => {
                      const maxRevenue = Math.max(...safeStats.monthlyRevenue.map(m => m.revenue))
                      const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">${(month.revenue / 1000).toFixed(1)}k</span>
                          <div 
                            className="w-full bg-emerald-500 rounded-t"
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
          {(!stats || !hasLocationReportData) && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10 text-center">
                <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No report data yet</h3>
                <p className="text-gray-500">
                  This location has no tracked activity yet, so reporting is empty.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      required
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
                  <Link href="/studio/locations">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="bg-violet-600 hover:bg-violet-700"
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
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
