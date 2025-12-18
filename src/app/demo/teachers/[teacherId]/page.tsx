// Demo Teacher Detail Page
"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Mail, Calendar, DollarSign, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { demoTeachers, demoScheduleClasses } from "../../_data/demo-data"

export default function DemoTeacherDetailPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = use(params)
  const teacher = demoTeachers.find(t => t.id === teacherId) || demoTeachers[0]
  
  // Filter classes for this teacher
  const teacherClasses = demoScheduleClasses.filter(
    c => c.teacher.user.firstName === teacher.user.firstName && c.teacher.user.lastName === teacher.user.lastName
  )

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/demo/teachers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-xl font-semibold text-violet-700">
              {teacher.user.firstName[0]}{teacher.user.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{teacher.user.firstName} {teacher.user.lastName}</h1>
                <Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
              </div>
              <p className="text-gray-500">{teacher.user.email}</p>
            </div>
          </div>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">Edit Profile</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Classes Taught</p>
                <p className="font-medium text-xl">{teacher._count.classSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Students Taught</p>
                <p className="font-medium text-xl">287</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Revenue Generated</p>
                <p className="font-medium text-xl">$8,450</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Avg. Rating</p>
                <p className="font-medium text-xl">4.9 ⭐</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Specialties */}
      {teacher.specialties && teacher.specialties.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {teacher.specialties.map((specialty, i) => (
              <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>This Week&apos;s Schedule</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm text-gray-500">This Week</span>
                  <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teacherClasses.slice(0, 6).map((cls, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{cls.classType.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(cls.startTime).toLocaleDateString()} at {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{cls.location.name}</p>
                      <p className={`text-sm ${cls._count.bookings >= cls.capacity ? 'text-red-500' : 'text-teal-500'}`}>
                        {cls._count.bookings}/{cls.capacity} spots
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Class Fill Rate</p>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">87% average</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Student Retention</p>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">92% return rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
