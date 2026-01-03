// Demo Marketing Page - Mirrors /studio/marketing/page.tsx
// Keep in sync with the real marketing page

"use client"

import { useState } from "react"
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
  Instagram
} from "lucide-react"
import { demoAutomations, demoClients } from "../_data/demo-data"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Gift,
  Bell,
  Sparkles,
}

// Demo campaigns
const demoCampaigns = [
  { id: "1", name: "December Holiday Special", channel: "EMAIL", status: "SENT", totalRecipients: 156, sentCount: 156, openedCount: 89, clickedCount: 34, sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "2", name: "New Year Classes Promo", channel: "EMAIL", status: "SCHEDULED", totalRecipients: 203, sentCount: 0, openedCount: 0, clickedCount: 0, scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "3", name: "Flash Sale Weekend", channel: "SMS", status: "DRAFT", totalRecipients: 89, sentCount: 0, openedCount: 0, clickedCount: 0 },
]

// Demo templates
const demoTemplates = [
  { id: "1", name: "Welcome Email", type: "EMAIL", subject: "Welcome to Align Pilates! 🎉", body: "Hi {{firstName}}, welcome to our studio!", variables: ["firstName", "lastName"] },
  { id: "2", name: "Class Reminder", type: "EMAIL", subject: "Your class is tomorrow!", body: "Hi {{firstName}}, just a reminder...", variables: ["firstName", "className", "classTime"] },
  { id: "3", name: "Win-back Message", type: "EMAIL", subject: "We miss you!", body: "Hi {{firstName}}, it's been a while...", variables: ["firstName", "daysSinceLastVisit"] },
  { id: "4", name: "Birthday Greeting", type: "SMS", subject: null, body: "Happy Birthday {{firstName}}! 🎂", variables: ["firstName"] },
]

// Demo segments
const demoSegments = [
  { id: "all", name: "All Subscribers", description: "Everyone who has opted in to marketing", type: "dynamic", icon: Users, iconBg: "bg-gray-100", conditions: [] },
  { id: "active", name: "Active Clients", description: "Clients who booked in the last 30 days", type: "dynamic", icon: Star, iconBg: "bg-emerald-50", conditions: ["Last booking within 30 days"] },
  { id: "inactive", name: "Inactive Clients", description: "Clients who haven't booked in 30+ days", type: "dynamic", icon: UserMinus, iconBg: "bg-orange-50", conditions: ["No booking in last 30 days"] },
  { id: "new", name: "New Clients", description: "Clients who joined in the last 30 days", type: "dynamic", icon: Sparkles, iconBg: "bg-violet-50", conditions: ["Signed up within 30 days"] },
  { id: "vip", name: "VIP Clients", description: "Clients with 10+ bookings", type: "dynamic", icon: Star, iconBg: "bg-amber-50", conditions: ["Total bookings >= 10"] },
]

export default function DemoMarketingPage() {
  const [activeTab, setActiveTab] = useState("automations")

  const activeAutomations = demoAutomations.filter(a => a.enabled).length

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
                <p className="text-3xl font-bold text-gray-900">156</p>
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
                <p className="text-3xl font-bold text-gray-900">89</p>
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
                <p className="text-xs text-gray-400 mt-1">{demoAutomations.length} total</p>
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
                <p className="text-3xl font-bold text-gray-900">{demoCampaigns.length}</p>
                <p className="text-xs text-gray-400 mt-1">{demoCampaigns.filter(c => c.status === "SENT").length} sent</p>
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
          <TabsTrigger value="social" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Instagram className="h-4 w-4 mr-2" />
            Social Media
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
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Automation
                </Button>
              </div>

              <div className="space-y-3">
                {demoAutomations.map((automation) => {
                  const Icon = iconMap[automation.iconKey] || Zap
                  return (
                    <div key={automation.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${automation.iconBg} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{automation.title}</p>
                            <Badge variant="secondary" className={`text-xs ${
                              automation.type === "Email" 
                                ? "bg-violet-100 text-violet-700" 
                                : "bg-blue-100 text-blue-700"
                            } border-0`}>
                              {automation.type === "Email" ? (
                                <><Mail className="h-3 w-3 mr-1" /> Email</>
                              ) : (
                                <><MessageSquare className="h-3 w-3 mr-1" /> SMS</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{automation.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-50">
                          <Settings className="h-4 w-4" />
                          Configure
                          <ChevronRight className="h-4 w-4 opacity-0 -ml-1 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <Switch checked={automation.enabled} />
                      </div>
                    </div>
                  )
                })}
              </div>
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
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>

              <div className="space-y-3">
                {demoCampaigns.map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
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
                          campaign.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                          "bg-gray-100 text-gray-700"
                        }
                      >
                        {campaign.status.toLowerCase()}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
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
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Segment
                </Button>
              </div>

              <div className="space-y-3">
                {demoSegments.map((segment) => {
                  const Icon = segment.icon
                  return (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group cursor-pointer"
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
                    </div>
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
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>

              {/* Email Templates */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-500" />
                  Email Templates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {demoTemplates.filter(t => t.type === "EMAIL").map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group cursor-pointer"
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
                    </div>
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
                  {demoTemplates.filter(t => t.type === "SMS").map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-colors group cursor-pointer"
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
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Social Media Marketing</h3>
                  <p className="text-sm text-gray-500">Training, automation tools, and tracking for Instagram & TikTok</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="block p-6 bg-gradient-to-br from-pink-50 to-violet-50 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center mb-4">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Training & Content</h4>
                  <p className="text-sm text-gray-600">Video courses on content creation, hooks, storytelling, and more</p>
                </div>

                <div className="block p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Automation Tools</h4>
                  <p className="text-sm text-gray-600">Auto-reply to comments and DMs, build booking flows</p>
                </div>

                <div className="block p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Tracking & Analytics</h4>
                  <p className="text-sm text-gray-600">Track conversions from social with auto-generated links</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600">
                  Open Social Media Hub
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
