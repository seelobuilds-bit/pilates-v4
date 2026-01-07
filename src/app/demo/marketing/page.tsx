import { db } from "@/lib/db"
import { MarketingView } from "@/components/studio"
import type { MarketingData, Automation, Campaign, Template } from "@/components/studio"

// Demo uses data from a real studio (Zenith) to always reflect the current state
const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoMarketingPage() {
  // Find the demo studio
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  const studioId = studio.id

  // Fetch all marketing data
  const [
    emailSubscribers,
    smsSubscribers,
    automations,
    campaigns,
    templates
  ] = await Promise.all([
    // Count clients with email (all clients have email, so count all)
    db.client.count({
      where: { studioId }
    }),
    // Count clients with phone
    db.client.count({
      where: { studioId, phone: { not: null } }
    }),
    // Fetch automations
    db.automation.findMany({
      where: { studioId },
      include: { location: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    // Fetch campaigns
    db.campaign.findMany({
      where: { studioId },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    // Fetch templates
    db.messageTemplate.findMany({
      where: { studioId },
      orderBy: { createdAt: "desc" }
    })
  ])

  const activeAutomations = automations.filter(a => a.status === "ACTIVE").length

  const marketingData: MarketingData = {
    stats: {
      emailSubscribers,
      smsSubscribers,
      activeAutomations,
      totalAutomations: automations.length,
      campaignsCount: campaigns.length,
      campaignsSent: campaigns.filter(c => c.status === "SENT").length
    },
    automations: automations.map((a): Automation => ({
      id: a.id,
      name: a.name,
      trigger: a.trigger,
      channel: a.channel as "EMAIL" | "SMS",
      status: a.status as "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED",
      totalSent: a.totalSent,
      totalOpened: a.totalOpened,
      location: a.location
    })),
    campaigns: campaigns.map((c): Campaign => ({
      id: c.id,
      name: c.name,
      channel: c.channel as "EMAIL" | "SMS",
      status: c.status as "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "CANCELLED",
      totalRecipients: c.totalRecipients,
      sentCount: c.sentCount,
      openedCount: c.openedCount,
      clickedCount: c.clickedCount,
      scheduledAt: c.scheduledAt?.toISOString() || null,
      sentAt: c.sentAt?.toISOString() || null
    })),
    templates: templates.map((t): Template => ({
      id: t.id,
      name: t.name,
      type: t.type as "EMAIL" | "SMS",
      subject: t.subject,
      body: t.body,
      variables: (t.variables as string[]) || []
    })),
    segments: [] // Segments are dynamically generated
  }

  return <MarketingView data={marketingData} linkPrefix="/demo" />
}




