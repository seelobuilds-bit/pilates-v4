"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
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
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  Lock,
  Clock,
  Award
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
  hasCommunity: boolean
  hasCertificate: boolean
  isPublished: boolean
  enrollmentCount: number
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
}

export default function TeacherVaultCoursePage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const resolvedParams = use(params)
  
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)

  useEffect(() => {
    fetchCourse()
  }, [resolvedParams.courseId])

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/vault/courses/${resolvedParams.courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
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
          paymentInfo: course.pricingType === "FREE" ? null : {
            amount: course.price,
            method: "card",
            transactionId: `teacher_${Date.now()}`
          }
        })
      })

      if (res.ok) {
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
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h2>
          <Link href="/teacher/vault">
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
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher/vault">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          {course.subtitle && (
            <p className="text-gray-500">{course.subtitle}</p>
          )}
        </div>
        {!course.isEnrolled && (
          <Button onClick={enroll} disabled={enrolling} className="bg-violet-600 hover:bg-violet-700">
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {course.pricingType === "FREE" ? "Enroll for Free" : `Enroll - $${course.price}`}
          </Button>
        )}
      </div>

      {/* Progress Card (if enrolled) */}
      {course.isEnrolled && (
        <Card className="border-0 shadow-sm mb-6 bg-gradient-to-r from-violet-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You&apos;re Enrolled</span>
                </div>
                <p className="text-sm text-gray-600">
                  {completedLessons} of {course.totalLessons} lessons completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-violet-600">{course.enrollment?.progressPercent || 0}%</p>
                <p className="text-sm text-gray-500">Progress</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-600 transition-all"
                style={{ width: `${course.enrollment?.progressPercent || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue={course.isEnrolled ? "learn" : "overview"} className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          {course.isEnrolled && (
            <TabsTrigger value="learn">
              <Play className="h-4 w-4 mr-2" />
              Learn
            </TabsTrigger>
          )}
          {course.isEnrolled && course.hasCommunity && course.chatRoom?.isEnabled && (
            <TabsTrigger value="community">
              <MessageSquare className="h-4 w-4 mr-2" />
              Community
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">About This Course</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
                  
                  {course.instructors.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Instructors</h4>
                      <div className="space-y-3">
                        {course.instructors.map((inst, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <span className="text-violet-700 font-medium text-sm">
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
            </div>

            <div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Course Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span>{course.enrollmentCount} students</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Play className="h-5 w-5 text-gray-400" />
                      <span>{course.totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                      <span>{course.modules.length} modules</span>
                    </div>
                    {course.difficulty && (
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-gray-400" />
                        <span>{course.difficulty}</span>
                      </div>
                    )}
                    {course.hasCertificate && (
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-gray-400" />
                        <span>Certificate included</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Learn Tab */}
        {course.isEnrolled && (
          <TabsContent value="learn">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
                
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
                          
                          return (
                            <div 
                              key={lesson.id}
                              className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="w-8 h-8 flex items-center justify-center">
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Play className="h-5 w-5 text-violet-600" />
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
        )}

        {/* Community Tab */}
        {course.isEnrolled && course.hasCommunity && course.chatRoom?.isEnabled && (
          <TabsContent value="community">
            <CourseChat courseId={course.id} courseName={course.title} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}















