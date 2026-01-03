"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseChat } from "@/components/vault/course-chat"
import {
  BookOpen,
  Loader2,
  Users,
  Star,
  Play,
  Clock,
  CheckCircle,
  Lock,
  ArrowLeft,
  MessageSquare,
  Award,
  Download,
  Share2,
  Heart
} from "lucide-react"

interface Course {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string
  thumbnailUrl: string | null
  promoVideoUrl: string | null
  audience: string
  category: string | null
  difficulty: string | null
  pricingType: string
  price: number
  subscriptionPrice: number | null
  subscriptionInterval: string | null
  accessType: string
  hasCommunity: boolean
  hasCertificate: boolean
  isPublished: boolean
  enrollmentCount: number
  averageRating: number
  totalLessons: number
  isEnrolled: boolean
  enrollment: {
    id: string
    status: string
    progressPercent: number
    progress: Array<{ lessonId: string; isCompleted: boolean }>
  } | null
  modules: Array<{
    id: string
    title: string
    description: string | null
    order: number
    lessons: Array<{
      id: string
      title: string
      description: string | null
      contentType: string
      videoDuration: number | null
      isPreview: boolean
      order: number
    }>
  }>
  instructors: Array<{
    role: string
    teacher: {
      user: { firstName: string; lastName: string }
    }
  }>
  chatRoom: { id: string; isEnabled: boolean } | null
  reviews: Array<{
    id: string
    rating: number
    title: string | null
    content: string | null
    client: { firstName: string; lastName: string } | null
    teacher: { user: { firstName: string; lastName: string } } | null
  }>
  studio: { name: string; subdomain: string }
}

export default function CourseDetailPage({ 
  params 
}: { 
  params: Promise<{ subdomain: string; slug: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get("ref")
  
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)

  useEffect(() => {
    fetchCourse()
  }, [resolvedParams.slug])

  async function fetchCourse() {
    try {
      // First get course ID by slug
      const coursesRes = await fetch(`/api/vault/courses?search=${resolvedParams.slug}`)
      if (coursesRes.ok) {
        const data = await coursesRes.json()
        const foundCourse = data.courses?.find((c: Course) => c.slug === resolvedParams.slug)
        
        if (foundCourse) {
          // Fetch full course details
          const detailRes = await fetch(`/api/vault/courses/${foundCourse.id}`)
          if (detailRes.ok) {
            const fullCourse = await detailRes.json()
            setCourse(fullCourse)
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch course:", err)
    }
    setLoading(false)
  }

  async function enroll() {
    if (!course) return
    
    setEnrolling(true)
    try {
      const res = await fetch("/api/vault/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          affiliateCode,
          paymentInfo: course.pricingType === "FREE" ? null : {
            amount: course.price,
            method: "card",
            transactionId: `demo_${Date.now()}`
          }
        })
      })

      if (res.ok) {
        // Refresh course data
        fetchCourse()
      }
    } catch (err) {
      console.error("Failed to enroll:", err)
    }
    setEnrolling(false)
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return ""
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h2>
          <Link href={`/${resolvedParams.subdomain}/vault`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vault
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const completedLessons = course.enrollment?.progress.filter(p => p.isCompleted).length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link 
            href={`/${resolvedParams.subdomain}/vault`} 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Vault
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                {course.category && (
                  <Badge className="bg-white/20 text-white">{course.category}</Badge>
                )}
                {course.difficulty && (
                  <Badge className="bg-white/20 text-white">{course.difficulty}</Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{course.title}</h1>
              {course.subtitle && (
                <p className="text-xl text-white/80 mb-4">{course.subtitle}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-white/80 mb-6">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.enrollmentCount} students
                </span>
                <span className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  {course.totalLessons} lessons
                </span>
                {course.averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {course.averageRating.toFixed(1)}
                  </span>
                )}
                {course.hasCertificate && (
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    Certificate
                  </span>
                )}
              </div>
              
              {/* Instructors */}
              {course.instructors.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60">By</span>
                  {course.instructors.map((inst, i) => (
                    <span key={i} className="font-medium">
                      {inst.teacher.user.firstName} {inst.teacher.user.lastName}
                      {i < course.instructors.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  {course.thumbnailUrl && (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title}
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  {course.isEnrolled ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Enrolled</span>
                        </div>
                        <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${course.enrollment?.progressPercent || 0}%` }}
                          />
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          {completedLessons} of {course.totalLessons} lessons completed
                        </p>
                      </div>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700">
                        Continue Learning
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        {course.pricingType === "FREE" ? (
                          <div className="text-3xl font-bold text-green-600">Free</div>
                        ) : course.pricingType === "SUBSCRIPTION" ? (
                          <div>
                            <span className="text-3xl font-bold text-gray-900">
                              ${course.subscriptionPrice}
                            </span>
                            <span className="text-gray-500">/{course.subscriptionInterval}</span>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-900">${course.price}</div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={enroll}
                        disabled={enrolling}
                        className="w-full bg-violet-600 hover:bg-violet-700"
                      >
                        {enrolling ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {course.pricingType === "FREE" ? "Enroll for Free" : "Enroll Now"}
                      </Button>
                      
                      {course.accessType === "LIFETIME" && (
                        <p className="text-xs text-center text-gray-500">
                          Lifetime access included
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="content">
              <BookOpen className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="overview">
              <Play className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            {course.hasCommunity && course.chatRoom?.isEnabled && (
              <TabsTrigger value="community">
                <MessageSquare className="h-4 w-4 mr-2" />
                Community
              </TabsTrigger>
            )}
            {course.reviews.length > 0 && (
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-2" />
                Reviews ({course.reviews.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {course.modules.length} modules • {course.totalLessons} lessons
                </p>
                
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border rounded-lg overflow-hidden">
                      <div className="p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-900">
                          Module {moduleIndex + 1}: {module.title}
                        </h4>
                        {module.description && (
                          <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                        )}
                      </div>
                      
                      <div className="divide-y">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const isCompleted = course.enrollment?.progress.some(
                            p => p.lessonId === lesson.id && p.isCompleted
                          )
                          const canAccess = course.isEnrolled || lesson.isPreview
                          
                          return (
                            <div 
                              key={lesson.id}
                              className={`p-4 flex items-center gap-4 ${canAccess ? "hover:bg-gray-50 cursor-pointer" : "opacity-60"}`}
                            >
                              <div className="w-8 h-8 flex items-center justify-center">
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : canAccess ? (
                                  <Play className="h-5 w-5 text-violet-600" />
                                ) : (
                                  <Lock className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Badge variant="secondary" className="text-xs">
                                    {lesson.contentType}
                                  </Badge>
                                  {lesson.videoDuration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(lesson.videoDuration)}
                                    </span>
                                  )}
                                  {lesson.isPreview && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                      Preview
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">About This Course</h3>
                <div className="prose prose-violet max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
                </div>
                
                {course.instructors.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <h4 className="font-semibold text-gray-900 mb-4">Instructors</h4>
                    <div className="space-y-4">
                      {course.instructors.map((inst, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-violet-700 font-medium">
                              {inst.teacher.user.firstName[0]}{inst.teacher.user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {inst.teacher.user.firstName} {inst.teacher.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{inst.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Community Tab */}
          {course.hasCommunity && course.chatRoom?.isEnabled && (
            <TabsContent value="community">
              {course.isEnrolled ? (
                <CourseChat courseId={course.id} courseName={course.title} />
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <Lock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Enroll to Join the Community
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Get access to the course community chat where you can connect with instructors and fellow students.
                    </p>
                    <Button onClick={enroll} disabled={enrolling} className="bg-violet-600 hover:bg-violet-700">
                      {course.pricingType === "FREE" ? "Enroll for Free" : "Enroll Now"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Reviews Tab */}
          {course.reviews.length > 0 && (
            <TabsContent value="reviews">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Student Reviews</h3>
                  <div className="space-y-4">
                    {course.reviews.map(review => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-gray-900">
                            {review.client 
                              ? `${review.client.firstName} ${review.client.lastName}`
                              : review.teacher
                              ? `${review.teacher.user.firstName} ${review.teacher.user.lastName}`
                              : "Anonymous"
                            }
                          </span>
                        </div>
                        {review.title && (
                          <p className="font-medium text-gray-900 mb-1">{review.title}</p>
                        )}
                        {review.content && (
                          <p className="text-gray-600">{review.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}












