"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { CourseChat } from "@/components/vault/course-chat"
import {
  BookOpen,
  Loader2,
  Users,
  Star,
  Play,
  ArrowLeft,
  MessageSquare,
  Settings,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Crown
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
  affiliateEnabled: boolean
  affiliateCommission: number
  isPublished: boolean
  isFeatured: boolean
  includeInSubscription: boolean
  enrollmentCount: number
  totalLessons: number
  modules: Array<{
    id: string
    title: string
    description: string | null
    order: number
    isPublished: boolean
    lessons: Array<{
      id: string
      title: string
      contentType: string
      videoDuration: number | null
      isPreview: boolean
      isPublished: boolean
      order: number
    }>
  }>
  instructors: Array<{
    id: string
    role: string
    teacher: {
      id: string
      user: { firstName: string; lastName: string }
    }
  }>
  chatRoom: { id: string; isEnabled: boolean } | null
  _count: { enrollments: number; modules: number }
}

export default function StudioVaultCoursePage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  
  // Edit state
  const [editedCourse, setEditedCourse] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    difficulty: "",
    price: 0,
    hasCommunity: true,
    hasCertificate: false,
    affiliateEnabled: true,
    affiliateCommission: 20,
    includeInSubscription: false
  })

  useEffect(() => {
    fetchCourse()
  }, [resolvedParams.courseId])

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/vault/courses/${resolvedParams.courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
        setEditedCourse({
          title: data.title,
          subtitle: data.subtitle || "",
          description: data.description,
          category: data.category || "",
          difficulty: data.difficulty || "",
          price: data.price,
          hasCommunity: data.hasCommunity,
          hasCertificate: data.hasCertificate,
          affiliateEnabled: data.affiliateEnabled,
          affiliateCommission: data.affiliateCommission,
          includeInSubscription: data.includeInSubscription
        })
      }
    } catch (err) {
      console.error("Failed to fetch course:", err)
    }
    setLoading(false)
  }

  async function saveCourse() {
    if (!course) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/vault/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedCourse)
      })

      if (res.ok) {
        const updated = await res.json()
        setCourse({ ...course, ...updated })
      }
    } catch (err) {
      console.error("Failed to save course:", err)
    }
    setSaving(false)
  }

  async function togglePublish() {
    if (!course) return
    
    try {
      const res = await fetch(`/api/vault/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished })
      })

      if (res.ok) {
        setCourse({ ...course, isPublished: !course.isPublished })
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err)
    }
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
          <Link href="/studio/vault">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vault
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/studio/vault">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
              {course.includeInSubscription && (
                <Badge className="bg-violet-100 text-violet-700">
                  <Crown className="h-3 w-3 mr-1" />
                  In Subscription
                </Badge>
              )}
              <span className="text-sm text-gray-500">
                {course.enrollmentCount} students • {course.totalLessons} lessons
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={togglePublish}>
            <Eye className="h-4 w-4 mr-2" />
            {course.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={saveCourse} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="content">
            <BookOpen className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          {course.hasCommunity && (
            <TabsTrigger value="community">
              <MessageSquare className="h-4 w-4 mr-2" />
              Community Chat
            </TabsTrigger>
          )}
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editedCourse.title}
                    onChange={(e) => setEditedCourse({ ...editedCourse, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={editedCourse.subtitle}
                    onChange={(e) => setEditedCourse({ ...editedCourse, subtitle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editedCourse.description}
                    onChange={(e) => setEditedCourse({ ...editedCourse, description: e.target.value })}
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={editedCourse.category}
                      onChange={(e) => setEditedCourse({ ...editedCourse, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Input
                      value={editedCourse.difficulty}
                      onChange={(e) => setEditedCourse({ ...editedCourse, difficulty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={editedCourse.price}
                    onChange={(e) => setEditedCourse({ ...editedCourse, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Features & Settings</h3>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Include in Subscription</p>
                    <p className="text-sm text-gray-500">Available to vault subscribers</p>
                  </div>
                  <Switch
                    checked={editedCourse.includeInSubscription}
                    onCheckedChange={(v) => setEditedCourse({ ...editedCourse, includeInSubscription: v })}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Community Chat</p>
                    <p className="text-sm text-gray-500">Enable group chat for students</p>
                  </div>
                  <Switch
                    checked={editedCourse.hasCommunity}
                    onCheckedChange={(v) => setEditedCourse({ ...editedCourse, hasCommunity: v })}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Certificate</p>
                    <p className="text-sm text-gray-500">Award certificate on completion</p>
                  </div>
                  <Switch
                    checked={editedCourse.hasCertificate}
                    onCheckedChange={(v) => setEditedCourse({ ...editedCourse, hasCertificate: v })}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Affiliate Program</p>
                    <p className="text-sm text-gray-500">Allow teachers to earn commissions</p>
                  </div>
                  <Switch
                    checked={editedCourse.affiliateEnabled}
                    onCheckedChange={(v) => setEditedCourse({ ...editedCourse, affiliateEnabled: v })}
                  />
                </div>

                {editedCourse.affiliateEnabled && (
                  <div className="space-y-2">
                    <Label>Commission Rate (%)</Label>
                    <Input
                      type="number"
                      value={editedCourse.affiliateCommission}
                      onChange={(e) => setEditedCourse({ ...editedCourse, affiliateCommission: parseFloat(e.target.value) || 20 })}
                      min={0}
                      max={100}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Course Content</h3>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
              
              {course.modules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No modules yet</p>
                  <p className="text-sm">Add modules and lessons to build your course</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.modules.map((module, i) => (
                    <div key={module.id} className="border rounded-lg">
                      <div className="p-4 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div>
                            <h4 className="font-medium">Module {i + 1}: {module.title}</h4>
                            <p className="text-sm text-gray-500">{module.lessons.length} lessons</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={module.isPublished ? "default" : "secondary"}>
                            {module.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {module.lessons.length > 0 && (
                        <div className="divide-y">
                          {module.lessons.map((lesson, j) => (
                            <div key={lesson.id} className="p-3 pl-12 flex items-center justify-between hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400">{j + 1}.</span>
                                <div>
                                  <p className="font-medium text-sm">{lesson.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Badge variant="secondary" className="text-xs">{lesson.contentType}</Badge>
                                    {lesson.isPreview && <Badge className="bg-green-100 text-green-700 text-xs">Preview</Badge>}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Enrolled Students</h3>
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{course.enrollmentCount} students enrolled</p>
                <p className="text-sm">Student management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Chat Tab */}
        {course.hasCommunity && (
          <TabsContent value="community">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CourseChat courseId={course.id} courseName={course.title} />
              </div>
              <div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Chat Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Chat Enabled</p>
                          <p className="text-sm text-gray-500">Allow members to chat</p>
                        </div>
                        <Switch checked={course.chatRoom?.isEnabled} />
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-2">As the course owner, you can:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Post announcements</li>
                          <li>• Pin important messages</li>
                          <li>• Moderate discussions</li>
                          <li>• Mute or ban members</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}














