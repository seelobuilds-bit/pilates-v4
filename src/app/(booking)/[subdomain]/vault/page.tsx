"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BookOpen,
  Loader2,
  Search,
  Users,
  Star,
  Play,
  Clock,
  CheckCircle,
  Lock,
  ArrowLeft
} from "lucide-react"

interface Course {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string
  thumbnailUrl: string | null
  audience: string
  category: string | null
  difficulty: string | null
  pricingType: string
  price: number
  subscriptionPrice: number | null
  subscriptionInterval: string | null
  accessType: string
  hasCommunity: boolean
  isPublished: boolean
  isFeatured: boolean
  enrollmentCount: number
  averageRating: number
  _count: {
    modules: number
    reviews: number
  }
  instructors: Array<{
    teacher: {
      user: { firstName: string; lastName: string }
    }
  }>
}

interface Studio {
  id: string
  name: string
  primaryColor: string | null
}

export default function ClientVaultPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get("ref")
  
  const [loading, setLoading] = useState(true)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [audienceFilter, setAudienceFilter] = useState("CLIENTS")

  useEffect(() => {
    fetchData()
    
    // Track affiliate click if code present
    if (affiliateCode) {
      fetch("/api/vault/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: affiliateCode, action: "click" })
      })
    }
  }, [affiliateCode])

  async function fetchData() {
    try {
      // Fetch studio info
      const studioRes = await fetch(`/api/booking/${resolvedParams.subdomain}/data`)
      if (studioRes.ok) {
        const data = await studioRes.json()
        setStudio(data.studio)
      }

      // Fetch published courses for this audience
      const coursesRes = await fetch(`/api/vault/courses?published=true`)
      if (coursesRes.ok) {
        const data = await coursesRes.json()
        // Filter to show only CLIENTS and ALL courses for clients
        const clientCourses = data.courses.filter(
          (c: Course) => c.audience === "CLIENTS" || c.audience === "ALL"
        )
        setCourses(clientCourses)
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error("Failed to fetch vault:", err)
    }
    setLoading(false)
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const featuredCourses = filteredCourses.filter(c => c.isFeatured)
  const regularCourses = filteredCourses.filter(c => !c.isFeatured)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href={`/${resolvedParams.subdomain}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to {studio?.name}
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">The Vault</h1>
          </div>
          <p className="text-lg text-white/80 max-w-2xl">
            Access exclusive courses, at-home workouts, and mentorship programs from {studio?.name}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
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

        {/* Featured Courses */}
        {featuredCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  subdomain={resolvedParams.subdomain}
                  affiliateCode={affiliateCode}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Courses */}
        {regularCourses.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  subdomain={resolvedParams.subdomain}
                  affiliateCode={affiliateCode}
                />
              ))}
            </div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available yet</h3>
              <p className="text-gray-500">Check back soon for new learning content</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function CourseCard({ 
  course, 
  subdomain, 
  affiliateCode 
}: { 
  course: Course
  subdomain: string
  affiliateCode: string | null
}) {
  const linkHref = affiliateCode 
    ? `/${subdomain}/vault/${course.slug}?ref=${affiliateCode}`
    : `/${subdomain}/vault/${course.slug}`

  return (
    <Card className="border-0 shadow-sm hover:shadow-lg transition-all group">
      <CardContent className="p-0">
        <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 relative rounded-t-lg overflow-hidden">
          {course.thumbnailUrl ? (
            <img 
              src={course.thumbnailUrl} 
              alt={course.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-white/50" />
            </div>
          )}
          {course.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500 text-white">
                <Star className="h-3 w-3 mr-1 fill-white" />
                Featured
              </Badge>
            </div>
          )}
          {course.pricingType === "FREE" && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500 text-white">Free</Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-violet-600 transition-colors">
            {course.title}
          </h3>
          {course.subtitle && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-1">{course.subtitle}</p>
          )}

          {/* Instructors */}
          {course.instructors.length > 0 && (
            <p className="text-sm text-gray-500 mb-3">
              By {course.instructors.map(i => `${i.teacher.user.firstName} ${i.teacher.user.lastName}`).join(", ")}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.enrollmentCount}
            </span>
            <span className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              {course._count.modules} modules
            </span>
            {course.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                {course.averageRating.toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              {course.pricingType === "FREE" ? (
                <span className="text-green-600 font-semibold">Free</span>
              ) : course.pricingType === "SUBSCRIPTION" ? (
                <div>
                  <span className="text-lg font-bold text-gray-900">${course.subscriptionPrice}</span>
                  <span className="text-sm text-gray-500">/{course.subscriptionInterval}</span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">${course.price}</span>
              )}
            </div>
            <Link href={linkHref}>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                View Course
              </Button>
            </Link>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {course.difficulty && (
              <Badge variant="secondary" className="text-xs">{course.difficulty}</Badge>
            )}
            {course.hasCommunity && (
              <Badge variant="secondary" className="text-xs">Community</Badge>
            )}
            {course.accessType === "LIFETIME" && (
              <Badge variant="secondary" className="text-xs">Lifetime Access</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
