import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔐 Seeding The Vault data...")

  // Get the first studio
  const studio = await prisma.studio.findFirst({
    include: {
      teachers: {
        include: { user: true }
      }
    }
  })

  if (!studio) {
    console.log("❌ No studio found. Please run the main seed first.")
    return
  }

  console.log(`📍 Using studio: ${studio.name}`)

  // Sample courses for different audiences
  const coursesData = [
    // For Studio Owners
    {
      title: "How to Grow Your Pilates Studio to 6 Figures",
      slug: "grow-pilates-studio-6-figures",
      subtitle: "A complete business growth blueprint for studio owners",
      description: "Learn proven strategies to scale your Pilates studio from struggling to thriving. This comprehensive course covers marketing, retention, pricing, team building, and systems that will help you reach 6-figure revenue.",
      audience: "STUDIO_OWNERS" as const,
      category: "Business Growth",
      difficulty: "Intermediate",
      pricingType: "ONE_TIME" as const,
      price: 497,
      accessType: "LIFETIME" as const,
      includeInSubscription: true,
      hasLiveEvents: true,
      hasCertificate: true,
      affiliateEnabled: true,
      affiliateCommission: 25,
      isPublished: true,
      isFeatured: true,
      modules: [
        {
          title: "Foundation: Understanding Your Business",
          order: 0,
          lessons: [
            { title: "Analyzing Your Current Business Health", contentType: "video", order: 0 },
            { title: "Setting 6-Figure Goals", contentType: "video", order: 1 },
            { title: "The Studio Owner Mindset", contentType: "video", order: 2 },
          ]
        },
        {
          title: "Marketing That Actually Works",
          order: 1,
          lessons: [
            { title: "Local SEO for Studios", contentType: "video", order: 0 },
            { title: "Social Media Strategy", contentType: "video", order: 1 },
            { title: "Referral Programs That Convert", contentType: "video", order: 2 },
            { title: "Email Marketing Sequences", contentType: "video", order: 3 },
          ]
        },
        {
          title: "Retention & Client Experience",
          order: 2,
          lessons: [
            { title: "The First 30 Days Experience", contentType: "video", order: 0 },
            { title: "Building Community", contentType: "video", order: 1 },
            { title: "Handling Cancellations", contentType: "video", order: 2 },
          ]
        },
        {
          title: "Pricing & Packages",
          order: 3,
          lessons: [
            { title: "Value-Based Pricing", contentType: "video", order: 0 },
            { title: "Creating Irresistible Packages", contentType: "video", order: 1 },
            { title: "Membership Models", contentType: "video", order: 2 },
          ]
        }
      ]
    },
    // For Teachers
    {
      title: "Become a Sought-After Pilates Instructor",
      slug: "sought-after-pilates-instructor",
      subtitle: "Elevate your teaching skills and build a loyal following",
      description: "Transform your teaching career with advanced cueing techniques, class design strategies, and personal branding that will make students request you by name.",
      audience: "TEACHERS" as const,
      category: "Teaching Skills",
      difficulty: "Intermediate",
      pricingType: "ONE_TIME" as const,
      price: 297,
      accessType: "LIFETIME" as const,
      includeInSubscription: true,
      hasLiveEvents: false,
      hasCertificate: true,
      affiliateEnabled: true,
      affiliateCommission: 20,
      isPublished: true,
      isFeatured: true,
      modules: [
        {
          title: "Advanced Cueing Techniques",
          order: 0,
          lessons: [
            { title: "The Art of Imagery", contentType: "video", order: 0 },
            { title: "Cueing for Different Bodies", contentType: "video", order: 1 },
            { title: "Voice Modulation", contentType: "video", order: 2 },
          ]
        },
        {
          title: "Class Design Mastery",
          order: 1,
          lessons: [
            { title: "Creating Flow in Your Classes", contentType: "video", order: 0 },
            { title: "Theming Your Sessions", contentType: "video", order: 1 },
            { title: "Music Selection Guide", contentType: "video", order: 2 },
          ]
        },
        {
          title: "Building Your Brand",
          order: 2,
          lessons: [
            { title: "Your Unique Teaching Style", contentType: "video", order: 0 },
            { title: "Social Media for Teachers", contentType: "video", order: 1 },
            { title: "Getting Referrals", contentType: "video", order: 2 },
          ]
        }
      ]
    },
    // For Clients - At Home
    {
      title: "30-Day At-Home Pilates Challenge",
      slug: "30-day-at-home-pilates",
      subtitle: "Transform your body with daily guided workouts",
      description: "A complete 30-day program designed for practicing Pilates at home. Each day includes a full workout video, modifications, and progression tracking.",
      audience: "CLIENTS" as const,
      category: "At-Home Workouts",
      difficulty: "Beginner",
      pricingType: "ONE_TIME" as const,
      price: 47,
      accessType: "LIFETIME" as const,
      includeInSubscription: true,
      hasLiveEvents: false,
      hasCertificate: true,
      affiliateEnabled: true,
      affiliateCommission: 30,
      isPublished: true,
      isFeatured: true,
      modules: [
        {
          title: "Week 1: Building Foundation",
          order: 0,
          lessons: [
            { title: "Day 1: Core Awakening", contentType: "video", order: 0, isPreview: true },
            { title: "Day 2: Spine Mobility", contentType: "video", order: 1 },
            { title: "Day 3: Hip Openers", contentType: "video", order: 2 },
            { title: "Day 4: Upper Body Focus", contentType: "video", order: 3 },
            { title: "Day 5: Full Body Flow", contentType: "video", order: 4 },
            { title: "Day 6: Active Recovery", contentType: "video", order: 5 },
            { title: "Day 7: Rest & Reflect", contentType: "text", order: 6 },
          ]
        },
        {
          title: "Week 2: Building Strength",
          order: 1,
          lessons: [
            { title: "Day 8: Core Intensified", contentType: "video", order: 0 },
            { title: "Day 9: Lower Body Burn", contentType: "video", order: 1 },
            { title: "Day 10: Arms & Back", contentType: "video", order: 2 },
            { title: "Day 11: Balance Challenge", contentType: "video", order: 3 },
            { title: "Day 12: Power Flow", contentType: "video", order: 4 },
            { title: "Day 13: Stretch & Restore", contentType: "video", order: 5 },
            { title: "Day 14: Rest Day", contentType: "text", order: 6 },
          ]
        }
      ]
    },
    // For Clients - Subscription
    {
      title: "Pilates On-Demand Membership",
      slug: "pilates-on-demand",
      subtitle: "Unlimited access to our entire workout library",
      description: "Get unlimited access to hundreds of Pilates workouts for all levels. New content added weekly. Practice anytime, anywhere.",
      audience: "CLIENTS" as const,
      category: "Membership",
      difficulty: "All Levels",
      pricingType: "SUBSCRIPTION" as const,
      price: 0,
      subscriptionPrice: 29,
      subscriptionInterval: "monthly",
      accessType: "LIFETIME" as const,
      includeInSubscription: true,
      hasLiveEvents: true,
      hasCertificate: false,
      affiliateEnabled: true,
      affiliateCommission: 20,
      isPublished: true,
      isFeatured: false,
      modules: [
        {
          title: "Getting Started",
          order: 0,
          lessons: [
            { title: "Welcome to the Membership", contentType: "video", order: 0 },
            { title: "How to Use This Platform", contentType: "video", order: 1 },
            { title: "Equipment Guide", contentType: "pdf", order: 2 },
          ]
        },
        {
          title: "Beginner Workouts",
          order: 1,
          lessons: [
            { title: "Intro to Mat Pilates", contentType: "video", order: 0 },
            { title: "Core Basics", contentType: "video", order: 1 },
            { title: "Flexibility Flow", contentType: "video", order: 2 },
          ]
        },
        {
          title: "Intermediate Workouts",
          order: 2,
          lessons: [
            { title: "Full Body Challenge", contentType: "video", order: 0 },
            { title: "Advanced Core", contentType: "video", order: 1 },
            { title: "Cardio Pilates", contentType: "video", order: 2 },
          ]
        }
      ]
    },
    // Free course
    {
      title: "Pilates Basics: Free Introduction",
      slug: "pilates-basics-free",
      subtitle: "Start your Pilates journey today",
      description: "A free introduction to Pilates fundamentals. Perfect for complete beginners who want to understand the basics before committing to a full program.",
      audience: "CLIENTS" as const,
      category: "Beginner",
      difficulty: "Beginner",
      pricingType: "FREE" as const,
      price: 0,
      accessType: "LIFETIME" as const,
      includeInSubscription: false,
      hasLiveEvents: false,
      hasCertificate: false,
      affiliateEnabled: false,
      affiliateCommission: 0,
      isPublished: true,
      isFeatured: false,
      modules: [
        {
          title: "Welcome to Pilates",
          order: 0,
          lessons: [
            { title: "What is Pilates?", contentType: "video", order: 0, isPreview: true },
            { title: "The 6 Principles", contentType: "video", order: 1 },
            { title: "Equipment You Need", contentType: "text", order: 2 },
            { title: "Your First Workout", contentType: "video", order: 3, isPreview: true },
          ]
        }
      ]
    }
  ]

  // Create courses with modules and lessons
  for (const courseData of coursesData) {
    const { modules, ...courseInfo } = courseData

    // Check if course already exists
    const existingCourse = await prisma.vaultCourse.findUnique({
      where: { slug: courseInfo.slug }
    })

    if (existingCourse) {
      console.log(`⏩ Course "${courseInfo.title}" already exists, skipping...`)
      continue
    }

    console.log(`📚 Creating course: ${courseInfo.title}`)

    const course = await prisma.vaultCourse.create({
      data: {
        ...courseInfo,
        studioId: studio.id,
        creatorId: studio.teachers[0]?.id || null
      }
    })

    // Note: Community chat is now subscription-tier only, not per-course

    // Add first teacher as instructor
    if (studio.teachers[0]) {
      await prisma.vaultCourseInstructor.create({
        data: {
          courseId: course.id,
          teacherId: studio.teachers[0].id,
          role: "lead"
        }
      })
    }

    // Create modules and lessons
    for (const moduleData of modules) {
      const { lessons, ...moduleInfo } = moduleData

      const module = await prisma.vaultModule.create({
        data: {
          ...moduleInfo,
          courseId: course.id,
          isPublished: true
        }
      })

      // Create lessons
      for (const lessonData of lessons) {
        await prisma.vaultLesson.create({
          data: {
            ...lessonData,
            moduleId: module.id,
            isPublished: true
          }
        })
      }
    }
  }

  // Create 3 subscription tiers with community chats
  const subscriptionTiers = [
    {
      audience: "STUDIO_OWNERS" as const,
      name: "Studio Owner Vault",
      description: "Exclusive business growth courses, strategies, and a private community for Pilates studio owners.",
      monthlyPrice: 99,
      quarterlyPrice: 249,
      yearlyPrice: 799,
      features: [
        "Access to all studio owner courses",
        "Private community chat with other owners",
        "Monthly live Q&A sessions",
        "Business templates and resources",
        "Priority support"
      ]
    },
    {
      audience: "TEACHERS" as const,
      name: "Teacher Vault",
      description: "Advanced teaching techniques, career development, and a supportive community for Pilates instructors.",
      monthlyPrice: 49,
      quarterlyPrice: 129,
      yearlyPrice: 399,
      features: [
        "Access to all teacher courses",
        "Teacher community chat",
        "Cueing and technique workshops",
        "Career development resources",
        "Certification prep materials"
      ]
    },
    {
      audience: "CLIENTS" as const,
      name: "At-Home Vault",
      description: "Unlimited at-home Pilates workouts and a motivating community to support your fitness journey.",
      monthlyPrice: 29,
      quarterlyPrice: 79,
      yearlyPrice: 249,
      features: [
        "Unlimited at-home workouts",
        "Member community chat",
        "New content added weekly",
        "Progress tracking",
        "Mobile app access"
      ]
    }
  ]

  for (const tierData of subscriptionTiers) {
    const existingPlan = await prisma.vaultSubscriptionPlan.findUnique({
      where: {
        studioId_audience: {
          studioId: studio.id,
          audience: tierData.audience
        }
      }
    })

    if (existingPlan) {
      console.log(`⏩ ${tierData.name} plan already exists, skipping...`)
      continue
    }

    console.log(`👑 Creating subscription: ${tierData.name}`)

    const plan = await prisma.vaultSubscriptionPlan.create({
      data: {
        ...tierData,
        studioId: studio.id,
        isActive: true
      }
    })

    // Create community chat for this tier
    await prisma.vaultSubscriptionChat.create({
      data: {
        planId: plan.id,
        name: `${tierData.name} Community`,
        isEnabled: true
      }
    })
  }

  console.log("✅ Vault seeding complete!")
}

main()
  .catch((e) => {
    console.error("Error seeding vault:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



