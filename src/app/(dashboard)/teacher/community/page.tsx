"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubscriptionChat } from "@/components/vault/subscription-chat"
import { MessageSquare, Loader2, Users, Lock } from "lucide-react"

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
  const [subscribedPlans, setSubscribedPlans] = useState<string[]>([])

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const res = await fetch("/api/vault/subscription")
      if (res.ok) {
        const data = await res.json()
        setSubscriptionPlans(data.plans || [])
        // For now, teachers can access all communities they're subscribed to
        // In production, check their actual subscriptions
        const teacherPlan = data.plans?.find((p: SubscriptionPlan) => 
          p.audience === "TEACHERS" && p.communityChat
        )
        if (teacherPlan) {
          setSelectedPlan(teacherPlan)
          setSubscribedPlans([teacherPlan.id])
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

  // Filter to show only teacher-relevant communities
  const teacherPlans = subscriptionPlans.filter(p => 
    p.audience === "TEACHERS" || subscribedPlans.includes(p.id)
  )

  return (
    <div className="p-8 bg-gray-50/50 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        <p className="text-gray-500 mt-1">Connect with other teachers and your studio community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-80px)]">
        {/* Chat Selector Sidebar */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Communities</h3>
          {teacherPlans.map(plan => {
            const isSubscribed = subscribedPlans.includes(plan.id) || plan.audience === "TEACHERS"
            return (
              <Card 
                key={plan.id} 
                className={`border-0 shadow-sm transition-all ${
                  isSubscribed ? "cursor-pointer" : "opacity-60"
                } ${
                  selectedPlan?.id === plan.id 
                    ? "ring-2 ring-violet-500 bg-violet-50" 
                    : isSubscribed ? "hover:bg-gray-50" : ""
                }`}
                onClick={() => isSubscribed && plan.communityChat && setSelectedPlan(plan)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.audience === "STUDIO_OWNERS" ? "bg-purple-100" :
                      plan.audience === "TEACHERS" ? "bg-blue-100" : "bg-green-100"
                    }`}>
                      <span className="text-lg">
                        {plan.audience === "STUDIO_OWNERS" ? "🏢" : plan.audience === "TEACHERS" ? "🎓" : "🏠"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{plan.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {plan.activeSubscribers} members
                      </p>
                    </div>
                    {!isSubscribed && (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                    {!plan.communityChat && (
                      <Badge variant="secondary" className="text-xs">No Chat</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {teacherPlans.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">
                  No communities available
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Subscribe to a vault plan to join
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Full Screen Chat Area */}
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
