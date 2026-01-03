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
  Copy
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
  { id: "1", name: "Active Members", description: "Clients with bookings in last 30 days", _count: { clients: 142 }, type: "ACTIVE" },
  { id: "2", name: "At-Risk Clients", description: "No bookings in 21-60 days", _count: { clients: 34 }, type: "AT_RISK" },
  { id: "3", name: "Churned Clients", description: "No bookings in 60+ days", _count: { clients: 27 }, type: "CHURNED" },
  { id: "4", name: "VIP Clients", description: "10+ bookings per month", _count: { clients: 18 }, type: "VIP" },
]

export default function DemoMarketingPage() {
  const [activeTab, setActiveTab] = useState("automations")

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-500 mt-1">Automate client communication and engagement</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Subscribers</p>
                <p className="text-3xl font-bold text-gray-900">156</p>
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
                <p className="text-sm text-gray-500 mb-1">Active Flows</p>
                <p className="text-3xl font-bold text-gray-900">5</p>
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
                <p className="text-sm text-gray-500 mb-1">Templates</p>
                <p className="text-3xl font-bold text-gray-900">8</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm mb-6">
          <TabsTrigger value="automations" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Zap className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Send className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Filter className="h-4 w-4 mr-2" />
            Segments
          </TabsTrigger>
        </TabsList>

        {/* Automations Tab */}
        <TabsContent value="automations">
          <div className="flex items-center justify-between mb-4">
            <div />
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">Marketing Automations</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Toggle automations on/off to engage with clients automatically</p>

              <div className="space-y-4">
                {demoAutomations.map((automation) => {
                  const Icon = iconMap[automation.iconKey] || Zap
                  return (
                    <div key={automation.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${automation.iconBg} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{automation.title}</p>
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-0">
                              {automation.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{automation.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
                          <Settings className="h-4 w-4" />
                          Configure
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
          <div className="flex items-center justify-between mb-4">
            <div />
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Send className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Campaigns</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Create and manage email & SMS campaigns</p>

              <div className="space-y-4">
                {demoCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${campaign.channel === 'EMAIL' ? 'bg-blue-50' : 'bg-green-50'} flex items-center justify-center`}>
                        {campaign.channel === 'EMAIL' ? (
                          <Mail className="h-5 w-5 text-blue-600" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <Badge className={`text-xs border-0 ${
                            campaign.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                            campaign.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                            campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {campaign.status === 'SENT' && `${campaign.totalRecipients} recipients • ${Math.round(campaign.openedCount / campaign.sentCount * 100)}% opened`}
                          {campaign.status === 'SCHEDULED' && campaign.scheduledAt && `Scheduled for ${new Date(campaign.scheduledAt).toLocaleDateString()}`}
                          {campaign.status === 'DRAFT' && `${campaign.totalRecipients} recipients`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="flex items-center justify-between mb-4">
            <div />
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-teal-500" />
                <h3 className="font-semibold text-gray-900">Message Templates</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Reusable templates for campaigns and automations</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoTemplates.map((template) => (
                  <div key={template.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {template.type === 'EMAIL' ? (
                          <Mail className="h-4 w-4 text-blue-600" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        )}
                        <p className="font-medium text-gray-900">{template.name}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {template.subject && (
                      <p className="text-sm text-gray-600 mb-1">{template.subject}</p>
                    )}
                    <p className="text-sm text-gray-500 truncate">{template.body}</p>
                    <div className="flex gap-1 mt-2">
                      {template.variables.slice(0, 3).map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments">
          <div className="flex items-center justify-between mb-4">
            <div />
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              New Segment
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Filter className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Client Segments</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Target specific groups of clients</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoSegments.map((segment) => (
                  <div key={segment.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {segment.type === 'ACTIVE' && <Star className="h-4 w-4 text-emerald-500" />}
                        {segment.type === 'AT_RISK' && <Clock className="h-4 w-4 text-amber-500" />}
                        {segment.type === 'CHURNED' && <UserMinus className="h-4 w-4 text-red-500" />}
                        {segment.type === 'VIP' && <Sparkles className="h-4 w-4 text-violet-500" />}
                        <p className="font-medium text-gray-900">{segment.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {segment._count.clients}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{segment.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}























