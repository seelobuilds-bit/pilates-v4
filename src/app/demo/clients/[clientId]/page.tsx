// Demo Client Detail Page - Mirrors /studio/clients/[clientId]/page.tsx
// Keep in sync with the real client detail page

"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  Star,
  BarChart3,
  Users,
  BookOpen,
  Gift,
  Activity,
  MessageSquare,
  Send,
  Check
} from "lucide-react"
import { demoClients, demoRecentBookings } from "../../_data/demo-data"

// Mock stats for client
const mockClientStats = {
  totalSpent: 1245,
  totalBookings: 42,
  completedClasses: 38,
  cancelRate: 9.5,
  avgBookingsPerMonth: 7,
  membershipType: "Class Pack (10)",
  favoriteClass: "Reformer Pilates",
  favoriteTeacher: "Sarah Johnson",
  favoriteLocation: "Downtown Studio",
  classBreakdown: [
    { name: "Reformer Pilates", count: 18 },
    { name: "Mat Pilates", count: 12 },
    { name: "Tower Class", count: 8 },
    { name: "Beginner Flow", count: 4 }
  ],
  teacherBreakdown: [
    { name: "Sarah Johnson", count: 22 },
    { name: "Mike Chen", count: 12 },
    { name: "Emily Davis", count: 8 }
  ],
  locationBreakdown: [
    { name: "Downtown Studio", count: 30 },
    { name: "Westside Location", count: 12 }
  ],
  monthlyBookings: [
    { month: "Jul", count: 5 },
    { month: "Aug", count: 7 },
    { month: "Sep", count: 6 },
    { month: "Oct", count: 8 },
    { month: "Nov", count: 9 },
    { month: "Dec", count: 7 }
  ],
  activityTimeline: [
    { date: "Today", action: "Booked", details: "Reformer Pilates - Dec 18, 9:00 AM" },
    { date: "Yesterday", action: "Completed", details: "Mat Pilates with Sarah J." },
    { date: "Dec 15", action: "Purchased", details: "10-Class Pack ($250)" },
    { date: "Dec 14", action: "Completed", details: "Tower Class with Mike C." },
    { date: "Dec 12", action: "Cancelled", details: "Beginner Flow (24h notice)" }
  ]
}

// Mock communications
const mockCommunications = [
  {
    id: "comm-1",
    type: "email" as const,
    direction: "outbound" as const,
    subject: "Class Reminder",
    content: "Hi! Just a reminder about your Reformer Pilates class tomorrow at 9:00 AM.",
    timestamp: "Yesterday at 3:00 PM"
  },
  {
    id: "comm-2",
    type: "email" as const,
    direction: "inbound" as const,
    subject: "Re: Class Reminder",
    content: "Thanks for the reminder! I'll be there.",
    timestamp: "Yesterday at 4:30 PM"
  },
  {
    id: "comm-3",
    type: "sms" as const,
    direction: "outbound" as const,
    content: "Your booking is confirmed! See you tomorrow at 9 AM.",
    timestamp: "2 days ago"
  },
  {
    id: "comm-4",
    type: "email" as const,
    direction: "outbound" as const,
    subject: "Welcome to Our Studio!",
    content: "Welcome to our pilates studio! We're excited to have you join us. Your first class is scheduled for...",
    timestamp: "2 weeks ago"
  }
]

export default function DemoClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params)
  const client = demoClients.find(c => c.id === clientId) || demoClients[0]

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/demo/clients" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-xl font-semibold text-violet-700">
              {client.firstName[0]}{client.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-gray-500">Client since {new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={client.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
              {client.isActive ? "Active" : "Inactive"}
            </Badge>
            <Link href="/demo/inbox">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${mockClientStats.totalSpent.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockClientStats.totalBookings}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockClientStats.avgBookingsPerMonth}</p>
                <p className="text-sm text-gray-500">Bookings/Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{client.credits}</p>
                <p className="text-sm text-gray-500">Credits</p>
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
          <TabsTrigger value="communications" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Calendar className="h-4 w-4 mr-2" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Users className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preferences */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Preferences</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-violet-500" />
                      <span className="text-sm text-gray-600">Favorite Class</span>
                    </div>
                    <span className="font-medium text-violet-700">{mockClientStats.favoriteClass}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Favorite Teacher</span>
                    </div>
                    <span className="font-medium text-blue-700">{mockClientStats.favoriteTeacher}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm text-gray-600">Favorite Location</span>
                    </div>
                    <span className="font-medium text-emerald-700">{mockClientStats.favoriteLocation}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-amber-500" />
                      <span className="text-sm text-gray-600">Membership</span>
                    </div>
                    <span className="font-medium text-amber-700">{mockClientStats.membershipType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Performance</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-600">{mockClientStats.completedClasses}</p>
                    <p className="text-sm text-emerald-700">Classes Completed</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-red-600">{mockClientStats.cancelRate}%</p>
                    <p className="text-sm text-red-700">Cancel Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Classes Attended</h3>
                </div>
                <div className="space-y-3">
                  {mockClientStats.classBreakdown.map((cls, i) => {
                    const total = mockClientStats.classBreakdown.reduce((a, c) => a + c.count, 0)
                    const pct = Math.round((cls.count / total) * 100)
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                          <span className="text-sm text-gray-500">{cls.count} ({pct}%)</span>
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

            {/* Teacher Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Teachers Booked</h3>
                </div>
                <div className="space-y-3">
                  {mockClientStats.teacherBreakdown.map((teacher, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{teacher.name}</span>
                      </div>
                      <span className="text-gray-500">{teacher.count} classes</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Bookings Chart */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Booking History</h3>
                </div>
                <div className="flex items-end justify-between h-32 gap-4">
                  {mockClientStats.monthlyBookings.map((month, i) => {
                    const maxCount = Math.max(...mockClientStats.monthlyBookings.map(m => m.count))
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

        {/* Communications Tab */}
        <TabsContent value="communications">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Message History</h3>
                <Link href="/demo/inbox">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {mockCommunications.map((comm) => (
                  <Link key={comm.id} href="/demo/inbox">
                    <div className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      comm.direction === "outbound" 
                        ? "bg-violet-50 ml-8 hover:bg-violet-100" 
                        : "bg-gray-50 mr-8 hover:bg-gray-100"
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {comm.type === "email" ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {comm.direction === "outbound" ? "Sent" : "Received"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {comm.timestamp}
                          {comm.direction === "outbound" && <Check className="h-3 w-3 ml-1 text-green-500" />}
                        </div>
                      </div>
                      {comm.subject && (
                        <p className="font-medium text-gray-900 mb-1">{comm.subject}</p>
                      )}
                      <p className="text-sm text-gray-700">{comm.content}</p>
                      <p className="text-xs text-violet-600 mt-2 font-medium">Click to view conversation →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Bookings</h3>
              <div className="space-y-3">
                {demoRecentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.classSession.classType.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(booking.classSession.startTime).toLocaleDateString()} at{" "}
                        {new Date(booking.classSession.startTime).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </p>
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        <span>{booking.classSession.teacher.user.firstName} {booking.classSession.teacher.user.lastName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.classSession.location.name}
                        </span>
                      </p>
                    </div>
                    <Badge className={`${
                      booking.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : 
                      booking.status === "CANCELLED" ? "bg-red-100 text-red-700" : 
                      booking.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    } border-0`}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {mockClientStats.activityTimeline.map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.action === "Booked" ? "bg-violet-500" :
                        activity.action === "Completed" ? "bg-emerald-500" :
                        activity.action === "Purchased" ? "bg-blue-500" :
                        activity.action === "Cancelled" ? "bg-red-500" :
                        "bg-gray-300"
                      }`} />
                      {i < mockClientStats.activityTimeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <span className="text-sm text-gray-500">{activity.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{client.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Account Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">Credits Balance</span>
                    </div>
                    <span className="font-bold text-gray-900">{client.credits}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">Status</span>
                    </div>
                    <Badge className={client.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                      {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                  <Button variant="outline" className="flex-1">
                    Add Credits
                  </Button>
                  <Link href="/demo/inbox" className="flex-1">
                    <Button className="w-full bg-violet-600 hover:bg-violet-700">
                      Send Message
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}























