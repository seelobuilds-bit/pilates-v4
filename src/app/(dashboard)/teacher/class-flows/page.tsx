"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Play, 
  FileText, 
  Video, 
  BookOpen,
  Loader2,
  CheckCircle,
  Clock,
  Star,
  GraduationCap,
  Calendar,
  MapPin,
  X,
  ChevronRight,
  Award,
  ExternalLink,
  Download,
  ArrowLeft,
  Users,
  Phone,
  Mail
} from "lucide-react"

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
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
  articleContent: string | null
  duration: number | null
  tags: string[]
  category?: { name: string; icon: string | null }
}

interface Progress {
  [key: string]: { isCompleted: boolean; progressPercent: number }
}

interface TrainingRequest {
  id: string
  title: string
  status: string
  createdAt: string
}

export default function TeacherClassFlowsPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<Content[]>([])
  const [progress, setProgress] = useState<Progress>({})
  const [myRequests, setMyRequests] = useState<TrainingRequest[]>([])
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [showTrainingRequest, setShowTrainingRequest] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Training request form
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
    notes: ""
  })

  useEffect(() => {
    fetchData()
    fetchMyRequests()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch("/api/class-flows")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setFeatured(data.featured || [])
        setProgress(data.progress || {})
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
    setLoading(false)
  }

  async function fetchMyRequests() {
    try {
      const res = await fetch("/api/class-flows/training-requests")
      if (res.ok) {
        const data = await res.json()
        setMyRequests(data)
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error)
    }
  }

  async function markComplete(contentId: string) {
    try {
      await fetch(`/api/class-flows/${contentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: true, progressPercent: 100 })
      })
      setProgress({
        ...progress,
        [contentId]: { isCompleted: true, progressPercent: 100 }
      })
    } catch (error) {
      console.error("Failed to update progress:", error)
    }
  }

  async function submitTrainingRequest() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/class-flows/training-requests", {
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
          notes: ""
        })
        fetchMyRequests()
      }
    } catch (error) {
      console.error("Failed to submit request:", error)
    }
    setSubmitting(false)
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

  const allContent = categories.flatMap(c => c.contents.map(content => ({
    ...content,
    categoryName: c.name,
    categoryIcon: c.icon
  })))

  const filteredContent = allContent.filter(c => {
    if (selectedCategory !== "all" && c.categoryName !== selectedCategory) return false
    if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false
    return true
  })

  const completedCount = Object.values(progress).filter(p => p.isCompleted).length
  const totalContent = allContent.length

  if (loading) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // Content Detail View
  if (selectedContent) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedContent(null)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video/PDF Viewer */}
            <Card className="border-0 shadow-sm overflow-hidden">
              {selectedContent.type === "VIDEO" && selectedContent.videoUrl && (
                <div className="aspect-video bg-black">
                  {selectedContent.videoUrl.includes("youtube") ? (
                    <iframe
                      src={selectedContent.videoUrl.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : selectedContent.videoUrl.includes("vimeo") ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${selectedContent.videoUrl.split("/").pop()}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={selectedContent.videoUrl} controls className="w-full h-full" />
                  )}
                </div>
              )}
              {selectedContent.type === "PDF" && selectedContent.pdfUrl && (
                <div className="p-8 text-center">
                  <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">PDF Document</h3>
                  <Button asChild>
                    <a href={selectedContent.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              )}
              {selectedContent.type === "ARTICLE" && (
                <div className="p-6 prose max-w-none">
                  {selectedContent.articleContent || "Article content will appear here."}
                </div>
              )}
            </Card>

            {/* Content Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedContent.category && (
                        <Badge variant="secondary">
                          {selectedContent.category.icon} {selectedContent.category.name}
                        </Badge>
                      )}
                      <Badge className={getDifficultyColor(selectedContent.difficulty)}>
                        {selectedContent.difficulty}
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedContent.title}</h1>
                  </div>
                  {progress[selectedContent.id]?.isCompleted ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Button onClick={() => markComplete(selectedContent.id)} className="bg-violet-600 hover:bg-violet-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{selectedContent.description}</p>
                {selectedContent.duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {selectedContent.duration} minutes
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Overall Completion</span>
                      <span className="font-medium">{completedCount}/{totalContent}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${totalContent > 0 ? (completedCount / totalContent) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {selectedContent.tags.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Flows</h1>
          <p className="text-gray-500">Learn new techniques and class formats</p>
        </div>
        <Button onClick={() => setShowTrainingRequest(true)} className="bg-violet-600 hover:bg-violet-700">
          <GraduationCap className="h-4 w-4 mr-2" />
          Request Expert Training
        </Button>
      </div>

      {/* Progress Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-600 to-violet-500 text-white mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Your Learning Journey</h2>
              <p className="text-violet-100">
                {completedCount} of {totalContent} modules completed
              </p>
            </div>
            <div className="w-48">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-violet-200">Progress</span>
                <span className="font-medium">
                  {totalContent > 0 ? Math.round((completedCount / totalContent) * 100) : 0}%
                </span>
              </div>
              <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${totalContent > 0 ? (completedCount / totalContent) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="bg-white shadow-sm border-0">
          <TabsTrigger value="library" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <BookOpen className="h-4 w-4 mr-2" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <GraduationCap className="h-4 w-4 mr-2" />
            Expert Training
          </TabsTrigger>
        </TabsList>

        {/* Content Library */}
        <TabsContent value="library" className="space-y-6">
          {/* Featured */}
          {featured.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Featured Content
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featured.slice(0, 3).map(content => (
                  <Card 
                    key={content.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedContent(content)}
                  >
                    <div className="aspect-video bg-gray-100 relative rounded-t-lg overflow-hidden">
                      {content.thumbnailUrl ? (
                        <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getTypeIcon(content.type)}
                        </div>
                      )}
                      {progress[content.id]?.isCompleted && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-emerald-500">
                            <CheckCircle className="h-3 w-3" />
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">{content.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{content.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Grid */}
          {filteredContent.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No content available</h3>
                <p className="text-gray-500">Check back soon for new training materials</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map(content => (
                <Card 
                  key={content.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="aspect-video bg-gray-100 relative rounded-t-lg overflow-hidden">
                    {content.thumbnailUrl ? (
                      <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                          {getTypeIcon(content.type)}
                        </div>
                      </div>
                    )}
                    {content.type === "VIDEO" && content.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {content.duration} min
                      </div>
                    )}
                    {progress[content.id]?.isCompleted && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-emerald-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <Play className="h-6 w-6 text-violet-600 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {content.categoryIcon} {content.categoryName}
                      </Badge>
                      <Badge className={`text-xs ${getDifficultyColor(content.difficulty)}`}>
                        {content.difficulty}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">{content.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{content.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Expert Training Tab */}
        <TabsContent value="training" className="space-y-6">
          {/* Info Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Expert On-Site Training</h3>
                  <p className="text-gray-600 mb-4">
                    Take your skills to the next level with personalized training from our expert instructors. 
                    They&apos;ll come to your studio and provide hands-on guidance for you and your team.
                  </p>
                  <Button onClick={() => setShowTrainingRequest(true)} className="bg-amber-600 hover:bg-amber-700">
                    Request Training Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Requests */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">My Training Requests</h3>
              {myRequests.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">You haven&apos;t requested any training sessions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.title}</h4>
                        <p className="text-sm text-gray-500">
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={
                        request.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        request.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
                        request.status === "SCHEDULED" ? "bg-violet-100 text-violet-700" :
                        request.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                        "bg-gray-100 text-gray-700"
                      }>
                        {request.status}
                      </Badge>
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
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Request Expert Training</h3>
                      <p className="text-sm text-gray-500">We&apos;ll send an expert to your location</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowTrainingRequest(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
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
                      placeholder="Describe what you'd like to learn or any specific areas you want to focus on..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
                        onChange={(e) => setTrainingForm({ ...trainingForm, attendeeCount: parseInt(e.target.value) || 1 })}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={trainingForm.contactEmail}
                        onChange={(e) => setTrainingForm({ ...trainingForm, contactEmail: e.target.value })}
                        placeholder="your@email.com"
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
                      placeholder="Any other information we should know..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowTrainingRequest(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitTrainingRequest}
                    disabled={submitting || !trainingForm.title || !trainingForm.description || !trainingForm.contactEmail}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
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



















