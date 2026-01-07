import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seedSocialMedia() {
  console.log("🌱 Seeding Social Media data...")

  // Get Zenith studio for test data
  const zenithStudio = await prisma.studio.findFirst({
    where: { name: { contains: "Zenith" } }
  })

  if (!zenithStudio) {
    console.log("❌ Zenith studio not found. Please run main seed first.")
    return
  }

  // Get a teacher from the studio
  const teacher = await prisma.teacher.findFirst({
    where: { studioId: zenithStudio.id }
  })

  console.log(`Found studio: ${zenithStudio.name}`)

  // ==========================================
  // TRAINING CATEGORIES & MODULES
  // ==========================================

  const categories = [
    {
      name: "Profile Optimization",
      description: "Learn how to optimize your Instagram & TikTok profiles for maximum impact",
      icon: "✨",
      order: 1,
      modules: [
        {
          title: "Optimize Your Bio for Conversions",
          description: "Learn the secrets to writing a bio that converts followers into clients. We cover the perfect structure, CTAs, and link strategies.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          thumbnailUrl: "/uploads/thumbnails/bio-optimize.jpg",
          duration: 15,
          order: 1,
          homework: {
            title: "Rewrite Your Bio",
            description: "Apply what you learned and rewrite your Instagram bio using the formula taught in this module",
            requirements: JSON.stringify([
              { task: "Update your bio", quantity: 1, metric: "bio_updated" }
            ]),
            points: 10
          }
        },
        {
          title: "Profile Picture & Highlights Strategy",
          description: "Your profile picture and highlights are the first things potential clients see. Learn how to make them count.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          thumbnailUrl: "/uploads/thumbnails/profile-pic.jpg",
          duration: 12,
          order: 2
        },
        {
          title: "Link in Bio Strategy",
          description: "Stop sending people to a Linktree that converts nobody. Learn how to use your link strategically.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 18,
          order: 3
        }
      ]
    },
    {
      name: "Content Creation",
      description: "Master the art of creating scroll-stopping content that books clients",
      icon: "🎬",
      order: 2,
      modules: [
        {
          title: "The Hook Formula That Goes Viral",
          description: "Learn the exact hook formulas that have generated millions of views for fitness studios. We break down 10 proven templates.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          thumbnailUrl: "/uploads/thumbnails/hooks.jpg",
          duration: 25,
          order: 1,
          homework: {
            title: "Create 8 Reels Using Hook Formula",
            description: "Create 8 Instagram Reels using the hook formulas from this module. Set up comment-to-DM automation to track results.",
            requirements: JSON.stringify([
              { task: "Create Instagram Reels", quantity: 8, metric: "reels_created" },
              { task: "Set up auto-reply flow", quantity: 1, metric: "flow_created" },
              { task: "Get bookings from reels", quantity: 3, metric: "bookings" }
            ]),
            points: 50
          }
        },
        {
          title: "Camera Angles That Pop",
          description: "The right angles can make or break your content. Learn the 5 essential angles every fitness creator needs.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 20,
          order: 2
        },
        {
          title: "Storytelling for Fitness",
          description: "Transform boring workout clips into compelling stories that build emotional connection with your audience.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 30,
          order: 3,
          homework: {
            title: "Create a Story-Driven Reel",
            description: "Create one reel that follows the storytelling framework taught in this module",
            requirements: JSON.stringify([
              { task: "Post story-driven content", quantity: 1, metric: "story_content" }
            ]),
            points: 15
          }
        },
        {
          title: "Editing for Beginners (CapCut)",
          description: "Learn CapCut from scratch. We cover transitions, text, music syncing, and everything you need for pro-looking content.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 45,
          order: 4
        },
        {
          title: "Advanced Editing Techniques",
          description: "Take your editing to the next level with keyframes, masking, green screen, and speed ramping.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 40,
          order: 5
        }
      ]
    },
    {
      name: "Offers & Sales",
      description: "Learn how to structure offers and convert followers into paying clients",
      icon: "💰",
      order: 3,
      modules: [
        {
          title: "The Perfect Intro Offer Structure",
          description: "Learn how to create irresistible intro offers that fill your schedule without devaluing your services.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 22,
          order: 1
        },
        {
          title: "Creating Urgency Without Being Sleazy",
          description: "Ethical urgency tactics that actually work. No fake timers or manipulation needed.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 18,
          order: 2
        },
        {
          title: "DM Conversation Templates",
          description: "Exact scripts for handling DM conversations from initial inquiry to booking confirmation.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 25,
          order: 3,
          homework: {
            title: "Handle 5 DM Conversations",
            description: "Use the templates to handle 5 real DM conversations and convert at least 2 to bookings",
            requirements: JSON.stringify([
              { task: "DM conversations handled", quantity: 5, metric: "dm_conversations" },
              { task: "Bookings from DMs", quantity: 2, metric: "dm_bookings" }
            ]),
            points: 30
          }
        }
      ]
    },
    {
      name: "Live Sessions & Events",
      description: "Join live Q&As and special guest talks",
      icon: "📡",
      order: 4,
      modules: [
        {
          title: "Weekly Q&A Session",
          description: "Join our weekly live Q&A where you can ask anything about social media marketing for your studio.",
          isLive: true,
          liveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
          liveUrl: "https://zoom.us/j/123456789",
          order: 1
        },
        {
          title: "Guest Expert: TikTok Growth Hacks",
          description: "Special session with @SocialMediaGuru who grew from 0 to 1M followers in 6 months.",
          isLive: true,
          liveDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
          liveUrl: "https://zoom.us/j/987654321",
          order: 2
        },
        {
          title: "In-Person Content Day - NYC",
          description: "Join us for an in-person content creation day in NYC. Learn, create, and network with other studio owners.",
          isInPerson: true,
          eventLocation: "New York City",
          eventAddress: "123 Studio Street, Manhattan, NY 10001",
          maxAttendees: 30,
          liveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
          order: 3
        }
      ]
    },
    {
      name: "Case Studies",
      description: "Real-world examples of studios crushing it on social media",
      icon: "📊",
      order: 5,
      modules: [
        {
          title: "How Lotus Studio 3X'd Revenue in 90 Days",
          description: "Deep dive into how a small yoga studio went from struggling to sold out using Instagram.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 35,
          order: 1
        },
        {
          title: "Video Breakdown: Viral Pilates Reel (2M Views)",
          description: "Frame-by-frame breakdown of why this reel went viral and how you can replicate it.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          duration: 20,
          order: 2
        }
      ]
    }
  ]

  for (const cat of categories) {
    const category = await prisma.socialTrainingCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        order: cat.order
      }
    })
    console.log(`Created category: ${category.name}`)

    for (const mod of cat.modules) {
      const moduleData = mod as Record<string, unknown>
      const module = await prisma.socialTrainingModule.create({
        data: {
          categoryId: category.id,
          title: mod.title,
          description: mod.description,
          videoUrl: (moduleData.videoUrl as string) || null,
          thumbnailUrl: (moduleData.thumbnailUrl as string) || null,
          duration: (moduleData.duration as number) || null,
          isLive: (moduleData.isLive as boolean) || false,
          liveDate: (moduleData.liveDate as Date) || null,
          liveUrl: (moduleData.liveUrl as string) || null,
          isInPerson: (moduleData.isInPerson as boolean) || false,
          eventLocation: (moduleData.eventLocation as string) || null,
          eventAddress: (moduleData.eventAddress as string) || null,
          maxAttendees: (moduleData.maxAttendees as number) || null,
          order: mod.order
        }
      })

      const homework = moduleData.homework as { title: string; description: string; requirements: string; points: number } | undefined
      if (homework) {
        await prisma.socialTrainingHomework.create({
          data: {
            moduleId: module.id,
            title: homework.title,
            description: homework.description,
            requirements: homework.requirements,
            points: homework.points
          }
        })
      }
    }
  }

  // ==========================================
  // WEEKLY CONTENT IDEAS
  // ==========================================

  const contentIdeas = [
    {
      title: "The Transformation Hook",
      description: "Start with a dramatic before/after or 'watch me go from X to Y'. Perfect for showing client results or demonstrating difficult moves.",
      category: "hooks",
      exampleScript: "POV: You've been doing Pilates for 3 months vs 3 years"
    },
    {
      title: "Myth Buster Content",
      description: "Call out common misconceptions in fitness. These get tons of engagement because people love to argue in comments.",
      category: "storytelling",
      exampleScript: "Stop believing that Pilates is just stretching. Here's why you're wrong..."
    },
    {
      title: "Day in the Life",
      description: "Show behind the scenes of your studio. Humanizes your brand and builds connection.",
      category: "content",
      exampleScript: "5am studio owner morning routine"
    },
    {
      title: "Student Spotlight",
      description: "Feature a client transformation or testimonial. Social proof that sells without being salesy.",
      category: "storytelling"
    },
    {
      title: "Quick Tip Format",
      description: "3 tips for X, 5 mistakes you're making, etc. Easy to consume, high save rate.",
      category: "hooks",
      exampleScript: "3 Pilates moves that'll transform your posture (do these daily)"
    },
    {
      title: "Trending Audio Remix",
      description: "Take whatever sound is trending and adapt it to fitness/wellness context.",
      category: "content"
    }
  ]

  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()) // Start of week

  for (const idea of contentIdeas) {
    await prisma.socialContentIdea.create({
      data: {
        title: idea.title,
        description: idea.description,
        category: idea.category,
        exampleScript: idea.exampleScript || null,
        weekOf: thisWeek
      }
    })
  }
  console.log(`Created ${contentIdeas.length} content ideas`)

  // ==========================================
  // TEST SOCIAL ACCOUNTS & FLOWS
  // ==========================================

  // Create test Instagram account for the studio
  const studioAccount = await prisma.socialMediaAccount.create({
    data: {
      platform: "INSTAGRAM",
      platformUserId: "ig_zenith_studio_123",
      username: "zenith_pilates",
      displayName: "Zenith Pilates Studio",
      accessToken: "mock_access_token",
      followerCount: 4250,
      followingCount: 312,
      postsCount: 187,
      isActive: true,
      studioId: zenithStudio.id
    }
  })
  console.log("Created studio Instagram account")

  // Create test TikTok account
  const tiktokAccount = await prisma.socialMediaAccount.create({
    data: {
      platform: "TIKTOK",
      platformUserId: "tt_zenith_pilates_456",
      username: "zenithpilates",
      displayName: "Zenith Pilates",
      accessToken: "mock_tt_token",
      followerCount: 12800,
      followingCount: 95,
      postsCount: 234,
      isActive: true,
      studioId: zenithStudio.id
    }
  })
  console.log("Created studio TikTok account")

  // Create automation flows
  const flows = [
    {
      name: "Book Now Auto-Reply",
      description: "Auto-respond when someone comments 'book', 'info', or 'interested'",
      triggerType: "COMMENT_KEYWORD",
      triggerKeywords: ["book", "info", "interested", "how much", "price", "schedule"],
      responseMessage: "Hey! Thanks so much for your interest! 🙌 We'd love to have you join us at Zenith.\n\nClick the link below to book your first class - new clients get 50% off their first session! 👇",
      bookingMessage: "Book your intro class here:",
      accountId: studioAccount.id,
      isActive: true,
      totalTriggered: 156,
      totalResponded: 148,
      totalBooked: 42
    },
    {
      name: "Story Reply - Class Info",
      description: "Auto-respond to story replies asking about classes",
      triggerType: "STORY_REPLY",
      triggerKeywords: ["when", "time", "class", "schedule"],
      responseMessage: "Thanks for reaching out! 💫 Our classes run every day from 6am-8pm. Want me to send you our schedule?",
      accountId: studioAccount.id,
      isActive: true,
      totalTriggered: 89,
      totalResponded: 85,
      totalBooked: 23
    },
    {
      name: "TikTok Comment Funnel",
      description: "Capture leads from TikTok comments",
      triggerType: "COMMENT_KEYWORD",
      triggerKeywords: ["link", "how", "where", "drop"],
      responseMessage: "Ayy thanks for the love! 🔥 Here's the link to book - we've got a special offer running rn...",
      accountId: tiktokAccount.id,
      isActive: true,
      totalTriggered: 312,
      totalResponded: 298,
      totalBooked: 67
    },
    {
      name: "DM Welcome Flow",
      description: "Auto-respond to new DMs",
      triggerType: "INBOUND_DM_KEYWORD",
      triggerKeywords: ["hi", "hello", "hey", "interested"],
      responseMessage: "Hey there! 👋 Thanks for messaging us. How can I help you today?\n\n1️⃣ Book a class\n2️⃣ Pricing info\n3️⃣ Schedule\n\nJust reply with a number!",
      accountId: studioAccount.id,
      isActive: false, // Paused for example
      totalTriggered: 45,
      totalResponded: 42,
      totalBooked: 8
    }
  ]

  for (const flowData of flows) {
    const flow = await prisma.socialMediaFlow.create({
      data: {
        name: flowData.name,
        description: flowData.description,
        triggerType: flowData.triggerType as any,
        triggerKeywords: flowData.triggerKeywords,
        responseMessage: flowData.responseMessage,
        bookingMessage: flowData.bookingMessage || null,
        accountId: flowData.accountId,
        isActive: flowData.isActive,
        totalTriggered: flowData.totalTriggered,
        totalResponded: flowData.totalResponded,
        totalBooked: flowData.totalBooked
      }
    })

    // Create tracking link for this flow
    const code = `flow_${flow.id.slice(-8)}_${Date.now().toString(36)}`
    await prisma.socialMediaTrackingLink.create({
      data: {
        code,
        campaign: flowData.name,
        source: flowData.accountId === studioAccount.id ? "instagram" : "tiktok",
        medium: flowData.triggerType.toLowerCase(),
        destinationUrl: `http://localhost:3000/${zenithStudio.subdomain}`,
        fullTrackingUrl: `http://localhost:3000/${zenithStudio.subdomain}?utm_source=${flowData.accountId === studioAccount.id ? "instagram" : "tiktok"}&utm_medium=${flowData.triggerType.toLowerCase()}&sf_track=${code}`,
        clicks: Math.floor(flowData.totalTriggered * 0.6),
        conversions: flowData.totalBooked,
        revenue: flowData.totalBooked * 35, // $35 avg class price
        flowId: flow.id,
        accountId: flowData.accountId,
        studioId: zenithStudio.id
      }
    })
  }
  console.log(`Created ${flows.length} automation flows with tracking links`)

  // ==========================================
  // TEST SOCIAL MESSAGES (DM Inbox)
  // ==========================================

  const conversations = [
    {
      platformUserId: "ig_user_12345",
      platformUsername: "yoga_sarah",
      messages: [
        { direction: "INBOUND", content: "Hi! I saw your reel about the intro offer. Is that still available?" },
        { direction: "OUTBOUND", content: "Hey Sarah! Yes absolutely! 🙌 The intro offer is still running. You get 50% off your first class!", isAutomated: true },
        { direction: "INBOUND", content: "Amazing! How do I book?" },
        { direction: "OUTBOUND", content: "Super easy! Just click here to pick a time: zenith-studio.current.com/book\n\nLet me know if you have any questions about which class to start with!" },
        { direction: "INBOUND", content: "Thanks! Just booked for tomorrow at 9am 🎉" }
      ]
    },
    {
      platformUserId: "ig_user_67890",
      platformUsername: "fitness_mike",
      messages: [
        { direction: "INBOUND", content: "What's the pricing for unlimited classes?" },
        { direction: "OUTBOUND", content: "Hey! Great question 💪 Our unlimited membership is $199/month. It includes:\n\n• All classes (Pilates, Yoga, Strength)\n• Priority booking\n• Guest passes\n\nWant me to send more details?", isAutomated: true }
      ]
    },
    {
      platformUserId: "tt_user_11111",
      platformUsername: "pilatesqueen",
      messages: [
        { direction: "INBOUND", content: "omg your tiktoks are 🔥 do you ship nationwide??" },
        { direction: "OUTBOUND", content: "Ahhh thank you so much!! 😭❤️ We're actually a studio so no shipping, but if you're ever in NYC come take a class with us! We have an online membership too if you want to train from home!", isAutomated: false }
      ]
    }
  ]

  for (const conv of conversations) {
    const accountId = conv.platformUserId.startsWith("ig") ? studioAccount.id : tiktokAccount.id
    const platform = conv.platformUserId.startsWith("ig") ? "INSTAGRAM" : "TIKTOK"
    
    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i]
      await prisma.socialMediaMessage.create({
        data: {
          platform,
          platformUserId: conv.platformUserId,
          platformUsername: conv.platformUsername,
          direction: msg.direction as any,
          content: msg.content,
          isRead: i < conv.messages.length - 1, // Last message unread
          isAutomated: msg.isAutomated || false,
          accountId,
          createdAt: new Date(Date.now() - (conv.messages.length - i) * 3600000) // Stagger timestamps
        }
      })
    }
  }
  console.log(`Created ${conversations.length} test conversations`)

  // ==========================================
  // TEACHER PROGRESS (if teacher exists)
  // ==========================================

  if (teacher) {
    // Create teacher's own Instagram account
    const teacherAccount = await prisma.socialMediaAccount.create({
      data: {
        platform: "INSTAGRAM",
        platformUserId: "ig_teacher_sarah_789",
        username: "sarahjohnsonpilates",
        displayName: "Sarah Johnson | Pilates",
        accessToken: "mock_teacher_token",
        followerCount: 2150,
        followingCount: 485,
        postsCount: 89,
        isActive: true,
        teacherId: teacher.id
      }
    })

    // Mark some modules as completed for the teacher
    const allModules = await prisma.socialTrainingModule.findMany({
      take: 3 // First 3 modules
    })

    for (const module of allModules) {
      await prisma.socialTrainingProgress.create({
        data: {
          moduleId: module.id,
          teacherId: teacher.id,
          isCompleted: true,
          completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
          watchedPercent: 100
        }
      })
    }

    // Create homework submission in progress
    const homework = await prisma.socialTrainingHomework.findFirst({
      where: { title: { contains: "8 Reels" } }
    })

    if (homework) {
      await prisma.socialHomeworkSubmission.create({
        data: {
          homeworkId: homework.id,
          teacherId: teacher.id,
          progress: JSON.stringify({
            reels_created: 5,
            flow_created: 1,
            bookings: 1
          }),
          isCompleted: false,
          trackingCode: `hw_${teacher.id.slice(-6)}_${homework.id.slice(-6)}_demo`
        }
      })
    }

    console.log("Created teacher progress and homework")
  }

  console.log("✅ Social Media seeding complete!")
}

seedSocialMedia()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
















