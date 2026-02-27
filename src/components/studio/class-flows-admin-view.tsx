"use client"

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
  contactEmail: string
  contactPhone?: string | null
  attendeeCount: number
  notes?: string | null
  createdAt: string
  requestedBy: {
    id: string
    user: { firstName: string; lastName: string }
  }
}

interface TeacherOption {
  id: string
  name: string
}

type ClassFlowsAdminViewProps = {
  adminEndpoint: string
  contentEndpoint?: string
  trainingRequestEndpoint?: string
  uploadEndpoint?: string
  readOnly?: boolean
}

const CLASS_FLOW_REQUEST_TYPE = "class-flow-request"

function getRequestKind(trainingType: string): "CLASS_FLOW" | "TRAINING" {
  return trainingType === CLASS_FLOW_REQUEST_TYPE ? "CLASS_FLOW" : "TRAINING"
}

export default function ClassFlowsAdminView({
  adminEndpoint,
  contentEndpoint = "/api/studio/class-flows/content",
  trainingRequestEndpoint = "/api/class-flows/training-requests",
  uploadEndpoint = "/api/upload",
  readOnly = false,
}: ClassFlowsAdminViewProps) {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [trainingRequests, setTrainingRequests] = useState<TrainingRequest[]>([])
  const [stats, setStats] = useState({ totalViews: 0, completedCount: 0, pendingTrainingRequests: 0 })
  const [showAddContent, setShowAddContent] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingContentId, setEditingContentId] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [showTrainingRequest, setShowTrainingRequest] = useState(false)
  const [submittingTrainingRequest, setSubmittingTrainingRequest] = useState(false)
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Form state
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    type: "VIDEO" as "VIDEO" | "PDF" | "ARTICLE" | "QUIZ",
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

  const [trainingForm, setTrainingForm] = useState({
    title: "",
    description: "",
    trainingType: "",
    preferredDate1: "",
    preferredDate2: "",
    preferredDate3: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    location: "",
    address: "",
    attendeeCount: 1,
    notes: "",
    requestedById: ""
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

  function showReadOnlyNotice() {
    alert("Demo mode is read-only.")
  }

  function toDateInputValue(value: string | null | undefined) {
    if (!value) return ""
    return value.slice(0, 10)
  }

  function isUploadedAsset(url: string | null | undefined): boolean {
    if (!url) return false
    return url.startsWith("/uploads") || url.startsWith("http://") || url.startsWith("https://")
  }

  async function handleFileUpload(file: File, type: "video" | "pdf" | "thumbnail") {
    if (readOnly) {
      showReadOnlyNotice()
      return null
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    try {
      const res = await fetch(uploadEndpoint, {
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
      const res = await fetch(adminEndpoint)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setTrainingRequests(data.trainingRequests || [])
        setStats(data.stats || { totalViews: 0, completedCount: 0, pendingTrainingRequests: 0 })
        setTeachers(data.teachers || [])
        const initialCategories = data.categories || []
        if (initialCategories.length > 0) {
          setSelectedCategory((previous) => {
            if (previous && initialCategories.some((category: Category) => category.id === previous)) {
              return previous
            }
            return initialCategories[0].id
          })
        } else {
          setSelectedCategory("")
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
    setLoading(false)
  }, [adminEndpoint])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  async function createCategory() {
    if (readOnly) {
      showReadOnlyNotice()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(adminEndpoint, {
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
    if (readOnly) {
      showReadOnlyNotice()
      return
    }

    setSaving(true)
    try {
      const isEditing = Boolean(editingContentId)
      const res = await fetch(contentEndpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingContentId } : {}),
          ...newContent,
          tags: newContent.tags.split(",").map(t => t.trim()).filter(Boolean)
        })
      })
      if (res.ok) {
        closeContentModal()
        void fetchData()
      }
    } catch (error) {
      console.error("Failed to create content:", error)
    }
    setSaving(false)
  }

  function resetNewContent() {
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
    setEditingContentId(null)
    setUploadMode("upload")
  }

  function closeContentModal() {
    setShowAddContent(false)
    resetNewContent()
  }

  function startAddContent(categoryId?: string) {
    resetNewContent()
    if (categoryId) {
      setNewContent((previous) => ({ ...previous, categoryId }))
    }
    setShowAddContent(true)
  }

  function startEditContent(content: Content, categoryId: string) {
    setEditingContentId(content.id)
    setUploadMode("upload")
    setNewContent({
      title: content.title,
      description: content.description || "",
      type: content.type,
      difficulty: content.difficulty,
      categoryId,
      videoUrl: content.videoUrl || "",
      pdfUrl: content.pdfUrl || "",
      thumbnailUrl: content.thumbnailUrl || "",
      duration: content.duration || 0,
      tags: content.tags.join(", "),
      isPublished: content.isPublished,
      isFeatured: content.isFeatured
    })
    setShowAddContent(true)
  }

  async function deleteContent(id: string) {
    if (readOnly) {
      showReadOnlyNotice()
      return
    }

    if (!confirm("Are you sure you want to delete this content?")) return
    
    try {
      await fetch(`${contentEndpoint}?id=${id}`, { method: "DELETE" })
      void fetchData()
    } catch (error) {
      console.error("Failed to delete content:", error)
    }
  }

  async function submitTrainingRequest() {
    if (readOnly) {
      showReadOnlyNotice()
      return
    }

    setSubmittingTrainingRequest(true)
    try {
      const res = await fetch(trainingRequestEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainingForm)
      })
      if (res.ok) {
        setShowTrainingRequest(false)
        setTrainingForm({
          title: "",
          description: "",
          trainingType: "",
          preferredDate1: "",
          preferredDate2: "",
          preferredDate3: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          location: "",
          address: "",
          attendeeCount: 1,
          notes: "",
          requestedById: ""
        })
        void fetchData()
      }
    } catch (error) {
      console.error("Failed to submit training request:", error)
    } finally {
      setSubmittingTrainingRequest(false)
    }
  }

  async function approveRequestAndContinue(request: TrainingRequest) {
    if (readOnly) {
      showReadOnlyNotice()
      return
    }

    setApprovingRequestId(request.id)
    try {
      const res = await fetch(trainingRequestEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          status: "APPROVED",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to approve request")
      }

      const requestKind = getRequestKind(request.trainingType)

      if (requestKind === "CLASS_FLOW") {
        const targetCategoryId = selectedCategory || categories[0]?.id || ""
        if (!targetCategoryId) {
          setNewCategory((prev) => ({
            ...prev,
            name: request.title.slice(0, 60),
            description: request.description,
          }))
          setShowAddCategory(true)
        } else {
          resetNewContent()
          setNewContent((prev) => ({
            ...prev,
            categoryId: targetCategoryId,
            title: request.title,
            description: request.description,
            tags: "teacher-request",
          }))
          setShowAddContent(true)
        }
      } else {
        setTrainingForm({
          title: request.title,
          description: request.description,
          trainingType: request.trainingType || "custom",
          preferredDate1: toDateInputValue(request.preferredDate1),
          preferredDate2: "",
          preferredDate3: "",
          contactName: request.contactName,
          contactEmail: request.contactEmail,
          contactPhone: request.contactPhone || "",
          location: "",
          address: "",
          attendeeCount: Math.max(1, request.attendeeCount || 1),
          notes: request.notes || "",
          requestedById: request.requestedBy.id,
        })
        setShowTrainingRequest(true)
      }

      setTrainingRequests((prev) =>
        prev.map((item) => (item.id === request.id ? { ...item, status: "APPROVED" } : item))
      )
    } catch (error) {
      console.error("Failed to approve request:", error)
      alert(error instanceof Error ? error.message : "Failed to approve request")
    } finally {
      setApprovingRequestId(null)
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
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const activeCategory = categories.find((category) => category.id === selectedCategory) ?? categories[0] ?? null
  const activeCategoryContents = activeCategory?.contents ?? []

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Flows</h1>
          <p className="text-gray-500">Manage your training content and teacher development</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              if (readOnly) {
                showReadOnlyNotice()
                return
              }
              setShowTrainingRequest(true)
            }}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Training Requests
            <Badge className="ml-2 bg-violet-100 text-violet-700">{stats.pendingTrainingRequests}</Badge>
          </Button>
          <Button
            onClick={() => {
              if (readOnly) {
                showReadOnlyNotice()
                return
              }
              startAddContent()
            }}
            className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1">
          <TabsTrigger value="content" className="shrink-0">Content Library</TabsTrigger>
          <TabsTrigger value="training" className="shrink-0">Training Requests</TabsTrigger>
        </TabsList>

        {/* Content Library Tab */}
        <TabsContent value="content" className="space-y-6">
          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-500 mb-4">Start by creating a category, then add videos and PDFs</p>
                <Button
                  onClick={() => {
                    if (readOnly) {
                      showReadOnlyNotice()
                      return
                    }
                    setShowAddCategory(true)
                  }}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {readOnly ? "Read-only demo" : "Create First Category"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Categories</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (readOnly) {
                          showReadOnlyNotice()
                          return
                        }
                        setShowAddCategory(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          activeCategory?.id === category.id
                            ? "bg-violet-50 border-2 border-violet-200"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{category.icon || "📚"}</span>
                            <div>
                              <p className="font-medium text-gray-900">{category.name}</p>
                              <p className="text-xs text-gray-500">{category._count.contents} items</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold">
                      {activeCategory?.name || "Select a category"}
                    </h3>
                    <Button
                      size="sm"
                      className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
                      onClick={() => {
                        if (readOnly) {
                          showReadOnlyNotice()
                          return
                        }
                        if (activeCategory?.id) startAddContent(activeCategory.id)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Content
                    </Button>
                  </div>
                  {activeCategoryContents.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No content in this category yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCategoryContents.map((content) => (
                        <div key={content.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4 sm:items-center">
                              <div className={`p-2 rounded-lg ${content.type === "VIDEO" ? "bg-blue-100" : "bg-amber-100"}`}>
                                {content.type === "VIDEO" ? (
                                  <Video className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <FileText className="h-5 w-5 text-amber-600" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{content.title}</p>
                                  {content.isFeatured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                  {!content.isPublished && <Badge variant="secondary">Draft</Badge>}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(content.difficulty)}`}>
                                    {content.difficulty}
                                  </Badge>
                                  {content.duration && (
                                    <span className="text-xs text-gray-500">
                                      {content.duration} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditContent(content, activeCategory?.id ?? "")}
                              >
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Training Requests Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Team Requests</h3>
                </div>
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
                  onClick={() => {
                    if (readOnly) {
                      showReadOnlyNotice()
                      return
                    }
                    setShowTrainingRequest(true)
                  }}
                  disabled={teachers.length === 0}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Request Training
                </Button>
              </div>

              {trainingRequests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No training requests</h3>
                  <p className="text-gray-500">Create the first on-site expert training request for your team.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainingRequests.map(request => (
                    <div 
                      key={request.id}
                      className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4 sm:items-center">
                        <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-gray-900">{request.title}</h4>
                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                            <Badge variant="outline">
                              {getRequestKind(request.trainingType) === "CLASS_FLOW" ? "Class Flow Request" : "Training Request"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Requested by {request.requestedBy.user.firstName} {request.requestedBy.user.lastName} • 
                            {request.attendeeCount} attendee{request.attendeeCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-gray-500">
                            {request.scheduledDate 
                              ? new Date(request.scheduledDate).toLocaleDateString()
                              : request.preferredDate1 
                                ? `Preferred: ${new Date(request.preferredDate1).toLocaleDateString()}`
                                : "No date set"
                            }
                          </p>
                        </div>
                        {request.status === "PENDING" && !readOnly ? (
                          <Button
                            size="sm"
                            className="shrink-0 bg-violet-600 hover:bg-violet-700"
                            onClick={() => void approveRequestAndContinue(request)}
                            disabled={approvingRequestId === request.id}
                          >
                            {approvingRequestId === request.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            {getRequestKind(request.trainingType) === "CLASS_FLOW" ? "Approve & Add Content" : "Approve & Book Training"}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="shrink-0" disabled>
                            View Details
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Training Request Modal */}
      {showTrainingRequest && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowTrainingRequest(false)} />
          <div className="fixed top-1/2 left-1/2 z-50 w-full max-h-[90vh] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto px-4">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="mb-6 flex items-start justify-between gap-3 sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Request Expert Training</h3>
                      <p className="text-sm text-gray-500">Create a request for your studio team</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowTrainingRequest(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Requested For Teacher</Label>
                    <Select
                      value={trainingForm.requestedById}
                      onValueChange={(value) => setTrainingForm({ ...trainingForm, requestedById: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Training Title</Label>
                    <Input
                      value={trainingForm.title}
                      onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                      placeholder="e.g., Advanced Reformer Certification"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Training Type</Label>
                    <Select
                      value={trainingForm.trainingType}
                      onValueChange={(value) => setTrainingForm({ ...trainingForm, trainingType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select training type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reformer-basics">Reformer Basics</SelectItem>
                        <SelectItem value="reformer-advanced">Reformer Advanced</SelectItem>
                        <SelectItem value="mat-certification">Mat Certification</SelectItem>
                        <SelectItem value="tower-training">Tower Training</SelectItem>
                        <SelectItem value="prenatal">Prenatal Pilates</SelectItem>
                        <SelectItem value="rehabilitation">Rehabilitation Focus</SelectItem>
                        <SelectItem value="custom">Custom Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={trainingForm.description}
                      onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                      placeholder="Describe what you'd like to cover..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Preferred Date 1</Label>
                      <Input
                        type="date"
                        value={trainingForm.preferredDate1}
                        onChange={(e) => setTrainingForm({ ...trainingForm, preferredDate1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Date 2</Label>
                      <Input
                        type="date"
                        value={trainingForm.preferredDate2}
                        onChange={(e) => setTrainingForm({ ...trainingForm, preferredDate2: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Date 3</Label>
                      <Input
                        type="date"
                        value={trainingForm.preferredDate3}
                        onChange={(e) => setTrainingForm({ ...trainingForm, preferredDate3: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        value={trainingForm.contactName}
                        onChange={(e) => setTrainingForm({ ...trainingForm, contactName: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Attendees</Label>
                      <Input
                        type="number"
                        value={trainingForm.attendeeCount}
                        onChange={(e) => setTrainingForm({ ...trainingForm, attendeeCount: parseInt(e.target.value, 10) || 1 })}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={trainingForm.contactEmail}
                        onChange={(e) => setTrainingForm({ ...trainingForm, contactEmail: e.target.value })}
                        placeholder="owner@studio.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone (optional)</Label>
                      <Input
                        value={trainingForm.contactPhone}
                        onChange={(e) => setTrainingForm({ ...trainingForm, contactPhone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Training Location</Label>
                    <Input
                      value={trainingForm.location}
                      onChange={(e) => setTrainingForm({ ...trainingForm, location: e.target.value })}
                      placeholder="Studio name or location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Address</Label>
                    <Textarea
                      value={trainingForm.address}
                      onChange={(e) => setTrainingForm({ ...trainingForm, address: e.target.value })}
                      placeholder="Street address, city, state, zip"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Notes (optional)</Label>
                    <Textarea
                      value={trainingForm.notes}
                      onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                      placeholder="Anything else the expert should know..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setShowTrainingRequest(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    onClick={submitTrainingRequest}
                    disabled={
                      submittingTrainingRequest ||
                      !trainingForm.requestedById ||
                      !trainingForm.title ||
                      !trainingForm.description ||
                      !trainingForm.contactEmail
                    }
                    className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
                  >
                    {submittingTrainingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddCategory(false)} />
          <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4">
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setShowAddCategory(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button 
                    onClick={createCategory} 
                    disabled={saving || !newCategory.name}
                    className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
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
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeContentModal} />
          <div className="fixed top-1/2 left-1/2 z-50 w-full max-h-[90vh] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto px-4">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">{editingContentId ? "Edit Content" : "Add Content"}</h3>
                  <Button variant="ghost" size="sm" onClick={closeContentModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        onValueChange={(value) => setNewContent({ ...newContent, type: value as "VIDEO" | "PDF" | "ARTICLE" | "QUIZ" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIDEO">Video</SelectItem>
                          <SelectItem value="PDF">PDF Document</SelectItem>
                          <SelectItem value="ARTICLE">Article</SelectItem>
                          <SelectItem value="QUIZ">Quiz</SelectItem>
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                        <div className="flex flex-col gap-2 sm:flex-row">
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

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-6">
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

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={closeContentModal} className="w-full sm:w-auto">Cancel</Button>
                  <Button 
                    onClick={createContent} 
                    disabled={saving || !newContent.title || !newContent.categoryId}
                    className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingContentId ? "Save Changes" : "Add Content"}
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







