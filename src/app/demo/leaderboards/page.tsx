"use client"

import { LeaderboardsView } from "@/components/studio"
import type { LeaderboardData } from "@/components/studio"

// Demo leaderboards data
const demoLeaderboardsData: LeaderboardData = {
  studioLeaderboards: [
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
        { id: "p1", position: 1, name: "$500 Marketing Credit", description: null, prizeType: "CASH", prizeValue: 500 },
        { id: "p2", position: 2, name: "$250 Marketing Credit", description: null, prizeType: "CASH", prizeValue: 250 },
        { id: "p3", position: 3, name: "$100 Marketing Credit", description: null, prizeType: "CASH", prizeValue: 100 }
      ],
      entries: [
        { id: "e1", rank: 1, previousRank: 2, score: 156, participantName: "Zenith Pilates" },
        { id: "e2", rank: 2, previousRank: 1, score: 142, participantName: "Harmony Studio" },
        { id: "e3", rank: 3, previousRank: 3, score: 128, participantName: "Balance & Flow" },
        { id: "e4", rank: 4, previousRank: 5, score: 115, participantName: "Core Strength" },
        { id: "e5", rank: 5, previousRank: 4, score: 98, participantName: "Pure Motion" }
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
        { id: "p4", position: 1, name: "Featured Studio Spotlight", description: null, prizeType: "FEATURE_SPOTLIGHT", prizeValue: null },
        { id: "p5", position: 2, name: "Premium Badge", description: null, prizeType: "BADGE", prizeValue: null },
        { id: "p6", position: 3, name: "Community Shoutout", description: null, prizeType: "FEATURE_SPOTLIGHT", prizeValue: null }
      ],
      entries: [
        { id: "e6", rank: 1, previousRank: 1, score: 89, participantName: "Core Strength" },
        { id: "e7", rank: 2, previousRank: 3, score: 76, participantName: "Zenith Pilates" },
        { id: "e8", rank: 3, previousRank: 2, score: 64, participantName: "Pure Motion" },
        { id: "e9", rank: 4, previousRank: 4, score: 52, participantName: "Harmony Studio" },
        { id: "e10", rank: 5, previousRank: 6, score: 41, participantName: "Balance & Flow" }
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
        { id: "e11", rank: 1, previousRank: 2, score: 1245, participantName: "Harmony Studio" },
        { id: "e12", rank: 2, previousRank: 1, score: 1189, participantName: "Zenith Pilates" },
        { id: "e13", rank: 3, previousRank: 3, score: 987, participantName: "Core Strength" }
      ],
      totalEntries: 89
    }
  ],
  teacherLeaderboards: [
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
        { id: "p7", position: 1, name: "Spa Day Package", description: null, prizeType: "GIFT_CARD", prizeValue: 300 },
        { id: "p8", position: 2, name: "$150 Gift Card", description: null, prizeType: "GIFT_CARD", prizeValue: 150 },
        { id: "p9", position: 3, name: "$75 Gift Card", description: null, prizeType: "GIFT_CARD", prizeValue: 75 }
      ],
      entries: [
        { id: "e14", rank: 1, previousRank: 1, score: 48, participantName: "Sarah Chen" },
        { id: "e15", rank: 2, previousRank: 3, score: 42, participantName: "Mike Johnson" },
        { id: "e16", rank: 3, previousRank: 2, score: 38, participantName: "Emily Davis" },
        { id: "e17", rank: 4, previousRank: 4, score: 35, participantName: "Lisa Park" },
        { id: "e18", rank: 5, previousRank: 5, score: 32, participantName: "James Wilson" }
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
        { id: "p10", position: 1, name: "Professional Development Course", description: null, prizeType: "SUBSCRIPTION", prizeValue: 500 },
        { id: "p11", position: 2, name: "Online Workshop Access", description: null, prizeType: "SUBSCRIPTION", prizeValue: 250 }
      ],
      entries: [
        { id: "e19", rank: 1, previousRank: 1, score: 4.98, participantName: "Lisa Park" },
        { id: "e20", rank: 2, previousRank: 2, score: 4.95, participantName: "James Wilson" },
        { id: "e21", rank: 3, previousRank: 4, score: 4.92, participantName: "Sarah Chen" },
        { id: "e22", rank: 4, previousRank: 3, score: 4.89, participantName: "Emily Davis" },
        { id: "e23", rank: 5, previousRank: 5, score: 4.85, participantName: "Mike Johnson" }
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
        { id: "e24", rank: 1, previousRank: 2, score: 94.5, participantName: "Emily Davis" },
        { id: "e25", rank: 2, previousRank: 1, score: 91.2, participantName: "Sarah Chen" },
        { id: "e26", rank: 3, previousRank: 3, score: 88.7, participantName: "Lisa Park" }
      ],
      totalEntries: 156
    }
  ],
  myRanks: {
    "1": { rank: 3, score: 128 },
    "2": { rank: 5, score: 41 },
    "4": { rank: 2, score: 42 }
  },
  badges: [
    { id: "b1", name: "First Win", description: "Won your first leaderboard", icon: "🏆", earnedCount: 45 },
    { id: "b2", name: "Triple Threat", description: "Top 3 in three different leaderboards", icon: "🎯", earnedCount: 12 },
    { id: "b3", name: "Champion", description: "Won 5 leaderboards", icon: "👑", earnedCount: 8 },
    { id: "b4", name: "Consistency King", description: "Maintained top 10 for 3 months", icon: "⚡", earnedCount: 15 },
    { id: "b5", name: "Rising Star", description: "Improved rank by 10+ positions", icon: "🌟", earnedCount: 34 },
    { id: "b6", name: "Social Butterfly", description: "Created 50+ social posts", icon: "🦋", earnedCount: 28 }
  ]
}

export default function DemoLeaderboardsPage() {
  return <LeaderboardsView data={demoLeaderboardsData} linkPrefix="/demo" />
}
