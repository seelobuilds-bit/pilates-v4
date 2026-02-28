"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  FileText, 
  Video, 
  BookOpen,
  Loader2,
  CheckCircle,
  Clock,
  Star,
  Download,
  ArrowLeft,
  GraduationCap,
  Send,
  ChevronRight,
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

type RequestKind = "CLASS_FLOW" | "TRAINING"

interface TeacherRequest {
  id: string
  title: string
  description: string
  trainingType: string
  status: "PENDING" | "APPROVED" | "SCHEDULED" | "COMPLETED" | "CANCELLED"
  preferredDate1: string | null
  preferredDate2: string | null
  preferredDate3: string | null
  createdAt: string
}

const CLASS_FLOW_REQUEST_TYPE = "class-flow-request"

export default function TeacherClassFlowsPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<Content[]>([])
  const [progress, setProgress] = useState<Progress>({})
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([])
  const [requestKind, setRequestKind] = useState<RequestKind>("CLASS_FLOW")
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    trainingType: "custom",
    preferredDate1: "",
    preferredDate2: "",
    preferredDate3: "",
  })
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [classFlowsRes, requestsRes] = await Promise.all([
        fetch("/api/class-flows"),
        fetch("/api/class-flows/training-requests")
      ])

      if (classFlowsRes.ok) {
        const data = await classFlowsRes.json()
        const nextCategories = data.categories || []
        setCategories(nextCategories)
        setFeatured(data.featured || [])
        setProgress(data.progress || {})
        setSelectedCategory((previous) => {
          if (nextCategories.length === 0) return ""
          if (previous && nextCategories.some((category: Category) => category.id === previous)) {
            return previous
          }
          return nextCategories[0].id
        })
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setTeacherRequests(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

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

  async function submitTeacherRequest() {
    setRequestError(null)
    setRequestSuccess(null)

    if (!requestForm.title.trim() || !requestForm.description.trim()) {
      setRequestError("Title and description are required.")
      return
    }

    setSubmittingRequest(true)
    try {
      const payload = {
        requestKind,
        requestSource: "TEACHER",
        title: requestForm.title.trim(),
        description: requestForm.description.trim(),
        trainingType: requestKind === "TRAINING" ? requestForm.trainingType : CLASS_FLOW_REQUEST_TYPE,
        preferredDate1: requestKind === "TRAINING" ? requestForm.preferredDate1 || null : null,
        preferredDate2: requestKind === "TRAINING" ? requestForm.preferredDate2 || null : null,
        preferredDate3: requestKind === "TRAINING" ? requestForm.preferredDate3 || null : null,
      }

      const res = await fetch("/api/class-flows/training-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit request")
      }

      setRequestForm({
        title: "",
        description: "",
        trainingType: "custom",
        preferredDate1: "",
        preferredDate2: "",
        preferredDate3: "",
      })
      setRequestSuccess("Request sent to studio admin for approval.")
      void fetchData()
    } catch (error) {
      console.error("Failed to submit teacher request:", error)
      setRequestError(error instanceof Error ? error.message : "Failed to submit request")
    } finally {
      setSubmittingRequest(false)
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

  const getRequestStatusColor = (status: TeacherRequest["status"]) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-700"
      case "APPROVED": return "bg-blue-100 text-blue-700"
      case "SCHEDULED": return "bg-violet-100 text-violet-700"
      case "COMPLETED": return "bg-emerald-100 text-emerald-700"
      case "CANCELLED": return "bg-gray-100 text-gray-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getRequestKindLabel = (trainingType: string) =>
    trainingType === CLASS_FLOW_REQUEST_TYPE ? "Class Flow Request" : "Training Request"

  const allContent = categories.flatMap(c => c.contents.map(content => ({
    ...content,
    categoryId: c.id,
    categoryName: c.name,
    categoryIcon: c.icon
  })))

  const filteredContent = allContent.filter(c => {
    if (selectedCategory && c.categoryId !== selectedCategory) return false
    if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false
    return true
  })

  const completedCount = Object.values(progress).filter(p => p.isCompleted).length
  const totalContent = allContent.length
  const activeCategory = categories.find((category) => category.id === selectedCategory) ?? categories[0] ?? null
  const activeCategoryContents = filteredContent.filter((content) => content.categoryId === activeCategory?.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // Content Detail View
  if (selectedContent) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedContent(null)}
          className="mb-6 w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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
                <div className="p-6 text-center sm:p-8">
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
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
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
                    <Badge className="w-fit bg-emerald-100 text-emerald-700">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Button onClick={() => markComplete(selectedContent.id)} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
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
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Flows</h1>
          <p className="text-gray-500">Learn new techniques and class formats</p>
        </div>
      </div>

      {/* Progress Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-600 to-violet-500 text-white mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Your Learning Journey</h2>
              <p className="text-violet-100">
                {completedCount} of {totalContent} modules completed
              </p>
            </div>
            <div className="w-full sm:w-48">
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
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto border-0 bg-white p-1 shadow-sm">
          <TabsTrigger value="library" className="shrink-0 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <BookOpen className="h-4 w-4 mr-2" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="requests" className="shrink-0 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <GraduationCap className="h-4 w-4 mr-2" />
            Requests
          </TabsTrigger>
        </TabsList>

        {/* Content Library */}
        <TabsContent value="library" className="space-y-6">
          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No content available</h3>
                <p className="text-gray-500">Check back soon for new training materials</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="border-0 shadow-sm lg:col-span-1">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Categories</h3>
                    <Badge variant="secondary">{categories.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full rounded-lg p-3 text-left transition-colors ${
                          activeCategory?.id === category.id
                            ? "border-2 border-violet-200 bg-violet-50"
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

              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardContent className="p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{activeCategory?.name || "Select a category"}</h3>
                      {activeCategory?.description ? (
                        <p className="text-sm text-gray-500">{activeCategory.description}</p>
                      ) : null}
                    </div>
                    <div className="w-full sm:w-[210px]">
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

                  {activeCategoryContents.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 py-8 text-center">
                      <p className="text-gray-500">No content in this category yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCategoryContents.map((content) => (
                        <button
                          key={content.id}
                          className="w-full rounded-lg bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100"
                          onClick={() => setSelectedContent(content)}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4 sm:items-center">
                              <div className={`rounded-lg p-2 ${content.type === "VIDEO" ? "bg-blue-100" : "bg-amber-100"}`}>
                                {content.type === "VIDEO" ? (
                                  <Video className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <FileText className="h-5 w-5 text-amber-600" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{content.title}</p>
                                  {featured.some((item) => item.id === content.id) ? (
                                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                  ) : null}
                                  {progress[content.id]?.isCompleted ? (
                                    <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(content.difficulty)}`}>
                                    {content.difficulty}
                                  </Badge>
                                  {content.duration ? (
                                    <span className="text-xs text-gray-500">{content.duration} min</span>
                                  ) : null}
                                </div>
                                {content.description ? (
                                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{content.description}</p>
                                ) : null}
                              </div>
                            </div>
                            <ChevronRight className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Support</h3>
                <p className="text-sm text-gray-500">
                  Ask studio admin for new class-flow content or expert training.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select value={requestKind} onValueChange={(value) => setRequestKind(value as RequestKind)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASS_FLOW">Class Flow Content</SelectItem>
                      <SelectItem value="TRAINING">Teacher Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {requestKind === "TRAINING" && (
                  <div className="space-y-2">
                    <Label>Training Type</Label>
                    <Select
                      value={requestForm.trainingType}
                      onValueChange={(value) => setRequestForm((prev) => ({ ...prev, trainingType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                )}
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={requestForm.title}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={requestKind === "CLASS_FLOW" ? "e.g., Intermediate Reformer Sequence" : "e.g., Prenatal Teacher Workshop"}
                />
              </div>

              <div className="space-y-2">
                <Label>{requestKind === "CLASS_FLOW" ? "Description" : "What should this training cover?"}</Label>
                <Textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    requestKind === "CLASS_FLOW"
                      ? "Explain what you need and why."
                      : "Be specific about the skills, corrections, sequences, or teaching gaps you want this training to focus on."
                  }
                  rows={4}
                />
              </div>

              {requestKind === "TRAINING" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Preferred Date 1</Label>
                    <Input
                      type="date"
                      value={requestForm.preferredDate1}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, preferredDate1: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Date 2</Label>
                    <Input
                      type="date"
                      value={requestForm.preferredDate2}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, preferredDate2: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Date 3</Label>
                    <Input
                      type="date"
                      value={requestForm.preferredDate3}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, preferredDate3: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {requestError && <p className="text-sm text-red-600">{requestError}</p>}
              {requestSuccess && <p className="text-sm text-emerald-600">{requestSuccess}</p>}

              <div className="flex justify-end">
                <Button
                  onClick={submitTeacherRequest}
                  disabled={submittingRequest}
                  className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
                >
                  {submittingRequest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Request
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Requests</h3>
              {teacherRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {teacherRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{request.title}</p>
                        <Badge className={getRequestStatusColor(request.status)}>{request.status}</Badge>
                        <Badge variant="outline">{getRequestKindLabel(request.trainingType)}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{request.description}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        Submitted {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}











