"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  BookOpen,
  Plus,
  Loader2,
  Search,
  Users,
  DollarSign,
  Star,
  Play,
  Eye,
  Edit,
  LinkIcon,
  Copy,
  TrendingUp,
  MousePointer,
  ShoppingCart,
  Wallet,
  MessageSquare,
  GraduationCap,
  Home,
  Sparkles
} from "lucide-react"
import { SubscriptionChat } from "@/components/vault/subscription-chat"

interface Course {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string
  thumbnailUrl: string | null
  audience: string
  category: string | null
  pricingType: string
  price: number
  subscriptionPrice: number | null
  affiliateEnabled: boolean
  affiliateCommission: number
  isPublished: boolean
  enrollmentCount: number
  averageRating: number
  includeInSubscription?: boolean
  _count: {
    modules: number
    enrollments: number
  }
  creator: { user: { firstName: string; lastName: string } } | null
}

interface MyCourse {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  isPublished: boolean
  enrollmentCount: number
  audience: string
  _count: { modules: number }
}

interface AffiliateLink {
  id: string
  code: string
  clicks: number
  conversions: number
  totalEarnings: number
  isActive: boolean
  customCommission: number | null
  course: { 
    id: string
    title: string
    price: number
    affiliateCommission: number
    slug: string
  }
  sales: Array<{
    id: string
    saleAmount: number
    commissionAmount: number
    status: string
    createdAt: string
  }>
}

interface SubscriptionPlan {
  id: string
  name: string
  audience: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS"
  activeSubscribers: number
  communityChat: { id: string; isEnabled: boolean } | null
  includedCourses?: Course[]
}

export default function TeacherVaultPage() {
  const [loading, setLoading] = useState(true)
  const [myCourses, setMyCourses] = useState<MyCourse[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [audienceFilter, setAudienceFilter] = useState<string>("all")
  
  // Subscription plans with their courses
  const [, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [allSubscriptionCourses, setAllSubscriptionCourses] = useState<Course[]>([])
  
  // Create course modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: "",
    subtitle: "",
    description: "",
    audience: "CLIENTS",
    category: "",
    difficulty: "Beginner",
    pricingType: "SUBSCRIPTION",
    price: 0,
    hasCommunity: true,
    affiliateEnabled: true,
    affiliateCommission: 20,
    includeInSubscription: true
  })

  // Create affiliate link modal
  const [showAffiliateLinkModal, setShowAffiliateLinkModal] = useState(false)
  const [selectedCourseForAffiliate, setSelectedCourseForAffiliate] = useState<Course | null>(null)
  const [creatingLink, setCreatingLink] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    myCourses: 0,
    totalStudents: 0,
    affiliateEarnings: 0,
    pendingPayout: 0,
    totalClicks: 0,
    totalConversions: 0
  })

  // Community state
  const [communityPlans, setCommunityPlans] = useState<SubscriptionPlan[]>([])
  const [selectedCommunityPlan, setSelectedCommunityPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [myCoursesRes, affiliatesRes, subscriptionRes] = await Promise.all([
        fetch("/api/vault/courses?myCreated=true"),
        fetch("/api/vault/affiliates?myLinks=true"),
        fetch("/api/vault/subscription")
      ])

      if (myCoursesRes.ok) {
        const data = await myCoursesRes.json()
        setMyCourses(data.courses || [])
        const totalStudents = data.courses.reduce((sum: number, c: Course) => sum + c.enrollmentCount, 0)
        setStats(s => ({ ...s, myCourses: data.courses.length, totalStudents }))
      }

      if (affiliatesRes.ok) {
        const data = await affiliatesRes.json()
        setAffiliateLinks(data.affiliateLinks || [])
        setStats(s => ({
          ...s,
          affiliateEarnings: data.stats?.totalEarnings || 0,
          pendingPayout: data.stats?.pendingPayout || 0,
          totalClicks: data.stats?.totalClicks || 0,
          totalConversions: data.stats?.totalConversions || 0
        }))
      }

      // Fetch subscription plans with courses (Teachers and Clients only)
      if (subscriptionRes.ok) {
        const data = await subscriptionRes.json()
        console.log("[Vault] Raw subscription data:", data)
        
        const plans = (data.plans || []).filter((p: SubscriptionPlan) => 
          p.audience === "TEACHERS" || p.audience === "CLIENTS"
        )
        console.log("[Vault] Filtered plans (TEACHERS/CLIENTS):", plans.length, plans.map((p: SubscriptionPlan) => ({ name: p.name, audience: p.audience, hasChat: !!p.communityChat })))
        
        setSubscriptionPlans(plans)
        
        // Combine all courses from TEACHERS and CLIENTS plans
        const allCourses: Course[] = []
        plans.forEach((plan: SubscriptionPlan) => {
          if (plan.includedCourses) {
            plan.includedCourses.forEach((course: Course) => {
              if (!allCourses.some(c => c.id === course.id)) {
                allCourses.push({ ...course, audience: plan.audience })
              }
            })
          }
        })
        setAllSubscriptionCourses(allCourses)
        
        // Set up community plans
        const communityEnabledPlans = plans.filter((p: SubscriptionPlan) => p.communityChat?.isEnabled)
        console.log("[Vault] Community enabled plans:", communityEnabledPlans.length, communityEnabledPlans.map((p: SubscriptionPlan) => p.name))
        
        setCommunityPlans(communityEnabledPlans)
        if (communityEnabledPlans.length > 0) {
          setSelectedCommunityPlan(communityEnabledPlans[0])
          console.log("[Vault] Selected community plan:", communityEnabledPlans[0].name, communityEnabledPlans[0].id)
        }
      } else {
        console.log("[Vault] Subscription fetch failed:", subscriptionRes.status)
      }
    } catch (err) {
      console.error("Failed to fetch vault data:", err)
    }
    setLoading(false)
  }

  async function createCourse() {
    setCreating(true)
    try {
      const res = await fetch("/api/vault/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse)
      })

      if (res.ok) {
        const course = await res.json()
        setMyCourses([course, ...myCourses])
        setShowCreateModal(false)
        setNewCourse({
          title: "",
          subtitle: "",
          description: "",
          audience: "CLIENTS",
          category: "",
          difficulty: "Beginner",
          pricingType: "SUBSCRIPTION",
          price: 0,
          hasCommunity: true,
          affiliateEnabled: true,
          affiliateCommission: 20,
          includeInSubscription: true
        })
        // Refresh data to update subscription courses
        fetchData()
      }
    } catch (err) {
      console.error("Failed to create course:", err)
    }
    setCreating(false)
  }

  async function createAffiliateLink() {
    if (!selectedCourseForAffiliate) return
    
    setCreatingLink(true)
    try {
      const res = await fetch("/api/vault/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseForAffiliate.id })
      })

      if (res.ok) {
        const link = await res.json()
        setAffiliateLinks([link, ...affiliateLinks])
        setShowAffiliateLinkModal(false)
        setSelectedCourseForAffiliate(null)
      }
    } catch (err) {
      console.error("Failed to create affiliate link:", err)
    }
    setCreatingLink(false)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  // Filter subscription courses
  const filteredSubscriptionCourses = allSubscriptionCourses.filter(course => {
    const matchesSearch = !searchQuery || course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAudience = audienceFilter === "all" || course.audience === audienceFilter
    return matchesSearch && matchesAudience
  })

  // Get courses available for affiliate
  const availableForAffiliate = allSubscriptionCourses.filter(
    c => c.affiliateEnabled && !affiliateLinks.some(l => l.course.id === c.id)
  )

  if (loading) {
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
          <p className="text-gray-500 mt-1">Create courses for the subscription and earn affiliate commissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.myCourses}</p>
                <p className="text-sm text-gray-500">My Courses</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-sm text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.affiliateEarnings.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Affiliate Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.pendingPayout.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Pending Payout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="subscription-courses" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="subscription-courses">
            <Sparkles className="h-4 w-4 mr-2" />
            Subscription Courses
          </TabsTrigger>
          <TabsTrigger value="my-courses">
            <BookOpen className="h-4 w-4 mr-2" />
            My Courses
          </TabsTrigger>
          <TabsTrigger value="community">
            <MessageSquare className="h-4 w-4 mr-2" />
            Community
          </TabsTrigger>
          <TabsTrigger value="affiliates">
            <LinkIcon className="h-4 w-4 mr-2" />
            Affiliate Links
          </TabsTrigger>
        </TabsList>

        {/* Subscription Courses Tab */}
        <TabsContent value="subscription-courses">
          <div className="space-y-4">
            {/* Info Banner */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-violet-900">Subscription Vault Access</p>
                    <p className="text-sm text-violet-700 mt-0.5">
                      You have access to all courses in the Teacher and Client (At-Home) subscription packages. 
                      You can also add your own courses to share with the community.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="TEACHERS">Teacher Courses</SelectItem>
                  <SelectItem value="CLIENTS">Client (At-Home)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Grid */}
            {filteredSubscriptionCourses.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-500 mb-4">Be the first to add a course to the subscription vault</p>
                  <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubscriptionCourses.map(course => (
                  <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 relative rounded-t-lg">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover rounded-t-lg" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-white/50" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge className={course.audience === "TEACHERS" ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"}>
                            {course.audience === "TEACHERS" ? (
                              <><GraduationCap className="h-3 w-3 mr-1" /> Teacher</>
                            ) : (
                              <><Home className="h-3 w-3 mr-1" /> At-Home</>
                            )}
                          </Badge>
                        </div>
                        {course.affiliateEnabled && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white text-xs">
                              {course.affiliateCommission}% Commission
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                        {course.subtitle && (
                          <p className="text-sm text-gray-500 mb-2 line-clamp-1">{course.subtitle}</p>
                        )}
                        
                        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.enrollmentCount || 0} enrolled
                          </span>
                          {course.averageRating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              {course.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/teacher/vault/${course.id}`} className="flex-1">
                            <Button variant="outline" className="w-full" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          {course.affiliateEnabled && !affiliateLinks.some(l => l.course.id === course.id) && (
                            <Button 
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedCourseForAffiliate(course)
                                setShowAffiliateLinkModal(true)
                              }}
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* My Courses Tab */}
        <TabsContent value="my-courses">
          {myCourses.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-500 mb-4">Create your first course to add to the subscription vault</p>
                <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCourses.map(course => (
                <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 relative rounded-t-lg">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover rounded-t-lg" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className={course.audience === "TEACHERS" ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"}>
                          {course.audience === "TEACHERS" ? "Teacher" : "At-Home"}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        {course.isPublished ? (
                          <Badge className="bg-green-500 text-white">Published</Badge>
                        ) : (
                          <Badge className="bg-gray-500 text-white">Draft</Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrollmentCount} students
                        </span>
                        <span className="flex items-center gap-1">
                          <Play className="h-4 w-4" />
                          {course._count.modules} modules
                        </span>
                      </div>
                      <Link href={`/teacher/vault/${course.id}`}>
                        <Button className="w-full bg-violet-600 hover:bg-violet-700">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Course
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: "calc(100vh - 350px)" }}>
            {/* Community Selector */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Communities</h3>
              
              {communityPlans.map(plan => (
                <Card 
                  key={plan.id} 
                  className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                    selectedCommunityPlan?.id === plan.id 
                      ? "ring-2 ring-violet-500 bg-violet-50" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCommunityPlan(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan.audience === "TEACHERS" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                      }`}>
                        {plan.audience === "TEACHERS" ? (
                          <GraduationCap className="h-5 w-5" />
                        ) : (
                          <Home className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">{plan.name}</h4>
                        <p className="text-xs text-gray-500">
                          {plan.audience === "TEACHERS" ? "Teacher Community" : "Client (At-Home)"}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          {plan.activeSubscribers} members
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {communityPlans.length === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-900">No communities available</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Contact HQ to set up community chats
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  💡 <strong>Teacher Access:</strong> You have access to both teacher and client communities to connect and support.
                </p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3 h-full min-h-[500px]">
              {selectedCommunityPlan ? (
                <SubscriptionChat 
                  planId={selectedCommunityPlan.id} 
                  planName={selectedCommunityPlan.name}
                  audience={selectedCommunityPlan.audience}
                />
              ) : (
                <Card className="border-0 shadow-sm h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                    <h4 className="font-medium text-gray-900 mb-1">Select a Community</h4>
                    <p className="text-sm text-gray-500">
                      Choose a community from the left to join the conversation
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Affiliate Links Tab */}
        <TabsContent value="affiliates" className="space-y-6">
          {/* Affiliate Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-pink-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Clicks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalClicks}</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conversions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalConversions}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalClicks > 0 ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create new affiliate link */}
          {availableForAffiliate.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Create Affiliate Link</h3>
                    <p className="text-sm text-gray-500">Earn commissions by promoting courses</p>
                  </div>
                  <Select onValueChange={(id) => {
                    const course = allSubscriptionCourses.find(c => c.id === id)
                    if (course) {
                      setSelectedCourseForAffiliate(course)
                      setShowAffiliateLinkModal(true)
                    }
                  }}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForAffiliate.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title} ({course.affiliateCommission}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affiliate Links List */}
          {affiliateLinks.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <LinkIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No affiliate links yet</h3>
                <p className="text-gray-500">Create affiliate links to earn commissions on course sales</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {affiliateLinks.map(link => (
                <Card key={link.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                          <LinkIcon className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{link.course.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {link.code}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(`${window.location.origin}/vault/${link.course.slug}?ref=${link.code}`)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{link.clicks}</p>
                          <p className="text-gray-500">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{link.conversions}</p>
                          <p className="text-gray-500">Sales</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {link.customCommission ?? link.course.affiliateCommission}%
                          </p>
                          <p className="text-gray-500">Commission</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">${link.totalEarnings.toFixed(2)}</p>
                          <p className="text-gray-500">Earned</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Course Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Course to Subscription Vault</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Course Title *</Label>
              <Input
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder="e.g., At-Home Pilates for Beginners"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={newCourse.subtitle}
                onChange={(e) => setNewCourse({ ...newCourse, subtitle: e.target.value })}
                placeholder="A brief tagline"
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="What will students learn?"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience *</Label>
                <Select value={newCourse.audience} onValueChange={(v) => setNewCourse({ ...newCourse, audience: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENTS">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-emerald-600" />
                        Clients (At-Home)
                      </div>
                    </SelectItem>
                    <SelectItem value="TEACHERS">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        Teachers
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  placeholder="e.g., At-Home Workouts"
                />
              </div>
            </div>

            <div className="p-4 bg-violet-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-violet-900">Include in Subscription</p>
                  <p className="text-sm text-violet-700">This course will be available to all subscribers</p>
                </div>
                <Switch
                  checked={newCourse.includeInSubscription}
                  onCheckedChange={(v) => setNewCourse({ ...newCourse, includeInSubscription: v })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Community Chat</p>
                <p className="text-sm text-gray-500">Enable group chat for students</p>
              </div>
              <Switch
                checked={newCourse.hasCommunity}
                onCheckedChange={(v) => setNewCourse({ ...newCourse, hasCommunity: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createCourse}
              disabled={creating || !newCourse.title || !newCourse.description}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Affiliate Link Modal */}
      <Dialog open={showAffiliateLinkModal} onOpenChange={setShowAffiliateLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Affiliate Link</DialogTitle>
          </DialogHeader>
          
          {selectedCourseForAffiliate && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900">{selectedCourseForAffiliate.title}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Price: ${selectedCourseForAffiliate.price}</span>
                  <span>Commission: {selectedCourseForAffiliate.affiliateCommission}%</span>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  You&apos;ll earn ${((selectedCourseForAffiliate.price * selectedCourseForAffiliate.affiliateCommission) / 100).toFixed(2)} per sale
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Your unique affiliate link will be generated automatically. Share it to earn commissions on every sale.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAffiliateLinkModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createAffiliateLink}
              disabled={creatingLink}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {creatingLink ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}












