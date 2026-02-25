"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Loader2,
  BookOpen,
  Video,
  FileText,
  Award,
  Calendar,
  Users,
  Edit,
  Trash2,
  Clock,
  MapPin,
  Link as LinkIcon,
  Lightbulb,
  Upload,
  Image as ImageIcon,
  File,
  X,
  Target,
  TrendingUp,
  Instagram,
  Play,
  CheckCircle2,
  Eye
} from "lucide-react"

interface UploadedFile {
  url: string
  filename: string
  type: string
  size: number
}

interface Resource {
  title: string
  url: string
  type: "pdf" | "video" | "image" | "document" | "link"
  filename?: string
}

interface HomeworkRequirement {
  task: string
  quantity: number
  metric: string
  description?: string
}

interface Homework {
  id: string
  title: string
  description: string
  requirements: string
  points: number
  dueInDays: number | null
}

interface Module {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  isLive: boolean
  liveDate: string | null
  liveUrl: string | null
  isInPerson: boolean
  eventLocation: string | null
  eventAddress: string | null
  maxAttendees: number | null
  resources: string | null
  order: number
  homework: Homework[]
  _count: {
    progress: number
    registrations: number
  }
}

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  order: number
  modules: Module[]
}

interface ContentIdea {
  id: string
  title: string
  description: string | null
  category: string
  exampleScript: string | null
  exampleVideoUrl: string | null
  weekOf: string
}

const METRIC_OPTIONS = [
  { value: "reels_created", label: "Reels Created", icon: Play },
  { value: "posts_created", label: "Posts Created", icon: ImageIcon },
  { value: "stories_posted", label: "Stories Posted", icon: Instagram },
  { value: "flow_created", label: "Automation Flows Created", icon: TrendingUp },
  { value: "bookings", label: "Bookings Generated", icon: Calendar },
  { value: "link_clicks", label: "Link Clicks", icon: LinkIcon },
  { value: "followers_gained", label: "Followers Gained", icon: Users },
  { value: "engagement_rate", label: "Engagement Rate %", icon: Target },
  { value: "comments_replied", label: "Comments Replied", icon: CheckCircle2 },
  { value: "dms_sent", label: "DMs Sent", icon: FileText },
  { value: "custom", label: "Custom Metric", icon: Award },
]

export default function HQTrainingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [activeTab, setActiveTab] = useState("courses")
  
  // File input refs
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const resourceInputRef = useRef<HTMLInputElement>(null)
  
  // Modals
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddModule, setShowAddModule] = useState<string | null>(null)
  const [showAddHomework, setShowAddHomework] = useState<string | null>(null)
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  
  // Edit modals
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingModule, setEditingModule] = useState<{ module: Module; categoryId: string } | null>(null)
  
  // Delete confirmations
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deletingModule, setDeletingModule] = useState<Module | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Forms
  const [newCategory, setNewCategory] = useState({ name: "", description: "", icon: "BookOpen" })
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    duration: "",
    isLive: false,
    liveDate: "",
    liveUrl: "",
    isInPerson: false,
    eventLocation: "",
    eventAddress: "",
    maxAttendees: "",
    resources: [] as Resource[]
  })
  const [newHomework, setNewHomework] = useState({
    title: "",
    description: "",
    requirements: [] as HomeworkRequirement[],
    points: 100,
    dueInDays: 7,
    trackingEnabled: true,
    autoVerify: true
  })
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    category: "",
    exampleScript: "",
    weekOf: ""
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/social-media/admin/training")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setContentIdeas(data.contentIdeas || [])
      }
    } catch (error) {
      console.error("Failed to fetch training data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // File upload handler
  const uploadFile = async (file: File, folder: string): Promise<UploadedFile | null> => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Upload failed")
        return null
      }

      return await res.json()
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload file")
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const result = await uploadFile(file, "training/videos")
    if (result) {
      setNewModule(prev => ({ ...prev, videoUrl: result.url }))
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const result = await uploadFile(file, "training/thumbnails")
    if (result) {
      setNewModule(prev => ({ ...prev, thumbnailUrl: result.url }))
    }
  }

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const result = await uploadFile(file, "training/resources")
    if (result) {
      const type = file.type.includes("pdf") ? "pdf" 
        : file.type.includes("video") ? "video"
        : file.type.includes("image") ? "image"
        : "document"
      
      setNewModule(prev => ({
        ...prev,
        resources: [...prev.resources, {
          title: file.name.replace(/\.[^/.]+$/, ""),
          url: result.url,
          type,
          filename: result.filename
        }]
      }))
    }
  }

  const removeResource = (index: number) => {
    setNewModule(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }))
  }

  const addRequirement = () => {
    setNewHomework(prev => ({
      ...prev,
      requirements: [...prev.requirements, {
        task: "",
        quantity: 1,
        metric: "custom",
        description: ""
      }]
    }))
  }

  const updateRequirement = (index: number, field: keyof HomeworkRequirement, value: string | number) => {
    setNewHomework(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      )
    }))
  }

  const removeRequirement = (index: number) => {
    setNewHomework(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const createCategory = async () => {
    if (!newCategory.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", ...newCategory, order: categories.length })
      })
      if (res.ok) {
        setShowAddCategory(false)
        setNewCategory({ name: "", description: "", icon: "BookOpen" })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create category:", error)
    } finally {
      setSaving(false)
    }
  }

  const createModule = async () => {
    if (!showAddModule || !newModule.title.trim()) return
    setSaving(true)
    try {
      const category = categories.find(c => c.id === showAddModule)
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "module",
          categoryId: showAddModule,
          title: newModule.title,
          description: newModule.description,
          videoUrl: newModule.videoUrl || null,
          thumbnailUrl: newModule.thumbnailUrl || null,
          duration: newModule.duration ? parseInt(newModule.duration) : null,
          isLive: newModule.isLive,
          liveDate: newModule.liveDate || null,
          liveUrl: newModule.liveUrl || null,
          isInPerson: newModule.isInPerson,
          eventLocation: newModule.eventLocation || null,
          eventAddress: newModule.eventAddress || null,
          maxAttendees: newModule.maxAttendees ? parseInt(newModule.maxAttendees) : null,
          resources: newModule.resources.length > 0 ? newModule.resources : null,
          order: category?.modules.length || 0
        })
      })
      if (res.ok) {
        setShowAddModule(null)
        setNewModule({
          title: "", description: "", videoUrl: "", thumbnailUrl: "", duration: "",
          isLive: false, liveDate: "", liveUrl: "",
          isInPerson: false, eventLocation: "", eventAddress: "", maxAttendees: "",
          resources: []
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create module:", error)
    } finally {
      setSaving(false)
    }
  }

  const createHomework = async () => {
    if (!showAddHomework || !newHomework.title.trim() || newHomework.requirements.length === 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "homework",
          moduleId: showAddHomework,
          title: newHomework.title,
          description: newHomework.description,
          requirements: newHomework.requirements,
          points: newHomework.points,
          dueInDays: newHomework.dueInDays
        })
      })
      if (res.ok) {
        setShowAddHomework(null)
        setNewHomework({
          title: "",
          description: "",
          requirements: [],
          points: 100,
          dueInDays: 7,
          trackingEnabled: true,
          autoVerify: true
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create homework:", error)
    } finally {
      setSaving(false)
    }
  }

  const createIdea = async () => {
    if (!newIdea.title.trim() || !newIdea.weekOf) return
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "content_idea", ...newIdea })
      })
      if (res.ok) {
        setShowAddIdea(false)
        setNewIdea({ title: "", description: "", category: "", exampleScript: "", weekOf: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create idea:", error)
    } finally {
      setSaving(false)
    }
  }

  // UPDATE functions
  const updateCategory = async () => {
    if (!editingCategory) return
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/admin/training", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: editingCategory.id,
          name: editingCategory.name,
          description: editingCategory.description,
          icon: editingCategory.icon
        })
      })
      if (res.ok) {
        setEditingCategory(null)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to update category:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateModule = async () => {
    if (!editingModule) return
    setSaving(true)
    try {
      const moduleDraft = editingModule.module
      const resources = moduleDraft.resources ? JSON.parse(moduleDraft.resources) : []
      const res = await fetch("/api/social-media/admin/training", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "module",
          id: moduleDraft.id,
          title: moduleDraft.title,
          description: moduleDraft.description,
          videoUrl: moduleDraft.videoUrl,
          thumbnailUrl: moduleDraft.thumbnailUrl,
          duration: moduleDraft.duration,
          isLive: moduleDraft.isLive,
          liveDate: moduleDraft.liveDate,
          liveUrl: moduleDraft.liveUrl,
          isInPerson: moduleDraft.isInPerson,
          eventLocation: moduleDraft.eventLocation,
          eventAddress: moduleDraft.eventAddress,
          maxAttendees: moduleDraft.maxAttendees,
          resources: resources.length > 0 ? resources : null
        })
      })
      if (res.ok) {
        setEditingModule(null)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to update module:", error)
    } finally {
      setSaving(false)
    }
  }

  // DELETE functions
  const deleteCategory = async () => {
    if (!deletingCategory) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/social-media/admin/training?type=category&id=${deletingCategory.id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setDeletingCategory(null)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
    } finally {
      setDeleting(false)
    }
  }

  const deleteModule = async () => {
    if (!deletingModule) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/social-media/admin/training?type=module&id=${deletingModule.id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setDeletingModule(null)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to delete module:", error)
    } finally {
      setDeleting(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText className="h-4 w-4 text-red-500" />
      case "video": return <Video className="h-4 w-4 text-blue-500" />
      case "image": return <ImageIcon className="h-4 w-4 text-green-500" />
      default: return <File className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Academy Hub</h1>
          <p className="text-gray-500 mt-1">Create courses, upload content, and track teacher progress</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto p-1">
          <TabsTrigger value="courses" className="shrink-0 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Growth Academy Courses
          </TabsTrigger>
          <TabsTrigger value="ideas" className="shrink-0 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Content Ideas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="shrink-0 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Training Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddCategory(true)} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Training Courses Yet</h3>
                <p className="text-gray-500 mb-4">Create categories and modules to build your training curriculum.</p>
                <Button onClick={() => setShowAddCategory(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {categories.map(category => (
                <Card key={category.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Edit className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setDeletingCategory(category)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-500">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setShowAddModule(category.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Module
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.modules.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No modules yet. Add your first training module.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {category.modules.map(module => {
                          const resources: Resource[] = module.resources ? JSON.parse(module.resources) : []
                          return (
                            <div 
                              key={module.id} 
                              className="p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  {module.thumbnailUrl ? (
                                    <img 
                                      src={module.thumbnailUrl} 
                                      alt={module.title}
                                      className="w-24 h-16 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-24 h-16 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                      {module.isLive ? (
                                        <Calendar className="h-6 w-6 text-red-500" />
                                      ) : module.isInPerson ? (
                                        <MapPin className="h-6 w-6 text-blue-500" />
                                      ) : (
                                        <Video className="h-6 w-6 text-gray-400" />
                                      )}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{module.title}</h4>
                                    {module.description && (
                                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{module.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      {module.duration && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {module.duration} min
                                        </span>
                                      )}
                                      {module.isLive && (
                                        <Badge className="bg-red-100 text-red-700 text-xs">Live Event</Badge>
                                      )}
                                      {module.isInPerson && (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs">In-Person</Badge>
                                      )}
                                      {module.videoUrl && (
                                        <Badge className="bg-green-100 text-green-700 text-xs">Video</Badge>
                                      )}
                                      {resources.length > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          {resources.length} Resource{resources.length !== 1 ? "s" : ""}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-gray-400">
                                        {module._count.progress} completions
                                      </span>
                                    </div>
                                    {module.homework.length > 0 && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <Award className="h-4 w-4 text-violet-500" />
                                        <span className="text-xs text-violet-600 font-medium">
                                          {module.homework.length} Homework Assignment{module.homework.length !== 1 ? "s" : ""}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 self-end sm:self-auto">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedModule(module)}
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingModule({ module, categoryId: category.id })}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingModule(module)}
                                    title="Delete"
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddHomework(module.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Homework
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Content Ideas Tab */}
        <TabsContent value="ideas" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddIdea(true)} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Content Idea
            </Button>
          </div>

          {contentIdeas.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Content Ideas Yet</h3>
                <p className="text-gray-500 mb-4">Create weekly content ideas to inspire teachers.</p>
                <Button onClick={() => setShowAddIdea(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Idea
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contentIdeas.map(idea => (
                <Card key={idea.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{idea.category}</Badge>
                      <span className="text-xs text-gray-400">
                        Week of {new Date(idea.weekOf).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">{idea.title}</h4>
                    {idea.description && (
                      <p className="text-sm text-gray-500 mt-1">{idea.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-500">Track homework completion, engagement, and ROI from training.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Modal */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Training Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Instagram Mastery"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="What teachers will learn in this course..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowAddCategory(false)}>Cancel</Button>
            <Button onClick={createCategory} disabled={saving || !newCategory.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Module Modal - WITH FILE UPLOADS */}
      <Dialog open={!!showAddModule} onOpenChange={(open) => !open && setShowAddModule(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Training Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  placeholder="e.g., Creating Viral Reels"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  placeholder="What this module covers..."
                  rows={3}
                />
              </div>
            </div>

            {/* Video Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Content
              </Label>
              {newModule.videoUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Video className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 flex-1">Video uploaded</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setNewModule({ ...newModule, videoUrl: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Input
                    value={newModule.videoUrl}
                    onChange={(e) => setNewModule({ ...newModule, videoUrl: e.target.value })}
                    placeholder="Paste video URL or upload..."
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    accept="video/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Thumbnail Image
              </Label>
              {newModule.thumbnailUrl ? (
                <div className="flex items-center gap-3">
                  <img src={newModule.thumbnailUrl} alt="Thumbnail" className="w-24 h-16 object-cover rounded" />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setNewModule({ ...newModule, thumbnailUrl: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Input
                    value={newModule.thumbnailUrl}
                    onChange={(e) => setNewModule({ ...newModule, thumbnailUrl: e.target.value })}
                    placeholder="Paste image URL or upload..."
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={newModule.duration}
                onChange={(e) => setNewModule({ ...newModule, duration: e.target.value })}
                placeholder="e.g., 15"
                className="w-32"
              />
            </div>

            {/* Resources Upload */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resources (PDFs, Documents, etc.)
                </Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={resourceInputRef}
                    onChange={handleResourceUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resourceInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    Upload File
                  </Button>
                </div>
              </div>
              {newModule.resources.length > 0 && (
                <div className="space-y-2">
                  {newModule.resources.map((resource, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      {getFileIcon(resource.type)}
                      <span className="text-sm flex-1">{resource.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event Options */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newModule.isLive}
                    onCheckedChange={(checked) => setNewModule({ ...newModule, isLive: checked, isInPerson: checked ? false : newModule.isInPerson })}
                  />
                  <Label>Live Webinar</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newModule.isInPerson}
                    onCheckedChange={(checked) => setNewModule({ ...newModule, isInPerson: checked, isLive: checked ? false : newModule.isLive })}
                  />
                  <Label>In-Person Event</Label>
                </div>
              </div>

              {newModule.isLive && (
                <div className="grid grid-cols-1 gap-4 rounded-lg bg-red-50 p-4 sm:grid-cols-2">
                  <div>
                    <Label>Live Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={newModule.liveDate}
                      onChange={(e) => setNewModule({ ...newModule, liveDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Webinar Link (Zoom/Meet)</Label>
                    <Input
                      value={newModule.liveUrl}
                      onChange={(e) => setNewModule({ ...newModule, liveUrl: e.target.value })}
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                </div>
              )}

              {newModule.isInPerson && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label>Venue Name</Label>
                    <Input
                      value={newModule.eventLocation}
                      onChange={(e) => setNewModule({ ...newModule, eventLocation: e.target.value })}
                      placeholder="e.g., Dublin Training Center"
                    />
                  </div>
                  <div>
                    <Label>Full Address</Label>
                    <Input
                      value={newModule.eventAddress}
                      onChange={(e) => setNewModule({ ...newModule, eventAddress: e.target.value })}
                      placeholder="123 Main St, Dublin"
                    />
                  </div>
                  <div>
                    <Label>Max Attendees</Label>
                    <Input
                      type="number"
                      value={newModule.maxAttendees}
                      onChange={(e) => setNewModule({ ...newModule, maxAttendees: e.target.value })}
                      placeholder="50"
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowAddModule(null)}>Cancel</Button>
            <Button onClick={createModule} disabled={saving || !newModule.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Module
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Homework Modal - COMPREHENSIVE VERSION */}
      <Dialog open={!!showAddHomework} onOpenChange={(open) => !open && setShowAddHomework(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-violet-600" />
              Create Homework Assignment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Assignment Title *</Label>
                <Input
                  value={newHomework.title}
                  onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                  placeholder="e.g., Week 1: Create Your First Viral Reel"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newHomework.description}
                  onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                  placeholder="Explain what teachers need to accomplish and why it matters..."
                  rows={3}
                />
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Trackable Requirements *
                </Label>
                <Button variant="outline" size="sm" onClick={addRequirement}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Requirement
                </Button>
              </div>
              
              {newHomework.requirements.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Add trackable requirements for this homework</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={addRequirement}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Requirement
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {newHomework.requirements.map((req, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-red-500 hover:text-red-700"
                          onClick={() => removeRequirement(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Task Description</Label>
                          <Input
                            value={req.task}
                            onChange={(e) => updateRequirement(index, "task", e.target.value)}
                            placeholder="e.g., Create Instagram Reels"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Metric to Track</Label>
                          <Select
                            value={req.metric}
                            onValueChange={(v) => updateRequirement(index, "metric", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {METRIC_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    <opt.icon className="h-4 w-4" />
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Target Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={req.quantity}
                            onChange={(e) => updateRequirement(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Additional Details (optional)</Label>
                          <Input
                            value={req.description || ""}
                            onChange={(e) => updateRequirement(index, "description", e.target.value)}
                            placeholder="e.g., Must include call-to-action"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tracking Options */}
            <div className="space-y-4 p-4 bg-violet-50 rounded-lg">
              <h4 className="font-medium text-violet-900 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Automatic Tracking
              </h4>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Generate Tracking Links</p>
                    <p className="text-xs text-gray-500">Auto-create UTM-tagged booking links for each teacher</p>
                  </div>
                  <Switch
                    checked={newHomework.trackingEnabled}
                    onCheckedChange={(checked) => setNewHomework({ ...newHomework, trackingEnabled: checked })}
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Auto-Verify Completions</p>
                    <p className="text-xs text-gray-500">Automatically track bookings & link clicks from teacher content</p>
                  </div>
                  <Switch
                    checked={newHomework.autoVerify}
                    onCheckedChange={(checked) => setNewHomework({ ...newHomework, autoVerify: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Points & Due Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Points Reward
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={newHomework.points}
                  onChange={(e) => setNewHomework({ ...newHomework, points: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">Points awarded upon completion</p>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Due In (Days)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={newHomework.dueInDays}
                  onChange={(e) => setNewHomework({ ...newHomework, dueInDays: parseInt(e.target.value) || 7 })}
                />
                <p className="text-xs text-gray-500 mt-1">Days from when teacher starts</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowAddHomework(null)}>Cancel</Button>
            <Button 
              onClick={createHomework} 
              disabled={saving || !newHomework.title.trim() || newHomework.requirements.length === 0}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Homework
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Content Idea Modal */}
      <Dialog open={showAddIdea} onOpenChange={setShowAddIdea}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                placeholder="e.g., Behind the Scenes Studio Tour"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newIdea.category} onValueChange={(v) => setNewIdea({ ...newIdea, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reel">Reel</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
                  <SelectItem value="Post">Post</SelectItem>
                  <SelectItem value="Carousel">Carousel</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Week Of *</Label>
              <Input
                type="date"
                value={newIdea.weekOf}
                onChange={(e) => setNewIdea({ ...newIdea, weekOf: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                placeholder="What the content should include..."
                rows={2}
              />
            </div>
            <div>
              <Label>Example Script</Label>
              <Textarea
                value={newIdea.exampleScript}
                onChange={(e) => setNewIdea({ ...newIdea, exampleScript: e.target.value })}
                placeholder="Sample script or talking points..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddIdea(false)}>Cancel</Button>
            <Button onClick={createIdea} disabled={saving || !newIdea.title.trim() || !newIdea.weekOf}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Idea
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Detail Modal */}
      <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedModule?.title}</DialogTitle>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-4 py-4">
              {selectedModule.videoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={selectedModule.videoUrl} 
                    controls 
                    className="w-full h-full"
                  />
                </div>
              )}
              
              {selectedModule.description && (
                <p className="text-gray-600">{selectedModule.description}</p>
              )}

              {selectedModule.resources && (
                <div className="space-y-2">
                  <Label>Resources</Label>
                  <div className="space-y-2">
                    {(JSON.parse(selectedModule.resources) as Resource[]).map((resource, i) => (
                      <a 
                        key={i}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        {getFileIcon(resource.type)}
                        <span className="text-sm">{resource.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedModule.homework.length > 0 && (
                <div className="space-y-2">
                  <Label>Homework Assignments</Label>
                  <div className="space-y-2">
                    {selectedModule.homework.map(hw => (
                      <div key={hw.id} className="p-3 bg-violet-50 rounded-lg">
                        <h4 className="font-medium text-violet-900">{hw.title}</h4>
                        <p className="text-sm text-violet-700 mt-1">{hw.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-violet-600">
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {hw.points} points
                          </span>
                          {hw.dueInDays && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due in {hw.dueInDays} days
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Category Name *</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g., Instagram Mastery"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="What teachers will learn..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
            <Button onClick={updateCategory} disabled={saving || !editingCategory?.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Module Modal */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={editingModule.module.title}
                  onChange={(e) => setEditingModule({
                    ...editingModule,
                    module: { ...editingModule.module, title: e.target.value }
                  })}
                  placeholder="e.g., Creating Viral Reels"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingModule.module.description || ""}
                  onChange={(e) => setEditingModule({
                    ...editingModule,
                    module: { ...editingModule.module, description: e.target.value }
                  })}
                  placeholder="What this module covers..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Video URL</Label>
                <Input
                  value={editingModule.module.videoUrl || ""}
                  onChange={(e) => setEditingModule({
                    ...editingModule,
                    module: { ...editingModule.module, videoUrl: e.target.value }
                  })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={editingModule.module.thumbnailUrl || ""}
                  onChange={(e) => setEditingModule({
                    ...editingModule,
                    module: { ...editingModule.module, thumbnailUrl: e.target.value }
                  })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={editingModule.module.duration || ""}
                  onChange={(e) => setEditingModule({
                    ...editingModule,
                    module: { ...editingModule.module, duration: parseInt(e.target.value) || null }
                  })}
                  placeholder="15"
                  className="w-32"
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingModule.module.isLive}
                    onCheckedChange={(checked) => setEditingModule({
                      ...editingModule,
                      module: { ...editingModule.module, isLive: checked, isInPerson: checked ? false : editingModule.module.isInPerson }
                    })}
                  />
                  <Label>Live Webinar</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingModule.module.isInPerson}
                    onCheckedChange={(checked) => setEditingModule({
                      ...editingModule,
                      module: { ...editingModule.module, isInPerson: checked, isLive: checked ? false : editingModule.module.isLive }
                    })}
                  />
                  <Label>In-Person Event</Label>
                </div>
              </div>
              {editingModule.module.isLive && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 rounded-lg">
                  <div>
                    <Label>Live Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={editingModule.module.liveDate?.slice(0, 16) || ""}
                      onChange={(e) => setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, liveDate: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Webinar Link</Label>
                    <Input
                      value={editingModule.module.liveUrl || ""}
                      onChange={(e) => setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, liveUrl: e.target.value }
                      })}
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                </div>
              )}
              {editingModule.module.isInPerson && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label>Venue Name</Label>
                    <Input
                      value={editingModule.module.eventLocation || ""}
                      onChange={(e) => setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, eventLocation: e.target.value }
                      })}
                      placeholder="e.g., Dublin Training Center"
                    />
                  </div>
                  <div>
                    <Label>Full Address</Label>
                    <Input
                      value={editingModule.module.eventAddress || ""}
                      onChange={(e) => setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, eventAddress: e.target.value }
                      })}
                      placeholder="123 Main St, Dublin"
                    />
                  </div>
                  <div>
                    <Label>Max Attendees</Label>
                    <Input
                      type="number"
                      value={editingModule.module.maxAttendees || ""}
                      onChange={(e) => setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, maxAttendees: parseInt(e.target.value) || null }
                      })}
                      placeholder="50"
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingModule(null)}>Cancel</Button>
            <Button onClick={updateModule} disabled={saving || !editingModule?.module.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Category</DialogTitle>
          </DialogHeader>
          {deletingCategory && (
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{deletingCategory.name}</strong>?
              </p>
              <p className="text-sm text-red-500 mt-2">
                ⚠️ This will also delete {deletingCategory.modules.length} module{deletingCategory.modules.length !== 1 ? "s" : ""} and all associated homework.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={deleteCategory} 
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation */}
      <Dialog open={!!deletingModule} onOpenChange={(open) => !open && setDeletingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Module</DialogTitle>
          </DialogHeader>
          {deletingModule && (
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{deletingModule.title}</strong>?
              </p>
              {deletingModule.homework.length > 0 && (
                <p className="text-sm text-red-500 mt-2">
                  ⚠️ This will also delete {deletingModule.homework.length} homework assignment{deletingModule.homework.length !== 1 ? "s" : ""}.
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingModule(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={deleteModule} 
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Module
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
