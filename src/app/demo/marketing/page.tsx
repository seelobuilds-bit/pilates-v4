// Demo Marketing Page - Mirrors /studio/marketing/page.tsx
// Keep in sync with the real marketing page

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare, Zap, FileText, Settings, TrendingUp, Gift, Bell, Sparkles } from "lucide-react"
import { demoAutomations } from "../_data/demo-data"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Gift,
  Bell,
  Sparkles,
}

export default function DemoMarketingPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-500 mt-1">Automate client communication and engagement</p>
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
      <div className="flex items-center gap-2 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-900">
          <Zap className="h-4 w-4" />
          Automations
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
          <Mail className="h-4 w-4" />
          Templates
        </button>
      </div>

      {/* Automations Card */}
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
    </div>
  )
}
