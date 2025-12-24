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
import { SubscriptionChat } from "@/components/vault/subscription-chat"
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
  Trash2,
  Filter,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Award,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Clock,
  Target,
  Crown,
  Lock,
  Unlock,
  CreditCard,
  Repeat,
  Save
} from "lucide-react"

interface Course {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string
  thumbnailUrl: string | null
  audience: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS" | "ALL"
  category: string | null
  difficulty: string | null
  pricingType: "FREE" | "ONE_TIME" | "SUBSCRIPTION" | "BUNDLE"
  price: number
  subscriptionPrice: number | null
  subscriptionInterval: string | null
  accessType: "LIFETIME" | "TIME_LIMITED" | "DRIP"
  affiliateEnabled: boolean
  affiliateCommission: number
  isPublished: boolean
  isFeatured: boolean
  includeInSubscription: boolean
  enrollmentCount: number
  averageRating: number
  _count: {
    modules: number
    enrollments: number
    reviews: number
  }
  creator: {
    user: { firstName: string; lastName: string }
  } | null
  instructors: Array<{
    teacher: {
      user: { firstName: string; lastName: string }
    }
  }>
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  audience: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS"
  monthlyPrice: number
  quarterlyPrice: number | null
  yearlyPrice: number | null
  features: string[]
  includesClasses: boolean
  classCreditsPerMonth: number | null
  isActive: boolean
  activeSubscribers: number
  includedCourses: Array<{ id: string; title: string }>
  communityChat: { id: string; isEnabled: boolean } | null
}

interface Enrollment {
  id: string
  status: string
  enrolledAt: string
  progressPercent: number
  paidAmount: number | null
  course: {
    id: string
    title: string
    price: number
  }
  client: { firstName: string; lastName: string; email: string } | null
  teacher: { user: { firstName: string; lastName: string } } | null
  user: { firstName: string; lastName: string } | null
}

interface AffiliateLink {
  id: string
  code: string
  clicks: number
  conversions: number
  totalEarnings: number
  isActive: boolean
  course: { title: string; price: number; affiliateCommission: number }
  teacher: { user: { firstName: string; lastName: string } }
}

export default function StudioVaultPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [categories, setCategories] = useState<string[]>([])
  
  // Subscription Plans (3 tiers)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [selectedTier, setSelectedTier] = useState<"STUDIO_OWNERS" | "TEACHERS" | "CLIENTS">("CLIENTS")
  const [editingPlan, setEditingPlan] = useState({
    audience: "CLIENTS" as "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS",
    name: "",
    description: "",
    monthlyPrice: 49,
    quarterlyPrice: 129,
    yearlyPrice: 399,
    features: [] as string[],
    includesClasses: false,
    classCreditsPerMonth: 0
  })
  const [savingPlan, setSavingPlan] = useState(false)
  const [newFeature, setNewFeature] = useState("")
  const [showChatForPlan, setShowChatForPlan] = useState<SubscriptionPlan | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [audienceFilter, setAudienceFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  
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
    subscriptionInterval: "monthly",
    subscriptionPrice: 0,
    accessType: "LIFETIME",
    accessDays: 30,
    affiliateEnabled: true,
    affiliateCommission: 20,
    includeInSubscription: false
  })

  // Stats
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    activeStudents: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [coursesRes, enrollmentsRes, affiliatesRes, subRes] = await Promise.all([
        fetch("/api/vault/courses"),
        fetch("/api/vault/enrollments"),
        fetch("/api/vault/affiliates"),
        fetch("/api/vault/subscription")
      ])

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || [])
        setCategories(data.categories || [])
        
        // Calculate stats
        const published = data.courses.filter((c: Course) => c.isPublished).length
        setStats(s => ({ ...s, totalCourses: data.courses.length, publishedCourses: published }))
      }

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json()
        setEnrollments(data.enrollments || [])
        setStats(s => ({
          ...s,
          totalEnrollments: data.stats?.total || 0,
          totalRevenue: data.stats?.totalRevenue || 0,
          activeStudents: data.stats?.active || 0
        }))
      }

      if (affiliatesRes.ok) {
        const data = await affiliatesRes.json()
        setAffiliateLinks(data.affiliateLinks || [])
      }

      if (subRes.ok) {
        const data = await subRes.json()
        setSubscriptionPlans(data.plans || [])
        
        // Set initial editing plan from selected tier
        const currentPlan = data.plans?.find((p: SubscriptionPlan) => p.audience === selectedTier)
        if (currentPlan) {
          setEditingPlan({
            audience: currentPlan.audience,
            name: currentPlan.name,
            description: currentPlan.description,
            monthlyPrice: currentPlan.monthlyPrice,
            quarterlyPrice: currentPlan.quarterlyPrice || 0,
            yearlyPrice: currentPlan.yearlyPrice || 0,
            features: currentPlan.features || [],
            includesClasses: currentPlan.includesClasses,
            classCreditsPerMonth: currentPlan.classCreditsPerMonth || 0
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch vault data:", err)
    }
    setLoading(false)
  }

  async function createCourse() {
    if (!newCourse.title.trim()) {
      alert("Please enter a course title")
      return
    }
    if (!newCourse.description.trim()) {
      alert("Please enter a course description")
      return
    }
    
    setCreating(true)
    try {
      const res = await fetch("/api/vault/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse)
      })

      if (res.ok) {
        const course = await res.json()
        setCourses([course, ...courses])
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
          subscriptionInterval: "monthly",
          subscriptionPrice: 0,
          accessType: "LIFETIME",
          accessDays: 30,
          affiliateEnabled: true,
          affiliateCommission: 20,
          includeInSubscription: false
        })
      } else {
        const error = await res.json()
        console.error("Course creation failed:", error)
        alert(error.error || "Failed to create course")
      }
    } catch (err) {
      console.error("Failed to create course:", err)
      alert("Failed to create course. Please try again.")
    }
    setCreating(false)
  }

  async function togglePublish(courseId: string, isPublished: boolean) {
    try {
      const res = await fetch(`/api/vault/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished })
      })

      if (res.ok) {
        setCourses(courses.map(c => 
          c.id === courseId ? { ...c, isPublished: !isPublished } : c
        ))
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err)
    }
  }

  async function toggleSubscriptionInclusion(courseId: string, include: boolean) {
    try {
      const res = await fetch("/api/vault/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, includeInSubscription: include })
      })

      if (res.ok) {
        setCourses(courses.map(c => 
          c.id === courseId ? { ...c, includeInSubscription: include } : c
        ))
      }
    } catch (err) {
      console.error("Failed to toggle subscription inclusion:", err)
    }
  }

  async function saveSubscriptionPlan() {
    setSavingPlan(true)
    try {
      const res = await fetch("/api/vault/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan)
      })

      if (res.ok) {
        // Refresh plans
        const plansRes = await fetch("/api/vault/subscription")
        if (plansRes.ok) {
          const data = await plansRes.json()
          setSubscriptionPlans(data.plans || [])
        }
      }
    } catch (err) {
      console.error("Failed to save subscription plan:", err)
    }
    setSavingPlan(false)
  }
  
  function selectTier(tier: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS") {
    setSelectedTier(tier)
    const existingPlan = subscriptionPlans.find(p => p.audience === tier)
    if (existingPlan) {
      setEditingPlan({
        audience: tier,
        name: existingPlan.name,
        description: existingPlan.description,
        monthlyPrice: existingPlan.monthlyPrice,
        quarterlyPrice: existingPlan.quarterlyPrice || 0,
        yearlyPrice: existingPlan.yearlyPrice || 0,
        features: existingPlan.features || [],
        includesClasses: existingPlan.includesClasses,
        classCreditsPerMonth: existingPlan.classCreditsPerMonth || 0
      })
    } else {
      // Default values for new tier
      const defaults: Record<string, { name: string; description: string }> = {
        STUDIO_OWNERS: {
          name: "Studio Owner Vault",
          description: "Exclusive business growth courses and community for studio owners."
        },
        TEACHERS: {
          name: "Teacher Vault",
          description: "Advanced teaching skills and career development for Pilates instructors."
        },
        CLIENTS: {
          name: "At-Home Vault",
          description: "Unlimited at-home workouts and community support for your fitness journey."
        }
      }
      setEditingPlan({
        audience: tier,
        name: defaults[tier].name,
        description: defaults[tier].description,
        monthlyPrice: tier === "STUDIO_OWNERS" ? 99 : tier === "TEACHERS" ? 49 : 29,
        quarterlyPrice: tier === "STUDIO_OWNERS" ? 249 : tier === "TEACHERS" ? 129 : 79,
        yearlyPrice: tier === "STUDIO_OWNERS" ? 799 : tier === "TEACHERS" ? 399 : 249,
        features: ["Access to all courses", "Community chat", "New content weekly"],
        includesClasses: false,
        classCreditsPerMonth: 0
      })
    }
  }

  function addFeature() {
    if (newFeature.trim()) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, newFeature.trim()]
      })
      setNewFeature("")
    }
  }

  function removeFeature(index: number) {
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index)
    })
  }

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
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAudience = audienceFilter === "all" || course.audience === audienceFilter
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesAudience && matchesCategory
  })

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
          <p className="text-gray-500 mt-1">Create and manage courses for owners, teachers, and clients</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
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
                <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Audiences</SelectItem>
                    <SelectItem value="STUDIO_OWNERS">Studio Owners</SelectItem>
                    <SelectItem value="TEACHERS">Teachers</SelectItem>
                    <SelectItem value="CLIENTS">Clients</SelectItem>
                    <SelectItem value="ALL">Everyone</SelectItem>
                  </SelectContent>
                </Select>
                {categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
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
                        <Link href={`/studio/vault/${course.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublish(course.id, course.isPublished)}
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
                <strong className="text-violet-600"> Click a tier below, fill in the details, and click Save to create it.</strong>
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
              const plan = subscriptionPlans.find(p => p.audience === tier.key)
              return (
                <Card 
                  key={tier.key}
                  className={`border-2 cursor-pointer transition-all ${
                    selectedTier === tier.key 
                      ? `border-${tier.color}-500 bg-${tier.color}-50` 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => selectTier(tier.key)}
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
                    <Badge className={subscriptionPlans.find(p => p.audience === selectedTier) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {subscriptionPlans.find(p => p.audience === selectedTier) ? "Active" : "Not Set Up"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Plan Name</Label>
                      <Input
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        placeholder="e.g., Studio Owner Vault"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editingPlan.description}
                        onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                        placeholder="Describe what subscribers get..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Monthly ($)</Label>
                        <Input
                          type="number"
                          value={editingPlan.monthlyPrice}
                          onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quarterly ($)</Label>
                        <Input
                          type="number"
                          value={editingPlan.quarterlyPrice}
                          onChange={(e) => setEditingPlan({ ...editingPlan, quarterlyPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Yearly ($)</Label>
                        <Input
                          type="number"
                          value={editingPlan.yearlyPrice}
                          onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Features (bullet points)</Label>
                      <div className="space-y-2">
                        {editingPlan.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input value={feature} disabled className="flex-1" />
                            <Button variant="ghost" size="sm" onClick={() => removeFeature(i)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <Input
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Add a feature..."
                            onKeyPress={(e) => e.key === "Enter" && addFeature()}
                          />
                          <Button variant="outline" size="sm" onClick={addFeature}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={saveSubscriptionPlan} 
                      disabled={savingPlan || !editingPlan.name}
                      className={`w-full ${subscriptionPlans.find(p => p.audience === selectedTier) 
                        ? "bg-violet-600 hover:bg-violet-700" 
                        : "bg-green-600 hover:bg-green-700"}`}
                      size="lg"
                    >
                      {savingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      {subscriptionPlans.find(p => p.audience === selectedTier) 
                        ? `Update ${selectedTier === "STUDIO_OWNERS" ? "Studio Owners" : selectedTier === "TEACHERS" ? "Teachers" : "At-Home"} Community`
                        : `Create ${selectedTier === "STUDIO_OWNERS" ? "Studio Owners" : selectedTier === "TEACHERS" ? "Teachers" : "At-Home"} Community`}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Courses for this tier */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Courses for {selectedTier === "STUDIO_OWNERS" ? "Studio Owners" : selectedTier === "TEACHERS" ? "Teachers" : "At-Home Members"}</h3>
                  <p className="text-sm text-gray-500 mb-4">Courses with matching audience will be included in this subscription</p>
                  
                  <div className="space-y-3">
                    {courses.filter(c => c.audience === selectedTier || c.audience === "ALL").map(course => (
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
                          onCheckedChange={(v) => toggleSubscriptionInclusion(course.id, v)}
                        />
                      </div>
                    ))}
                    {courses.filter(c => c.audience === selectedTier || c.audience === "ALL").length === 0 && (
                      <p className="text-center py-4 text-gray-500 text-sm">
                        No courses for this audience yet. Create courses with the &quot;{selectedTier === "STUDIO_OWNERS" ? "Studio Owners" : selectedTier === "TEACHERS" ? "Teachers" : "Clients"}&quot; audience.
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
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{editingPlan.name || "Plan Name"}</h4>
                  <p className="text-gray-600 text-sm mb-4">{editingPlan.description || "Plan description..."}</p>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-violet-600">${editingPlan.monthlyPrice}</span>
                    <span className="text-gray-500">/month</span>
                  </div>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Community chat access
                    </li>
                    {editingPlan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full bg-violet-600 hover:bg-violet-700" disabled>
                    Subscribe (Preview)
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Plan Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Active Subscribers</span>
                      <span className="font-medium">{subscriptionPlans.find(p => p.audience === selectedTier)?.activeSubscribers || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Courses Included</span>
                      <span className="font-medium">{courses.filter(c => c.audience === selectedTier && c.includeInSubscription).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Est. Monthly Revenue</span>
                      <span className="font-medium text-green-600">
                        ${((subscriptionPlans.find(p => p.audience === selectedTier)?.activeSubscribers || 0) * editingPlan.monthlyPrice).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
            {/* Chat Selector Sidebar */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Communities</h3>
              {subscriptionPlans.map(plan => (
                <Card 
                  key={plan.id} 
                  className={`border-0 shadow-sm cursor-pointer transition-all ${
                    showChatForPlan?.id === plan.id 
                      ? "ring-2 ring-violet-500 bg-violet-50" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => plan.communityChat && setShowChatForPlan(plan)}
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
                      {!plan.communityChat && (
                        <Badge variant="secondary" className="text-xs">No Chat</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {subscriptionPlans.length === 0 && (
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
                <div className="h-full">
                  <SubscriptionChat 
                    planId={showChatForPlan.id} 
                    planName={showChatForPlan.name}
                    audience={showChatForPlan.audience}
                  />
                </div>
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
              
              {enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No enrollments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 20).map(enrollment => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {enrollment.client 
                              ? `${enrollment.client.firstName} ${enrollment.client.lastName}`
                              : enrollment.teacher
                              ? `${enrollment.teacher.user.firstName} ${enrollment.teacher.user.lastName}`
                              : enrollment.user
                              ? `${enrollment.user.firstName} ${enrollment.user.lastName}`
                              : "Unknown"
                            }
                          </p>
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
              
              {affiliateLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No affiliate links yet</p>
                  <p className="text-sm mt-1">Teachers can create affiliate links for your courses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {affiliateLinks.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <LinkIcon className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {link.teacher.user.firstName} {link.teacher.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{link.course.title}</p>
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

      {/* Create Course Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Basic Information</h4>
              
              <div className="space-y-2">
                <Label>Course Title *</Label>
                <Input
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g., How to Grow Your Pilates Studio"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={newCourse.subtitle}
                  onChange={(e) => setNewCourse({ ...newCourse, subtitle: e.target.value })}
                  placeholder="A brief tagline for your course"
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Describe what students will learn..."
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
                      <SelectItem value="STUDIO_OWNERS">Studio Owners</SelectItem>
                      <SelectItem value="TEACHERS">Teachers</SelectItem>
                      <SelectItem value="CLIENTS">Clients</SelectItem>
                      <SelectItem value="ALL">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    placeholder="e.g., Business Growth"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={newCourse.difficulty} onValueChange={(v) => setNewCourse({ ...newCourse, difficulty: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900">Pricing</h4>
              
              <div className="space-y-2">
                <Label>Pricing Model</Label>
                <Select value={newCourse.pricingType} onValueChange={(v) => setNewCourse({ ...newCourse, pricingType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="ONE_TIME">One-Time Purchase</SelectItem>
                    <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCourse.pricingType === "ONE_TIME" && (
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

              {newCourse.pricingType === "SUBSCRIPTION" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subscription Price ($)</Label>
                    <Input
                      type="number"
                      value={newCourse.subscriptionPrice}
                      onChange={(e) => setNewCourse({ ...newCourse, subscriptionPrice: parseFloat(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Interval</Label>
                    <Select value={newCourse.subscriptionInterval} onValueChange={(v) => setNewCourse({ ...newCourse, subscriptionInterval: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Access & Features */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900">Access & Features</h4>
              
              <div className="space-y-2">
                <Label>Access Type</Label>
                <Select value={newCourse.accessType} onValueChange={(v) => setNewCourse({ ...newCourse, accessType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIFETIME">Lifetime Access</SelectItem>
                    <SelectItem value="TIME_LIMITED">Time Limited</SelectItem>
                    <SelectItem value="DRIP">Drip Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCourse.accessType === "TIME_LIMITED" && (
                <div className="space-y-2">
                  <Label>Access Duration (days)</Label>
                  <Input
                    type="number"
                    value={newCourse.accessDays}
                    onChange={(e) => setNewCourse({ ...newCourse, accessDays: parseInt(e.target.value) || 30 })}
                    min={1}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Include in Subscription</p>
                  <p className="text-sm text-gray-500">Include this course in the subscription vault for its audience</p>
                </div>
                <Switch
                  checked={newCourse.includeInSubscription}
                  onCheckedChange={(v) => setNewCourse({ ...newCourse, includeInSubscription: v })}
                />
              </div>
              
              {newCourse.includeInSubscription && (
                <p className="text-sm text-violet-600 bg-violet-50 p-2 rounded">
                  <Crown className="h-4 w-4 inline mr-1" />
                  Subscribers of the {newCourse.audience === "STUDIO_OWNERS" ? "Studio Owners" : newCourse.audience === "TEACHERS" ? "Teachers" : "At-Home"} vault will get access
                </p>
              )}
              
              <p className="text-xs text-gray-400 mt-2">
                Note: Community chat is only available for subscription members, not individual course purchases.
              </p>
            </div>

            {/* Affiliates */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900">Affiliate Program</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Enable Affiliates</p>
                  <p className="text-sm text-gray-500">Allow teachers to earn commissions</p>
                </div>
                <Switch
                  checked={newCourse.affiliateEnabled}
                  onCheckedChange={(v) => setNewCourse({ ...newCourse, affiliateEnabled: v })}
                />
              </div>

              {newCourse.affiliateEnabled && (
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    value={newCourse.affiliateCommission}
                    onChange={(e) => setNewCourse({ ...newCourse, affiliateCommission: parseFloat(e.target.value) || 20 })}
                    min={0}
                    max={100}
                  />
                </div>
              )}
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
    </div>
  )
}
