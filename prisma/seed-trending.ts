import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const trendingContent = [
  // Instagram - High performing
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_001",
    postUrl: "https://instagram.com/reel/xyz123",
    creatorUsername: "pilatesbymove",
    creatorDisplayName: "Move Pilates Studio",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/1.jpg",
    creatorFollowers: 245000,
    isVerified: true,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    caption: "This one exercise changed my entire practice 🔥 The secret to a strong core isn't what you think... #pilates #reformerpilates #coretok",
    hashtags: ["pilates", "reformerpilates", "coretok", "pilatesinstructor", "fitness"],
    viewCount: 2450000,
    likeCount: 185000,
    commentCount: 4200,
    shareCount: 12000,
    saveCount: 45000,
    category: "Reformer",
    contentStyle: "Tutorial",
    difficulty: "Intermediate",
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isFeatured: true
  },
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_002",
    postUrl: "https://instagram.com/reel/abc456",
    creatorUsername: "thepilatespt",
    creatorDisplayName: "Dr. Sarah - Pilates PT",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    creatorFollowers: 520000,
    isVerified: true,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    caption: "POV: You finally understand why your hip flexors are always tight 😮‍💨 Save this for later! #pilates #hipflexors #physicaltherapy",
    hashtags: ["pilates", "hipflexors", "physicaltherapy", "mobility", "fitness"],
    viewCount: 5200000,
    likeCount: 420000,
    commentCount: 8500,
    shareCount: 35000,
    saveCount: 180000,
    category: "Mat",
    contentStyle: "Educational",
    difficulty: "Beginner",
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    isFeatured: true
  },
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_003",
    postUrl: "https://instagram.com/reel/def789",
    creatorUsername: "pilates.flow",
    creatorDisplayName: "Pilates Flow NYC",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/3.jpg",
    creatorFollowers: 89000,
    isVerified: false,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    caption: "5 transitions that will make you look like a pro 💫 Which one is your favorite? #pilates #pilatestransitions #pilatespro",
    hashtags: ["pilates", "pilatestransitions", "pilatespro", "reformer", "movement"],
    viewCount: 890000,
    likeCount: 72000,
    commentCount: 1800,
    shareCount: 5600,
    saveCount: 28000,
    category: "Transitions",
    contentStyle: "Tutorial",
    difficulty: "Advanced",
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isFeatured: false
  },
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_004",
    postUrl: "https://instagram.com/reel/ghi012",
    creatorUsername: "balanced.pilates",
    creatorDisplayName: "Balanced Body Studio",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/4.jpg",
    creatorFollowers: 156000,
    isVerified: false,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1562088287-bde35a1ea917?w=400",
    caption: "Client transformation after 3 months of Pilates 🙌 She couldn't believe the difference in her posture! #pilates #transformation #posture",
    hashtags: ["pilates", "transformation", "posture", "beforeafter", "wellness"],
    viewCount: 1560000,
    likeCount: 145000,
    commentCount: 3200,
    shareCount: 8900,
    saveCount: 42000,
    category: "Transformation",
    contentStyle: "Before/After",
    difficulty: "Beginner",
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isFeatured: true
  },
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_005",
    postUrl: "https://instagram.com/reel/jkl345",
    creatorUsername: "reformer.queen",
    creatorDisplayName: "Emma | Reformer Queen",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/5.jpg",
    creatorFollowers: 320000,
    isVerified: true,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400",
    caption: "Stop doing hundreds like this ❌ Here's why you're not feeling your abs... #pilates #hundreds #abworkout #pilatesform",
    hashtags: ["pilates", "hundreds", "abworkout", "pilatesform", "coretok"],
    viewCount: 3200000,
    likeCount: 280000,
    commentCount: 6100,
    shareCount: 22000,
    saveCount: 95000,
    category: "Mat",
    contentStyle: "Correction",
    difficulty: "Beginner",
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    isFeatured: false
  },
  // TikTok content
  {
    platform: "TIKTOK",
    platformPostId: "tt_viral_001",
    postUrl: "https://tiktok.com/@pilatesqueen/video/123",
    creatorUsername: "pilatesqueen",
    creatorDisplayName: "Pilates Queen 👑",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/6.jpg",
    creatorFollowers: 1200000,
    isVerified: true,
    contentType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400",
    caption: "When your client asks if pilates is just stretching 😂 #pilates #pilatestok #pilatesinstructor #fitnesshumor",
    hashtags: ["pilates", "pilatestok", "pilatesinstructor", "fitnesshumor", "gymtok"],
    viewCount: 8500000,
    likeCount: 890000,
    commentCount: 12000,
    shareCount: 45000,
    saveCount: 120000,
    category: "Humor",
    contentStyle: "Entertainment",
    difficulty: null,
    postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    isFeatured: true
  },
  {
    platform: "TIKTOK",
    platformPostId: "tt_viral_002",
    postUrl: "https://tiktok.com/@core.pilates/video/456",
    creatorUsername: "core.pilates",
    creatorDisplayName: "Core Pilates Method",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/7.jpg",
    creatorFollowers: 450000,
    isVerified: false,
    contentType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    caption: "The teaser progression nobody talks about 🤫 Watch til the end for the secret! #pilates #teaser #coretok #pilatesworkout",
    hashtags: ["pilates", "teaser", "coretok", "pilatesworkout", "abschallenge"],
    viewCount: 4500000,
    likeCount: 520000,
    commentCount: 8900,
    shareCount: 32000,
    saveCount: 180000,
    category: "Mat",
    contentStyle: "Tutorial",
    difficulty: "Advanced",
    postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    isFeatured: false
  },
  {
    platform: "TIKTOK",
    platformPostId: "tt_viral_003",
    postUrl: "https://tiktok.com/@reformerlife/video/789",
    creatorUsername: "reformerlife",
    creatorDisplayName: "Reformer Life",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/8.jpg",
    creatorFollowers: 680000,
    isVerified: true,
    contentType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400",
    caption: "My morning routine as a pilates instructor ☀️ 5am wake up, reformer flow, green juice, then teach... #pilates #dayinmylife #pilatesinstructor",
    hashtags: ["pilates", "dayinmylife", "pilatesinstructor", "morningroutine", "wellness"],
    viewCount: 2800000,
    likeCount: 340000,
    commentCount: 5600,
    shareCount: 18000,
    saveCount: 65000,
    category: "Lifestyle",
    contentStyle: "Day in Life",
    difficulty: null,
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isFeatured: false
  },
  {
    platform: "TIKTOK",
    platformPostId: "tt_viral_004",
    postUrl: "https://tiktok.com/@pilates.tips/video/012",
    creatorUsername: "pilates.tips",
    creatorDisplayName: "Daily Pilates Tips",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/9.jpg",
    creatorFollowers: 890000,
    isVerified: false,
    contentType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=400",
    caption: "3 props every pilates instructor needs 🛠️ #3 is a game changer! #pilates #pilatesprops #pilatesequipment #fitnesstips",
    hashtags: ["pilates", "pilatesprops", "pilatesequipment", "fitnesstips", "instructortips"],
    viewCount: 1900000,
    likeCount: 210000,
    commentCount: 4200,
    shareCount: 15000,
    saveCount: 78000,
    category: "Props",
    contentStyle: "Tips",
    difficulty: "Beginner",
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isFeatured: false
  },
  {
    platform: "TIKTOK",
    platformPostId: "tt_viral_005",
    postUrl: "https://tiktok.com/@pilateslab/video/345",
    creatorUsername: "pilateslab",
    creatorDisplayName: "The Pilates Lab",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/10.jpg",
    creatorFollowers: 560000,
    isVerified: true,
    contentType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    caption: "Why your clients keep coming back 😏 The hook that books... #pilates #pilatestudio #clientretention #fitnessbusiness",
    hashtags: ["pilates", "pilatestudio", "clientretention", "fitnessbusiness", "studiogrowth"],
    viewCount: 1200000,
    likeCount: 145000,
    commentCount: 3800,
    shareCount: 9500,
    saveCount: 52000,
    category: "Business",
    contentStyle: "Tips",
    difficulty: null,
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isFeatured: false
  },
  // More variety
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_006",
    postUrl: "https://instagram.com/reel/mno678",
    creatorUsername: "pilates.with.props",
    creatorDisplayName: "Props & Pilates",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/11.jpg",
    creatorFollowers: 78000,
    isVerified: false,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400",
    caption: "Magic circle exercises that actually work 🔵 These 5 moves will change your inner thigh game #pilates #magiccircle #innerthighs",
    hashtags: ["pilates", "magiccircle", "innerthighs", "pilatesring", "legworkout"],
    viewCount: 780000,
    likeCount: 68000,
    commentCount: 1400,
    shareCount: 4200,
    saveCount: 32000,
    category: "Props",
    contentStyle: "Tutorial",
    difficulty: "Intermediate",
    postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    isFeatured: false
  },
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_007",
    postUrl: "https://instagram.com/reel/pqr901",
    creatorUsername: "prenatal.pilates",
    creatorDisplayName: "Prenatal Pilates Pro",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/12.jpg",
    creatorFollowers: 145000,
    isVerified: false,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    caption: "Safe pilates modifications for every trimester 🤰 Save this for your pregnant clients! #pilates #prenatalpilates #pregnancy #prenatalfitness",
    hashtags: ["pilates", "prenatalpilates", "pregnancy", "prenatalfitness", "safeworkout"],
    viewCount: 1450000,
    likeCount: 125000,
    commentCount: 2800,
    shareCount: 18000,
    saveCount: 85000,
    category: "Prenatal",
    contentStyle: "Educational",
    difficulty: "Beginner",
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    isFeatured: false
  },
  {
    platform: "TIKTOK",
    platformPostId: "tt_viral_006",
    postUrl: "https://tiktok.com/@cadillac.queen/video/678",
    creatorUsername: "cadillac.queen",
    creatorDisplayName: "Cadillac Queen",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/13.jpg",
    creatorFollowers: 230000,
    isVerified: false,
    contentType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    caption: "This cadillac series will humble you 😤 Try not to shake... #pilates #cadillac #pilatescadillac #advancedpilates",
    hashtags: ["pilates", "cadillac", "pilatescadillac", "advancedpilates", "pilatesworkout"],
    viewCount: 2300000,
    likeCount: 285000,
    commentCount: 5200,
    shareCount: 14000,
    saveCount: 92000,
    category: "Cadillac",
    contentStyle: "Challenge",
    difficulty: "Advanced",
    postedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
    isFeatured: true
  },
  {
    platform: "INSTAGRAM",
    platformPostId: "ig_viral_008",
    postUrl: "https://instagram.com/reel/stu234",
    creatorUsername: "studio.marketing",
    creatorDisplayName: "Studio Marketing Tips",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/14.jpg",
    creatorFollowers: 92000,
    isVerified: false,
    contentType: "REEL",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    caption: "How I got 50 new clients in 30 days using this one hook 🎣 Comment HOOK for the template! #pilates #studiogrowth #marketing #fitnessbusiness",
    hashtags: ["pilates", "studiogrowth", "marketing", "fitnessbusiness", "pilatesmarketing"],
    viewCount: 920000,
    likeCount: 82000,
    commentCount: 4500,
    shareCount: 6800,
    saveCount: 38000,
    category: "Business",
    contentStyle: "Tips",
    difficulty: null,
    postedAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 hours ago
    isFeatured: false
  },
  {
    platform: "TIKTOK",
    platformPostId: "tt_viral_007",
    postUrl: "https://tiktok.com/@tower.pilates/video/901",
    creatorUsername: "tower.pilates",
    creatorDisplayName: "Tower Pilates Master",
    creatorProfilePic: "https://randomuser.me/api/portraits/women/15.jpg",
    creatorFollowers: 175000,
    isVerified: false,
    contentType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400",
    caption: "Spring tension explained in 60 seconds ⚡ This changed how I teach... #pilates #springtension #pilatestips #pilatesinstructor",
    hashtags: ["pilates", "springtension", "pilatestips", "pilatesinstructor", "reformer"],
    viewCount: 1750000,
    likeCount: 195000,
    commentCount: 3800,
    shareCount: 12000,
    saveCount: 68000,
    category: "Educational",
    contentStyle: "Tutorial",
    difficulty: "Intermediate",
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isFeatured: false
  }
]

async function seed() {
  console.log("🌱 Seeding trending content...")

  for (const content of trendingContent) {
    // Calculate engagement rate
    const totalEngagement = content.likeCount + content.commentCount + content.shareCount
    const engagementRate = content.viewCount > 0 ? (totalEngagement / content.viewCount) * 100 : 0

    // Calculate trending score
    const hoursOld = (Date.now() - content.postedAt.getTime()) / (1000 * 60 * 60)
    const recencyBoost = Math.max(0, 100 - hoursOld)
    const engagementBoost = Math.log10(content.viewCount || 1) * 10
    const trendingScore = (engagementRate * 10) + recencyBoost + engagementBoost

    await prisma.trendingContent.upsert({
      where: { platformPostId: content.platformPostId },
      update: {
        viewCount: content.viewCount,
        likeCount: content.likeCount,
        commentCount: content.commentCount,
        shareCount: content.shareCount,
        saveCount: content.saveCount,
        engagementRate,
        trendingScore
      },
      create: {
        platform: content.platform as "INSTAGRAM" | "TIKTOK",
        platformPostId: content.platformPostId,
        postUrl: content.postUrl,
        creatorUsername: content.creatorUsername,
        creatorDisplayName: content.creatorDisplayName,
        creatorProfilePic: content.creatorProfilePic,
        creatorFollowers: content.creatorFollowers,
        isVerified: content.isVerified,
        contentType: content.contentType as "VIDEO" | "REEL" | "IMAGE" | "CAROUSEL" | "STORY",
        thumbnailUrl: content.thumbnailUrl,
        caption: content.caption,
        hashtags: content.hashtags,
        viewCount: content.viewCount,
        likeCount: content.likeCount,
        commentCount: content.commentCount,
        shareCount: content.shareCount,
        saveCount: content.saveCount,
        engagementRate,
        category: content.category,
        contentStyle: content.contentStyle,
        difficulty: content.difficulty,
        postedAt: content.postedAt,
        trendingScore,
        isFeatured: content.isFeatured
      }
    })
    console.log(`  ✓ ${content.creatorUsername}: ${content.caption?.slice(0, 40)}...`)
  }

  console.log("✅ Trending content seeded!")
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



