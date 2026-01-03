"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Zap,
  Gift
} from "lucide-react"

const demoStudioLeaderboards = [
  {
    id: "1",
    name: "Content Champion",
    description: "Most content posted this month",
    category: "SOCIAL_MEDIA",
    entries: [
      { rank: 1, name: "Zenith Pilates", score: 156, avatar: "ZP", change: "+12" },
      { rank: 2, name: "Harmony Studio", score: 142, avatar: "HS", change: "+8" },
      { rank: 3, name: "Balance & Flow", score: 128, avatar: "BF", change: "+5" },
    ],
    prize: "$500 Marketing Credit"
  },
  {
    id: "2",
    name: "Client Magnet",
    description: "Most new client sign-ups",
    category: "GROWTH",
    entries: [
      { rank: 1, name: "Core Strength", score: 89, avatar: "CS", change: "+15" },
      { rank: 2, name: "Zenith Pilates", score: 76, avatar: "ZP", change: "+10" },
      { rank: 3, name: "Pure Motion", score: 64, avatar: "PM", change: "+7" },
    ],
    prize: "Featured Studio Spotlight"
  },
]

const demoTeacherLeaderboards = [
  {
    id: "3",
    name: "Most Classes Taught",
    description: "Total classes this month",
    category: "CLASSES",
    entries: [
      { rank: 1, name: "Sarah Chen", score: 48, avatar: "SC", change: "+5" },
      { rank: 2, name: "Mike Johnson", score: 42, avatar: "MJ", change: "+3" },
      { rank: 3, name: "Emily Davis", score: 38, avatar: "ED", change: "+2" },
    ],
    prize: "Spa Day Package"
  },
  {
    id: "4",
    name: "Top Rated Instructor",
    description: "Highest average client rating",
    category: "RATINGS",
    entries: [
      { rank: 1, name: "Lisa Park", score: 4.98, avatar: "LP", change: "0" },
      { rank: 2, name: "James Wilson", score: 4.95, avatar: "JW", change: "+0.02" },
      { rank: 3, name: "Sarah Chen", score: 4.92, avatar: "SC", change: "+0.01" },
    ],
    prize: "Professional Development Course"
  },
]

const demoBadges = [
  { id: "1", name: "First Win", description: "Won your first leaderboard", icon: "🏆", earnedCount: 45 },
  { id: "2", name: "Triple Threat", description: "Top 3 in three different leaderboards", icon: "🎯", earnedCount: 12 },
  { id: "3", name: "Champion", description: "Won 5 leaderboards", icon: "👑", earnedCount: 8 },
  { id: "4", name: "Consistency King", description: "Maintained top 10 for 3 months", icon: "⚡", earnedCount: 15 },
]

export default function DemoLeaderboardsPage() {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-gray-500 font-medium">#{rank}</span>
  }

  const LeaderboardCard = ({ leaderboard }: { leaderboard: typeof demoStudioLeaderboards[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{leaderboard.name}</h3>
            <p className="text-sm text-gray-500">{leaderboard.description}</p>
          </div>
          <Badge className="bg-violet-100 text-violet-700">
            <Gift className="h-3 w-3 mr-1" />
            {leaderboard.prize}
          </Badge>
        </div>
        <div className="space-y-3">
          {leaderboard.entries.map((entry) => (
            <div key={entry.rank} className={`flex items-center gap-4 p-3 rounded-lg ${entry.rank === 1 ? "bg-yellow-50" : "bg-gray-50"}`}>
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-sm font-medium text-violet-700">
                {entry.avatar}
              </div>
              <div className="flex-1">
                <p className="font-medium">{entry.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{entry.score}</p>
                <p className={`text-xs ${entry.change.startsWith("+") ? "text-green-600" : "text-gray-500"}`}>
                  {entry.change}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4 text-violet-600">
          View Full Leaderboard
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboards</h1>
          <p className="text-gray-500 mt-1">Compete, achieve, and earn rewards</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Trophy className="h-4 w-4 mr-2" />
          View My Rankings
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Your Rank</p>
                <p className="text-2xl font-bold">#3</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Badges Earned</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <Award className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="text-2xl font-bold">2,450</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Leaderboards Won</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Crown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <Tabs defaultValue="studios" className="space-y-6">
        <TabsList>
          <TabsTrigger value="studios">Studio Leaderboards</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Leaderboards</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="studios">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoStudioLeaderboards.map((lb) => (
              <LeaderboardCard key={lb.id} leaderboard={lb} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teachers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoTeacherLeaderboards.map((lb) => (
              <LeaderboardCard key={lb.id} leaderboard={lb} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {demoBadges.map((badge) => (
              <Card key={badge.id} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-3">{badge.icon}</div>
                  <h3 className="font-semibold">{badge.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                  <p className="text-xs text-violet-600 mt-2">{badge.earnedCount} studios earned</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
