import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Send,
  Users,
  Eye,
  MousePointer,
  Clock,
  Calendar,
  BarChart3
} from "lucide-react"

// Mock data - in real app would fetch from API
const campaigns: Record<string, {
  id: string
  name: string
  type: "email" | "sms" | "both"
  status: "draft" | "scheduled" | "active" | "completed"
  audience: number
  sent: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  scheduledDate?: string
  sentDate?: string
  subject?: string
  body?: string
}> = {
  "1": {
    id: "1",
    name: "Summer Promo 2024",
    type: "email",
    status: "completed",
    audience: 150,
    sent: 148,
    opened: 89,
    clicked: 34,
    bounced: 2,
    unsubscribed: 1,
    sentDate: "Dec 1, 2024 at 10:00 AM",
    subject: "☀️ Summer is here! Get 20% off all class packs",
    body: "Hi {firstName},\n\nSummer is the perfect time to refresh your practice! For a limited time, enjoy 20% off all class packs.\n\nUse code: SUMMER20\n\nBook now and start your summer transformation!\n\nSee you on the mat,\nZenith Pilates"
  },
  "2": {
    id: "2",
    name: "New Class Launch",
    type: "both",
    status: "active",
    audience: 200,
    sent: 200,
    opened: 120,
    clicked: 45,
    bounced: 0,
    unsubscribed: 2,
    sentDate: "Dec 15, 2024 at 9:00 AM",
    subject: "🎉 New Class Alert: Power Pilates is here!",
    body: "Hi {firstName},\n\nWe're excited to announce our newest class: Power Pilates!\n\nThis high-intensity class combines traditional Pilates with cardio bursts for a full-body workout.\n\nFirst class is FREE for all members. Book your spot now!\n\nSee you there,\nZenith Pilates"
  },
  "3": {
    id: "3",
    name: "Holiday Special",
    type: "sms",
    status: "scheduled",
    audience: 186,
    sent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    scheduledDate: "Dec 20, 2024 at 10:00 AM",
    body: "🎄 Holiday Special! Get 25% off gift cards this week only. Perfect for loved ones! Shop now: {bookingLink}"
  }
}

export default function CampaignDetailPage({
  params,
}: {
  params: { campaignId: string }
}) {
  const campaign = campaigns[params.campaignId]

  if (!campaign) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-500">Campaign not found</p>
          <Link href="/studio/marketing" className="text-violet-600 hover:text-violet-700 mt-4 inline-block">
            Back to Marketing
          </Link>
        </div>
      </div>
    )
  }

  const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0
  const clickRate = campaign.sent > 0 ? Math.round((campaign.clicked / campaign.sent) * 100) : 0
  const bounceRate = campaign.sent > 0 ? Math.round((campaign.bounced / campaign.sent) * 100) : 0

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing?tab=campaigns" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              campaign.type === "email" ? "bg-violet-100" : 
              campaign.type === "sms" ? "bg-blue-100" : "bg-teal-100"
            }`}>
              {campaign.type === "email" ? (
                <Mail className="h-6 w-6 text-violet-600" />
              ) : campaign.type === "sms" ? (
                <MessageSquare className="h-6 w-6 text-blue-600" />
              ) : (
                <Send className="h-6 w-6 text-teal-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge 
                  variant={
                    campaign.status === "active" ? "success" :
                    campaign.status === "scheduled" ? "secondary" :
                    campaign.status === "completed" ? "outline" : "secondary"
                  }
                >
                  {campaign.status}
                </Badge>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  {campaign.status === "scheduled" ? (
                    <>
                      <Clock className="h-4 w-4" />
                      Scheduled for {campaign.scheduledDate}
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Sent on {campaign.sentDate}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          {campaign.status === "scheduled" && (
            <div className="flex gap-3">
              <Button variant="outline">Edit</Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700">Cancel</Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {campaign.status !== "scheduled" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{campaign.sent}</p>
                  <p className="text-xs text-gray-500">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{openRate}%</p>
                  <p className="text-xs text-gray-500">Open Rate ({campaign.opened})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <MousePointer className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{clickRate}%</p>
                  <p className="text-xs text-gray-500">Click Rate ({campaign.clicked})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{bounceRate}%</p>
                  <p className="text-xs text-gray-500">Bounced ({campaign.bounced})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{campaign.unsubscribed}</p>
                  <p className="text-xs text-gray-500">Unsubscribed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Preview */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h2>
              
              {(campaign.type === "email" || campaign.type === "both") && campaign.subject && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Email Subject</p>
                  <p className="font-medium text-gray-900 p-3 bg-gray-50 rounded-lg">{campaign.subject}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  {campaign.type === "sms" ? "SMS Message" : "Email Body"}
                </p>
                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-700 text-sm font-mono">
                  {campaign.body}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium text-gray-900 capitalize">{campaign.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Audience Size</p>
                  <p className="font-medium text-gray-900">{campaign.audience} recipients</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge 
                    variant={
                      campaign.status === "active" ? "success" :
                      campaign.status === "scheduled" ? "secondary" :
                      campaign.status === "completed" ? "outline" : "secondary"
                    }
                    className="mt-1"
                  >
                    {campaign.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaign.status !== "scheduled" && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Delivery Rate</span>
                    <span className="font-medium text-gray-900">
                      {campaign.audience > 0 ? Math.round((campaign.sent / campaign.audience) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Open Rate</span>
                    <span className="font-medium text-gray-900">{openRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Click Rate</span>
                    <span className="font-medium text-gray-900">{clickRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Bounce Rate</span>
                    <span className="font-medium text-gray-900">{bounceRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
