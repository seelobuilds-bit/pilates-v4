// Demo Leaderboards Page - Mirrors /studio/leaderboards/page.tsx
// Keep in sync with the real leaderboards page

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Users,
  Award,
  Crown,
  Target,
  Gift,
  Flame,
  ChevronRight,
  Share2,
  BookOpen,
  Calendar,
  Heart,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"

// Full demo data matching the real leaderboards
const demoStudioLeaderboards = [
  {
    id: "1",
    name: "Content Champion",
    slug: "content-champion",
    description: "Studios creating the most engaging social content",
    category: "SOCIAL_MEDIA",
    participantType: "STUDIO",
    timeframe: "MONTHLY",
    metricName: "Posts Created",
    metricUnit: null,
    icon: "Share2",
    color: "#ec4899",
    isFeatured: true,
    prizes: [
      { id: "p1", position: 1, name: "$500 Marketing Credit", prizeType: "CASH", prizeValue: 500 },
      { id: "p2", position: 2, name: "$250 Marketing Credit", prizeType: "CASH", prizeValue: 250 },
      { id: "p3", position: 3, name: "$100 Marketing Credit", prizeType: "CASH", prizeValue: 100 },
    ],
    entries: [
      { rank: 1, name: "Zenith Pilates", score: 156, previousRank: 2 },
      { rank: 2, name: "Harmony Studio", score: 142, previousRank: 1 },
      { rank: 3, name: "Balance & Flow", score: 128, previousRank: 3 },
      { rank: 4, name: "Core Strength", score: 115, previousRank: 5 },
      { rank: 5, name: "Pure Motion", score: 98, previousRank: 4 },
    ],
    totalEntries: 89
  },
  {
    id: "2",
    name: "Client Magnet",
    slug: "client-magnet",
    description: "Studios attracting the most new clients",
    category: "GROWTH",
    participantType: "STUDIO",
    timeframe: "MONTHLY",
    metricName: "New Signups",
    metricUnit: null,
    icon: "TrendingUp",
    color: "#8b5cf6",
    isFeatured: true,
    prizes: [
      { id: "p4", position: 1, name: "Featured Studio Spotlight", prizeType: "FEATURE_SPOTLIGHT", prizeValue: null },
      { id: "p5", position: 2, name: "Premium Badge", prizeType: "BADGE", prizeValue: null },
      { id: "p6", position: 3, name: "Community Shoutout", prizeType: "FEATURE_SPOTLIGHT", prizeValue: null },
    ],
    entries: [
      { rank: 1, name: "Core Strength", score: 89, previousRank: 1 },
      { rank: 2, name: "Zenith Pilates", score: 76, previousRank: 3 },
      { rank: 3, name: "Pure Motion", score: 64, previousRank: 2 },
      { rank: 4, name: "Harmony Studio", score: 52, previousRank: 4 },
      { rank: 5, name: "Balance & Flow", score: 41, previousRank: 6 },
    ],
    totalEntries: 89
  },
  {
    id: "3",
    name: "Booking Bonanza",
    slug: "booking-bonanza",
    description: "Studios with the most class bookings",
    category: "CLASSES",
    participantType: "STUDIO",
    timeframe: "MONTHLY",
    metricName: "Total Bookings",
    metricUnit: null,
    icon: "Calendar",
    color: "#06b6d4",
    isFeatured: false,
    prizes: [],
    entries: [
      { rank: 1, name: "Harmony Studio", score: 1245, previousRank: 2 },
      { rank: 2, name: "Zenith Pilates", score: 1189, previousRank: 1 },
      { rank: 3, name: "Core Strength", score: 987, previousRank: 3 },
    ],
    totalEntries: 89
  },
]

const demoTeacherLeaderboards = [
  {
    id: "4",
    name: "Class King/Queen",
    slug: "class-king",
    description: "Teachers with the most classes taught",
    category: "CLASSES",
    participantType: "TEACHER",
    timeframe: "MONTHLY",
    metricName: "Classes Taught",
    metricUnit: null,
    icon: "BookOpen",
    color: "#22c55e",
    isFeatured: true,
    prizes: [
      { id: "p7", position: 1, name: "Spa Day Package", prizeType: "GIFT_CARD", prizeValue: 300 },
      { id: "p8", position: 2, name: "$150 Gift Card", prizeType: "GIFT_CARD", prizeValue: 150 },
      { id: "p9", position: 3, name: "$75 Gift Card", prizeType: "GIFT_CARD", prizeValue: 75 },
    ],
    entries: [
      { rank: 1, name: "Sarah Chen", score: 48, previousRank: 1 },
      { rank: 2, name: "Mike Johnson", score: 42, previousRank: 3 },
      { rank: 3, name: "Emily Davis", score: 38, previousRank: 2 },
      { rank: 4, name: "Lisa Park", score: 35, previousRank: 4 },
      { rank: 5, name: "James Wilson", score: 32, previousRank: 5 },
    ],
    totalEntries: 156
  },
  {
    id: "5",
    name: "Top Rated Instructor",
    slug: "top-rated",
    description: "Highest average client ratings",
    category: "RATINGS",
    participantType: "TEACHER",
    timeframe: "MONTHLY",
    metricName: "Average Rating",
    metricUnit: null,
    icon: "Star",
    color: "#f59e0b",
    isFeatured: true,
    prizes: [
      { id: "p10", position: 1, name: "Professional Development Course", prizeType: "SUBSCRIPTION", prizeValue: 500 },
      { id: "p11", position: 2, name: "Online Workshop Access", prizeType: "SUBSCRIPTION", prizeValue: 250 },
    ],
    entries: [
      { rank: 1, name: "Lisa Park", score: 4.98, previousRank: 1 },
      { rank: 2, name: "James Wilson", score: 4.95, previousRank: 2 },
      { rank: 3, name: "Sarah Chen", score: 4.92, previousRank: 4 },
      { rank: 4, name: "Emily Davis", score: 4.89, previousRank: 3 },
      { rank: 5, name: "Mike Johnson", score: 4.85, previousRank: 5 },
    ],
    totalEntries: 156
  },
  {
    id: "6",
    name: "Client Champion",
    slug: "client-champion",
    description: "Teachers with most repeat bookings",
    category: "RETENTION",
    participantType: "TEACHER",
    timeframe: "MONTHLY",
    metricName: "Repeat Bookings",
    metricUnit: "%",
    icon: "Heart",
    color: "#ef4444",
    isFeatured: false,
    prizes: [],
    entries: [
      { rank: 1, name: "Emily Davis", score: 94.5, previousRank: 2 },
      { rank: 2, name: "Sarah Chen", score: 91.2, previousRank: 1 },
      { rank: 3, name: "Lisa Park", score: 88.7, previousRank: 3 },
    ],
    totalEntries: 156
  },
]

const demoBadges = [
  { id: "1", name: "First Win", description: "Won your first leaderboard", icon: "🏆", earnedCount: 45 },
  { id: "2", name: "Triple Threat", description: "Top 3 in three different leaderboards", icon: "🎯", earnedCount: 12 },
  { id: "3", name: "Champion", description: "Won 5 leaderboards", icon: "👑", earnedCount: 8 },
  { id: "4", name: "Consistency King", description: "Maintained top 10 for 3 months", icon: "⚡", earnedCount: 15 },
  { id: "5", name: "Rising Star", description: "Improved rank by 10+ positions", icon: "🌟", earnedCount: 34 },
  { id: "6", name: "Social Butterfly", description: "Created 50+ social posts", icon: "🦋", earnedCount: 28 },
]

// Demo user ranks
const myRanks: Record<string, { rank: number; score: number }> = {
  "1": { rank: 3, score: 128 },
  "2": { rank: 5, score: 41 },
  "4": { rank: 2, score: 42 },
}

export default function DemoLeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<"studio" | "teacher">("studio")
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<typeof demoStudioLeaderboards[0] | null>(null)

  const leaderboards = activeTab === "studio" ? demoStudioLeaderboards : demoTeacherLeaderboards
  const featuredLeaderboards = leaderboards.filter(lb => lb.isFeatured)

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Share2: <Share2 className="h-5 w-5" />,
      TrendingUp: <TrendingUp className="h-5 w-5" />,
      BookOpen: <BookOpen className="h-5 w-5" />,
      Calendar: <Calendar className="h-5 w-5" />,
      Heart: <Heart className="h-5 w-5" />,
      Star: <Star className="h-5 w-5" />,
      Award: <Award className="h-5 w-5" />
    }
    return icons[iconName] || <Trophy className="h-5 w-5" />
  }

  const getPrizeIcon = (type: string) => {
    const icons: Record<string, string> = {
      CASH: "💵",
      GIFT_CARD: "🎁",
      HOLIDAY: "✈️",
      MERCHANDISE: "👕",
      SUBSCRIPTION: "⭐",
      FEATURE_SPOTLIGHT: "🔦",
      BADGE: "🏅",
      OTHER: "🎉"
    }
    return icons[type] || "🎉"
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="font-bold text-gray-500">{position}</span>
  }

  const getRankChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null
    const diff = previous - current
    if (diff > 0) return <span className="flex items-center text-green-600 text-xs"><ArrowUp className="h-3 w-3" />{diff}</span>
    if (diff < 0) return <span className="flex items-center text-red-600 text-xs"><ArrowDown className="h-3 w-3" />{Math.abs(diff)}</span>
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const formatScore = (score: number, unit: string | null) => {
    if (unit === "%") return `${score.toFixed(1)}%`
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`
    return score.toLocaleString()
  }

  return (
    <div className="p-8 bg-gradient-to-br from-violet-50/50 to-amber-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Leaderboards</h1>
            </div>
            <p className="text-gray-500">Compete across Soulflow and win amazing prizes!</p>
          </div>
          
          {/* Studio vs Teacher Toggle */}
          <div className="flex bg-white border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("studio")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === "studio"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Target className="h-4 w-4" />
              Studio Rankings
              <Badge variant={activeTab === "studio" ? "secondary" : "outline"} className="ml-1">
                {demoStudioLeaderboards.length}
              </Badge>
            </button>
            <button
              onClick={() => setActiveTab("teacher")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === "teacher"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Users className="h-4 w-4" />
              Teacher Rankings
              <Badge variant={activeTab === "teacher" ? "secondary" : "outline"} className="ml-1">
                {demoTeacherLeaderboards.length}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      {/* Your Rankings Summary */}
      <Card className={`border-0 shadow-lg text-white mb-8 ${
        activeTab === "studio" 
          ? "bg-gradient-to-r from-violet-600 to-purple-600" 
          : "bg-gradient-to-r from-emerald-600 to-teal-600"
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                {activeTab === "studio" ? "Your Studio Rankings" : "Your Teacher Rankings"}
              </h2>
              <p className={activeTab === "studio" ? "text-violet-200 text-sm" : "text-emerald-200 text-sm"}>
                {activeTab === "studio" 
                  ? "Compete with other studios across Soulflow!" 
                  : "Compete with instructors across all studios!"}
              </p>
            </div>
            <div className="flex gap-4">
              {Object.entries(myRanks)
                .filter(([lbId]) => {
                  const lb = leaderboards.find(l => l.id === lbId)
                  return lb !== undefined
                })
                .slice(0, 3)
                .map(([lbId, rank]) => {
                  const lb = leaderboards.find(l => l.id === lbId)
                  if (!lb) return null
                  return (
                    <div key={lbId} className="text-center bg-white/10 rounded-lg px-4 py-2">
                      <p className="text-xs opacity-80 mb-1">{lb.name}</p>
                      <p className="text-2xl font-bold">#{rank.rank}</p>
                    </div>
                  )
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Leaderboards */}
      {featuredLeaderboards.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Featured Competitions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLeaderboards.map(lb => (
              <Card 
                key={lb.id} 
                className="border-0 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                onClick={() => setSelectedLeaderboard(lb)}
              >
                <div 
                  className="h-2"
                  style={{ backgroundColor: lb.color || "#7c3aed" }}
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{lb.name}</h3>
                      <p className="text-sm text-gray-500">{lb.timeframe.toLowerCase()}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>

                  {/* Top 3 */}
                  <div className="space-y-2 mb-4">
                    {lb.entries.slice(0, 3).map((entry, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          idx === 0 ? "bg-yellow-50" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getPositionIcon(idx + 1)}
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: lb.color || "#7c3aed" }}>
                          {formatScore(entry.score, lb.metricUnit)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Prizes Preview */}
                  {lb.prizes.length > 0 && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Gift className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Win: {lb.prizes[0].name}
                        {lb.prizes.length > 1 && ` + ${lb.prizes.length - 1} more`}
                      </span>
                    </div>
                  )}

                  {/* Your Rank */}
                  {myRanks[lb.id] && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-sm text-gray-500">Your Rank</span>
                      <span className="font-bold" style={{ color: lb.color || "#7c3aed" }}>
                        #{myRanks[lb.id].rank}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Leaderboards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All {activeTab === "studio" ? "Studio" : "Teacher"} Leaderboards</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaderboards.map(lb => (
            <Card 
              key={lb.id} 
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedLeaderboard(lb)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${lb.color || "#7c3aed"}20` }}
                    >
                      {getCategoryIcon(lb.icon || "Trophy")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lb.name}</h3>
                      <p className="text-xs text-gray-500">
                        {lb.totalEntries} participants • {lb.timeframe.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </div>

                {/* Top Entries */}
                <div className="space-y-2">
                  {lb.entries.slice(0, 5).map((entry, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 flex justify-center">
                          {idx < 3 ? getPositionIcon(idx + 1) : (
                            <span className="text-sm text-gray-400">{idx + 1}</span>
                          )}
                        </div>
                        <span className="text-sm truncate max-w-[150px]">
                          {entry.name}
                        </span>
                        {getRankChange(entry.rank, entry.previousRank)}
                      </div>
                      <span className="text-sm font-medium">
                        {formatScore(entry.score, lb.metricUnit)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Your Rank & Prize */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  {myRanks[lb.id] ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        You: <span className="font-semibold">#{myRanks[lb.id].rank}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Not ranked yet</span>
                  )}
                  {lb.prizes[0] && (
                    <div className="flex items-center gap-1 text-sm">
                      <span>{getPrizeIcon(lb.prizes[0].prizeType)}</span>
                      <span className="text-gray-600">{lb.prizes[0].name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-violet-500" />
          Badges
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {demoBadges.map((badge) => (
            <Card key={badge.id} className="border-0 shadow-sm text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h3 className="font-semibold text-sm">{badge.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                <p className="text-xs text-violet-600 mt-2">{badge.earnedCount} earned</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leaderboard Detail Modal */}
      {selectedLeaderboard && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLeaderboard(null)}
        >
          <Card 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div 
              className="h-3"
              style={{ backgroundColor: selectedLeaderboard.color || "#7c3aed" }}
            />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedLeaderboard.name}</CardTitle>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedLeaderboard.description}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLeaderboard(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Period Info */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{selectedLeaderboard.timeframe}</span>
                </div>
                <Badge>{selectedLeaderboard.totalEntries} participants</Badge>
              </div>

              {/* Prizes */}
              {selectedLeaderboard.prizes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-amber-500" />
                    Prizes Up For Grabs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedLeaderboard.prizes.map(prize => (
                      <div 
                        key={prize.id}
                        className={`relative p-5 rounded-2xl text-center overflow-hidden ${
                          prize.position === 1 
                            ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-200" 
                            : prize.position === 2
                              ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-200"
                              : "bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-200"
                        }`}
                      >
                        {/* Position Badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-white/30 text-white">
                          {prize.position === 1 ? "🥇 1ST" : prize.position === 2 ? "🥈 2ND" : "🥉 3RD"}
                        </div>
                        
                        {/* Prize Icon */}
                        <div className="text-4xl mb-3 mt-4">
                          {getPrizeIcon(prize.prizeType)}
                        </div>
                        
                        <p className="font-bold text-lg">{prize.name}</p>
                        {prize.prizeValue && (
                          <p className="text-2xl font-bold mt-1 text-white/90">
                            ${prize.prizeValue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Rankings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-violet-500" />
                  Rankings
                </h3>
                <div className="space-y-2">
                  {selectedLeaderboard.entries.map((entry, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        idx === 0 ? "bg-yellow-50 border border-yellow-200" :
                        idx === 1 ? "bg-gray-50 border border-gray-200" :
                        idx === 2 ? "bg-amber-50 border border-amber-200" :
                        "bg-white border border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 flex justify-center">
                          {getPositionIcon(idx + 1)}
                        </div>
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          {getRankChange(entry.rank, entry.previousRank)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p 
                          className="font-bold"
                          style={{ color: selectedLeaderboard.color || "#7c3aed" }}
                        >
                          {formatScore(entry.score, selectedLeaderboard.metricUnit)}
                        </p>
                        <p className="text-xs text-gray-400">{selectedLeaderboard.metricName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Position */}
              {myRanks[selectedLeaderboard.id] && (
                <div 
                  className="p-4 rounded-xl text-white"
                  style={{ backgroundColor: selectedLeaderboard.color || "#7c3aed" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Your Position</p>
                      <p className="text-3xl font-bold">#{myRanks[selectedLeaderboard.id].rank}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Your Score</p>
                      <p className="text-2xl font-bold">
                        {formatScore(myRanks[selectedLeaderboard.id].score, selectedLeaderboard.metricUnit)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
