"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ConnectPayments,
  ConnectPayouts,
  ConnectBalances,
  ConnectNotificationBanner,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js"
import { loadConnectAndInitialize } from "@stripe/connect-js"
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Settings,
  Banknote,
  ArrowRightLeft,
  Wallet
} from "lucide-react"

interface StripeStatus {
  connected: boolean
  configured?: boolean
  accountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  onboardingComplete: boolean
}

type StripeConnectInstance = Awaited<ReturnType<typeof loadConnectAndInitialize>>

export default function PaymentsPage() {
  const router = useRouter()
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripeConnectInstance, setStripeConnectInstance] = useState<StripeConnectInstance | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "payouts">("overview")
  const [connectingStripe, setConnectingStripe] = useState(false)

  const fetchAccountSession = useCallback(async () => {
    const res = await fetch("/api/studio/stripe/account-session", {
      method: "POST",
    })
    if (!res.ok) {
      throw new Error("Failed to create account session")
    }
    const data = await res.json()
    return data.clientSecret
  }, [])

  useEffect(() => {
    fetchStripeStatus()
  }, [])

  useEffect(() => {
    if (stripeStatus?.connected && stripeStatus?.onboardingComplete) {
      initializeStripeConnect()
    }
  }, [stripeStatus])

  const fetchStripeStatus = async () => {
    try {
      const res = await fetch("/api/studio/stripe/connect")
      if (res.ok) {
        const data = await res.json()
        setStripeStatus(data)
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializeStripeConnect = async () => {
    try {
      const instance = await loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret: fetchAccountSession,
        appearance: {
          overlays: "dialog",
          variables: {
            colorPrimary: "#7c3aed",
            colorBackground: "#ffffff",
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      })
      setStripeConnectInstance(instance)
    } catch (error) {
      console.error("Error initializing Stripe Connect:", error)
    }
  }

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      const res = await fetch("/api/studio/stripe/connect", {
        method: "POST",
      })
      
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      } else {
        alert("Failed to create Stripe account")
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error)
      alert("Failed to connect Stripe")
    } finally {
      setConnectingStripe(false)
    }
  }

  const handleContinueOnboarding = async () => {
    setConnectingStripe(true)
    try {
      const res = await fetch("/api/studio/stripe/connect", {
        method: "POST",
      })
      
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setConnectingStripe(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // Not configured
  if (stripeStatus?.configured === false) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Accept payments from your clients</p>
        </div>

        <Card className="border-0 shadow-sm max-w-xl">
          <CardContent className="p-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 mb-1">Stripe Not Configured</h3>
                <p className="text-sm text-amber-700">
                  The payment system hasn&apos;t been set up yet. Please contact your platform administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not connected
  if (!stripeStatus?.connected) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Accept payments from your clients</p>
        </div>

        <Card className="border-0 shadow-sm max-w-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-violet-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start Accepting Payments</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Connect your Stripe account to start accepting credit card payments from your clients. 
              Setup takes just a few minutes.
            </p>
            <Button 
              onClick={handleConnectStripe}
              disabled={connectingStripe}
              size="lg"
              className="bg-violet-600 hover:bg-violet-700"
            >
              {connectingStripe ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Connect with Stripe
                </>
              )}
            </Button>

            <div className="mt-8 pt-6 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-500">Secure payments</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Banknote className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">Fast payouts</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <ArrowRightLeft className="h-5 w-5 text-violet-600" />
                  </div>
                  <p className="text-xs text-gray-500">All cards accepted</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Onboarding incomplete
  if (!stripeStatus.onboardingComplete) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Accept payments from your clients</p>
        </div>

        <Card className="border-0 shadow-sm max-w-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Setup</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Your Stripe account is connected but setup isn&apos;t complete. 
              Finish the onboarding to start accepting payments.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs mx-auto text-left">
              <div className="flex items-center gap-2">
                {stripeStatus.chargesEnabled ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm text-gray-600">Payments</span>
              </div>
              <div className="flex items-center gap-2">
                {stripeStatus.payoutsEnabled ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm text-gray-600">Payouts</span>
              </div>
              <div className="flex items-center gap-2">
                {stripeStatus.detailsSubmitted ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm text-gray-600">Details</span>
              </div>
            </div>

            <Button 
              onClick={handleContinueOnboarding}
              disabled={connectingStripe}
              size="lg"
              className="bg-violet-600 hover:bg-violet-700"
            >
              {connectingStripe ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Continue Setup
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Connected - show dashboard
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Manage your payments and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/studio/settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "overview" 
              ? "bg-violet-600 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Wallet className="h-4 w-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "payments" 
              ? "bg-violet-600 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <CreditCard className="h-4 w-4 inline mr-2" />
          Payments
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "payouts" 
              ? "bg-violet-600 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Banknote className="h-4 w-4 inline mr-2" />
          Payouts
        </button>
      </div>

      {stripeConnectInstance ? (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          {/* Notification Banner */}
          <div className="mb-6">
            <ConnectNotificationBanner />
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Balance */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-gray-400" />
                    Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConnectBalances />
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConnectPayments />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "payments" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  All Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConnectPayments />
              </CardContent>
            </Card>
          )}

          {activeTab === "payouts" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-gray-400" />
                  Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConnectPayouts />
              </CardContent>
            </Card>
          )}
        </ConnectComponentsProvider>
      ) : (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      )}
    </div>
  )
}
