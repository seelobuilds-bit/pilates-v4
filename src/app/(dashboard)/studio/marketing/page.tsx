"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Mail, 
  MessageSquare, 
  Zap, 
  FileText, 
  Settings, 
  TrendingUp, 
  Gift, 
  Bell, 
  Sparkles, 
  Plus,
  Clock,
  Send,
  ChevronRight,
  Users,
  Filter,
  Star,
  UserMinus,
  Copy,
  Loader2,
  AlertCircle
} from "lucide-react"

interface Automation {
  id: string
  name: string
  trigger: string
  channel: "EMAIL" | "SMS"
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"
  totalSent: number
  totalOpened: number
  location?: {
    id: string
    name: string
  } | null
}

interface Campaign {
  id: string
  name: string
  channel: "EMAIL" | "SMS"
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "CANCELLED"
  totalRecipients: number
  sentCount: number
  openedCount: number
  clickedCount: number
  scheduledAt?: string | null
  sentAt?: string | null
}

interface Template {
  id: string
  name: string
  type: "EMAIL" | "SMS"
  subject?: string | null
  body: string
  variables: string[]
}

// Default automation templates (for new studio)
const defaultAutomationTemplates = [
  {
    icon: TrendingUp,
    iconBg: "bg-orange-50",
    title: "Win-back 30 Days",
    trigger: "CLIENT_INACTIVE",
    description: "Re-engage clients who haven't booked in 30 days",
    emailEnabled: true,
    smsEnabled: false
  },
  {
    icon: Gift,
    iconBg: "bg-pink-50",
    title: "Birthday Message",
    trigger: "BIRTHDAY",
    description: "Celebrate clients on their special day",
    emailEnabled: true,
    smsEnabled: true
  },
  {
    icon: Bell,
    iconBg: "bg-blue-50",
    title: "Class Reminder (24h)",
    trigger: "CLASS_REMINDER",
    description: "Remind clients about upcoming class",
    emailEnabled: true,
    smsEnabled: true
  },
  {
    icon: Sparkles,
    iconBg: "bg-violet-50",
    title: "Welcome Series",
    trigger: "WELCOME",
    description: "Welcome new clients to your studio",
    emailEnabled: true,
    smsEnabled: false
  },
  {
    icon: MessageSquare,
    iconBg: "bg-teal-50",
    title: "Post-Class Follow-up",
    trigger: "CLASS_FOLLOWUP",
    description: "Thank clients after their class",
    emailEnabled: true,
    smsEnabled: false
  }
]

// Default segment types
const defaultSegments = [
  {
    id: "all",
    name: "All Subscribers",
    description: "Everyone who has opted in to marketing",
    type: "dynamic",
    icon: Users,
    iconBg: "bg-gray-100",
    conditions: []
  },
  {
    id: "active",
    name: "Active Clients",
    description: "Clients who booked in the last 30 days",
    type: "dynamic",
    icon: Star,
    iconBg: "bg-emerald-50",
    conditions: ["Last booking within 30 days"]
  },
  {
    id: "inactive",
    name: "Inactive Clients",
    description: "Clients who haven't booked in 30+ days",
    type: "dynamic",
    icon: UserMinus,
    iconBg: "bg-orange-50",
    conditions: ["No booking in last 30 days"]
  },
  {
    id: "new",
    name: "New Clients",
    description: "Clients who joined in the last 30 days",
    type: "dynamic",
    icon: Sparkles,
    iconBg: "bg-violet-50",
    conditions: ["Signed up within 30 days"]
  },
  {
    id: "vip",
    name: "VIP Clients",
    description: "Clients with 10+ bookings",
    type: "dynamic",
    icon: Star,
    iconBg: "bg-amber-50",
    conditions: ["Total bookings >= 10"]
  }
]

export default function MarketingPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTab, setActiveTab] = useState("automations")
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  
  // Stats
  const [subscriberStats, setSubscriberStats] = useState({
    email: 0,
    sms: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [automationsRes, campaignsRes, clientsRes] = await Promise.all([
        fetch('/api/studio/automations'),
        fetch('/api/studio/campaigns'),
        fetch('/api/studio/clients')
      ])

      if (automationsRes.ok) {
        const data = await automationsRes.json()
        setAutomations(data.automations || [])
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(data.campaigns || [])
      }

      if (clientsRes.ok) {
        const clients = await clientsRes.json()
        const emailCount = clients.filter((c: { email: string }) => c.email).length
        const smsCount = clients.filter((c: { phone: string | null }) => c.phone).length
        setSubscriberStats({ email: emailCount, sms: smsCount })
      }
    } catch (error) {
      console.error("Error fetching marketing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAutomation = async (automation: Automation) => {
    setToggling(automation.id)
    try {
      const action = automation.status === "ACTIVE" ? "pause" : "activate"
      const res = await fetch(`/api/studio/automations/${automation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        const data = await res.json()
        setAutomations(prev => prev.map(a => 
          a.id === automation.id ? { ...a, status: data.automation.status } : a
        ))
      }
    } catch (error) {
      console.error("Error toggling automation:", error)
    } finally {
      setToggling(null)
    }
  }

  const activeAutomations = automations.filter(a => a.status === "ACTIVE").length

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case "CLIENT_INACTIVE": return TrendingUp
      case "BIRTHDAY": return Gift
      case "CLASS_REMINDER": return Bell
      case "WELCOME": return Sparkles
      case "CLASS_FOLLOWUP": return MessageSquare
      case "BOOKING_CONFIRMED": return Clock
      default: return Zap
    }
  }

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case "CLIENT_INACTIVE": return "Client Inactive"
      case "BIRTHDAY": return "Birthday"
      case "CLASS_REMINDER": return "Class Reminder"
      case "WELCOME": return "Welcome"
      case "CLASS_FOLLOWUP": return "Post-Class"
      case "BOOKING_CONFIRMED": return "Booking Confirmed"
      case "BOOKING_CANCELLED": return "Booking Cancelled"
      case "MEMBERSHIP_EXPIRING": return "Membership Expiring"
      default: return trigger
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-500 mt-1">Automate client communication and run campaigns</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Subscribers</p>
                <p className="text-3xl font-bold text-gray-900">{subscriberStats.email}</p>
                <p className="text-xs text-gray-400 mt-1">With email address</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <Mail className="h-6 w-6 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">SMS Subscribers</p>
                <p className="text-3xl font-bold text-gray-900">{subscriberStats.sms}</p>
                <p className="text-xs text-gray-400 mt-1">With phone number</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Automations</p>
                <p className="text-3xl font-bold text-gray-900">{activeAutomations}</p>
                <p className="text-xs text-gray-400 mt-1">{automations.length} total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">{campaigns.length}</p>
                <p className="text-xs text-gray-400 mt-1">{campaigns.filter(c => c.status === "SENT").length} sent</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Send className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white shadow-sm border-0 mb-6">
          <TabsTrigger value="automations" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Zap className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Send className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Filter className="h-4 w-4 mr-2" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Automations Tab */}
        <TabsContent value="automations">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Marketing Automations</h3>
                  <p className="text-sm text-gray-500">Set up automated messages based on client behavior</p>
                </div>
                <Link href="/studio/marketing/automations/new">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Automation
                  </Button>
                </Link>
              </div>

              {automations.length > 0 ? (
                <div className="space-y-3">
                  {automations.map((automation) => {
                    const Icon = getTriggerIcon(automation.trigger)
                    return (
                      <div 
                        key={automation.id} 
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-violet-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{automation.name}</p>
                              <Badge variant="secondary" className={`text-xs ${
                                automation.channel === "EMAIL" 
                                  ? "bg-violet-100 text-violet-700" 
                                  : "bg-blue-100 text-blue-700"
                              } border-0`}>
                                {automation.channel === "EMAIL" ? (
                                  <><Mail className="h-3 w-3 mr-1" /> Email</>
                                ) : (
                                  <><MessageSquare className="h-3 w-3 mr-1" /> SMS</>
                                )}
                              </Badge>
                              {automation.location && (
                                <Badge variant="secondary" className="text-xs">
                                  {automation.location.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Trigger: {getTriggerLabel(automation.trigger)} • {automation.totalSent} sent
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Link 
                            href={`/studio/marketing/automations/${automation.id}`}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-50"
                          >
                            <Settings className="h-4 w-4" />
                            Configure
                            <ChevronRight className="h-4 w-4 opacity-0 -ml-1 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {toggling === automation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Switch 
                              checked={automation.status === "ACTIVE"}
                              onCheckedChange={() => handleToggleAutomation(automation)}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-8 bg-gray-50 rounded-xl mb-6">
                    <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No automations set up yet</p>
                    <p className="text-sm text-gray-400">Create your first automation to get started</p>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-500 mb-3">Suggested Automations:</p>
                  {defaultAutomationTemplates.map((template, idx) => {
                    const Icon = template.icon
                    return (
                      <Link
                        key={idx}
                        href={`/studio/marketing/automations/new?trigger=${template.trigger}`}
                        className="flex items-center justify-between p-4 border border-dashed border-gray-200 rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${template.iconBg} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{template.title}</p>
                              <div className="flex gap-1">
                                {template.emailEnabled && (
                                  <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 border-0">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email
                                  </Badge>
                                )}
                                {template.smsEnabled && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-0">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    SMS
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">{template.description}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 mr-1" />
                          Set Up
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Campaigns</h3>
                  <p className="text-sm text-gray-500">One-time email and SMS campaigns</p>
                </div>
                <Link href="/studio/marketing/campaigns/new">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </Link>
              </div>

              {campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <Link 
                      key={campaign.id} 
                      href={`/studio/marketing/campaigns/${campaign.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          campaign.channel === "EMAIL" ? "bg-violet-100" : "bg-blue-100"
                        }`}>
                          {campaign.channel === "EMAIL" ? (
                            <Mail className="h-5 w-5 text-violet-600" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {campaign.status === "SCHEDULED" && campaign.scheduledAt ? (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(campaign.scheduledAt).toLocaleString()}
                              </span>
                            ) : campaign.status === "SENT" ? (
                              <>
                                <span className="text-xs text-gray-500">
                                  {campaign.sentCount} sent
                                </span>
                                <span className="text-xs text-gray-500">
                                  {campaign.sentCount > 0 ? Math.round((campaign.openedCount / campaign.sentCount) * 100) : 0}% opened
                                </span>
                                <span className="text-xs text-gray-500">
                                  {campaign.sentCount > 0 ? Math.round((campaign.clickedCount / campaign.sentCount) * 100) : 0}% clicked
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {campaign.totalRecipients} recipients
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={
                            campaign.status === "SENT" ? "bg-emerald-100 text-emerald-700" :
                            campaign.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" :
                            campaign.status === "SENDING" ? "bg-amber-100 text-amber-700" :
                            campaign.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {campaign.status.toLowerCase()}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No campaigns yet</p>
                  <Link href="/studio/marketing/campaigns/new">
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      Create your first campaign
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Audience Segments</h3>
                  <p className="text-sm text-gray-500">Create and manage client segments for targeted campaigns</p>
                </div>
                <Link href="/studio/marketing/segments/new">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Segment
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {defaultSegments.map((segment) => {
                  const Icon = segment.icon
                  return (
                    <Link
                      key={segment.id}
                      href={`/studio/marketing/segments/${segment.id}`}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${segment.iconBg} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{segment.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {segment.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{segment.description}</p>
                          {segment.conditions && segment.conditions.length > 0 && (
                            <div className="flex gap-2 mt-1">
                              {segment.conditions.map((condition, i) => (
                                <span key={i} className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                                  {condition}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">--</p>
                          <p className="text-xs text-gray-500">clients</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Message Templates</h3>
                  <p className="text-sm text-gray-500">Reusable templates for campaigns and automations</p>
                </div>
                <Link href="/studio/marketing/templates/new">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </Link>
              </div>

              {templates.length > 0 ? (
                <>
                  {/* Email Templates */}
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-violet-500" />
                      Email Templates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templates.filter(t => t.type === "EMAIL").map((template) => (
                        <Link
                          key={template.id}
                          href={`/studio/marketing/templates/${template.id}`}
                          className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-gray-900">{template.name}</p>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-gray-200 rounded">
                                <Copy className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          {template.subject && (
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="text-gray-400">Subject:</span> {template.subject}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 line-clamp-2">{template.body}</p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* SMS Templates */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      SMS Templates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templates.filter(t => t.type === "SMS").map((template) => (
                        <Link
                          key={template.id}
                          href={`/studio/marketing/templates/${template.id}`}
                          className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-gray-900">{template.name}</p>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-gray-200 rounded">
                                <Copy className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">{template.body}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No templates yet</p>
                  <Link href="/studio/marketing/templates/new">
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      Create your first template
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
