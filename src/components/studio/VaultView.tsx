"use client"

import { useState } from "react"
import Link from "next/link"
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
  Crown,
  DollarSign,
  Eye,
  Edit,
  TrendingUp,
  CheckCircle,
  MessageSquare,
  Link as LinkIcon,
  BarChart3,
  Save,
  Lock,
  Unlock,
  Loader2
} from "lucide-react"
import { VaultData, Course, SubscriptionPlan } from "./types"

interface VaultViewProps {
  data: VaultData
  linkPrefix?: string
  onToggleSubscriptionInclusion?: (courseId: string, include: boolean) => Promise<void>
  onTogglePublish?: (courseId: string, isPublished: boolean) => Promise<void>
  isLoading?: boolean
}

export function VaultView({ 
  data, 
  linkPrefix = "/studio",
  onToggleSubscriptionInclusion,
  onTogglePublish,
  isLoading = false
}: VaultViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [audienceFilter, setAudienceFilter] = useState<string>("all")
  const [selectedTier, setSelectedTier] = useState<"STUDIO_OWNERS" | "TEACHERS" | "CLIENTS">("CLIENTS")
  const [showChatForPlan, setShowChatForPlan] = useState<SubscriptionPlan | null>(null)

  const currentPlan = data.subscriptionPlans.find(p => p.audience === selectedTier)

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case "STUDIO_OWNERS":
        return <Badge className="bg-purple-100 text-purple-700">Studio Owners</Badge>
      case "TEACHERS":
        return <Badge className="bg-blue-100 text-blue-700">Teachers</Badge>
      case "CLIENTS":
        return <Badge className="bg-green-100 text-green-700">Clients</Badge>
      case "ALL":
        return <Badge className="bg-gray-100 text-gray-700">Everyone</Badge>
      default:
        return <Badge variant="secondary">{audience}</Badge>
    }
  }

  const getPricingBadge = (course: Course) => {
    if (course.pricingType === "FREE") {
      return <Badge className="bg-green-100 text-green-700">Free</Badge>
    }
    if (course.pricingType === "SUBSCRIPTION") {
      return <Badge className="bg-violet-100 text-violet-700">${course.subscriptionPrice}/{course.subscriptionInterval}</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-700">${course.price}</Badge>
  }

  // Filter courses
  const filteredCourses = data.courses.filter(course => {
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAudience = audienceFilter === "all" || course.audience === audienceFilter
    return matchesSearch && matchesAudience
  })

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">The Vault</h1>
          <p className="text-gray-500 mt-1">Create and manage courses for owners, teachers, and clients</p>
        </div>
        <Link href={`${linkPrefix}/vault/new`}>
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
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
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalCourses}</p>
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
                <p className="text-2xl font-bold text-gray-900">{data.stats.publishedCourses}</p>
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
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalEnrollments}</p>
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
                <p className="text-2xl font-bold text-gray-900">${data.stats.totalRevenue.toFixed(0)}</p>
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
                <p className="text-2xl font-bold text-gray-900">{data.stats.activeStudents}</p>
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

          {/* Course List */}
          {filteredCourses.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-500 mb-4">Create your first course to start building your vault</p>
                <Link href={`${linkPrefix}/vault/new`}>
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 relative">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-white/50" />
                        </div>
                      )}
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
                      {course.subtitle && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-1">{course.subtitle}</p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        {getPricingBadge(course)}
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
                          {course.enrollmentCount} students
                        </span>
                        <span className="flex items-center gap-1">
                          <Play className="h-4 w-4" />
                          {course._count?.modules || 0} modules
                        </span>
                        {course.averageRating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            {course.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`${linkPrefix}/vault/${course.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTogglePublish?.(course.id, course.isPublished)}
                        >
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
          )}
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
              { key: "STUDIO_OWNERS" as const, label: "Studio Owners", icon: "🏢" },
              { key: "TEACHERS" as const, label: "Teachers", icon: "🎓" },
              { key: "CLIENTS" as const, label: "At-Home Members", icon: "🏠" }
            ].map(tier => {
              const plan = data.subscriptionPlans.find(p => p.audience === tier.key)
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
                        <p>${plan.monthlyPrice}/mo • {plan.activeSubscribers} subscribers</p>
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
                    <Badge className={currentPlan ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {currentPlan ? "Active" : "Not Set Up"}
                    </Badge>
                  </div>
                  
                  {currentPlan ? (
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
                          <p className="text-2xl font-bold text-gray-900">${currentPlan.quarterlyPrice || 0}</p>
                          <p className="text-xs text-gray-500">Quarterly</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900">${currentPlan.yearlyPrice || 0}</p>
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
                  ) : (
                    <div className="text-center py-8">
                      <Crown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No plan configured yet</p>
                      <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
                        Create Plan
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
                    {data.courses.filter(c => c.audience === selectedTier || (c.audience === "CLIENTS" && selectedTier === "CLIENTS")).map(course => (
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
                            <p className="text-xs text-gray-500">{course.enrollmentCount} enrolled</p>
                          </div>
                        </div>
                        <Switch 
                          checked={course.includeInSubscription}
                          onCheckedChange={(v) => onToggleSubscriptionInclusion?.(course.id, v)}
                        />
                      </div>
                    ))}
                    {data.courses.filter(c => c.audience === selectedTier || (c.audience === "CLIENTS" && selectedTier === "CLIENTS")).length === 0 && (
                      <p className="text-center py-4 text-gray-500 text-sm">
                        No courses for this audience yet.
                      </p>
                    )}
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
                  {currentPlan ? (
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
                  ) : (
                    <p className="text-center py-8 text-gray-400">Configure a plan to see preview</p>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Plan Stats</h3>
                  {currentPlan ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Active Subscribers</span>
                        <span className="font-medium">{currentPlan.activeSubscribers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Courses Included</span>
                        <span className="font-medium">{currentPlan.includedCourses.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Est. Monthly Revenue</span>
                        <span className="font-medium text-green-600">
                          ${(currentPlan.activeSubscribers * currentPlan.monthlyPrice).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-400 text-sm">No stats available</p>
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
              {data.subscriptionPlans.map(plan => (
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
                        <p className="text-xs text-gray-500">{plan.activeSubscribers} members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {data.subscriptionPlans.length === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-500">
                      Create subscription plans first
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Full Screen Chat Area */}
            <div className="lg:col-span-3 h-full">
              {showChatForPlan ? (
                <Card className="border-0 shadow-sm h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{showChatForPlan.name} Community</h3>
                      <Badge className="bg-green-100 text-green-700">{showChatForPlan.activeSubscribers} members</Badge>
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
              
              {data.enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No enrollments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.enrollments.slice(0, 20).map(enrollment => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{enrollment.clientName}</p>
                          <p className="text-sm text-gray-500">{enrollment.course.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={enrollment.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                            {enrollment.status}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">{enrollment.progressPercent}% complete</p>
                        </div>
                        {enrollment.paidAmount !== null && (
                          <p className="font-semibold text-gray-900">${enrollment.paidAmount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Affiliate Links</h3>
              
              {data.affiliateLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No affiliate links yet</p>
                  <p className="text-sm mt-1">Teachers can create affiliate links for your courses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.affiliateLinks.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <LinkIcon className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{link.teacherName}</p>
                          <p className="text-sm text-gray-500">{link.courseName}</p>
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
                          <p className="font-semibold text-green-600">${link.totalEarnings.toFixed(2)}</p>
                          <p className="text-gray-500">Earned</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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



