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
  CheckCircle,
  TrendingUp,
  ExternalLink,
  MousePointer,
  ShoppingCart,
  Wallet,
  MessageSquare,
  GraduationCap,
  Home
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

interface Enrollment {
  id: string
  status: string
  progressPercent: number
  enrolledAt: string
  course: {
    id: string
    title: string
    slug: string
    thumbnailUrl: string | null
  }
}

export default function TeacherVaultPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [myCourses, setMyCourses] = useState<MyCourse[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
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
    pricingType: "ONE_TIME",
    price: 0,
    hasCommunity: true,
    affiliateEnabled: true,
    affiliateCommission: 20
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
  interface SubscriptionPlan {
    id: string
    name: string
    audience: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS"
    activeSubscribers: number
    communityChat: { id: string; isEnabled: boolean } | null
  }
  const [communityPlans, setCommunityPlans] = useState<SubscriptionPlan[]>([])
  const [selectedCommunityPlan, setSelectedCommunityPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [coursesRes, myCoursesRes, affiliatesRes, enrollmentsRes, communityRes] = await Promise.all([
        fetch("/api/vault/courses?published=true"),
        fetch("/api/vault/courses?myCreated=true"),
        fetch("/api/vault/affiliates?myLinks=true"),
        fetch("/api/vault/enrollments?myEnrollments=true"),
        fetch("/api/vault/subscription")
      ])

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || [])
      }

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

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json()
        setMyEnrollments(data.enrollments || [])
      }

      // Fetch community plans (Teachers have access to Teachers and Clients communities)
      if (communityRes.ok) {
        const data = await communityRes.json()
        const plans = (data.plans || []).filter((p: SubscriptionPlan) => 
          (p.audience === "TEACHERS" || p.audience === "CLIENTS") && p.communityChat?.isEnabled
        )
        setCommunityPlans(plans)
        // Auto-select first plan
        if (plans.length > 0) {
          setSelectedCommunityPlan(plans[0])
        }
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
          pricingType: "ONE_TIME",
          price: 0,
          hasCommunity: true,
          affiliateEnabled: true,
          affiliateCommission: 20
        })
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

  // Get courses user doesn't have affiliate link for
  const availableForAffiliate = courses.filter(
    c => c.affiliateEnabled && !affiliateLinks.some(l => l.course.id === c.id)
  )

  // Filter courses
  const filteredCourses = courses.filter(course => 
    !searchQuery || course.title.toLowerCase().includes(searchQuery.toLowerCase())
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
          <p className="text-gray-500 mt-1">Create courses, earn affiliate commissions, and learn</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Course
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
      <Tabs defaultValue="my-courses" className="space-y-6">
        <TabsList className="bg-white border">
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
          <TabsTrigger value="browse">
            <Search className="h-4 w-4 mr-2" />
            Browse Courses
          </TabsTrigger>
          <TabsTrigger value="my-learning">
            <Play className="h-4 w-4 mr-2" />
            My Learning
          </TabsTrigger>
        </TabsList>

        {/* My Courses Tab */}
        <TabsContent value="my-courses">
          {myCourses.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-500 mb-4">Create your first course to share your expertise</p>
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
                    const course = courses.find(c => c.id === id)
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

        {/* Browse Courses Tab */}
        <TabsContent value="browse">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredCourses.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-500">Check back later for new courses</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map(course => (
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
                        {course.affiliateEnabled && (
                          <div className="absolute top-2 left-2">
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
                        
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-amber-100 text-amber-700">
                            {course.pricingType === "FREE" ? "Free" : `$${course.price}`}
                          </Badge>
                          {course.averageRating > 0 && (
                            <span className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              {course.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/vault/${course.slug}`} className="flex-1">
                            <Button variant="outline" className="w-full" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          {course.affiliateEnabled && !affiliateLinks.some(l => l.course.id === course.id) && (
                            <Button 
                              size="sm"
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

        {/* My Learning Tab */}
        <TabsContent value="my-learning">
          {myEnrollments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Play className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
                <p className="text-gray-500 mb-4">Start learning by enrolling in a course</p>
                <Button onClick={() => {
                  const tabTrigger = document.querySelector('[data-state="inactive"][value="browse"]') as HTMLButtonElement
                  tabTrigger?.click()
                }} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEnrollments.map(enrollment => (
                <Card key={enrollment.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 relative rounded-t-lg">
                      {enrollment.course.thumbnailUrl ? (
                        <img src={enrollment.course.thumbnailUrl} alt={enrollment.course.title} className="w-full h-full object-cover rounded-t-lg" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{enrollment.course.title}</h3>
                      
                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium">{enrollment.progressPercent}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-600 transition-all" 
                            style={{ width: `${enrollment.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <Link href={`/vault/${enrollment.course.slug}/learn`}>
                        <Button className="w-full bg-violet-600 hover:bg-violet-700">
                          <Play className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                      </Link>
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
            <DialogTitle>Create New Course</DialogTitle>
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
                <Label>Target Audience</Label>
                <Select value={newCourse.audience} onValueChange={(v) => setNewCourse({ ...newCourse, audience: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENTS">Clients</SelectItem>
                    <SelectItem value="TEACHERS">Teachers</SelectItem>
                    <SelectItem value="STUDIO_OWNERS">Studio Owners</SelectItem>
                    <SelectItem value="ALL">Everyone</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pricing</Label>
                <Select value={newCourse.pricingType} onValueChange={(v) => setNewCourse({ ...newCourse, pricingType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="ONE_TIME">One-Time</SelectItem>
                    <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCourse.pricingType !== "FREE" && (
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              )}
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



