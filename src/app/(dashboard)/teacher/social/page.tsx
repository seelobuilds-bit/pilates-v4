"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { getPublicSocialMediaMode } from "@/lib/social-media-mode"
import { 
  Video, 
  Plus,
  Loader2,
  CheckCircle,
  GraduationCap,
  X,
  Instagram,
  MessageCircle,
  Zap,
  Target,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Award,
  Lightbulb,
  ClipboardList,
  Radio,
  Settings,
  BookOpen,
  Flame,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Search,
  BadgeCheck
} from "lucide-react"

interface TrainingCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  modules: TrainingModule[]
}

interface TrainingModule {
  id: string
  title: string
  description: string | null
  summary: string | null
  keyTakeaways: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  isLive: boolean
  liveDate: string | null
  liveUrl: string | null
  isInPerson: boolean
  eventLocation: string | null
  maxAttendees: number | null
  homework: Homework[]
  _count: { registrations: number }
}

interface Homework {
  id: string
  title: string
  description: string
  requirements: string
  aiInstructions: string | null
  points: number
}

interface ContentIdea {
  id: string
  title: string
  description: string
  category: string
  exampleScript: string | null
  weekOf: string
}

interface SocialAccount {
  id: string
  platform: "INSTAGRAM" | "TIKTOK"
  username: string
  displayName: string | null
  profilePicture: string | null
  followerCount: number
  isActive: boolean
  _count: { flows: number; messages: number }
}

interface Flow {
  id: string
  name: string
  description: string | null
  triggerType: string
  triggerKeywords: string[]
  responseMessage: string
  isActive: boolean
  totalTriggered: number
  totalBooked: number
  account: SocialAccount
}

interface TrackingLink {
  id: string
  code: string
  campaign: string | null
  source: string
  medium: string
  fullTrackingUrl: string
  clicks: number
  conversions: number
}

interface TrendingContent {
  id: string
  platform: "INSTAGRAM" | "TIKTOK"
  postUrl: string
  creatorUsername: string
  creatorDisplayName: string | null
  creatorProfilePic: string | null
  creatorFollowers: number
  isVerified: boolean
  contentType: string
  thumbnailUrl: string | null
  caption: string | null
  hashtags: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  saveCount: number
  engagementRate: number
  category: string | null
  contentStyle: string | null
  difficulty: string | null
  postedAt: string
  trendingScore: number
  isFeatured: boolean
}

interface HomeworkSubmission {
  id: string
  homeworkId: string
  progress: Record<string, number>
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  isCompleted: boolean
  trackingCode: string | null
  fullTrackingUrl: string | null
  submissionUrls: string[]
  attachedFlowId: string | null
  attachedFlow: {
    id: string
    name: string
    triggerType: string
    account: {
      platform: string
      username: string
    }
  } | null
  startedAt: string
  homework: {
    title: string
    description: string
    requirements: string
    aiInstructions: string | null
    points: number
    module: {
      title: string
      summary: string | null
      keyTakeaways: string | null
      category: { name: string }
    }
  }
}

export default function TeacherSocialPage() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(tabFromUrl || "training")
  
  // Training state
  const [categories, setCategories] = useState<TrainingCategory[]>([])
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [progress, setProgress] = useState<Record<string, { isCompleted: boolean; watchedPercent: number }>>({})
  const [myHomework, setMyHomework] = useState<HomeworkSubmission[]>([])
  const [activeHomeworkId, setActiveHomeworkId] = useState<string | null>(null)
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [startingHomework, setStartingHomework] = useState(false)
  const [cancellingHomework, setCancellingHomework] = useState(false)
  const [selectedFlowId, setSelectedFlowId] = useState<string>("")
  const [videoLinks, setVideoLinks] = useState<string[]>([""])
  const [savingVideoLinks, setSavingVideoLinks] = useState(false)
  const [savingFlow, setSavingFlow] = useState(false)
  
  // Tools state
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [flows, setFlows] = useState<Flow[]>([])
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([])
  const [showConnectAccount, setShowConnectAccount] = useState(false)
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  
  // Trending/Inspiration state
  const [trendingContent, setTrendingContent] = useState<TrendingContent[]>([])
  const [featuredContent, setFeaturedContent] = useState<TrendingContent[]>([])
  const [trendingFilters, setTrendingFilters] = useState({
    platform: "",
    category: "",
    contentStyle: "",
    timeframe: "7d",
    sortBy: "trendingScore",
    search: ""
  })
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableStyles, setAvailableStyles] = useState<string[]>([])
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [newAccountPlatform, setNewAccountPlatform] = useState<"INSTAGRAM" | "TIKTOK">("INSTAGRAM")
  const [newAccountUsername, setNewAccountUsername] = useState("")
  const [saving, setSaving] = useState(false)

  // New flow state
  const [newFlow, setNewFlow] = useState({
    accountId: "",
    name: "",
    description: "",
    triggerType: "COMMENT_KEYWORD",
    triggerKeywords: "",
    responseMessage: "",
    includeBookingLink: true,
    bookingMessage: "Click below to book your spot! 👇",
    linkToActiveHomework: false
  })
  const socialMode = getPublicSocialMediaMode()
  const isSimulatedSocialMode = socialMode === "SIMULATED_BETA"

  const fetchTrainingData = useCallback(async () => {
    try {
      const res = await fetch("/api/social-media/training")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setContentIdeas(data.contentIdeas || [])
        setProgress(data.progress || {})
      }
    } catch (error) {
      console.error("Failed to fetch training:", error)
    }
  }, [])

  const fetchTrendingContent = useCallback(async () => {
    setLoadingTrending(true)
    try {
      const params = new URLSearchParams()
      if (trendingFilters.platform) params.set("platform", trendingFilters.platform)
      if (trendingFilters.category) params.set("category", trendingFilters.category)
      if (trendingFilters.contentStyle) params.set("contentStyle", trendingFilters.contentStyle)
      if (trendingFilters.timeframe) params.set("timeframe", trendingFilters.timeframe)
      if (trendingFilters.sortBy) params.set("sortBy", trendingFilters.sortBy)
      if (trendingFilters.search) params.set("search", trendingFilters.search)
      
      const res = await fetch(`/api/social-media/trending?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTrendingContent(data.content || [])
        setFeaturedContent(data.featured || [])
        setAvailableCategories(data.filters?.categories || [])
        setAvailableStyles(data.filters?.contentStyles || [])
      }
    } catch (error) {
      console.error("Failed to fetch trending content:", error)
    }
    setLoadingTrending(false)
  }, [trendingFilters])

  const fetchMyHomework = useCallback(async () => {
    try {
      const res = await fetch("/api/social-media/homework")
      if (res.ok) {
        const data = await res.json()
        setMyHomework((data.submissions || []).map((s: HomeworkSubmission & { progress: string | Record<string, number> }) => ({
          ...s,
          progress: typeof s.progress === 'string' ? JSON.parse(s.progress) : s.progress
        })))
        setActiveHomeworkId(data.activeHomeworkId || null)
      }
    } catch (error) {
      console.error("Failed to fetch homework:", error)
    }
  }, [])

  async function startHomework(homeworkId: string, flowId?: string) {
    setStartingHomework(true)
    try {
      const res = await fetch("/api/social-media/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "start", 
          homeworkId,
          attachedFlowId: flowId || selectedFlowId || null
        })
      })
      
      if (res.ok) {
        await fetchMyHomework()
        setActiveTab("homework") // Switch to homework tab
        setSelectedFlowId("")
        setVideoLinks([""])
      } else {
        const data = await res.json()
        alert(data.error || "Failed to start homework")
      }
    } catch (error) {
      console.error("Failed to start homework:", error)
    }
    setStartingHomework(false)
  }

  async function saveVideoLinks(homeworkId: string, urls: string[]) {
    setSavingVideoLinks(true)
    try {
      const res = await fetch("/api/social-media/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "saveVideoLinks", 
          homeworkId,
          submissionUrls: urls.filter(u => u.trim())
        })
      })
      
      if (res.ok) {
        await fetchMyHomework()
      }
    } catch (error) {
      console.error("Failed to save video links:", error)
    }
    setSavingVideoLinks(false)
  }

  async function attachFlow(homeworkId: string, flowId: string | null) {
    setSavingFlow(true)
    try {
      const res = await fetch("/api/social-media/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "attachFlow", 
          homeworkId,
          attachedFlowId: flowId
        })
      })
      
      if (res.ok) {
        await fetchMyHomework()
      }
    } catch (error) {
      console.error("Failed to attach flow:", error)
    }
    setSavingFlow(false)
  }

  async function cancelHomework(homeworkId: string) {
    if (!confirm("Are you sure you want to cancel this homework? Your progress will be saved but you'll need to start over.")) {
      return
    }
    
    setCancellingHomework(true)
    try {
      const res = await fetch("/api/social-media/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", homeworkId })
      })
      
      if (res.ok) {
        await fetchMyHomework()
      }
    } catch (error) {
      console.error("Failed to cancel homework:", error)
    }
    setCancellingHomework(false)
  }

  const fetchToolsData = useCallback(async () => {
    try {
      const [accountsRes, flowsRes, linksRes] = await Promise.all([
        fetch("/api/social-media/accounts"),
        fetch("/api/social-media/flows"),
        fetch("/api/social-media/tracking")
      ])

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json())
      }
      if (flowsRes.ok) {
        const data = await flowsRes.json()
        setFlows(data.flows || [])
      }
      if (linksRes.ok) {
        setTrackingLinks(await linksRes.json())
      }
    } catch (error) {
      console.error("Failed to fetch tools data:", error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchTrainingData()
    void fetchToolsData()
    void fetchMyHomework()
  }, [fetchTrainingData, fetchToolsData, fetchMyHomework])

  useEffect(() => {
    void fetchTrendingContent()
  }, [fetchTrendingContent])

  async function connectAccount() {
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newAccountPlatform,
          username: newAccountUsername
        })
      })
      if (res.ok) {
        setShowConnectAccount(false)
        setNewAccountUsername("")
        void fetchToolsData()
      }
    } catch (error) {
      console.error("Failed to connect account:", error)
    }
    setSaving(false)
  }

  async function createFlow() {
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newFlow,
          triggerKeywords: newFlow.triggerKeywords.split(",").map(k => k.trim()).filter(Boolean)
        })
      })
      if (res.ok) {
        const createdFlow = await res.json()
        
        // If linking to active homework, attach the flow
        if (newFlow.linkToActiveHomework && activeHomeworkId) {
          await fetch("/api/social-media/homework", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "attachFlow",
              homeworkId: activeHomeworkId,
              attachedFlowId: createdFlow.id
            })
          })
          await fetchMyHomework()
        }
        
        setShowCreateFlow(false)
        setNewFlow({
          accountId: "",
          name: "",
          description: "",
          triggerType: "COMMENT_KEYWORD",
          triggerKeywords: "",
          responseMessage: "",
          includeBookingLink: true,
          bookingMessage: "Click below to book your spot! 👇",
          linkToActiveHomework: false
        })
        void fetchToolsData()
      }
    } catch (error) {
      console.error("Failed to create flow:", error)
    }
    setSaving(false)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case "COMMENT_KEYWORD": return "Comment Keyword → DM"
      case "STORY_REPLY": return "Story Reply → DM"
      case "STORY_REACTION": return "Story Reaction → DM"
      case "INBOUND_DM_KEYWORD": return "DM Keyword → Flow"
      case "CLICK_TO_MESSAGE_AD": return "Ad Click → Flow"
      default: return type
    }
  }

  // Calculate total points
  const totalPoints = myHomework.filter(h => h.isCompleted).reduce((sum, h) => sum + (h.homework.points || 0), 0)
  const completedModules = Object.values(progress).filter(p => p.isCompleted).length
  const totalModules = categories.reduce((acc, c) => acc + c.modules.length, 0)

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
          <p className="text-gray-500">Learn, create, and grow your social presence</p>
        </div>
      </div>

      {isSimulatedSocialMode && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Social media is running in simulated beta mode.</p>
          <p className="mt-1 text-sm text-amber-800">
            Account connection and outbound DM actions are stored internally and do not call Instagram or TikTok APIs.
          </p>
        </div>
      )}

      {/* Progress Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 text-white mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div>
                <p className="text-3xl font-bold">{totalPoints}</p>
                <p className="text-sm opacity-80">Total Points</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{completedModules}/{totalModules}</p>
                <p className="text-sm opacity-80">Modules Complete</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{myHomework.filter(h => h.isCompleted).length}</p>
                <p className="text-sm opacity-80">Homework Done</p>
              </div>
            </div>
            <Award className="h-12 w-12 sm:h-16 sm:w-16 opacity-50 self-start sm:self-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="app-scrollbar w-full justify-start overflow-x-auto bg-white shadow-sm border-0 p-1">
          <TabsTrigger value="training" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <GraduationCap className="h-4 w-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="inspiration" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Flame className="h-4 w-4 mr-2" />
            Inspiration
          </TabsTrigger>
          <TabsTrigger value="homework" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <ClipboardList className="h-4 w-4 mr-2" />
            My Homework
          </TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Zap className="h-4 w-4 mr-2" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Target className="h-4 w-4 mr-2" />
            My Results
          </TabsTrigger>
        </TabsList>

        {/* ==================== TRAINING TAB ==================== */}
        <TabsContent value="training" className="space-y-6">
          {/* Content Ideas This Week */}
          {contentIdeas.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">This Week&apos;s Content Ideas</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contentIdeas.slice(0, 3).map(idea => (
                    <div key={idea.id} className="p-4 bg-amber-50 rounded-lg">
                      <Badge className="mb-2 bg-amber-100 text-amber-700">{idea.category}</Badge>
                      <h4 className="font-medium text-gray-900 mb-1">{idea.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{idea.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Categories */}
          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Coming Soon</h3>
                <p className="text-gray-500">Social media training modules will be available here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {categories.map(category => (
                <Card key={category.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{category.icon || "📚"}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.modules.map(module => (
                        <div 
                          key={module.id}
                          className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedModule(module)}
                        >
                          <div className="aspect-video bg-gray-100 relative">
                            {module.thumbnailUrl ? (
                              <img src={module.thumbnailUrl} alt={module.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-violet-100">
                                <Video className="h-8 w-8 text-violet-400" />
                              </div>
                            )}
                            {progress[module.id]?.isCompleted && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-emerald-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Done
                                </Badge>
                              </div>
                            )}
                            {module.isLive && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-red-500">
                                  <Radio className="h-3 w-3 mr-1" />
                                  Live
                                </Badge>
                              </div>
                            )}
                            {module.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {module.duration} min
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">{module.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">{module.description}</p>
                            {module.homework.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-violet-600">
                                <ClipboardList className="h-3 w-3" />
                                {module.homework.length} homework • {module.homework.reduce((s, h) => s + h.points, 0)} pts
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ==================== INSPIRATION TAB ==================== */}
        <TabsContent value="inspiration" className="space-y-6">
          {/* Featured Section */}
          {featuredContent.length > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-500 to-pink-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-white" />
                  <h3 className="font-semibold text-white">🔥 Trending Now</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {featuredContent.slice(0, 5).map(content => (
                    <a
                      key={content.id}
                      href={content.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black/20">
                        {content.thumbnailUrl && (
                          <img src={content.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-1 text-white text-xs mb-1">
                            {content.platform === "INSTAGRAM" ? (
                              <Instagram className="h-3 w-3" />
                            ) : (
                              <span className="font-bold">TT</span>
                            )}
                            @{content.creatorUsername}
                            {content.isVerified && <BadgeCheck className="h-3 w-3 text-blue-400" />}
                          </div>
                          <div className="flex items-center gap-2 text-white/80 text-xs">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(content.viewCount / 1000000).toFixed(1)}M</span>
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{(content.likeCount / 1000).toFixed(0)}K</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search hashtags, creators..."
                    value={trendingFilters.search}
                    onChange={(e) => setTrendingFilters({ ...trendingFilters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>

                {/* Platform Filter */}
                <Select
                  value={trendingFilters.platform || "all"}
                  onValueChange={(value) => setTrendingFilters({ ...trendingFilters, platform: value === "all" ? "" : value })}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                    <SelectItem value="TIKTOK">TikTok</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select
                  value={trendingFilters.category || "all"}
                  onValueChange={(value) => setTrendingFilters({ ...trendingFilters, category: value === "all" ? "" : value })}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Content Style Filter */}
                <Select
                  value={trendingFilters.contentStyle || "all"}
                  onValueChange={(value) => setTrendingFilters({ ...trendingFilters, contentStyle: value === "all" ? "" : value })}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    {availableStyles.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Timeframe Filter */}
                <Select
                  value={trendingFilters.timeframe}
                  onValueChange={(value) => setTrendingFilters({ ...trendingFilters, timeframe: value })}
                >
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select
                  value={trendingFilters.sortBy}
                  onValueChange={(value) => setTrendingFilters({ ...trendingFilters, sortBy: value })}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trendingScore">🔥 Trending</SelectItem>
                    <SelectItem value="viewCount">👁 Most Views</SelectItem>
                    <SelectItem value="likeCount">❤️ Most Likes</SelectItem>
                    <SelectItem value="engagementRate">📈 Engagement Rate</SelectItem>
                    <SelectItem value="commentCount">💬 Most Comments</SelectItem>
                    <SelectItem value="postedAt">🕐 Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          {loadingTrending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : trendingContent.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trendingContent.map(content => (
                <Card key={content.id} className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <a
                    href={content.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[9/16] bg-gray-100">
                      {content.thumbnailUrl ? (
                        <img src={content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-violet-100">
                          <Video className="h-12 w-12 text-violet-300" />
                        </div>
                      )}
                      {/* Platform badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className={content.platform === "INSTAGRAM" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-black"}>
                          {content.platform === "INSTAGRAM" ? (
                            <Instagram className="h-3 w-3 mr-1" />
                          ) : (
                            <span className="mr-1">TT</span>
                          )}
                          {content.contentType}
                        </Badge>
                      </div>
                      {/* Category badge */}
                      {content.category && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-white/90">{content.category}</Badge>
                        </div>
                      )}
                      {/* Stats overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{content.viewCount >= 1000000 ? `${(content.viewCount / 1000000).toFixed(1)}M` : `${(content.viewCount / 1000).toFixed(0)}K`}</span>
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{content.likeCount >= 1000000 ? `${(content.likeCount / 1000000).toFixed(1)}M` : `${(content.likeCount / 1000).toFixed(0)}K`}</span>
                          </div>
                          <span className="text-emerald-400 font-medium">{content.engagementRate.toFixed(1)}% ER</span>
                        </div>
                      </div>
                    </div>
                  </a>
                  {/* Content info */}
                  <CardContent className="p-3">
                    {/* Creator */}
                    <div className="flex items-center gap-2 mb-2">
                      {content.creatorProfilePic ? (
                        <img src={content.creatorProfilePic} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                          @{content.creatorUsername}
                          {content.isVerified && <BadgeCheck className="h-3 w-3 text-blue-500" />}
                        </p>
                        <p className="text-xs text-gray-500">{(content.creatorFollowers / 1000).toFixed(0)}K followers</p>
                      </div>
                    </div>
                    {/* Caption */}
                    {content.caption && (
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{content.caption}</p>
                    )}
                    {/* More stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{content.commentCount.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{content.shareCount.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{content.saveCount.toLocaleString()}</span>
                    </div>
                    {/* Tags */}
                    {content.hashtags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {content.hashtags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">#{tag}</span>
                        ))}
                        {content.hashtags.length > 3 && (
                          <span className="text-xs text-gray-400">+{content.hashtags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Card */}
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">How to use Inspiration</h4>
                  <p className="text-sm text-blue-700">
                    Browse top-performing Pilates content from Instagram and TikTok. Study what&apos;s working - the hooks, 
                    formats, and topics - then create your own version. Click any post to view it on the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== HOMEWORK TAB ==================== */}
        <TabsContent value="homework" className="space-y-6">
          {/* Active Homework Alert */}
          {activeHomeworkId && (
            <Card className="border-2 border-violet-300 shadow-sm bg-violet-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-violet-700">
                  <ClipboardList className="h-5 w-5" />
                  <span className="font-medium">You have active homework in progress</span>
                </div>
                <p className="text-sm text-violet-600 mt-1">
                  Complete or cancel your current homework before starting a new one.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <ClipboardList className="h-5 w-5 text-violet-500" />
                <h3 className="font-semibold text-gray-900">My Homework</h3>
              </div>

              {myHomework.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">No homework started</h4>
                  <p className="text-gray-500 mb-4">Watch a training module and start its homework assignment</p>
                  <Button onClick={() => setActiveTab("training")} variant="outline">
                    Browse Training
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Homework */}
                  {myHomework.filter(s => s.status === "ACTIVE" && !s.isCompleted).map(submission => {
                    const requirements = JSON.parse(submission.homework.requirements || "[]")
                    const aiInstructions = submission.homework.aiInstructions ? JSON.parse(submission.homework.aiInstructions) : []
                    const keyTakeaways = submission.homework.module.keyTakeaways ? JSON.parse(submission.homework.module.keyTakeaways) : []
                    
                    return (
                      <div key={submission.id} className="p-6 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 border-2 border-violet-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <Badge className="bg-violet-100 text-violet-700 mb-2">Active</Badge>
                            <p className="text-xs text-gray-500">{submission.homework.module.category.name}</p>
                            <h4 className="font-semibold text-gray-900 text-lg">{submission.homework.title}</h4>
                            <p className="text-sm text-gray-600">From: {submission.homework.module.title}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-violet-600">{submission.homework.points}</p>
                            <p className="text-xs text-gray-500">points</p>
                          </div>
                        </div>

                        {/* Module Summary */}
                        {submission.homework.module.summary && (
                          <div className="p-4 bg-white rounded-lg mb-4">
                            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-violet-500" />
                              Module Recap
                            </h5>
                            <p className="text-sm text-gray-700">{submission.homework.module.summary}</p>
                            {keyTakeaways.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-gray-500 mb-2">Key Takeaways:</p>
                                <ul className="space-y-1">
                                  {keyTakeaways.slice(0, 3).map((t: string, i: number) => (
                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                      <span className="text-emerald-500">✓</span> {t}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Progress bars */}
                        <div className="space-y-3 mb-4">
                          <p className="text-sm font-medium text-gray-700">Your Progress:</p>
                          {requirements.map((req: { task: string; quantity: number; metric: string }, i: number) => {
                            const current = submission.progress?.[req.metric] || 0
                            const percent = Math.min((current / req.quantity) * 100, 100)
                            
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700">{req.task}</span>
                                  <span className={percent >= 100 ? "text-emerald-600 font-medium" : "text-gray-500"}>
                                    {current}/{req.quantity}
                                  </span>
                                </div>
                                <div className="h-3 bg-white rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      percent >= 100 ? "bg-emerald-500" : "bg-violet-500"
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* AI Instructions */}
                        {aiInstructions.length > 0 && (
                          <div className="p-4 bg-white rounded-lg mb-4">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              Step-by-Step Instructions
                            </h5>
                            <div className="space-y-4">
                              {aiInstructions.map((instruction: { task: string; steps: string[] }, i: number) => (
                                <div key={i}>
                                  <p className="text-sm font-medium text-violet-700 mb-2">{instruction.task}</p>
                                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-2">
                                    {instruction.steps.map((step: string, j: number) => (
                                      <li key={j}>{step}</li>
                                    ))}
                                  </ol>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tracking link */}
                        {submission.trackingCode && (
                          <div className="p-3 bg-white rounded-lg mb-4">
                            <p className="text-xs text-gray-500 mb-1">Your tracking code (bookings auto-count):</p>
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{submission.trackingCode}</code>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(submission.trackingCode!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Cancel button */}
                        <Button 
                          onClick={() => cancelHomework(submission.homeworkId)}
                          disabled={cancellingHomework}
                          variant="outline"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {cancellingHomework ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelling...</>
                          ) : (
                            "Cancel Homework"
                          )}
                        </Button>
                      </div>
                    )
                  })}

                  {/* Completed Homework */}
                  {myHomework.filter(s => s.isCompleted).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Completed
                      </h4>
                      <div className="space-y-3">
                        {myHomework.filter(s => s.isCompleted).map(submission => (
                          <div key={submission.id} className="p-4 bg-emerald-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{submission.homework.title}</p>
                                <p className="text-sm text-gray-600">{submission.homework.module.title}</p>
                              </div>
                              <Badge className="bg-emerald-100 text-emerald-700">
                                <CheckCircle className="h-3 w-3 mr-1" /> +{submission.homework.points} pts
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancelled Homework */}
                  {myHomework.filter(s => s.status === "CANCELLED").length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-500 mb-3">Cancelled</h4>
                      <div className="space-y-2">
                        {myHomework.filter(s => s.status === "CANCELLED").map(submission => (
                          <div key={submission.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">{submission.homework.title}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => startHomework(submission.homeworkId)}
                              disabled={!!activeHomeworkId}
                            >
                              Restart
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TOOLS TAB ==================== */}
        <TabsContent value="tools" className="space-y-6">
          {/* Connected Accounts */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">My Accounts</h3>
                </div>
                <Button onClick={() => setShowConnectAccount(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>

              {accounts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Instagram className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Connect your accounts to use automation tools</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts.map(account => (
                    <div key={account.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        account.platform === "INSTAGRAM" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-black"
                      }`}>
                        {account.platform === "INSTAGRAM" ? (
                          <Instagram className="h-6 w-6 text-white" />
                        ) : (
                          <span className="text-white font-bold">TT</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">@{account.username}</p>
                        <p className="text-sm text-gray-500">{account._count.flows} flows active</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automation Flows */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">My Automation Flows</h3>
                </div>
                <Button 
                  onClick={() => setShowCreateFlow(true)} 
                  disabled={accounts.length === 0}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>

              {flows.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Create flows to auto-reply to comments and DMs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flows.map(flow => (
                    <div key={flow.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <MessageCircle className="h-5 w-5 text-pink-500" />
                        <div>
                          <p className="font-medium text-gray-900">{flow.name}</p>
                          <p className="text-sm text-gray-500">{getTriggerTypeLabel(flow.triggerType)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{flow.totalTriggered}</p>
                          <p className="text-xs text-gray-500">Triggered</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-emerald-600">{flow.totalBooked}</p>
                          <p className="text-xs text-gray-500">Booked</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TRACKING TAB ==================== */}
        <TabsContent value="tracking" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">My Tracking Links & Results</h3>
              </div>

              {trackingLinks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Your tracking results will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingLinks.map(link => (
                    <div key={link.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{link.source}</Badge>
                          {link.campaign && <span className="text-sm text-gray-500">{link.campaign}</span>}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{link.clicks}</p>
                            <p className="text-xs text-gray-500">Clicks</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-emerald-600">{link.conversions}</p>
                            <p className="text-xs text-gray-500">Bookings</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-violet-600">
                              {link.clicks > 0 ? Math.round((link.conversions / link.clicks) * 100) : 0}%
                            </p>
                            <p className="text-xs text-gray-500">Conv. Rate</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connect Account Modal */}
      {showConnectAccount && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowConnectAccount(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Connect Account</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowConnectAccount(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewAccountPlatform("INSTAGRAM")}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          newAccountPlatform === "INSTAGRAM" 
                            ? "border-pink-500 bg-pink-50" 
                            : "border-gray-200"
                        }`}
                      >
                        <Instagram className={`h-8 w-8 mx-auto mb-2 ${
                          newAccountPlatform === "INSTAGRAM" ? "text-pink-500" : "text-gray-400"
                        }`} />
                        <p className="text-sm font-medium">Instagram</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAccountPlatform("TIKTOK")}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          newAccountPlatform === "TIKTOK" 
                            ? "border-gray-900 bg-gray-50" 
                            : "border-gray-200"
                        }`}
                      >
                        <div className={`w-8 h-8 mx-auto mb-2 rounded flex items-center justify-center ${
                          newAccountPlatform === "TIKTOK" ? "bg-black text-white" : "bg-gray-200"
                        }`}>
                          <span className="font-bold text-sm">TT</span>
                        </div>
                        <p className="text-sm font-medium">TikTok</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={newAccountUsername}
                      onChange={(e) => setNewAccountUsername(e.target.value)}
                      placeholder="@yourusername"
                    />
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This environment uses simulated beta mode. Enter a username to create an internal test
                      account connection.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowConnectAccount(false)}>Cancel</Button>
                  <Button 
                    onClick={connectAccount}
                    disabled={saving || !newAccountUsername}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Create Flow Modal */}
      {showCreateFlow && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCreateFlow(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Create Automation Flow</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateFlow(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account</Label>
                      <Select
                        value={newFlow.accountId}
                        onValueChange={(value) => setNewFlow({ ...newFlow, accountId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              @{account.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={newFlow.triggerType}
                        onValueChange={(value) => setNewFlow({ ...newFlow, triggerType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMMENT_KEYWORD">Comment → DM</SelectItem>
                          <SelectItem value="STORY_REPLY">Story Reply → DM</SelectItem>
                          <SelectItem value="INBOUND_DM_KEYWORD">DM Keyword → Flow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Flow Name</Label>
                    <Input
                      value={newFlow.name}
                      onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                      placeholder="e.g., Book Now Auto-Reply"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger Keywords</Label>
                    <Input
                      value={newFlow.triggerKeywords}
                      onChange={(e) => setNewFlow({ ...newFlow, triggerKeywords: e.target.value })}
                      placeholder="book, info, price"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Response Message</Label>
                    <Textarea
                      value={newFlow.responseMessage}
                      onChange={(e) => setNewFlow({ ...newFlow, responseMessage: e.target.value })}
                      placeholder="Hey! Thanks for your interest! 🙌"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Include Booking Link</p>
                      <p className="text-sm text-gray-500">Add your booking link with tracking</p>
                    </div>
                    <Switch
                      checked={newFlow.includeBookingLink}
                      onCheckedChange={(checked) => setNewFlow({ ...newFlow, includeBookingLink: checked })}
                    />
                  </div>

                  {/* Link to Active Homework */}
                  {activeHomeworkId && (() => {
                    const activeHw = myHomework.find(h => h.homeworkId === activeHomeworkId && h.status === "ACTIVE")
                    return (
                      <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-violet-500" />
                              Link to Active Homework
                            </p>
                            <p className="text-sm text-gray-500">Automatically attach this flow to your current homework for tracking</p>
                          </div>
                          <Switch
                            checked={newFlow.linkToActiveHomework}
                            onCheckedChange={(checked) => setNewFlow({ ...newFlow, linkToActiveHomework: checked })}
                          />
                        </div>
                        {activeHw && (
                          <div className="mt-3 p-2 bg-white rounded border border-violet-200">
                            <p className="text-xs text-gray-500">Current active homework:</p>
                            <p className="font-medium text-violet-700">{activeHw.homework.title}</p>
                            <p className="text-xs text-gray-500">{activeHw.homework.module.category.name} → {activeHw.homework.module.title}</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowCreateFlow(false)}>Cancel</Button>
                  <Button 
                    onClick={createFlow}
                    disabled={saving || !newFlow.accountId || !newFlow.name}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Module Detail Modal (same as studio version) */}
      {selectedModule && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedModule(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-0">
                <div className="aspect-video bg-black relative">
                  {selectedModule.videoUrl ? (
                    selectedModule.videoUrl.includes("youtube") ? (
                      <iframe
                        src={selectedModule.videoUrl.replace("watch?v=", "embed/")}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <video src={selectedModule.videoUrl} controls className="w-full h-full" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-violet-500">
                      <Video className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => setSelectedModule(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedModule.title}</h2>
                    <p className="text-gray-600">{selectedModule.description}</p>
                  </div>

                  {/* Module Summary */}
                  {selectedModule.summary && (
                    <div className="p-4 bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-violet-500" />
                        Module Summary
                      </h3>
                      <p className="text-gray-700">{selectedModule.summary}</p>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {selectedModule.keyTakeaways && (
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        Key Takeaways
                      </h3>
                      <ul className="space-y-2">
                        {JSON.parse(selectedModule.keyTakeaways).map((takeaway: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Homework Assignment */}
                  {selectedModule.homework.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-violet-500" />
                        Homework Assignment
                      </h3>
                      {selectedModule.homework.map(hw => {
                        const requirements = JSON.parse(hw.requirements || "[]")
                        const aiInstructions = hw.aiInstructions ? JSON.parse(hw.aiInstructions) : []
                        const mySubmission = myHomework.find(s => s.homeworkId === hw.id)
                        const isActive = mySubmission?.status === "ACTIVE"
                        const isCompleted = mySubmission?.isCompleted
                        const hasOtherActiveHomework = activeHomeworkId && activeHomeworkId !== hw.id
                        
                        return (
                          <div key={hw.id} className={`p-4 rounded-xl ${
                            isCompleted ? "bg-emerald-50" : isActive ? "bg-violet-50 border-2 border-violet-300" : "bg-gray-50"
                          }`}>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{hw.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{hw.description}</p>
                              </div>
                              <Badge className={
                                isCompleted 
                                  ? "bg-emerald-100 text-emerald-700" 
                                  : isActive 
                                    ? "bg-violet-100 text-violet-700" 
                                    : "bg-gray-100 text-gray-700"
                              }>
                                {isCompleted ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                                ) : isActive ? (
                                  "In Progress"
                                ) : (
                                  `${hw.points} pts`
                                )}
                              </Badge>
                            </div>
                            
                            {/* Requirements */}
                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-medium text-gray-700">Tasks to Complete:</p>
                              {requirements.map((req: { task: string; quantity: number; metric: string }, i: number) => {
                                const current = mySubmission?.progress?.[req.metric] || 0
                                const percent = Math.min((current / req.quantity) * 100, 100)
                                
                                return (
                                  <div key={i} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-700">• {req.task}</span>
                                      <span className={percent >= 100 ? "text-emerald-600 font-medium" : "text-gray-500"}>
                                        {isActive ? `${current}/${req.quantity}` : `${req.quantity} required`}
                                      </span>
                                    </div>
                                    {isActive && (
                                      <div className="h-1.5 bg-white rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all ${
                                            percent >= 100 ? "bg-emerald-500" : "bg-violet-500"
                                          }`}
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {/* AI Instructions (shown when homework is active) */}
                            {isActive && aiInstructions.length > 0 && (
                              <div className="mb-4 p-3 bg-white rounded-lg border border-violet-200">
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 text-amber-500" />
                                  How to Complete This Homework
                                </h5>
                                <div className="space-y-4">
                                  {aiInstructions.map((instruction: { task: string; steps: string[] }, i: number) => (
                                    <div key={i}>
                                      <p className="text-sm font-medium text-violet-700 mb-2">{instruction.task}</p>
                                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-2">
                                        {instruction.steps.map((step: string, j: number) => (
                                          <li key={j}>{step}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Full Tracking URL & Automation Setup (shown when active) */}
                            {isActive && mySubmission && (
                              <div className="mb-4 space-y-4">
                                {/* Full Booking URL */}
                                <div className="p-4 bg-white rounded-lg border border-violet-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <LinkIcon className="h-4 w-4 text-violet-500" />
                                    <p className="font-medium text-gray-900">Your Tracking Booking Link</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">Use this URL in your Instagram/TikTok bio or DM automation:</p>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono truncate">
                                      {mySubmission.fullTrackingUrl || `Use code: ${mySubmission.trackingCode}`}
                                    </code>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        navigator.clipboard.writeText(mySubmission.fullTrackingUrl || mySubmission.trackingCode || "")
                                        alert("Copied to clipboard!")
                                      }}
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                </div>

                                {/* Attach Automation Flow */}
                                <div className="p-4 bg-white rounded-lg border border-amber-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    <p className="font-medium text-gray-900">Attach Auto DM Flow</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-3">Link an automation flow to track conversions from this homework:</p>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={mySubmission.attachedFlowId || "none"}
                                      onValueChange={(value) => attachFlow(hw.id, value === "none" ? null : value)}
                                      disabled={savingFlow}
                                    >
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a flow to attach" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">No flow attached</SelectItem>
                                        {flows.map(flow => (
                                          <SelectItem key={flow.id} value={flow.id}>
                                            {flow.name} (@{flow.account.username})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {savingFlow && <Loader2 className="h-4 w-4 animate-spin text-violet-500" />}
                                  </div>
                                  {mySubmission.attachedFlow && (
                                    <div className="mt-2 text-xs flex items-center gap-2 text-amber-700">
                                      <CheckCircle className="h-3 w-3" />
                                      Tracking: {mySubmission.attachedFlow.name} on @{mySubmission.attachedFlow.account.username}
                                    </div>
                                  )}
                                </div>

                                {/* Video Links for Evidence */}
                                <div className="p-4 bg-white rounded-lg border border-emerald-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Video className="h-4 w-4 text-emerald-500" />
                                    <p className="font-medium text-gray-900">Video Evidence</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-3">Add links to your Instagram/TikTok videos to show completion:</p>
                                  <div className="space-y-2">
                                    {(mySubmission.submissionUrls?.length ? mySubmission.submissionUrls : videoLinks).map((url, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <Input
                                          placeholder="https://instagram.com/reel/..."
                                          value={url}
                                          onChange={(e) => {
                                            const newUrls = [...(mySubmission.submissionUrls?.length ? mySubmission.submissionUrls : videoLinks)]
                                            newUrls[i] = e.target.value
                                            if (mySubmission.submissionUrls?.length) {
                                              // Update directly
                                            } else {
                                              setVideoLinks(newUrls)
                                            }
                                          }}
                                          className="flex-1 text-sm"
                                        />
                                        {url && (
                                          <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => window.open(url, "_blank")}
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const current = mySubmission.submissionUrls?.length ? [...mySubmission.submissionUrls] : [...videoLinks]
                                          current.push("")
                                          if (mySubmission.submissionUrls?.length) {
                                            saveVideoLinks(hw.id, current)
                                          } else {
                                            setVideoLinks(current)
                                          }
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Video Link
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          const urls = mySubmission.submissionUrls?.length ? mySubmission.submissionUrls : videoLinks
                                          saveVideoLinks(hw.id, urls)
                                        }}
                                        disabled={savingVideoLinks}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        {savingVideoLinks ? (
                                          <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Saving...</>
                                        ) : (
                                          <>Save Links</>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {mySubmission.submissionUrls?.length > 0 && (
                                    <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      {mySubmission.submissionUrls.filter(u => u).length} video(s) submitted
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {!mySubmission && (
                              <>
                                {hasOtherActiveHomework ? (
                                  <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                                    <p className="font-medium">You have active homework</p>
                                    <p>Complete or cancel your current homework before starting a new one.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {/* Pre-select flow before starting */}
                                    {flows.length > 0 && (
                                      <div className="p-3 bg-amber-50 rounded-lg">
                                        <p className="text-sm font-medium text-amber-800 mb-2">
                                          <Zap className="h-4 w-4 inline mr-1" />
                                          Attach an automation flow (optional)
                                        </p>
                                        <Select
                                          value={selectedFlowId || "none"}
                                          onValueChange={(value) => setSelectedFlowId(value === "none" ? "" : value)}
                                        >
                                          <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select a flow to track" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Start without flow</SelectItem>
                                            {flows.map(flow => (
                                              <SelectItem key={flow.id} value={flow.id}>
                                                {flow.name} (@{flow.account.username})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <p className="text-xs text-amber-600 mt-1">
                                          Attach a flow to automatically track bookings from your content
                                        </p>
                                      </div>
                                    )}
                                    <Button 
                                      onClick={() => startHomework(hw.id)}
                                      disabled={startingHomework}
                                      className="w-full bg-violet-600 hover:bg-violet-700"
                                    >
                                      {startingHomework ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting...</>
                                      ) : (
                                        <>Start Homework</>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}

                            {isActive && !isCompleted && (
                              <Button 
                                onClick={() => cancelHomework(hw.id)}
                                disabled={cancellingHomework}
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                              >
                                {cancellingHomework ? (
                                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelling...</>
                                ) : (
                                  <>Cancel Homework</>
                                )}
                              </Button>
                            )}

                            {mySubmission?.status === "CANCELLED" && (
                              <Button 
                                onClick={() => startHomework(hw.id)}
                                disabled={startingHomework || !!hasOtherActiveHomework}
                                variant="outline"
                                className="w-full"
                              >
                                Restart Homework
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}











