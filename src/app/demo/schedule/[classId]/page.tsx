// Demo Schedule Class Detail Page
"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, MapPin, Users, User } from "lucide-react"
import { demoScheduleClasses, demoClients } from "../../_data/demo-data"

export default function DemoScheduleDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params)
  const classSession = demoScheduleClasses.find(c => c.id === classId) || demoScheduleClasses[0]

  // Mock attendees
  const attendees = demoClients.slice(0, classSession._count.bookings)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/demo/schedule">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{classSession.classType.name}</h1>
          <p className="text-gray-500">
            {new Date(classSession.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Cancel Class</Button>
          <Button className="bg-violet-600 hover:bg-violet-700">Edit Class</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">
                  {new Date(classSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{classSession.location.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="font-medium">
                  {classSession.teacher.user.firstName} {classSession.teacher.user.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className={`font-medium ${classSession._count.bookings >= classSession.capacity ? 'text-red-500' : 'text-teal-500'}`}>
                  {classSession._count.bookings}/{classSession.capacity} spots filled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendees */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Attendees ({attendees.length})</CardTitle>
            <Button variant="outline" size="sm">Add Attendee</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendees.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">Confirmed</Badge>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                </div>
              ))}
              {classSession._count.bookings < classSession.capacity && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  {classSession.capacity - classSession._count.bookings} spots remaining
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}











