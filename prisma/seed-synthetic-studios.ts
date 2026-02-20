import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import bcrypt from "bcryptjs"
import {
  AutomationStatus,
  AutomationTrigger,
  BookingStatus,
  CampaignStatus,
  InvoiceStatus,
  MessageChannel,
  MessageDirection,
  MessageStatus,
  PayRateType,
  PaymentStatus,
  Prisma,
  PrismaClient,
  Role,
} from "@prisma/client"

type CliOptions = {
  batchId: string
  historyDays: number
  futureDays: number
  clientsPerStudio: number
  teachersPerStudio: number
  yes: boolean
}

type StudioBlueprint = {
  name: string
  subdomain: string
  city: string
  state: string
  country: "UK" | "AU"
  currency: "gbp" | "aud"
  timezone: string
}

type LocationSeed = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  studioId: string
}

type ClassTypeSeed = {
  id: string
  name: string
  description: string
  duration: number
  capacity: number
  price: number
  studioId: string
}

type TeacherSeed = {
  teacherId: string
  userId: string
  userEmail: string
  firstName: string
  lastName: string
  studioId: string
}

type ClientSeed = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  studioId: string
}

type StudioSeedResult = {
  studioId: string
  studioName: string
  subdomain: string
  ownerId: string
  ownerEmail: string
  teacherIds: string[]
  teacherUserIds: string[]
}

const STUDIO_BLUEPRINTS: StudioBlueprint[] = [
  {
    name: "Riverstone Pilates London",
    subdomain: "riverstone-london",
    city: "London",
    state: "Greater London",
    country: "UK",
    currency: "gbp",
    timezone: "Europe/London",
  },
  {
    name: "Northbridge Pilates Manchester",
    subdomain: "northbridge-manchester",
    city: "Manchester",
    state: "Greater Manchester",
    country: "UK",
    currency: "gbp",
    timezone: "Europe/London",
  },
  {
    name: "Elm & Core Bristol",
    subdomain: "elm-core-bristol",
    city: "Bristol",
    state: "Bristol",
    country: "UK",
    currency: "gbp",
    timezone: "Europe/London",
  },
  {
    name: "Harbourline Pilates Sydney",
    subdomain: "harbourline-sydney",
    city: "Sydney",
    state: "NSW",
    country: "AU",
    currency: "aud",
    timezone: "Australia/Sydney",
  },
  {
    name: "Coastal Motion Melbourne",
    subdomain: "coastal-motion-melbourne",
    city: "Melbourne",
    state: "VIC",
    country: "AU",
    currency: "aud",
    timezone: "Australia/Melbourne",
  },
]

const FIRST_NAMES = [
  "Oliver",
  "Noah",
  "George",
  "Arthur",
  "Leo",
  "Freddie",
  "Theodore",
  "Archie",
  "Luca",
  "Henry",
  "Amelia",
  "Isla",
  "Ava",
  "Sophia",
  "Grace",
  "Mia",
  "Lily",
  "Ella",
  "Chloe",
  "Harper",
  "Charlotte",
  "Matilda",
  "Ruby",
  "Evie",
  "Poppy",
  "Emily",
  "Sienna",
  "Willow",
]

const LAST_NAMES = [
  "Smith",
  "Jones",
  "Taylor",
  "Brown",
  "Wilson",
  "Davies",
  "Evans",
  "Thomas",
  "Roberts",
  "Walker",
  "Johnson",
  "White",
  "Thompson",
  "Hughes",
  "Edwards",
  "Hall",
  "Green",
  "Morris",
  "Clark",
  "Ward",
  "Wright",
  "Mitchell",
  "Parker",
  "Turner",
]

const CLASS_TYPE_TEMPLATES = [
  { name: "Mat Flow", duration: 50, capacity: 16, basePrice: 22 },
  { name: "Reformer Essentials", duration: 55, capacity: 10, basePrice: 34 },
  { name: "Reformer Performance", duration: 55, capacity: 9, basePrice: 38 },
  { name: "Tower Alignment", duration: 50, capacity: 8, basePrice: 32 },
  { name: "Prenatal Pilates", duration: 45, capacity: 12, basePrice: 24 },
  { name: "Athletic Core", duration: 60, capacity: 14, basePrice: 30 },
  { name: "Posture Restore", duration: 45, capacity: 12, basePrice: 25 },
  { name: "Jumpboard Conditioning", duration: 50, capacity: 10, basePrice: 35 },
  { name: "Stretch & Release", duration: 40, capacity: 18, basePrice: 20 },
]

const LOCATION_NAMES = ["Central Studio", "Riverside Studio", "Northside Studio"]

function toInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function parseArgs(argv: string[]): CliOptions {
  const map = new Map<string, string>()
  let yes = false
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === "--yes") {
      yes = true
      continue
    }
    if (token.startsWith("--")) {
      const key = token.slice(2)
      const value = argv[index + 1]
      if (value && !value.startsWith("--")) {
        map.set(key, value)
        index += 1
      } else {
        map.set(key, "1")
      }
    }
  }
  return {
    batchId: (map.get("batch") || `live${Date.now().toString(36)}`).toLowerCase().replace(/[^a-z0-9-]/g, ""),
    historyDays: toInt(map.get("history-days"), 84),
    futureDays: toInt(map.get("future-days"), 21),
    clientsPerStudio: toInt(map.get("clients-per-studio"), 180),
    teachersPerStudio: toInt(map.get("teachers-per-studio"), 10),
    yes,
  }
}

function hashSeed(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function createRng(seed: string) {
  let state = hashSeed(seed) + 0x6d2b79f5
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function pickOne<T>(rng: () => number, values: T[]): T {
  return values[randomInt(rng, 0, values.length - 1)]
}

function shuffle<T>(rng: () => number, values: T[]) {
  const copy = [...values]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index)
    const temp = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = temp
  }
  return copy
}

function chunk<T>(values: T[], size = 1000) {
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

async function createManyChunked<T>(values: T[], handler: (input: T[]) => Promise<unknown>, size = 1000) {
  for (const batch of chunk(values, size)) {
    await handler(batch)
  }
}

function classPrice(countryCurrency: "gbp" | "aud", basePrice: number) {
  if (countryCurrency === "aud") return Math.round((basePrice * 1.95) * 100) / 100
  return basePrice
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isoDateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

async function seedOneStudio({
  prisma,
  blueprint,
  batchId,
  historyDays,
  futureDays,
  clientsPerStudio,
  teachersPerStudio,
  commonHashes,
}: {
  prisma: PrismaClient
  blueprint: StudioBlueprint
  batchId: string
  historyDays: number
  futureDays: number
  clientsPerStudio: number
  teachersPerStudio: number
  commonHashes: { owner: string; teacher: string; client: string }
}): Promise<StudioSeedResult> {
  const rng = createRng(`${blueprint.subdomain}:${batchId}`)
  const subdomain = `${blueprint.subdomain}-${batchId}`.slice(0, 63)
  const ownerEmail = `owner+${batchId}@${subdomain}.studio`

  const ownerId = randomUUID()
  await prisma.user.create({
    data: {
      id: ownerId,
      email: ownerEmail,
      password: commonHashes.owner,
      firstName: "Studio",
      lastName: "Owner",
      role: Role.OWNER,
    },
  })

  const studioId = randomUUID()
  await prisma.studio.create({
    data: {
      id: studioId,
      name: blueprint.name,
      subdomain,
      ownerId,
      stripeCurrency: blueprint.currency,
    },
  })

  await prisma.studioEmailConfig.create({
    data: {
      studioId,
      fromName: blueprint.name,
      fromEmail: `hello@${subdomain}.studio`,
      replyToEmail: `support@${subdomain}.studio`,
      domain: `${subdomain}.studio`,
      domainStatus: "verified",
      useFallback: false,
      verifiedAt: new Date(),
    },
  })

  await prisma.studioSmsConfig.create({
    data: {
      studioId,
      provider: "twilio",
      fromNumber: blueprint.country === "UK" ? `+447700${randomInt(rng, 100000, 999999)}` : `+6149${randomInt(rng, 1000000, 9999999)}`,
      isVerified: true,
      verifiedAt: new Date(),
      monthlyLimit: 5000,
      currentMonthUsage: randomInt(rng, 320, 1700),
    },
  })

  const locations: LocationSeed[] = LOCATION_NAMES.map((name, index) => ({
    id: randomUUID(),
    name,
    address: `${120 + index * 37} ${["King", "Harbour", "Union"][index]} Street`,
    city: blueprint.city,
    state: blueprint.state,
    zipCode: blueprint.country === "UK" ? `W${index + 1} ${randomInt(rng, 1, 9)}AA` : `${randomInt(rng, 2000, 3999)}`,
    phone: blueprint.country === "UK" ? `+4420${randomInt(rng, 10000000, 99999999)}` : `+613${randomInt(rng, 10000000, 99999999)}`,
    studioId,
  }))
  await prisma.location.createMany({ data: locations })

  const classTypes: ClassTypeSeed[] = CLASS_TYPE_TEMPLATES.map((template, index) => ({
    id: randomUUID(),
    name: template.name,
    description: `${template.name} programme for ${blueprint.name}.`,
    duration: template.duration,
    capacity: template.capacity + (index % 2),
    price: classPrice(blueprint.currency, template.basePrice),
    studioId,
  }))
  await prisma.classType.createMany({ data: classTypes })

  const teacherSeeds: TeacherSeed[] = []
  const teacherUsers = []
  const teachers = []
  const teacherPayRates = []

  for (let index = 0; index < teachersPerStudio; index += 1) {
    const firstName = pickOne(rng, FIRST_NAMES)
    const lastName = pickOne(rng, LAST_NAMES)
    const teacherUserId = randomUUID()
    const teacherId = randomUUID()
    const teacherEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index + 1}+${batchId}@${subdomain}.studio`
    teacherSeeds.push({
      teacherId,
      userId: teacherUserId,
      userEmail: teacherEmail,
      firstName,
      lastName,
      studioId,
    })
    teacherUsers.push({
      id: teacherUserId,
      email: teacherEmail,
      password: commonHashes.teacher,
      firstName,
      lastName,
      role: Role.TEACHER,
    })
    teachers.push({
      id: teacherId,
      userId: teacherUserId,
      studioId,
      bio: `${firstName} leads ${pickOne(rng, ["mobility", "athletic", "rehab-focused", "precision reformer"])} sessions.`,
      specialties: shuffle(rng, classTypes.map((entry) => entry.name)).slice(0, 3),
    })
    teacherPayRates.push({
      id: randomUUID(),
      teacherId,
      type: pickOne(rng, [PayRateType.PER_CLASS, PayRateType.PER_HOUR, PayRateType.PER_STUDENT]),
      rate: classPrice(blueprint.currency, randomInt(rng, 24, 55)),
      currency: blueprint.currency.toUpperCase(),
    })
  }

  await prisma.user.createMany({ data: teacherUsers })
  await prisma.teacher.createMany({ data: teachers })
  await prisma.teacherPayRate.createMany({ data: teacherPayRates })

  const clientSeeds: ClientSeed[] = []
  const clients = []
  for (let index = 0; index < clientsPerStudio; index += 1) {
    const firstName = pickOne(rng, FIRST_NAMES)
    const lastName = pickOne(rng, LAST_NAMES)
    const clientId = randomUUID()
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index + 1}+${batchId}@${subdomain}.members`
    const phone = blueprint.country === "UK" ? `+4475${randomInt(rng, 10000000, 99999999)}` : `+6147${randomInt(rng, 1000000, 9999999)}`
    clientSeeds.push({
      id: clientId,
      email,
      firstName,
      lastName,
      phone,
      studioId,
    })
    clients.push({
      id: clientId,
      email,
      password: commonHashes.client,
      firstName,
      lastName,
      phone,
      birthday: new Date(1975 + randomInt(rng, 0, 28), randomInt(rng, 0, 11), randomInt(rng, 1, 27)),
      credits: randomInt(rng, 0, 18),
      stripeCustomerId: `cus_${randomUUID().replace(/-/g, "").slice(0, 18)}`,
      studioId,
      createdAt: new Date(Date.now() - randomInt(rng, 7, 360) * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
  }
  await createManyChunked(clients, (data) => prisma.client.createMany({ data }))

  const segments = [
    {
      id: randomUUID(),
      name: "Frequent Bookers",
      description: "Clients booking at least 6 sessions in 30 days",
      rules: JSON.stringify({
        operator: "AND",
        conditions: [{ field: "bookingsLast30Days", operator: "gte", value: 6 }],
      }),
      clientCount: randomInt(rng, Math.floor(clientsPerStudio * 0.16), Math.floor(clientsPerStudio * 0.29)),
      lastCalculated: new Date(),
      studioId,
    },
    {
      id: randomUUID(),
      name: "At Risk Members",
      description: "Clients with no booking in 21+ days",
      rules: JSON.stringify({
        operator: "AND",
        conditions: [{ field: "daysSinceLastBooking", operator: "gte", value: 21 }],
      }),
      clientCount: randomInt(rng, Math.floor(clientsPerStudio * 0.08), Math.floor(clientsPerStudio * 0.14)),
      lastCalculated: new Date(),
      studioId,
    },
  ]
  await prisma.segment.createMany({ data: segments })

  const templates = [
    {
      id: randomUUID(),
      name: "Class Win-Back Email",
      type: "EMAIL" as const,
      subject: "We would love to see you in class this week",
      body: "Hi {{firstName}}, we have fresh class options open this week.",
      htmlBody: "<p>Hi {{firstName}}, we have fresh class options open this week.</p>",
      variables: ["firstName", "className", "bookingLink"],
      studioId,
    },
    {
      id: randomUUID(),
      name: "Class Reminder SMS",
      type: "SMS" as const,
      body: "Reminder: {{className}} starts soon at {{startTime}}.",
      subject: null,
      htmlBody: null,
      variables: ["className", "startTime", "locationName"],
      studioId,
    },
  ]
  await prisma.messageTemplate.createMany({ data: templates })

  const campaigns = [
    {
      id: randomUUID(),
      name: "Spring Reformer Push",
      channel: MessageChannel.EMAIL,
      status: CampaignStatus.SENT,
      subject: "Spring reformer blocks now open",
      body: "New reformer schedules are now open for booking.",
      htmlBody: "<p>New reformer schedules are now open for booking.</p>",
      targetAll: true,
      totalRecipients: clientsPerStudio,
      sentCount: randomInt(rng, Math.floor(clientsPerStudio * 0.85), clientsPerStudio),
      deliveredCount: randomInt(rng, Math.floor(clientsPerStudio * 0.75), clientsPerStudio),
      openedCount: randomInt(rng, Math.floor(clientsPerStudio * 0.4), Math.floor(clientsPerStudio * 0.7)),
      clickedCount: randomInt(rng, Math.floor(clientsPerStudio * 0.08), Math.floor(clientsPerStudio * 0.26)),
      failedCount: randomInt(rng, 0, 8),
      sentAt: new Date(Date.now() - randomInt(rng, 5, 28) * 24 * 60 * 60 * 1000),
      studioId,
      segmentId: segments[0].id,
      locationId: locations[0].id,
      templateId: templates[0].id,
    },
    {
      id: randomUUID(),
      name: "Weekend Offer SMS",
      channel: MessageChannel.SMS,
      status: CampaignStatus.SENT,
      subject: null,
      body: "Weekend classes have extra spots. Reply YES to reserve now.",
      htmlBody: null,
      targetAll: false,
      totalRecipients: Math.floor(clientsPerStudio * 0.48),
      sentCount: randomInt(rng, Math.floor(clientsPerStudio * 0.36), Math.floor(clientsPerStudio * 0.48)),
      deliveredCount: randomInt(rng, Math.floor(clientsPerStudio * 0.31), Math.floor(clientsPerStudio * 0.46)),
      openedCount: 0,
      clickedCount: 0,
      failedCount: randomInt(rng, 0, 5),
      sentAt: new Date(Date.now() - randomInt(rng, 2, 16) * 24 * 60 * 60 * 1000),
      studioId,
      segmentId: segments[1].id,
      locationId: locations[1].id,
      templateId: templates[1].id,
    },
    {
      id: randomUUID(),
      name: "Reformer Intro Sequence",
      channel: MessageChannel.EMAIL,
      status: CampaignStatus.SCHEDULED,
      subject: "Intro reformer series starts next week",
      body: "Join our guided intro reformer series.",
      htmlBody: "<p>Join our guided intro reformer series.</p>",
      targetAll: true,
      totalRecipients: clientsPerStudio,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      failedCount: 0,
      scheduledAt: new Date(Date.now() + randomInt(rng, 3, 11) * 24 * 60 * 60 * 1000),
      studioId,
      segmentId: null,
      locationId: null,
      templateId: templates[0].id,
    },
  ]
  await prisma.campaign.createMany({ data: campaigns })

  const automations = [
    {
      id: randomUUID(),
      name: "New Client Welcome Journey",
      trigger: AutomationTrigger.WELCOME,
      channel: MessageChannel.EMAIL,
      status: AutomationStatus.ACTIVE,
      subject: "Welcome to the studio",
      body: "Welcome {{firstName}}, here is how to start booking.",
      htmlBody: "<p>Welcome {{firstName}}, here is how to start booking.</p>",
      triggerDelay: 0,
      totalSent: randomInt(rng, 120, 420),
      totalDelivered: randomInt(rng, 110, 390),
      totalOpened: randomInt(rng, 70, 260),
      totalClicked: randomInt(rng, 20, 90),
      studioId,
      templateId: templates[0].id,
    },
    {
      id: randomUUID(),
      name: "Class Reminder 24h",
      trigger: AutomationTrigger.CLASS_REMINDER,
      channel: MessageChannel.SMS,
      status: AutomationStatus.ACTIVE,
      subject: null,
      body: "Reminder: {{className}} starts tomorrow at {{startTime}}.",
      htmlBody: null,
      triggerDelay: 24 * 60,
      reminderHours: 24,
      totalSent: randomInt(rng, 600, 2600),
      totalDelivered: randomInt(rng, 580, 2450),
      totalOpened: 0,
      totalClicked: 0,
      studioId,
      templateId: templates[1].id,
    },
  ]

  for (const automation of automations) {
    await prisma.automation.create({ data: automation })
    await prisma.automationStep.createMany({
      data: [
        {
          id: randomUUID(),
          automationId: automation.id,
          stepId: "step-1",
          stepOrder: 1,
          channel: automation.channel,
          subject: automation.subject,
          body: automation.body,
          htmlBody: automation.htmlBody,
          delayMinutes: 0,
        },
        {
          id: randomUUID(),
          automationId: automation.id,
          stepId: "step-2",
          stepOrder: 2,
          channel: automation.channel,
          subject: automation.subject,
          body: automation.channel === MessageChannel.EMAIL
            ? "A quick follow-up with this week schedule and resources."
            : "Follow-up: we saved a class slot if you want it.",
          htmlBody: automation.channel === MessageChannel.EMAIL ? "<p>A quick follow-up with this week schedule and resources.</p>" : null,
          delayMinutes: 24 * 60,
        },
      ],
    })
  }

  await prisma.websiteAnalyticsConfig.create({
    data: {
      studioId,
      websiteUrl: `https://${subdomain}.studio`,
      platform: "custom",
      trackPageViews: true,
      trackClicks: true,
      trackForms: true,
      trackOutboundLinks: true,
      conversionGoals: JSON.stringify([
        { name: "book_class", path: "/book" },
        { name: "join_waitlist", path: "/waitlist" },
      ]),
    },
  })

  const visitors = []
  const visitorEvents = []
  const visitorCount = randomInt(rng, 180, 320)
  for (let index = 0; index < visitorCount; index += 1) {
    const visitorId = randomUUID()
    const firstVisitOffsetDays = randomInt(rng, 1, 180)
    const lastVisitOffsetDays = randomInt(rng, 0, firstVisitOffsetDays)
    const firstVisit = new Date(Date.now() - firstVisitOffsetDays * 24 * 60 * 60 * 1000)
    const lastVisit = new Date(Date.now() - lastVisitOffsetDays * 24 * 60 * 60 * 1000)
    const visits = randomInt(rng, 1, 9)
    const pageViews = randomInt(rng, visits, visits * 5)
    visitors.push({
      id: visitorId,
      studioId,
      visitorId: `v_${randomUUID().replace(/-/g, "").slice(0, 14)}`,
      firstVisit,
      lastVisit,
      totalVisits: visits,
      totalPageViews: pageViews,
      device: pickOne(rng, ["desktop", "mobile", "tablet"]),
      browser: pickOne(rng, ["Chrome", "Safari", "Firefox"]),
      os: pickOne(rng, ["iOS", "Android", "Windows", "macOS"]),
      country: blueprint.country === "UK" ? "United Kingdom" : "Australia",
      city: blueprint.city,
      firstSource: pickOne(rng, ["google", "instagram", "referral", "direct"]),
      firstMedium: pickOne(rng, ["organic", "social", "referral", "direct"]),
      firstCampaign: pickOne(rng, ["spring-launch", "founder-offer", "reformer-promo"]),
      hasConverted: rng() > 0.72,
    })
    const eventsPerVisitor = randomInt(rng, 2, 6)
    for (let eventIndex = 0; eventIndex < eventsPerVisitor; eventIndex += 1) {
      visitorEvents.push({
        id: randomUUID(),
        studioId,
        visitorId,
        type: pickOne(rng, ["PAGE_VIEW", "CLICK", "FORM_SUBMIT", "OUTBOUND_LINK"] as const),
        pageUrl: `https://${subdomain}.studio${pickOne(rng, ["/", "/book", "/classes", "/about", "/pricing"])}`,
        pageTitle: pickOne(rng, ["Home", "Book", "Classes", "About", "Pricing"]),
        pagePath: pickOne(rng, ["/", "/book", "/classes", "/about", "/pricing"]),
        eventName: pickOne(rng, ["page_view", "cta_click", "form_submit"]),
        sessionId: `sess_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        utmSource: pickOne(rng, ["google", "instagram", "facebook", null]),
        utmMedium: pickOne(rng, ["organic", "cpc", "social", null]),
        utmCampaign: pickOne(rng, ["spring", "retention", "launch", null]),
        createdAt: new Date(Date.now() - randomInt(rng, 0, 90) * 24 * 60 * 60 * 1000),
      })
    }
  }
  await createManyChunked(visitors, (data) => prisma.websiteVisitor.createMany({ data }))
  await createManyChunked(visitorEvents, (data) => prisma.websiteEvent.createMany({ data }))

  const classSessions: Prisma.ClassSessionCreateManyInput[] = []
  const bookings: Prisma.BookingCreateManyInput[] = []
  const payments: Prisma.PaymentCreateManyInput[] = []
  const waitlists: Prisma.WaitlistCreateManyInput[] = []
  const now = new Date()
  const sessionSlots = [
    { hour: 6, minute: 30 },
    { hour: 8, minute: 0 },
    { hour: 9, minute: 30 },
    { hour: 12, minute: 0 },
    { hour: 17, minute: 30 },
    { hour: 19, minute: 0 },
  ]

  for (let dayOffset = -historyDays; dayOffset <= futureDays; dayOffset += 1) {
    const date = startOfDay(new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000))
    const weekday = date.getDay()
    const isWeekend = weekday === 0 || weekday === 6
    const sessionsPerLocation = isWeekend ? 2 : 3

    for (const location of locations) {
      const shuffledSlots = shuffle(rng, sessionSlots).slice(0, sessionsPerLocation)
      for (const slot of shuffledSlots) {
        const classType = pickOne(rng, classTypes)
        const teacher = pickOne(rng, teacherSeeds)
        const classSessionId = randomUUID()
        const startTime = new Date(date)
        startTime.setHours(slot.hour, slot.minute, 0, 0)
        const endTime = new Date(startTime.getTime() + classType.duration * 60 * 1000)
        classSessions.push({
          id: classSessionId,
          studioId,
          classTypeId: classType.id,
          teacherId: teacher.teacherId,
          locationId: location.id,
          startTime,
          endTime,
          capacity: classType.capacity,
          notes: `${classType.name} session at ${location.name}`,
          recurringGroupId: `${classType.id}:${location.id}:${slot.hour}:${slot.minute}`,
        })

        const isPast = startTime.getTime() < now.getTime()
        const occupancyFloor = Math.floor(classType.capacity * (isWeekend ? 0.35 : 0.45))
        const occupancyCeil = Math.floor(classType.capacity * (isWeekend ? 0.82 : 0.94))
        const bookingsTarget = randomInt(rng, Math.max(1, occupancyFloor), Math.max(2, occupancyCeil))
        const selectedClients = shuffle(rng, clientSeeds).slice(0, bookingsTarget)

        for (const client of selectedClients) {
          let status: BookingStatus
          if (isPast) {
            const roll = rng()
            if (roll < 0.74) status = BookingStatus.COMPLETED
            else if (roll < 0.83) status = BookingStatus.CANCELLED
            else if (roll < 0.9) status = BookingStatus.NO_SHOW
            else status = BookingStatus.CONFIRMED
          } else {
            status = rng() < 0.92 ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED
          }

          const bookingId = randomUUID()
          const shouldCreatePayment = status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED || status === BookingStatus.NO_SHOW
          let paymentId: string | null = null
          if (shouldCreatePayment) {
            paymentId = randomUUID()
            payments.push({
              id: paymentId,
              studioId,
              clientId: client.id,
              amount: classType.price,
              currency: blueprint.currency,
              status: PaymentStatus.SUCCEEDED,
              description: `${classType.name} booking - ${isoDateOnly(startTime)}`,
              stripePaymentIntentId: `pi_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
              stripeChargeId: `ch_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
              stripeFee: Math.round(classType.price * 0.029 * 100) / 100,
              netAmount: Math.round(classType.price * 0.971 * 100) / 100,
              createdAt: new Date(startTime.getTime() - randomInt(rng, 2, 18) * 60 * 60 * 1000),
              updatedAt: new Date(),
            })
          }

          bookings.push({
            id: bookingId,
            studioId,
            clientId: client.id,
            classSessionId,
            status,
            paidAmount: shouldCreatePayment ? classType.price : null,
            paymentId,
            cancelledAt: status === BookingStatus.CANCELLED ? new Date(startTime.getTime() - randomInt(rng, 1, 36) * 60 * 60 * 1000) : null,
            cancellationReason: status === BookingStatus.CANCELLED ? pickOne(rng, ["Schedule conflict", "Travel", "Illness"]) : null,
            notes: status === BookingStatus.NO_SHOW ? "Client did not arrive." : null,
            createdAt: new Date(startTime.getTime() - randomInt(rng, 2, 96) * 60 * 60 * 1000),
            updatedAt: new Date(),
          })
        }

        if (bookingsTarget >= classType.capacity - 1 && rng() < 0.42) {
          const waitCount = randomInt(rng, 1, 3)
          const waitClients = shuffle(rng, clientSeeds).slice(0, waitCount)
          waitClients.forEach((client, index) => {
            waitlists.push({
              id: randomUUID(),
              studioId,
              clientId: client.id,
              classSessionId,
              position: index + 1,
              status: rng() < 0.82 ? "WAITING" : "NOTIFIED",
              notifiedAt: rng() < 0.22 ? new Date(startTime.getTime() - 2 * 60 * 60 * 1000) : null,
              expiresAt: rng() < 0.22 ? new Date(startTime.getTime() - 60 * 60 * 1000) : null,
              createdAt: new Date(startTime.getTime() - randomInt(rng, 1, 72) * 60 * 60 * 1000),
              updatedAt: new Date(),
            })
          })
        }
      }
    }
  }

  await createManyChunked(classSessions, (data) => prisma.classSession.createMany({ data }))
  await createManyChunked(payments, (data) => prisma.payment.createMany({ data }))
  await createManyChunked(bookings, (data) => prisma.booking.createMany({ data }))
  await createManyChunked(waitlists, (data) => prisma.waitlist.createMany({ data }))

  const messages = []
  const conversationClients = shuffle(rng, clientSeeds).slice(0, Math.floor(clientsPerStudio * 0.35))
  for (const client of conversationClients) {
    const threadId = randomUUID()
    const messageCount = randomInt(rng, 2, 6)
    const startOffsetDays = randomInt(rng, 1, 70)
    let previousDate = new Date(Date.now() - startOffsetDays * 24 * 60 * 60 * 1000)
    for (let index = 0; index < messageCount; index += 1) {
      const outbound = index % 2 === 0
      previousDate = new Date(previousDate.getTime() + randomInt(rng, 2, 30) * 60 * 1000)
      const channel = rng() < 0.62 ? MessageChannel.EMAIL : MessageChannel.SMS
      messages.push({
        id: randomUUID(),
        studioId,
        clientId: client.id,
        threadId,
        replyToId: null,
        channel,
        direction: outbound ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
        status: MessageStatus.DELIVERED,
        subject: channel === MessageChannel.EMAIL ? pickOne(rng, ["Class update", "Booking confirmation", "Quick follow-up"]) : null,
        body: outbound
          ? pickOne(rng, [
              "Your class is confirmed. We are excited to see you.",
              "A waitlist spot opened up, tap to confirm your place.",
              "Here is this week schedule based on your preferences.",
            ])
          : pickOne(rng, [
              "Thanks, that works for me.",
              "Can I move this booking to tomorrow evening?",
              "Please add me to the waitlist for reformer.",
            ]),
        fromAddress: outbound
          ? `${subdomain}@studio-mail.app`
          : client.email,
        toAddress: outbound
          ? client.email
          : `${subdomain}@studio-mail.app`,
        fromName: outbound ? blueprint.name : `${client.firstName} ${client.lastName}`,
        toName: outbound ? `${client.firstName} ${client.lastName}` : blueprint.name,
        sentAt: previousDate,
        deliveredAt: new Date(previousDate.getTime() + randomInt(rng, 10, 300) * 1000),
        openedAt: outbound && channel === MessageChannel.EMAIL && rng() < 0.68
          ? new Date(previousDate.getTime() + randomInt(rng, 1, 120) * 60 * 1000)
          : null,
        clickedAt: outbound && channel === MessageChannel.EMAIL && rng() < 0.24
          ? new Date(previousDate.getTime() + randomInt(rng, 5, 240) * 60 * 1000)
          : null,
        createdAt: previousDate,
        updatedAt: previousDate,
      })
    }
  }
  await createManyChunked(messages, (data) => prisma.message.createMany({ data }))

  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const invoiceRows = teacherSeeds.map((teacher, index) => {
    const taughtClasses = randomInt(rng, 28, 64)
    const rate = classPrice(blueprint.currency, randomInt(rng, 24, 52))
    const subtotal = taughtClasses * rate
    return {
      id: randomUUID(),
      teacherId: teacher.teacherId,
      studioId,
      invoiceNumber: `${subdomain.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}-${batchId}-${String(index + 1).padStart(3, "0")}`,
      status: InvoiceStatus.PAID,
      periodStart: monthStart,
      periodEnd: monthEnd,
      lineItems: JSON.stringify([
        {
          description: "Classes taught",
          quantity: taughtClasses,
          rate,
          amount: subtotal,
        },
      ]),
      subtotal,
      tax: 0,
      taxRate: 0,
      total: subtotal,
      currency: blueprint.currency.toUpperCase(),
      sentAt: new Date(now.getTime() - randomInt(rng, 10, 30) * 24 * 60 * 60 * 1000),
      paidAt: new Date(now.getTime() - randomInt(rng, 3, 18) * 24 * 60 * 60 * 1000),
      paidAmount: subtotal,
      paymentMethod: pickOne(rng, ["bank_transfer", "stripe_transfer"]),
      paymentReference: `pay_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    }
  })
  await createManyChunked(invoiceRows, (data) => prisma.teacherInvoice.createMany({ data }))

  console.log(
    `  • ${blueprint.name}: ${teachers.length} teachers, ${clients.length} clients, ${classSessions.length} sessions, ${bookings.length} bookings`
  )

  return {
    studioId,
    studioName: blueprint.name,
    subdomain,
    ownerId,
    ownerEmail,
    teacherIds: teacherSeeds.map((entry) => entry.teacherId),
    teacherUserIds: teacherSeeds.map((entry) => entry.userId),
  }
}

async function seedLeaderboardEntries(prisma: PrismaClient, studioIds: string[], teacherIds: string[], batchId: string) {
  const rng = createRng(`leaderboards:${batchId}`)
  const periods = await prisma.leaderboardPeriod.findMany({
    where: { status: "ACTIVE" },
    include: { leaderboard: true },
  })
  if (periods.length === 0) {
    console.log("  • No active leaderboard periods found; skipping leaderboard entry seed.")
    return
  }

  for (const period of periods) {
    if (period.leaderboard.participantType === "STUDIO") {
      for (const studioId of studioIds) {
        const score = randomInt(rng, 220, 9200)
        await prisma.leaderboardEntry.upsert({
          where: { periodId_studioId: { periodId: period.id, studioId } },
          update: {
            previousScore: score * (0.85 + rng() * 0.22),
            score,
            lastUpdated: new Date(),
          },
          create: {
            id: randomUUID(),
            periodId: period.id,
            studioId,
            score,
            previousScore: score * (0.85 + rng() * 0.22),
            lastUpdated: new Date(),
          },
        })
      }
    } else {
      const chosenTeachers = shuffle(rng, teacherIds).slice(0, Math.min(teacherIds.length, 18))
      for (const teacherId of chosenTeachers) {
        const score = randomInt(rng, 90, 3100)
        await prisma.leaderboardEntry.upsert({
          where: { periodId_teacherId: { periodId: period.id, teacherId } },
          update: {
            previousScore: score * (0.8 + rng() * 0.28),
            score,
            lastUpdated: new Date(),
          },
          create: {
            id: randomUUID(),
            periodId: period.id,
            teacherId,
            score,
            previousScore: score * (0.8 + rng() * 0.28),
            lastUpdated: new Date(),
          },
        })
      }
    }

    const allEntries = await prisma.leaderboardEntry.findMany({
      where: { periodId: period.id },
      select: { id: true, score: true, rank: true },
    })

    const sorted = [...allEntries].sort((left, right) =>
      period.leaderboard.higherIsBetter ? right.score - left.score : left.score - right.score
    )

    for (let index = 0; index < sorted.length; index += 1) {
      const entry = sorted[index]
      await prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: {
          previousRank: entry.rank,
          rank: index + 1,
          lastUpdated: new Date(),
        },
      })
    }

    await prisma.leaderboard.update({
      where: { id: period.leaderboardId },
      data: { lastCalculated: new Date() },
    })
  }

  console.log(`  • Updated leaderboard entries across ${periods.length} active periods.`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.batchId) {
    throw new Error("Missing batch id. Use --batch <id>.")
  }

  if (!options.yes) {
    throw new Error("Refusing to run without confirmation. Re-run with --yes")
  }

  const prisma = new PrismaClient()
  const batchTag = options.batchId.toLowerCase()
  console.log(`Seeding synthetic studios batch '${batchTag}'...`)

  const existing = await prisma.studio.count({
    where: { subdomain: { endsWith: `-${batchTag}` } },
  })
  if (existing > 0) {
    throw new Error(`Batch '${batchTag}' already exists (${existing} studios). Use a new --batch or cleanup first.`)
  }

  const commonHashes = {
    owner: await bcrypt.hash("Owner!234", 10),
    teacher: await bcrypt.hash("Teacher!234", 10),
    client: await bcrypt.hash("Client!234", 10),
  }

  const seededStudios: StudioSeedResult[] = []
  for (const blueprint of STUDIO_BLUEPRINTS) {
    const seeded = await seedOneStudio({
      prisma,
      blueprint,
      batchId: batchTag,
      historyDays: options.historyDays,
      futureDays: options.futureDays,
      clientsPerStudio: options.clientsPerStudio,
      teachersPerStudio: options.teachersPerStudio,
      commonHashes,
    })
    seededStudios.push(seeded)
  }

  await seedLeaderboardEntries(
    prisma,
    seededStudios.map((entry) => entry.studioId),
    seededStudios.flatMap((entry) => entry.teacherIds),
    batchTag
  )

  const manifest = {
    batchId: batchTag,
    createdAt: new Date().toISOString(),
    studios: seededStudios.map((entry) => ({
      id: entry.studioId,
      name: entry.studioName,
      subdomain: entry.subdomain,
      ownerId: entry.ownerId,
      ownerEmail: entry.ownerEmail,
      teacherUserIds: entry.teacherUserIds,
      teacherIds: entry.teacherIds,
    })),
    defaults: {
      ownerPassword: "Owner!234",
      teacherPassword: "Teacher!234",
      clientPassword: "Client!234",
    },
  }

  const batchesDir = join(process.cwd(), "prisma", "synthetic-batches")
  mkdirSync(batchesDir, { recursive: true })
  const manifestPath = join(batchesDir, `${batchTag}.json`)
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log("Synthetic studio seeding complete.")
  console.log(`Batch: ${batchTag}`)
  console.log(`Manifest: ${manifestPath}`)
  console.log(
    `Studios: ${seededStudios.map((entry) => `${entry.studioName} (${entry.subdomain})`).join(", ")}`
  )

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error("Synthetic seed failed:", error)
  process.exitCode = 1
})
