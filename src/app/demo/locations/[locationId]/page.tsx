// Demo Location Detail Page
"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, TrendingUp } from "lucide-react"
import { demoLocations, demoScheduleClasses } from "../../_data/demo-data"

export default function DemoLocationDetailPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = use(params)
  const location = demoLocations.find(l => l.id === locationId) || demoLocations[0]
  
  // Filter classes for this location
  const locationClasses = demoScheduleClasses.filter(c => c.location.name === location.name)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/demo/locations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
                <Badge className={location.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                  {location.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-gray-500">{location.address}</p>
            </div>
          </div>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm text-gray-500">Classes This Month</p>
                <p className="font-medium text-xl">{location._count.classSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-sm text-gray-500">Total Visits</p>
                <p className="font-medium text-xl">456</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="font-medium text-xl">$14,200</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500">Utilization</p>
                <p className="font-medium text-xl">72%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input id="name" defaultValue={location.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue={location.address} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-gray-500">Show classes at this location</p>
              </div>
              <Switch defaultChecked={location.isActive} />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationClasses.slice(0, 5).map((cls, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{cls.classType.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(cls.startTime).toLocaleDateString()} at {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{cls.teacher.user.firstName} {cls.teacher.user.lastName[0]}.</p>
                    <p className={`text-sm ${cls._count.bookings >= cls.capacity ? 'text-red-500' : 'text-teal-500'}`}>
                      {cls._count.bookings}/{cls.capacity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
