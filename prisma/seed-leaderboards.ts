import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🏆 Seeding leaderboards with more variety...")

  // Get existing studios and teachers for sample data
  const studios = await prisma.studio.findMany({ take: 10 })
  const teachers = await prisma.teacher.findMany({ 
    take: 10,
    include: { user: { select: { firstName: true, lastName: true } } }
  })

  if (studios.length === 0) {
    console.log("No studios found. Please seed studios first.")
    return
  }

  // Clear existing leaderboards for fresh seed
  await prisma.leaderboardEntry.deleteMany({})
  await prisma.leaderboardWinner.deleteMany({})
  await prisma.leaderboardPeriod.deleteMany({})
  await prisma.leaderboardPrize.deleteMany({})
  await prisma.leaderboard.deleteMany({})
  console.log("  🗑️ Cleared existing leaderboards")

  // ========================================
  // STUDIO LEADERBOARDS - 12 Total
  // ========================================
  const studioLeaderboards = [
    // CONTENT & SOCIAL (4)
    {
      name: "Content Champion",
      slug: "content-champion-monthly",
      description: "Studio posting the most engaging content across all platforms",
      category: "MOST_CONTENT_POSTED",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "posts",
      metricUnit: "posts",
      color: "#7c3aed",
      isFeatured: true,
      prizes: [
        { position: 1, name: "$500 Marketing Credit", prizeType: "CASH", prizeValue: 500 },
        { position: 2, name: "$250 Marketing Credit", prizeType: "CASH", prizeValue: 250 },
        { position: 3, name: "Featured Spotlight", prizeType: "FEATURE_SPOTLIGHT", prizeValue: 100 }
      ]
    },
    {
      name: "Viral Sensation",
      slug: "most-views-studio",
      description: "Total views across Instagram, TikTok, and other platforms",
      category: "MOST_SOCIAL_VIEWS",
      participantType: "STUDIO",
      timeframe: "WEEKLY",
      metricName: "views",
      metricUnit: "views",
      color: "#dc2626",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$200 Cash", prizeType: "CASH", prizeValue: 200 },
        { position: 2, name: "$100 Cash", prizeType: "CASH", prizeValue: 100 },
        { position: 3, name: "Social Badge", prizeType: "BADGE", prizeValue: 50 }
      ]
    },
    {
      name: "Engagement King",
      slug: "engagement-studio",
      description: "Highest engagement rate on social content",
      category: "MOST_SOCIAL_ENGAGEMENT",
      participantType: "STUDIO",
      timeframe: "WEEKLY",
      metricName: "engagement",
      metricUnit: "%",
      color: "#ec4899",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$150 Cash", prizeType: "CASH", prizeValue: 150 },
        { position: 2, name: "Pro Features (1 month)", prizeType: "SUBSCRIPTION", prizeValue: 100 }
      ]
    },
    {
      name: "Most Liked Studio",
      slug: "most-likes-studio",
      description: "Most total likes across all platforms",
      category: "MOST_SOCIAL_LIKES",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "likes",
      metricUnit: "likes",
      color: "#f43f5e",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$300 Cash", prizeType: "CASH", prizeValue: 300 },
        { position: 2, name: "$150 Cash", prizeType: "CASH", prizeValue: 150 },
        { position: 3, name: "Swag Pack", prizeType: "MERCHANDISE", prizeValue: 75 }
      ]
    },

    // GROWTH (3)
    {
      name: "Fastest Growing Studio",
      slug: "fastest-growing-studio",
      description: "Studios with the highest percentage growth in new clients",
      category: "FASTEST_GROWING",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "growth",
      metricUnit: "%",
      color: "#059669",
      isFeatured: true,
      prizes: [
        { position: 1, name: "Bali Retreat for 2", prizeType: "HOLIDAY", prizeValue: 5000 },
        { position: 2, name: "$1000 Cash", prizeType: "CASH", prizeValue: 1000 },
        { position: 3, name: "$500 Equipment Credit", prizeType: "GIFT_CARD", prizeValue: 500 }
      ]
    },
    {
      name: "Client Magnet",
      slug: "most-new-clients-studio",
      description: "Most new clients acquired this period",
      category: "MOST_NEW_CLIENTS",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "new clients",
      metricUnit: "clients",
      color: "#0891b2",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$400 Cash", prizeType: "CASH", prizeValue: 400 },
        { position: 2, name: "$200 Cash", prizeType: "CASH", prizeValue: 200 },
        { position: 3, name: "Marketing Consult", prizeType: "OTHER", prizeValue: 150 }
      ]
    },
    {
      name: "Retention Royalty",
      slug: "highest-retention-studio",
      description: "Highest client retention rate",
      category: "HIGHEST_RETENTION",
      participantType: "STUDIO",
      timeframe: "QUARTERLY",
      metricName: "retention",
      metricUnit: "%",
      color: "#0d9488",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$600 Cash", prizeType: "CASH", prizeValue: 600 },
        { position: 2, name: "$300 Cash", prizeType: "CASH", prizeValue: 300 },
        { position: 3, name: "Retention Strategy Session", prizeType: "OTHER", prizeValue: 200 }
      ]
    },

    // COURSES/VAULT (2)
    {
      name: "Course Creator Excellence",
      slug: "course-creator-studio",
      description: "Studios creating the most valuable educational content",
      category: "TOP_COURSE_CREATOR",
      participantType: "STUDIO",
      timeframe: "QUARTERLY",
      metricName: "enrollments",
      metricUnit: "students",
      color: "#6366f1",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$750 Production Credit", prizeType: "CASH", prizeValue: 750 },
        { position: 2, name: "Pro Vault Features", prizeType: "SUBSCRIPTION", prizeValue: 500 }
      ]
    },
    {
      name: "Top Rated Academy",
      slug: "best-ratings-studio",
      description: "Highest rated courses in The Vault",
      category: "BEST_COURSE_RATINGS",
      participantType: "STUDIO",
      timeframe: "QUARTERLY",
      metricName: "rating",
      metricUnit: "⭐",
      color: "#f59e0b",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$500 Cash", prizeType: "CASH", prizeValue: 500 },
        { position: 2, name: "Featured Course Badge", prizeType: "BADGE", prizeValue: 200 }
      ]
    },

    // BOOKINGS (2)
    {
      name: "Booking Boss",
      slug: "most-bookings-studio",
      description: "Most total class bookings",
      category: "MOST_BOOKINGS",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "bookings",
      metricUnit: "bookings",
      color: "#8b5cf6",
      isFeatured: true,
      prizes: [
        { position: 1, name: "$800 Cash", prizeType: "CASH", prizeValue: 800 },
        { position: 2, name: "$400 Cash", prizeType: "CASH", prizeValue: 400 },
        { position: 3, name: "$200 Cash", prizeType: "CASH", prizeValue: 200 }
      ]
    },
    {
      name: "Full House Champion",
      slug: "attendance-rate-studio",
      description: "Highest average class attendance rate",
      category: "HIGHEST_ATTENDANCE_RATE",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "attendance",
      metricUnit: "%",
      color: "#14b8a6",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$350 Cash", prizeType: "CASH", prizeValue: 350 },
        { position: 2, name: "$175 Cash", prizeType: "CASH", prizeValue: 175 }
      ]
    },

    // SPECIAL (1)
    {
      name: "Studio Newcomer",
      slug: "newcomer-studio",
      description: "Best performing new studio (joined within 90 days)",
      category: "NEWCOMER_OF_MONTH",
      participantType: "STUDIO",
      timeframe: "MONTHLY",
      metricName: "score",
      metricUnit: "points",
      color: "#06b6d4",
      isFeatured: false,
      prizes: [
        { position: 1, name: "Welcome Package + $300", prizeType: "CASH", prizeValue: 300 },
        { position: 2, name: "3 Month Pro Sub", prizeType: "SUBSCRIPTION", prizeValue: 200 }
      ]
    }
  ]

  // ========================================
  // TEACHER LEADERBOARDS - 15 Total
  // ========================================
  const teacherLeaderboards = [
    // CONTENT & SOCIAL (5)
    {
      name: "Content Consistency King",
      slug: "content-consistency-teacher",
      description: "Maintaining the most consistent posting schedule",
      category: "CONTENT_CONSISTENCY",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "streak",
      metricUnit: "days",
      color: "#f59e0b",
      isFeatured: true,
      prizes: [
        { position: 1, name: "$200 Lululemon Card", prizeType: "GIFT_CARD", prizeValue: 200, sponsorName: "Lululemon" },
        { position: 2, name: "$100 Lululemon Card", prizeType: "GIFT_CARD", prizeValue: 100, sponsorName: "Lululemon" },
        { position: 3, name: "Current Swag Pack", prizeType: "MERCHANDISE", prizeValue: 50 }
      ]
    },
    {
      name: "Social Media Star",
      slug: "social-star-teacher",
      description: "Highest engagement on social content",
      category: "MOST_SOCIAL_ENGAGEMENT",
      participantType: "TEACHER",
      timeframe: "WEEKLY",
      metricName: "engagement",
      metricUnit: "%",
      color: "#ec4899",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$100 Cash", prizeType: "CASH", prizeValue: 100 },
        { position: 2, name: "Featured on Current", prizeType: "FEATURE_SPOTLIGHT", prizeValue: 50 }
      ]
    },
    {
      name: "Viral Teacher",
      slug: "most-views-teacher",
      description: "Most views on content this period",
      category: "MOST_SOCIAL_VIEWS",
      participantType: "TEACHER",
      timeframe: "WEEKLY",
      metricName: "views",
      metricUnit: "views",
      color: "#ef4444",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$75 Cash", prizeType: "CASH", prizeValue: 75 },
        { position: 2, name: "Content Badge", prizeType: "BADGE", prizeValue: 25 }
      ]
    },
    {
      name: "Like Magnet",
      slug: "most-likes-teacher",
      description: "Most liked content across platforms",
      category: "MOST_SOCIAL_LIKES",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "likes",
      metricUnit: "likes",
      color: "#f43f5e",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$150 Cash", prizeType: "CASH", prizeValue: 150 },
        { position: 2, name: "$75 Cash", prizeType: "CASH", prizeValue: 75 },
        { position: 3, name: "Like Badge", prizeType: "BADGE", prizeValue: 25 }
      ]
    },
    {
      name: "Content Machine",
      slug: "most-content-teacher",
      description: "Most content posted this period",
      category: "MOST_CONTENT_POSTED",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "posts",
      metricUnit: "posts",
      color: "#7c3aed",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$125 Cash", prizeType: "CASH", prizeValue: 125 },
        { position: 2, name: "$60 Cash", prizeType: "CASH", prizeValue: 60 }
      ]
    },

    // CLASSES & BOOKINGS (4)
    {
      name: "Most Classes Taught",
      slug: "most-classes-teacher",
      description: "Hardest working instructors by number of classes",
      category: "MOST_CLASSES_TAUGHT",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "classes",
      metricUnit: "classes",
      color: "#8b5cf6",
      isFeatured: true,
      prizes: [
        { position: 1, name: "$300 Cash Bonus", prizeType: "CASH", prizeValue: 300 },
        { position: 2, name: "$150 Spa Voucher", prizeType: "GIFT_CARD", prizeValue: 150 },
        { position: 3, name: "Free Month Training", prizeType: "SUBSCRIPTION", prizeValue: 100 }
      ]
    },
    {
      name: "Full Class Pro",
      slug: "attendance-teacher",
      description: "Highest average class attendance rate",
      category: "HIGHEST_ATTENDANCE_RATE",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "attendance",
      metricUnit: "%",
      color: "#10b981",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$175 Cash", prizeType: "CASH", prizeValue: 175 },
        { position: 2, name: "$85 Cash", prizeType: "CASH", prizeValue: 85 }
      ]
    },
    {
      name: "Booking Champion",
      slug: "most-bookings-teacher",
      description: "Most student bookings for your classes",
      category: "MOST_BOOKINGS",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "bookings",
      metricUnit: "bookings",
      color: "#6366f1",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$200 Cash", prizeType: "CASH", prizeValue: 200 },
        { position: 2, name: "$100 Cash", prizeType: "CASH", prizeValue: 100 },
        { position: 3, name: "$50 Cash", prizeType: "CASH", prizeValue: 50 }
      ]
    },
    {
      name: "Revenue Rockstar",
      slug: "top-revenue-teacher",
      description: "Highest revenue generated from classes",
      category: "TOP_REVENUE",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "revenue",
      metricUnit: "$",
      color: "#059669",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$250 Cash", prizeType: "CASH", prizeValue: 250 },
        { position: 2, name: "$125 Cash", prizeType: "CASH", prizeValue: 125 }
      ]
    },

    // COURSES/VAULT (3)
    {
      name: "Course Completion Master",
      slug: "course-completion-teacher",
      description: "Completing the most training courses",
      category: "MOST_COURSES_COMPLETED",
      participantType: "TEACHER",
      timeframe: "QUARTERLY",
      metricName: "courses",
      metricUnit: "courses",
      color: "#14b8a6",
      isFeatured: false,
      prizes: [
        { position: 1, name: "Certification Upgrade", prizeType: "SUBSCRIPTION", prizeValue: 500 },
        { position: 2, name: "$100 Book Voucher", prizeType: "GIFT_CARD", prizeValue: 100 }
      ]
    },
    {
      name: "Student Magnet",
      slug: "course-enrollments-teacher",
      description: "Most students enrolled in your courses",
      category: "MOST_COURSE_ENROLLMENTS",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "enrollments",
      metricUnit: "students",
      color: "#0891b2",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$180 Cash", prizeType: "CASH", prizeValue: 180 },
        { position: 2, name: "$90 Cash", prizeType: "CASH", prizeValue: 90 }
      ]
    },
    {
      name: "Top Rated Instructor",
      slug: "best-ratings-teacher",
      description: "Highest average course ratings",
      category: "BEST_COURSE_RATINGS",
      participantType: "TEACHER",
      timeframe: "QUARTERLY",
      metricName: "rating",
      metricUnit: "⭐",
      color: "#fbbf24",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$200 Cash + Badge", prizeType: "CASH", prizeValue: 200 },
        { position: 2, name: "Top Instructor Badge", prizeType: "BADGE", prizeValue: 50 }
      ]
    },

    // SPECIAL CATEGORIES (3)
    {
      name: "Newcomer of the Month",
      slug: "newcomer-teacher",
      description: "Best performing new teacher (joined within 90 days)",
      category: "NEWCOMER_OF_MONTH",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "score",
      metricUnit: "points",
      color: "#06b6d4",
      isFeatured: true,
      prizes: [
        { position: 1, name: "$150 Welcome Package", prizeType: "MERCHANDISE", prizeValue: 150 },
        { position: 2, name: "Mentor Session", prizeType: "OTHER", prizeValue: 100 }
      ]
    },
    {
      name: "Comeback Champion",
      slug: "comeback-teacher",
      description: "Biggest improvement from previous period",
      category: "COMEBACK_CHAMPION",
      participantType: "TEACHER",
      timeframe: "MONTHLY",
      metricName: "improvement",
      metricUnit: "%",
      color: "#f97316",
      isFeatured: false,
      prizes: [
        { position: 1, name: "$120 Cash", prizeType: "CASH", prizeValue: 120 },
        { position: 2, name: "Comeback Badge", prizeType: "BADGE", prizeValue: 40 }
      ]
    },
    {
      name: "All-Rounder Award",
      slug: "all-rounder-teacher",
      description: "Best overall performance across all metrics",
      category: "ALL_ROUNDER",
      participantType: "TEACHER",
      timeframe: "QUARTERLY",
      metricName: "overall",
      metricUnit: "points",
      color: "#a855f7",
      isFeatured: true,
      prizes: [
        { position: 1, name: "Wellness Retreat", prizeType: "HOLIDAY", prizeValue: 1500 },
        { position: 2, name: "$300 Cash", prizeType: "CASH", prizeValue: 300 },
        { position: 3, name: "$150 Cash", prizeType: "CASH", prizeValue: 150 }
      ]
    }
  ]

  // Create all leaderboards
  const allLeaderboards = [...studioLeaderboards, ...teacherLeaderboards]

  for (const lb of allLeaderboards) {
    const leaderboard = await prisma.leaderboard.create({
      data: {
        name: lb.name,
        slug: lb.slug,
        description: lb.description,
        category: lb.category as any,
        participantType: lb.participantType as any,
        timeframe: lb.timeframe as any,
        metricName: lb.metricName,
        metricUnit: lb.metricUnit,
        color: lb.color,
        isActive: true,
        isFeatured: lb.isFeatured,
        showOnDashboard: true,
        prizes: {
          create: lb.prizes.map(p => ({
            position: p.position,
            name: p.name,
            prizeType: p.prizeType as any,
            prizeValue: p.prizeValue,
            sponsorName: (p as any).sponsorName || null
          }))
        }
      }
    })

    // Create current period
    const now = new Date()
    let startDate: Date, endDate: Date, periodName: string

    if (lb.timeframe === "WEEKLY") {
      const dayOfWeek = now.getDay()
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      periodName = `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else if (lb.timeframe === "QUARTERLY") {
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59)
      periodName = `Q${quarter + 1} ${now.getFullYear()}`
    } else {
      // Monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      periodName = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`
    }

    const period = await prisma.leaderboardPeriod.create({
      data: {
        leaderboardId: leaderboard.id,
        name: periodName,
        startDate,
        endDate,
        status: "ACTIVE"
      }
    })

    // Create sample entries
    const participants = lb.participantType === "STUDIO" ? studios : teachers.map(t => ({ id: t.id }))
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < Math.min(shuffled.length, 10); i++) {
      const score = Math.floor(Math.random() * 900) + 100 + (10 - i) * 50 // Higher scores for lower indices
      
      await prisma.leaderboardEntry.create({
        data: {
          periodId: period.id,
          ...(lb.participantType === "STUDIO" 
            ? { studioId: shuffled[i].id }
            : { teacherId: shuffled[i].id }
          ),
          score,
          rank: i + 1,
          previousRank: Math.floor(Math.random() * 10) + 1
        }
      })
    }

    console.log(`  ✅ Created "${lb.name}" (${lb.participantType}) with ${lb.prizes.length} prizes`)
  }

  // Create badges
  const badges = [
    { name: "First Win", description: "Won your first leaderboard competition", imageUrl: "🏆", rarity: "common", requiredWins: 1 },
    { name: "Triple Threat", description: "Won 3 different competitions", imageUrl: "🔥", rarity: "rare", requiredWins: 3 },
    { name: "Champion", description: "Won 5 competitions", imageUrl: "👑", rarity: "epic", requiredWins: 5 },
    { name: "Legend", description: "Won 10 competitions", imageUrl: "⭐", rarity: "legendary", requiredWins: 10 },
    { name: "Content Creator", description: "Achieved #1 in any content leaderboard", imageUrl: "📱", rarity: "rare", requiredRank: 1 },
    { name: "Growth Hacker", description: "Achieved top 3 in fastest growing", imageUrl: "📈", rarity: "epic", requiredRank: 3 },
    { name: "Consistency King", description: "Maintained a 30-day posting streak", imageUrl: "📅", rarity: "rare" },
    { name: "Community Star", description: "Top engagement in community chats", imageUrl: "💬", rarity: "rare" },
  ]

  await prisma.earnedBadge.deleteMany({})
  await prisma.leaderboardBadge.deleteMany({})

  for (const badge of badges) {
    await prisma.leaderboardBadge.create({ data: badge })
    console.log(`  🏅 Created badge: ${badge.name}`)
  }

  console.log("\n✅ Leaderboards seeding complete!")
  console.log(`   📊 ${studioLeaderboards.length} Studio leaderboards`)
  console.log(`   👩‍🏫 ${teacherLeaderboards.length} Teacher leaderboards`)
  console.log(`   🏅 ${badges.length} Badges`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())














