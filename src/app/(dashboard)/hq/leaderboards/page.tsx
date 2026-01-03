"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Trophy,
  Medal,
  Award,
  Star,
  TrendingUp,
  Crown,
  Gift,
  Loader2,
  Plus,
  Edit,
  Settings,
  Users,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Target,
  Sparkles,
  Eye
} from "lucide-react"

interface Prize {
  id: string
  position: number
  name: string
  description: string | null
  prizeType: string
  prizeValue: number | null
  sponsorName: string | null
}

interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  _count: { entries: number; winners: number }
}

interface Leaderboard {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  participantType: string
  timeframe: string
  metricName: string
  metricUnit: string | null
  icon: string | null
  color: string | null
  isActive: boolean
  isFeatured: boolean
  showOnDashboard: boolean
  createdAt: string
  prizes: Prize[]
  periods: Period[]
  _count: { periods: number; prizes: number }
}

interface Winner {
  id: string
  position: number
  finalScore: number
  prizeStatus: string
  createdAt: string
  participant: { id: string; name: string } | null
  prize: {
    name: string
    prizeValue: number | null
    leaderboard: { name: string; participantType: string }
  }
  period: { name: string }
}

interface Stats {
  totalLeaderboards: number
  activeLeaderboards: number
  studioLeaderboards: number
  teacherLeaderboards: number
  totalPrizes: number
  activePeriods: number
}

const CATEGORIES = [
  { value: "MOST_CONTENT_POSTED", label: "Most Content Posted" },
  { value: "MOST_SOCIAL_VIEWS", label: "Most Social Views" },
  { value: "MOST_SOCIAL_LIKES", label: "Most Social Likes" },
  { value: "MOST_SOCIAL_ENGAGEMENT", label: "Most Engagement" },
  { value: "CONTENT_CONSISTENCY", label: "Content Consistency" },
  { value: "FASTEST_GROWING", label: "Fastest Growing" },
  { value: "BIGGEST_GROWTH_MONTHLY", label: "Biggest Growth (Monthly)" },
  { value: "BIGGEST_GROWTH_QUARTERLY", label: "Biggest Growth (Quarterly)" },
  { value: "MOST_NEW_CLIENTS", label: "Most New Clients" },
  { value: "HIGHEST_RETENTION", label: "Highest Retention" },
  { value: "MOST_COURSES_COMPLETED", label: "Most Courses Completed" },
  { value: "MOST_COURSE_ENROLLMENTS", label: "Most Course Enrollments" },
  { value: "TOP_COURSE_CREATOR", label: "Top Course Creator" },
  { value: "BEST_COURSE_RATINGS", label: "Best Course Ratings" },
  { value: "MOST_BOOKINGS", label: "Most Bookings" },
  { value: "HIGHEST_ATTENDANCE_RATE", label: "Highest Attendance Rate" },
  { value: "MOST_CLASSES_TAUGHT", label: "Most Classes Taught" },
  { value: "TOP_REVENUE", label: "Top Revenue" },
  { value: "MOST_ACTIVE_COMMUNITY", label: "Most Active Community" },
  { value: "TOP_REVIEWER", label: "Top Reviewer" },
  { value: "MOST_REFERRALS", label: "Most Referrals" },
  { value: "NEWCOMER_OF_MONTH", label: "Newcomer of the Month" },
  { value: "COMEBACK_CHAMPION", label: "Comeback Champion" },
  { value: "ALL_ROUNDER", label: "All Rounder" }
]

const PRIZE_TYPES = [
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "GIFT_CARD", label: "Gift Card", icon: "🎁" },
  { value: "HOLIDAY", label: "Holiday/Trip", icon: "✈️" },
  { value: "MERCHANDISE", label: "Merchandise", icon: "👕" },
  { value: "SUBSCRIPTION", label: "Subscription", icon: "⭐" },
  { value: "FEATURE_SPOTLIGHT", label: "Feature Spotlight", icon: "🔦" },
  { value: "BADGE", label: "Badge", icon: "🏅" },
  { value: "OTHER", label: "Other", icon: "🎉" }
]

export default function HQLeaderboardsPage() {
  const [loading, setLoading] = useState(true)
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([])
  const [recentWinners, setRecentWinners] = useState<Winner[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<Leaderboard | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    participantType: "STUDIO",
    timeframe: "MONTHLY",
    metricName: "",
    metricUnit: "",
    color: "#7c3aed",
    isActive: true,
    isFeatured: false,
    prizes: [
      { position: 1, name: "", prizeType: "CASH", prizeValue: 0, sponsorName: "" },
      { position: 2, name: "", prizeType: "GIFT_CARD", prizeValue: 0, sponsorName: "" },
      { position: 3, name: "", prizeType: "BADGE", prizeValue: 0, sponsorName: "" }
    ]
  })

  const [periodForm, setPeriodForm] = useState({
    name: "",
    startDate: "",
    endDate: ""
  })

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  async function fetchLeaderboards() {
    try {
      const res = await fetch("/api/hq/leaderboards")
      if (res.ok) {
        const data = await res.json()
        setLeaderboards(data.leaderboards)
        setRecentWinners(data.recentWinners)
        setStats(data.stats)
      }
    } catch (err) {
      console.error("Failed to fetch leaderboards:", err)
    }
    setLoading(false)
  }

  async function createLeaderboard() {
    setSaving(true)
    try {
      const res = await fetch("/api/hq/leaderboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prizes: form.prizes.filter(p => p.name)
        })
      })

      if (res.ok) {
        const newLb = await res.json()
        setLeaderboards([newLb, ...leaderboards])
        setShowCreateModal(false)
        resetForm()
      }
    } catch (err) {
      console.error("Failed to create leaderboard:", err)
    }
    setSaving(false)
  }

  async function createPeriod() {
    if (!selectedLeaderboard) return
    setSaving(true)
    try {
      const res = await fetch("/api/hq/leaderboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createPeriod",
          leaderboardId: selectedLeaderboard.id,
          ...periodForm
        })
      })

      if (res.ok) {
        await fetchLeaderboards()
        setShowPeriodModal(false)
        setPeriodForm({ name: "", startDate: "", endDate: "" })
      }
    } catch (err) {
      console.error("Failed to create period:", err)
    }
    setSaving(false)
  }

  async function toggleLeaderboard(id: string, field: "isActive" | "isFeatured", value: boolean) {
    try {
      await fetch("/api/hq/leaderboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          leaderboardId: id,
          [field]: value
        })
      })
      setLeaderboards(leaderboards.map(lb => 
        lb.id === id ? { ...lb, [field]: value } : lb
      ))
    } catch (err) {
      console.error("Failed to update:", err)
    }
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      category: "",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "",
      metricUnit: "",
      color: "#7c3aed",
      isActive: true,
      isFeatured: false,
      prizes: [
        { position: 1, name: "", prizeType: "CASH", prizeValue: 0, sponsorName: "" },
        { position: 2, name: "", prizeType: "GIFT_CARD", prizeValue: 0, sponsorName: "" },
        { position: 3, name: "", prizeType: "BADGE", prizeValue: 0, sponsorName: "" }
      ]
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      DRAFT: "bg-gray-100 text-gray-700",
      ARCHIVED: "bg-red-100 text-red-700"
    }
    return <Badge className={styles[status] || "bg-gray-100"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="h-7 w-7 text-amber-500" />
            Leaderboards Management
          </h1>
          <p className="text-gray-500 mt-1">Create and manage competitions across Soulflow</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Leaderboard
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalLeaderboards}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Check className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeLeaderboards}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-violet-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.studioLeaderboards}</p>
                  <p className="text-xs text-gray-500">Studios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.teacherLeaderboards}</p>
                  <p className="text-xs text-gray-500">Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPrizes}</p>
                  <p className="text-xs text-gray-500">Prizes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activePeriods}</p>
                  <p className="text-xs text-gray-500">Active Periods</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="leaderboards" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="leaderboards">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboards
          </TabsTrigger>
          <TabsTrigger value="winners">
            <Crown className="h-4 w-4 mr-2" />
            Recent Winners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboards">
          <div className="space-y-4">
            {leaderboards.map(lb => (
              <Card key={lb.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${lb.color || "#7c3aed"}20` }}
                      >
                        <Trophy className="h-6 w-6" style={{ color: lb.color || "#7c3aed" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{lb.name}</h3>
                          {lb.isFeatured && (
                            <Badge className="bg-amber-100 text-amber-700">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge variant={lb.isActive ? "default" : "secondary"}>
                            {lb.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {lb.participantType === "STUDIO" ? "Studios" : "Teachers"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{lb.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{CATEGORIES.find(c => c.value === lb.category)?.label}</span>
                          <span>•</span>
                          <span>{lb.timeframe.toLowerCase()}</span>
                          <span>•</span>
                          <span>{lb._count.prizes} prizes</span>
                          <span>•</span>
                          <span>{lb._count.periods} periods</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Featured</span>
                        <Switch
                          checked={lb.isFeatured}
                          onCheckedChange={(v) => toggleLeaderboard(lb.id, "isFeatured", v)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Active</span>
                        <Switch
                          checked={lb.isActive}
                          onCheckedChange={(v) => toggleLeaderboard(lb.id, "isActive", v)}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedLeaderboard(lb)
                          setShowPeriodModal(true)
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        New Period
                      </Button>
                    </div>
                  </div>

                  {/* Prizes Preview */}
                  {lb.prizes.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex items-center gap-3">
                      <span className="text-sm text-gray-500">Prizes:</span>
                      {lb.prizes.slice(0, 3).map(prize => (
                        <Badge key={prize.id} variant="outline" className="gap-1">
                          {prize.position === 1 ? "🥇" : prize.position === 2 ? "🥈" : "🥉"}
                          {prize.name}
                          {prize.prizeValue && ` ($${prize.prizeValue})`}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Active Periods */}
                  {lb.periods.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Current/Recent Periods:</p>
                      <div className="flex flex-wrap gap-2">
                        {lb.periods.slice(0, 3).map(period => (
                          <div key={period.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            {getStatusBadge(period.status)}
                            <span className="text-sm">{period.name}</span>
                            <span className="text-xs text-gray-400">
                              ({period._count.entries} entries)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {leaderboards.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Leaderboards Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first leaderboard to start competitions</p>
                  <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Leaderboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="winners">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Winners</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWinners.length > 0 ? (
                <div className="space-y-3">
                  {recentWinners.map(winner => (
                    <div key={winner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                          {winner.position === 1 ? "🥇" : winner.position === 2 ? "🥈" : "🥉"}
                        </div>
                        <div>
                          <p className="font-medium">{winner.participant?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-500">
                            {winner.prize.leaderboard.name} - {winner.period.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{winner.prize.name}</p>
                        <Badge variant={
                          winner.prizeStatus === "fulfilled" ? "default" :
                          winner.prizeStatus === "claimed" ? "secondary" : "outline"
                        }>
                          {winner.prizeStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No winners yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Leaderboard Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Leaderboard</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Leaderboard Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Content Champion of the Month"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what this leaderboard measures..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Participant Type</Label>
                <Select value={form.participantType} onValueChange={(v) => setForm({ ...form, participantType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDIO">Studios</SelectItem>
                    <SelectItem value="TEACHER">Teachers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select value={form.timeframe} onValueChange={(v) => setForm({ ...form, timeframe: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="ALL_TIME">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Metric Name</Label>
                <Input
                  value={form.metricName}
                  onChange={(e) => setForm({ ...form, metricName: e.target.value })}
                  placeholder="e.g., posts, views, clients"
                />
              </div>

              <div className="space-y-2">
                <Label>Metric Unit</Label>
                <Input
                  value={form.metricUnit}
                  onChange={(e) => setForm({ ...form, metricUnit: e.target.value })}
                  placeholder="e.g., posts, %, $"
                />
              </div>

              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Prizes */}
            <div>
              <Label className="text-base font-semibold">Prizes</Label>
              <div className="space-y-3 mt-2">
                {form.prizes.map((prize, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                    <div>
                      <Label className="text-xs">Position</Label>
                      <div className="flex items-center justify-center h-10 bg-gray-100 rounded-lg font-bold">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} #{idx + 1}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Prize Name</Label>
                      <Input
                        value={prize.name}
                        onChange={(e) => {
                          const newPrizes = [...form.prizes]
                          newPrizes[idx].name = e.target.value
                          setForm({ ...form, prizes: newPrizes })
                        }}
                        placeholder="e.g., $500 Cash, Lululemon Gift Card"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select 
                        value={prize.prizeType} 
                        onValueChange={(v) => {
                          const newPrizes = [...form.prizes]
                          newPrizes[idx].prizeType = v
                          setForm({ ...form, prizes: newPrizes })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIZE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Value ($)</Label>
                      <Input
                        type="number"
                        value={prize.prizeValue || ""}
                        onChange={(e) => {
                          const newPrizes = [...form.prizes]
                          newPrizes[idx].prizeValue = parseFloat(e.target.value) || 0
                          setForm({ ...form, prizes: newPrizes })
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
                />
                <Label>Featured</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createLeaderboard} 
              disabled={saving || !form.name || !form.category}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Leaderboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Period Modal */}
      <Dialog open={showPeriodModal} onOpenChange={setShowPeriodModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Period</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Period Name</Label>
              <Input
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="e.g., January 2025, Q1 2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createPeriod} 
              disabled={saving || !periodForm.name || !periodForm.startDate || !periodForm.endDate}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
              Create Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}












