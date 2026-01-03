// Demo Vault Page - Mirrors /studio/vault/page.tsx
// Keep in sync with the real vault page

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
  TrendingUp,
  CheckCircle,
  MessageSquare,
  Link as LinkIcon,
  BarChart3,
  Save,
  Trash2,
  Lock,
  Unlock
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
    isPublished: true,
    isFeatured: true,
    audience: "CLIENTS",
    includeInSubscription: true
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
    isPublished: true,
    isFeatured: true,
    audience: "TEACHERS",
    includeInSubscription: true
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
    isPublished: true,
    isFeatured: false,
    audience: "CLIENTS",
    includeInSubscription: false
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
    isPublished: false,
    isFeatured: false,
    audience: "CLIENTS",
    includeInSubscription: false
  },
]

const demoSubscriptionPlans = [
  {
    id: "1",
    name: "Studio Owner Vault",
    description: "Exclusive business growth courses and community for studio owners.",
    audience: "STUDIO_OWNERS",
    monthlyPrice: 99,
    quarterlyPrice: 249,
    yearlyPrice: 799,
    subscribers: 12,
    features: ["Business growth courses", "Private community", "Monthly strategy calls", "Resource library"],
    includedCourses: []
  },
  {
    id: "2",
    name: "Teacher Vault",
    description: "Advanced teaching skills and career development for Pilates instructors.",
    audience: "TEACHERS",
    monthlyPrice: 49,
    quarterlyPrice: 129,
    yearlyPrice: 399,
    subscribers: 42,
    features: ["All teacher courses", "Certification prep", "Mentorship program", "Private community"],
    includedCourses: [{ id: "2", title: "Prenatal Pilates Certification" }]
  },
  {
    id: "3",
    name: "At-Home Vault",
    description: "Unlimited at-home workouts and community support for your fitness journey.",
    audience: "CLIENTS",
    monthlyPrice: 29,
    quarterlyPrice: 79,
    yearlyPrice: 249,
    subscribers: 156,
    features: ["All client courses", "Community chat", "Monthly live Q&A", "New content weekly"],
    includedCourses: [{ id: "1", title: "Reformer Masterclass Series" }]
  },
]

const demoEnrollments = [
  { id: "1", name: "Sarah Johnson", course: "Reformer Masterclass", status: "ACTIVE", progress: 75, paidAmount: 149.99 },
  { id: "2", name: "Mike Chen", course: "Mat Work Foundations", status: "ACTIVE", progress: 45, paidAmount: 79.99 },
  { id: "3", name: "Emily Davis", course: "Prenatal Certification", status: "COMPLETED", progress: 100, paidAmount: 299.99 },
  { id: "4", name: "Lisa Park", course: "Reformer Masterclass", status: "ACTIVE", progress: 20, paidAmount: 149.99 },
]

const demoAffiliates = [
  { id: "1", teacher: "Sarah Chen", course: "Reformer Masterclass", code: "SARAH20", clicks: 234, conversions: 18, earnings: 539.64 },
  { id: "2", teacher: "Mike Johnson", course: "Mat Work Foundations", code: "MIKE15", clicks: 156, conversions: 12, earnings: 143.98 },
]

const stats = {
  totalCourses: 12,
  publishedCourses: 10,
  totalEnrollments: 1245,
  totalRevenue: 48500,
  activeStudents: 198
}

export default function DemoVaultPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTier, setSelectedTier] = useState<"STUDIO_OWNERS" | "TEACHERS" | "CLIENTS">("CLIENTS")
  const [showChatForPlan, setShowChatForPlan] = useState<typeof demoSubscriptionPlans[0] | null>(null)
  
  const currentPlan = demoSubscriptionPlans.find(p => p.audience === selectedTier)

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case "STUDIO_OWNERS":
        return <Badge className="bg-purple-100 text-purple-700">Studio Owners</Badge>
      case "TEACHERS":
        return <Badge className="bg-blue-100 text-blue-700">Teachers</Badge>
      case "CLIENTS":
        return <Badge className="bg-green-100 text-green-700">Clients</Badge>
      default:
        return <Badge variant="secondary">{audience}</Badge>
    }
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">The Vault</h1>
          <p className="text-gray-500 mt-1">Create and manage courses for owners, teachers, and clients</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                <p className="text-sm text-gray-500">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedCourses}</p>
                <p className="text-sm text-gray-500">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
                <p className="text-sm text-gray-500">Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-gray-500">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
                <p className="text-sm text-gray-500">Active Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <Crown className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="community">
            <MessageSquare className="h-4 w-4 mr-2" />
            Community
          </TabsTrigger>
          <TabsTrigger value="enrollments">
            <Users className="h-4 w-4 mr-2" />
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="affiliates">
            <LinkIcon className="h-4 w-4 mr-2" />
            Affiliates
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">All Audiences</Button>
              </div>
            </CardContent>
          </Card>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoCourses.map(course => (
              <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      {course.image}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {course.isPublished ? (
                        <Badge className="bg-green-500 text-white">Published</Badge>
                      ) : (
                        <Badge className="bg-gray-500 text-white">Draft</Badge>
                      )}
                    </div>
                    <div className="absolute top-2 left-2">
                      {getAudienceBadge(course.audience)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{course.description}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-amber-100 text-amber-700">${course.price}</Badge>
                      {course.includeInSubscription && (
                        <Badge variant="outline" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Subscription
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrollments} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {course.modules} modules
                      </span>
                      {course.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          {course.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="flex-1" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        {course.isPublished ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {/* 3 Subscription Tiers Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Subscription Tiers</h3>
              <p className="text-sm text-gray-500">
                Configure 3 subscription types with their own community chats.
              </p>
            </div>
          </div>

          {/* Tier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: "STUDIO_OWNERS" as const, label: "Studio Owners", icon: "🏢", color: "purple" },
              { key: "TEACHERS" as const, label: "Teachers", icon: "🎓", color: "blue" },
              { key: "CLIENTS" as const, label: "At-Home Members", icon: "🏠", color: "green" }
            ].map(tier => {
              const plan = demoSubscriptionPlans.find(p => p.audience === tier.key)
              return (
                <Card 
                  key={tier.key}
                  className={`border-2 cursor-pointer transition-all ${
                    selectedTier === tier.key 
                      ? "border-violet-500 bg-violet-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedTier(tier.key)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{tier.icon}</span>
                      {plan ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Not Set Up</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900">{tier.label}</h4>
                    {plan ? (
                      <div className="mt-2 text-sm text-gray-500">
                        <p>${plan.monthlyPrice}/mo • {plan.subscribers} subscribers</p>
                        <p>{plan.includedCourses.length} courses included</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-400">Click to configure</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Selected Tier Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {selectedTier === "STUDIO_OWNERS" ? "Studio Owners" : selectedTier === "TEACHERS" ? "Teachers" : "At-Home Members"} Plan
                    </h3>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  
                  {currentPlan && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Plan Name</p>
                        <p className="font-medium">{currentPlan.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Description</p>
                        <p className="text-gray-700">{currentPlan.description}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900">${currentPlan.monthlyPrice}</p>
                          <p className="text-xs text-gray-500">Monthly</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900">${currentPlan.quarterlyPrice}</p>
                          <p className="text-xs text-gray-500">Quarterly</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900">${currentPlan.yearlyPrice}</p>
                          <p className="text-xs text-gray-500">Yearly</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Features</p>
                        <ul className="space-y-1">
                          {currentPlan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700">
                        <Save className="h-4 w-4 mr-2" />
                        Update Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Courses for this tier */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Courses for {selectedTier === "STUDIO_OWNERS" ? "Studio Owners" : selectedTier === "TEACHERS" ? "Teachers" : "At-Home Members"}</h3>
                  <p className="text-sm text-gray-500 mb-4">Toggle which courses are included in this subscription</p>
                  
                  <div className="space-y-3">
                    {demoCourses.filter(c => c.audience === selectedTier || c.audience === "CLIENTS" && selectedTier === "CLIENTS").map(course => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                            {course.includeInSubscription ? (
                              <Unlock className="h-4 w-4 text-violet-600" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{course.title}</p>
                            <p className="text-xs text-gray-500">{course.enrollments} enrolled</p>
                          </div>
                        </div>
                        <Switch checked={course.includeInSubscription} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Stats */}
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold text-gray-900">Preview</h3>
                  </div>
                  {currentPlan && (
                    <>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{currentPlan.name}</h4>
                      <p className="text-gray-600 text-sm mb-4">{currentPlan.description}</p>
                      
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold text-violet-600">${currentPlan.monthlyPrice}</span>
                        <span className="text-gray-500">/month</span>
                      </div>

                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Community chat access
                        </li>
                        {currentPlan.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button className="w-full bg-violet-600 hover:bg-violet-700" disabled>
                        Subscribe (Preview)
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Plan Stats</h3>
                  {currentPlan && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Active Subscribers</span>
                        <span className="font-medium">{currentPlan.subscribers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Courses Included</span>
                        <span className="font-medium">{currentPlan.includedCourses.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Est. Monthly Revenue</span>
                        <span className="font-medium text-green-600">
                          ${(currentPlan.subscribers * currentPlan.monthlyPrice).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[500px]">
            {/* Chat Selector Sidebar */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Communities</h3>
              {demoSubscriptionPlans.map(plan => (
                <Card 
                  key={plan.id} 
                  className={`border-0 shadow-sm cursor-pointer transition-all ${
                    showChatForPlan?.id === plan.id 
                      ? "ring-2 ring-violet-500 bg-violet-50" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setShowChatForPlan(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan.audience === "STUDIO_OWNERS" ? "bg-purple-100" :
                        plan.audience === "TEACHERS" ? "bg-blue-100" : "bg-green-100"
                      }`}>
                        <span className="text-lg">
                          {plan.audience === "STUDIO_OWNERS" ? "🏢" : plan.audience === "TEACHERS" ? "🎓" : "🏠"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{plan.name}</h4>
                        <p className="text-xs text-gray-500">{plan.subscribers} members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Full Screen Chat Area */}
            <div className="lg:col-span-3 h-full">
              {showChatForPlan ? (
                <Card className="border-0 shadow-sm h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{showChatForPlan.name} Community</h3>
                      <Badge className="bg-green-100 text-green-700">{showChatForPlan.subscribers} members</Badge>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">Community chat interface</p>
                        <p className="text-sm text-gray-400">Members can chat, share progress, and support each other</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-sm h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                    <h4 className="font-medium text-gray-900 mb-1">Select a Community</h4>
                    <p className="text-sm text-gray-500">
                      Choose a community from the left to view and manage the chat
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Enrollments</h3>
              
              <div className="space-y-3">
                {demoEnrollments.map(enrollment => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{enrollment.name}</p>
                        <p className="text-sm text-gray-500">{enrollment.course}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={enrollment.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {enrollment.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">{enrollment.progress}% complete</p>
                      </div>
                      <p className="font-semibold text-gray-900">${enrollment.paidAmount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Affiliate Links</h3>
              
              <div className="space-y-3">
                {demoAffiliates.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{link.teacher}</p>
                        <p className="text-sm text-gray-500">{link.course}</p>
                        <code className="text-xs bg-gray-200 px-2 py-0.5 rounded mt-1 inline-block">
                          {link.code}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{link.clicks}</p>
                        <p className="text-gray-500">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{link.conversions}</p>
                        <p className="text-gray-500">Sales</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-600">${link.earnings.toFixed(2)}</p>
                        <p className="text-gray-500">Earned</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p>Detailed course analytics and insights will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
