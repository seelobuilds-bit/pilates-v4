"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen,
  Plus,
  Search,
  Play,
  Users,
  Star,
  Clock,
  Crown,
  Video,
  DollarSign,
  Eye,
  Edit,
  MoreVertical,
  TrendingUp,
  Award
} from "lucide-react"

const demoCourses = [
  {
    id: "1",
    title: "Reformer Masterclass Series",
    description: "Complete guide to advanced reformer techniques",
    instructor: "Sarah Chen",
    price: 149.99,
    enrollments: 234,
    rating: 4.9,
    reviews: 89,
    modules: 12,
    duration: "8 hours",
    image: "🎯",
    isFeatured: true,
    audience: "CLIENTS"
  },
  {
    id: "2",
    title: "Prenatal Pilates Certification",
    description: "Train to teach safe prenatal classes",
    instructor: "Emily Davis",
    price: 299.99,
    enrollments: 156,
    rating: 4.95,
    reviews: 62,
    modules: 18,
    duration: "15 hours",
    image: "🤰",
    isFeatured: true,
    audience: "TEACHERS"
  },
  {
    id: "3",
    title: "Mat Work Foundations",
    description: "Essential mat exercises for beginners",
    instructor: "Mike Johnson",
    price: 79.99,
    enrollments: 412,
    rating: 4.8,
    reviews: 134,
    modules: 8,
    duration: "5 hours",
    image: "🧘",
    isFeatured: false,
    audience: "CLIENTS"
  },
  {
    id: "4",
    title: "Props & Equipment Workshop",
    description: "Master the use of Pilates props",
    instructor: "Lisa Park",
    price: 99.99,
    enrollments: 189,
    rating: 4.85,
    reviews: 56,
    modules: 10,
    duration: "6 hours",
    image: "💪",
    isFeatured: false,
    audience: "CLIENTS"
  },
]

const demoSubscriptionPlans = [
  {
    id: "1",
    name: "At-Home Community",
    description: "Access to all client courses and community",
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    subscribers: 156,
    features: ["All client courses", "Community chat", "Monthly live Q&A"],
    audience: "CLIENTS"
  },
  {
    id: "2",
    name: "Teacher Training",
    description: "Complete teacher certification program",
    monthlyPrice: 79.99,
    yearlyPrice: 799.99,
    subscribers: 42,
    features: ["All teacher courses", "Certification prep", "Mentorship program", "Private community"],
    audience: "TEACHERS"
  },
]

const stats = {
  totalCourses: 12,
  totalEnrollments: 1245,
  totalRevenue: 48500,
  activeSubscribers: 198
}

export default function DemoVaultPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">The Vault</h1>
          <p className="text-gray-500 mt-1">Manage your courses and subscription content</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <BookOpen className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Enrollments</p>
                <p className="text-2xl font-bold">{stats.totalEnrollments.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscribers</p>
                <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          {/* Search */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search courses..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline">All Audiences</Button>
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Course Image */}
                    <div className="w-32 h-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-4xl">
                      {course.image}
                    </div>
                    {/* Course Info */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{course.title}</h3>
                            {course.isFeatured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                        </div>
                        <Badge className={course.audience === "TEACHERS" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                          {course.audience === "TEACHERS" ? "Teachers" : "Clients"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          {course.modules} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          {course.rating} ({course.reviews})
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-xl font-bold">${course.price}</span>
                          <span className="text-sm text-gray-500 ml-2">{course.enrollments} enrolled</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoSubscriptionPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    </div>
                    <Badge className={plan.audience === "TEACHERS" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                      {plan.audience === "TEACHERS" ? "Teachers" : "Clients"}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                    <span className="text-gray-500">/month</span>
                    <span className="text-sm text-gray-400">or ${plan.yearlyPrice}/year</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600">✓</span>
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      {plan.subscribers} subscribers
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
