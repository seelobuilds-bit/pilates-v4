"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Play, 
  FileText, 
  Video, 
  BookOpen,
  Plus,
  Loader2,
  Eye,
  CheckCircle,
  Star,
  GraduationCap,
  X,
  Upload,
  Link as LinkIcon,
  Trash2,
  Edit,
  ChevronRight,
  Award,
  File,
  Image as ImageIcon
} from "lucide-react"

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  isActive: boolean
  contents: Content[]
  _count: { contents: number }
}

interface Content {
  id: string
  title: string
  description: string | null
  type: "VIDEO" | "PDF" | "ARTICLE" | "QUIZ"
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
  videoUrl: string | null
  thumbnailUrl: string | null
  pdfUrl: string | null
  duration: number | null
  tags: string[]
  isPublished: boolean
  isFeatured: boolean
}

interface TrainingRequest {
  id: string
  title: string
  description: string
  trainingType: string
  status: "PENDING" | "APPROVED" | "SCHEDULED" | "COMPLETED" | "CANCELLED"
  preferredDate1: string | null
  scheduledDate: string | null
  contactName: string
  attendeeCount: number
  createdAt: string
  requestedBy: {
    user: { firstName: string; lastName: string }
  }
}

export default function ClassFlowsPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [trainingRequests, setTrainingRequests] = useState<TrainingRequest[]>([])
  const [stats, setStats] = useState({ totalViews: 0, completedCount: 0, pendingTrainingRequests: 0 })
  const [showAddContent, setShowAddContent] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    type: "VIDEO" as "VIDEO" | "PDF" | "ARTICLE",
    difficulty: "BEGINNER" as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
    categoryId: "",
    videoUrl: "",
    pdfUrl: "",
    thumbnailUrl: "",
    duration: 0,
    tags: "",
    isPublished: true,
    isFeatured: false
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    icon: "📚",
    color: "#7c3aed"
  })

  // Upload state
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadMode, setUploadMode] = useState<"upload" | "link">("upload")
  
  // File input refs
  const videoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  function isUploadedAsset(url: string | null | undefined): boolean {
    if (!url) return false
    return url.startsWith("/uploads") || url.startsWith("http://") || url.startsWith("https://")
  }

  async function handleFileUpload(file: File, type: "video" | "pdf" | "thumbnail") {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        return data.url
      } else {
        const error = await res.json()
        alert(error.error || "Upload failed")
        return null
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Upload failed")
      return null
    }
  }

  async function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingVideo(true)
    const url = await handleFileUpload(file, "video")
    if (url) {
      setNewContent({ ...newContent, videoUrl: url })
    }
    setUploadingVideo(false)
  }

  async function onPdfFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingPdf(true)
    const url = await handleFileUpload(file, "pdf")
    if (url) {
      setNewContent({ ...newContent, pdfUrl: url })
    }
    setUploadingPdf(false)
  }

  async function onThumbnailFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingThumbnail(true)
    const url = await handleFileUpload(file, "thumbnail")
    if (url) {
      setNewContent({ ...newContent, thumbnailUrl: url })
    }
    setUploadingThumbnail(false)
  }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/class-flows/admin")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setTrainingRequests(data.trainingRequests || [])
        setStats(data.stats || { totalViews: 0, completedCount: 0, pendingTrainingRequests: 0 })
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  async function createCategory() {
    setSaving(true)
    try {
      const res = await fetch("/api/studio/class-flows/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory)
      })
      if (res.ok) {
        setShowAddCategory(false)
        setNewCategory({ name: "", description: "", icon: "📚", color: "#7c3aed" })
        void fetchData()
      }
    } catch (error) {
      console.error("Failed to create category:", error)
    }
    setSaving(false)
  }

  async function createContent() {
    setSaving(true)
    try {
      const res = await fetch("/api/studio/class-flows/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newContent,
          tags: newContent.tags.split(",").map(t => t.trim()).filter(Boolean)
        })
      })
      if (res.ok) {
        setShowAddContent(false)
        setNewContent({
          title: "",
          description: "",
          type: "VIDEO",
          difficulty: "BEGINNER",
          categoryId: "",
          videoUrl: "",
          pdfUrl: "",
          thumbnailUrl: "",
          duration: 0,
          tags: "",
          isPublished: true,
          isFeatured: false
        })
        void fetchData()
      }
    } catch (error) {
      console.error("Failed to create content:", error)
    }
    setSaving(false)
  }

  async function deleteContent(id: string) {
    if (!confirm("Are you sure you want to delete this content?")) return
    
    try {
      await fetch(`/api/studio/class-flows/content?id=${id}`, { method: "DELETE" })
      void fetchData()
    } catch (error) {
      console.error("Failed to delete content:", error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return <Video className="h-4 w-4" />
      case "PDF": return <FileText className="h-4 w-4" />
      case "ARTICLE": return <BookOpen className="h-4 w-4" />
      default: return <Play className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER": return "bg-emerald-100 text-emerald-700"
      case "INTERMEDIATE": return "bg-blue-100 text-blue-700"
      case "ADVANCED": return "bg-amber-100 text-amber-700"
      case "EXPERT": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-700"
      case "APPROVED": return "bg-blue-100 text-blue-700"
      case "SCHEDULED": return "bg-violet-100 text-violet-700"
      case "COMPLETED": return "bg-emerald-100 text-emerald-700"
      case "CANCELLED": return "bg-gray-100 text-gray-500"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Flows</h1>
          <p className="text-gray-500">Manage training content and resources for your teachers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => setShowAddContent(true)} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCount}</p>
                <p className="text-sm text-gray-500">Completions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingTrainingRequests}</p>
                <p className="text-sm text-gray-500">Training Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="bg-white shadow-sm border-0">
          <TabsTrigger value="content" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Video className="h-4 w-4 mr-2" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <GraduationCap className="h-4 w-4 mr-2" />
            Training Requests
          </TabsTrigger>
        </TabsList>

        {/* Content Library Tab */}
        <TabsContent value="content" className="space-y-6">
          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-500 mb-4">Start by creating a category, then add videos and PDFs</p>
                <Button onClick={() => setShowAddCategory(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            categories.map(category => (
              <Card key={category.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon || "📚"}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category._count.contents} items</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setNewContent({ ...newContent, categoryId: category.id })
                        setShowAddContent(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Content
                    </Button>
                  </div>

                  {category.contents.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No content in this category yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.contents.map(content => (
                        <div 
                          key={content.id}
                          className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-video bg-gray-100 relative">
                            {content.thumbnailUrl ? (
                              <Image
                                src={content.thumbnailUrl} 
                                alt={content.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getTypeIcon(content.type)}
                              </div>
                            )}
                            {content.type === "VIDEO" && content.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {content.duration} min
                              </div>
                            )}
                            {content.isFeatured && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-amber-500">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Content Info */}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-medium text-gray-900 line-clamp-1">{content.title}</h4>
                              <Badge variant="secondary" className={getDifficultyColor(content.difficulty)}>
                                {content.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{content.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(content.type)}
                                <span className="text-xs text-gray-500 capitalize">{content.type.toLowerCase()}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => deleteContent(content.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {!content.isPublished && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                              <Badge variant="secondary">Draft</Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Training Requests Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Expert Training Requests</h3>
              </div>

              {trainingRequests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No training requests</h3>
                  <p className="text-gray-500">Teachers can request on-site expert training from here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainingRequests.map(request => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{request.title}</h4>
                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Requested by {request.requestedBy.user.firstName} {request.requestedBy.user.lastName} • 
                            {request.attendeeCount} attendee{request.attendeeCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {request.scheduledDate 
                              ? new Date(request.scheduledDate).toLocaleDateString()
                              : request.preferredDate1 
                                ? `Preferred: ${new Date(request.preferredDate1).toLocaleDateString()}`
                                : "No date set"
                            }
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Modal */}
      {showAddCategory && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddCategory(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">New Category</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddCategory(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Reformer Basics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Brief description of this category..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Icon (emoji)</Label>
                      <Input
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                        placeholder="📚"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                  <Button 
                    onClick={createCategory} 
                    disabled={saving || !newCategory.name}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Category"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Add Content Modal */}
      {showAddContent && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddContent(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Add Content</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddContent(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newContent.categoryId}
                        onValueChange={(value) => setNewContent({ ...newContent, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <Select
                        value={newContent.type}
                        onValueChange={(value) => setNewContent({ ...newContent, type: value as "VIDEO" | "PDF" | "ARTICLE" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIDEO">Video</SelectItem>
                          <SelectItem value="PDF">PDF Document</SelectItem>
                          <SelectItem value="ARTICLE">Article</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      placeholder="e.g., Introduction to Reformer Pilates"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newContent.description}
                      onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                      placeholder="Describe what this content covers..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={newContent.difficulty}
                        onValueChange={(value) => setNewContent({ ...newContent, difficulty: value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BEGINNER">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                          <SelectItem value="ADVANCED">Advanced</SelectItem>
                          <SelectItem value="EXPERT">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newContent.type === "VIDEO" && (
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={newContent.duration}
                          onChange={(e) => setNewContent({ ...newContent, duration: parseInt(e.target.value) || 0 })}
                          placeholder="30"
                        />
                      </div>
                    )}
                  </div>

                  {newContent.type === "VIDEO" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Video</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={uploadMode === "upload" ? "default" : "outline"}
                            onClick={() => setUploadMode("upload")}
                            className={uploadMode === "upload" ? "bg-violet-600" : ""}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={uploadMode === "link" ? "default" : "outline"}
                            onClick={() => setUploadMode("link")}
                            className={uploadMode === "link" ? "bg-violet-600" : ""}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Link
                          </Button>
                        </div>
                      </div>
                      
                      {uploadMode === "upload" ? (
                        <div>
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={onVideoFileChange}
                            className="hidden"
                          />
                          {isUploadedAsset(newContent.videoUrl) ? (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                              <Video className="h-5 w-5 text-emerald-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-emerald-700">Video uploaded</p>
                                <p className="text-xs text-emerald-600 truncate">{newContent.videoUrl}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setNewContent({ ...newContent, videoUrl: "" })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-24 border-dashed"
                              onClick={() => videoInputRef.current?.click()}
                              disabled={uploadingVideo}
                            >
                              {uploadingVideo ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                  <span>Uploading...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Upload className="h-6 w-6 mb-2" />
                                  <span>Click to upload video</span>
                                  <span className="text-xs text-gray-400">MP4, WebM, MOV (max 50MB)</span>
                                </div>
                              )}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Input
                          value={newContent.videoUrl}
                          onChange={(e) => setNewContent({ ...newContent, videoUrl: e.target.value })}
                          placeholder="https://youtube.com/watch?v=... or Vimeo URL"
                        />
                      )}
                    </div>
                  )}

                  {newContent.type === "PDF" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>PDF Document</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={uploadMode === "upload" ? "default" : "outline"}
                            onClick={() => setUploadMode("upload")}
                            className={uploadMode === "upload" ? "bg-violet-600" : ""}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={uploadMode === "link" ? "default" : "outline"}
                            onClick={() => setUploadMode("link")}
                            className={uploadMode === "link" ? "bg-violet-600" : ""}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Link
                          </Button>
                        </div>
                      </div>
                      
                      {uploadMode === "upload" ? (
                        <div>
                          <input
                            ref={pdfInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={onPdfFileChange}
                            className="hidden"
                          />
                          {isUploadedAsset(newContent.pdfUrl) ? (
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                              <FileText className="h-5 w-5 text-red-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-red-700">PDF uploaded</p>
                                <p className="text-xs text-red-600 truncate">{newContent.pdfUrl}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setNewContent({ ...newContent, pdfUrl: "" })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-24 border-dashed"
                              onClick={() => pdfInputRef.current?.click()}
                              disabled={uploadingPdf}
                            >
                              {uploadingPdf ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                  <span>Uploading...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <File className="h-6 w-6 mb-2" />
                                  <span>Click to upload PDF</span>
                                  <span className="text-xs text-gray-400">PDF files (max 10MB)</span>
                                </div>
                              )}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Input
                          value={newContent.pdfUrl}
                          onChange={(e) => setNewContent({ ...newContent, pdfUrl: e.target.value })}
                          placeholder="https://... (link to PDF file)"
                        />
                      )}
                    </div>
                  )}

                  {/* Thumbnail Upload */}
                  <div className="space-y-3">
                    <Label>Thumbnail (optional)</Label>
                    <div>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={onThumbnailFileChange}
                        className="hidden"
                      />
                      {newContent.thumbnailUrl ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          {isUploadedAsset(newContent.thumbnailUrl) ? (
                            <img
                              src={newContent.thumbnailUrl}
                              alt="Thumbnail"
                              className="w-16 h-10 object-cover rounded"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-700">
                              {isUploadedAsset(newContent.thumbnailUrl) ? "Thumbnail uploaded" : "Thumbnail URL set"}
                            </p>
                            <p className="text-xs text-blue-600 truncate">{newContent.thumbnailUrl}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setNewContent({ ...newContent, thumbnailUrl: "" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => thumbnailInputRef.current?.click()}
                            disabled={uploadingThumbnail}
                          >
                            {uploadingThumbnail ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload Image
                          </Button>
                          <Input
                            className="flex-1"
                            value={newContent.thumbnailUrl}
                            onChange={(e) => setNewContent({ ...newContent, thumbnailUrl: e.target.value })}
                            placeholder="Or paste URL..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={newContent.tags}
                      onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
                      placeholder="reformer, beginner, core"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newContent.isPublished}
                        onCheckedChange={(checked) => setNewContent({ ...newContent, isPublished: checked })}
                      />
                      <Label>Published</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newContent.isFeatured}
                        onCheckedChange={(checked) => setNewContent({ ...newContent, isFeatured: checked })}
                      />
                      <Label>Featured</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowAddContent(false)}>Cancel</Button>
                  <Button 
                    onClick={createContent} 
                    disabled={saving || !newContent.title || !newContent.categoryId}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Content"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}





















