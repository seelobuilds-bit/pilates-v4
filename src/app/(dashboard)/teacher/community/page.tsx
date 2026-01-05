"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SubscriptionChat } from "@/components/vault/subscription-chat"
import { MessageSquare, Loader2, Users, GraduationCap, Home, Sparkles } from "lucide-react"

interface SubscriptionPlan {
  id: string
  name: string
  audience: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS"
  activeSubscribers: number
  communityChat: { id: string; isEnabled: boolean } | null
}

export default function TeacherCommunityPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const res = await fetch("/api/vault/subscription")
      if (res.ok) {
        const data = await res.json()
        const plans = data.plans || []
        setSubscriptionPlans(plans)
        
        // Auto-select the first available community (prefer Teachers community)
        const teacherPlan = plans.find((p: SubscriptionPlan) => 
          p.audience === "TEACHERS" && p.communityChat?.isEnabled
        )
        const clientPlan = plans.find((p: SubscriptionPlan) => 
          p.audience === "CLIENTS" && p.communityChat?.isEnabled
        )
        
        if (teacherPlan) {
          setSelectedPlan(teacherPlan)
        } else if (clientPlan) {
          setSelectedPlan(clientPlan)
        }
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // Teachers have automatic access to Teachers and Clients communities
  const accessiblePlans = subscriptionPlans.filter(p => 
    (p.audience === "TEACHERS" || p.audience === "CLIENTS") && p.communityChat?.isEnabled
  )

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "TEACHERS": return <GraduationCap className="h-5 w-5" />
      case "CLIENTS": return <Home className="h-5 w-5" />
      default: return <Users className="h-5 w-5" />
    }
  }

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case "TEACHERS": return "bg-blue-100 text-blue-600"
      case "CLIENTS": return "bg-emerald-100 text-emerald-600"
      default: return "bg-violet-100 text-violet-600"
    }
  }

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "TEACHERS": return "Teacher Community"
      case "CLIENTS": return "Client (At-Home) Community"
      default: return "Community"
    }
  }

  return (
    <div className="p-8 bg-gray-50/50 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        <p className="text-gray-500 mt-1">Connect with other teachers and support your clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-80px)]">
        {/* Chat Selector Sidebar */}
        <div className="space-y-4">
          {/* Info Banner */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-900">Teacher Access</p>
                  <p className="text-xs text-violet-700 mt-0.5">
                    You have access to both teacher and client communities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Communities</h3>
          
          {accessiblePlans.map(plan => (
            <Card 
              key={plan.id} 
              className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                selectedPlan?.id === plan.id 
                  ? "ring-2 ring-violet-500 bg-violet-50" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getAudienceColor(plan.audience)}`}>
                    {getAudienceIcon(plan.audience)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">{plan.name}</h4>
                    <p className="text-xs text-gray-500">{getAudienceLabel(plan.audience)}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {plan.activeSubscribers} members
                    </p>
                  </div>
                  {selectedPlan?.id === plan.id && (
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {accessiblePlans.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-900">No communities available</p>
                <p className="text-xs text-gray-500 mt-1">
                  Contact HQ to set up community chats
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Tips</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <p className="flex items-start gap-2">
                <GraduationCap className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span><strong>Teacher Chat:</strong> Connect with other instructors, share tips</span>
              </p>
              <p className="flex items-start gap-2">
                <Home className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Client Chat:</strong> Support at-home subscribers, answer questions</span>
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 h-full">
          {selectedPlan ? (
            <div className="h-full">
              <SubscriptionChat 
                planId={selectedPlan.id} 
                planName={selectedPlan.name}
                audience={selectedPlan.audience}
              />
            </div>
          ) : (
            <Card className="border-0 shadow-sm h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                <h4 className="font-medium text-gray-900 mb-1">Select a Community</h4>
                <p className="text-sm text-gray-500">
                  Choose a community from the left to join the conversation
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}











