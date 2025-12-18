// Demo Class Type Detail Page
"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Clock, Users, DollarSign, Calendar, TrendingUp } from "lucide-react"
import { demoClassTypes } from "../../_data/demo-data"

export default function DemoClassTypeDetailPage({ params }: { params: Promise<{ classTypeId: string }> }) {
  const { classTypeId } = use(params)
  const classType = demoClassTypes.find(c => c.id === classTypeId) || demoClassTypes[0]

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/demo/classes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{classType.name}</h1>
            <Badge className={classType.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
              {classType.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">{classType.description}</p>
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
                <p className="font-medium text-xl">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-sm text-gray-500">Total Attendees</p>
                <p className="font-medium text-xl">186</p>
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
                <p className="font-medium text-xl">${(186 * classType.price).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500">Avg. Fill Rate</p>
                <p className="font-medium text-xl">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" defaultValue={classType.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" defaultValue={classType.description} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" defaultValue={classType.duration} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input id="capacity" type="number" defaultValue={classType.capacity} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" defaultValue={classType.price} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-gray-500">Show this class on booking page</p>
              </div>
              <Switch defaultChecked={classType.isActive} />
            </div>
          </CardContent>
        </Card>

        {/* Reporting */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Fill Rate</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Repeat Booking Rate</span>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Cancellation Rate</span>
                  <span className="text-sm font-medium">8%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Popular Times</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Morning (6am-12pm)</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Afternoon (12pm-5pm)</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Evening (5pm-9pm)</span>
                  <span className="font-medium">30%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
