// Demo Client Detail Page
"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, MessageSquare } from "lucide-react"
import { demoClients, demoRecentBookings } from "../../_data/demo-data"

export default function DemoClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params)
  const client = demoClients.find(c => c.id === clientId) || demoClients[0]

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/demo/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-xl font-semibold text-violet-700">
              {client.firstName[0]}{client.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.firstName} {client.lastName}</h1>
              <p className="text-gray-500">Member since {new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/demo/inbox">
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </Link>
          <Button className="bg-violet-600 hover:bg-violet-700">Edit Client</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="font-medium">{client._count.bookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Credits</p>
                <p className="font-medium">{client.credits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoRecentBookings.slice(0, 5).map((booking, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.classSession.classType.name}</p>
                      <p className="text-sm text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">{booking.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Class Reminder</p>
                    <span className="text-sm text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Automated reminder for Morning Flow class</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Welcome Email</p>
                    <span className="text-sm text-gray-500">1 week ago</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Welcome to Align Pilates!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">10-Class Pack</p>
                    <p className="text-sm text-gray-500">Dec 15, 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$200.00</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">Paid</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Single Class - Reformer Basics</p>
                    <p className="text-sm text-gray-500">Dec 10, 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$35.00</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">Paid</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
