"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Globe, 
  Palette, 
  CreditCard, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  XCircle,
  RefreshCw
} from "lucide-react"

interface StripeStatus {
  connected: boolean
  configured?: boolean
  accountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  onboardingComplete: boolean
  currency?: string
  email?: string
  businessName?: string
  error?: string
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const stripeParam = searchParams.get("stripe")
  
  const [studio, setStudio] = useState<{
    name: string
    subdomain: string
    primaryColor: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [connectingStripe, setConnectingStripe] = useState(false)

  useEffect(() => {
    fetchStudioData()
    fetchStripeStatus()
  }, [])

  useEffect(() => {
    // Refresh Stripe status after onboarding
    if (stripeParam === "success" || stripeParam === "refresh") {
      fetchStripeStatus()
    }
  }, [stripeParam])

  const fetchStudioData = async () => {
    try {
      // For now, just set placeholder - you can add an API to fetch this
      // The actual values will come from the session
      setStudio({
        name: "Studio",
        subdomain: "studio",
        primaryColor: "#7c3aed"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStripeStatus = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch("/api/studio/stripe/connect")
      if (res.ok) {
        const data = await res.json()
        setStripeStatus(data)
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error)
    } finally {
      setStripeLoading(false)
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
        // Redirect to Stripe onboarding
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

  const handleDisconnectStripe = async () => {
    if (!confirm("Are you sure you want to disconnect your Stripe account? You won't be able to accept payments until you reconnect.")) {
      return
    }

    try {
      const res = await fetch("/api/studio/stripe/connect", {
        method: "DELETE",
      })
      
      if (res.ok) {
        await fetchStripeStatus()
      } else {
        alert("Failed to disconnect Stripe")
      }
    } catch (error) {
      console.error("Error disconnecting Stripe:", error)
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

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your studio settings</p>
      </div>

      {/* Success/Refresh message from Stripe */}
      {stripeParam === "success" && (
        <div className="max-w-2xl mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <p className="text-emerald-800">Stripe account connected successfully! You can now accept payments.</p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Stripe Payments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              Payments
            </CardTitle>
            <CardDescription>
              Connect your Stripe account to accept payments from clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stripeLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking Stripe status...
              </div>
            ) : stripeStatus?.connected ? (
              <div className="space-y-4">
                {/* Connected Status */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {stripeStatus.businessName || "Stripe Account"}
                        </p>
                        <p className="text-sm text-gray-500">{stripeStatus.email}</p>
                      </div>
                    </div>
                    {stripeStatus.onboardingComplete ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Incomplete
                      </Badge>
                    )}
                  </div>

                  {/* Status details */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      {stripeStatus.chargesEnabled ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-sm text-gray-600">Accept Payments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stripeStatus.payoutsEnabled ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-sm text-gray-600">Receive Payouts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stripeStatus.detailsSubmitted ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-sm text-gray-600">Details Submitted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Currency: <span className="font-medium uppercase">{stripeStatus.currency || "USD"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!stripeStatus.onboardingComplete && (
                    <Button 
                      onClick={handleContinueOnboarding}
                      disabled={connectingStripe}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {connectingStripe ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Complete Setup
                    </Button>
                  )}
                  <Button variant="outline" onClick={fetchStripeStatus}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                  <a 
                    href="https://dashboard.stripe.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Stripe Dashboard
                    </Button>
                  </a>
                </div>

                {/* Disconnect option */}
                <div className="pt-4 border-t">
                  <button 
                    onClick={handleDisconnectStripe}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Disconnect Stripe Account
                  </button>
                </div>
              </div>
            ) : stripeStatus?.configured === false ? (
              <div className="space-y-4">
                {/* Stripe not configured on platform */}
                <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900 mb-1">Stripe Not Configured</h3>
                      <p className="text-sm text-amber-700">
                        The payment system hasn&apos;t been set up yet. Please contact your platform administrator 
                        to configure Stripe payments.
                      </p>
                      <p className="text-xs text-amber-600 mt-2">
                        Admin: Add <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> to the environment variables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Not connected */}
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Accept Payments Online</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                    Connect your Stripe account to start accepting credit card payments from your clients. 
                    Payments go directly to your bank account.
                  </p>
                  <Button 
                    onClick={handleConnectStripe}
                    disabled={connectingStripe}
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
                </div>

                {/* Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <strong>Why Stripe?</strong> Stripe is a secure payment platform used by millions of businesses. 
                    Your clients&apos; payment information is handled securely by Stripe, never stored on our servers.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Studio Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              Studio Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Studio Name</Label>
              <Input id="name" defaultValue={studio?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input id="subdomain" defaultValue={studio?.subdomain} />
                <span className="text-sm text-gray-500 whitespace-nowrap">.cadence.studio</span>
              </div>
              <p className="text-xs text-gray-500">
                Your booking page: {studio?.subdomain}.cadence.studio
              </p>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Booking Page */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" />
              Booking Page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Share your booking page with clients or embed it on your website.
            </p>
            <div className="space-y-2">
              <Label>Direct Link</Label>
              <div className="flex items-center gap-2">
                <Input 
                  readOnly 
                  value={`http://localhost:3000/${studio?.subdomain}`} 
                  className="bg-gray-50"
                />
                <Button variant="outline">Copy</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <textarea 
                readOnly
                className="w-full h-24 p-3 text-sm font-mono bg-gray-50 border rounded-lg resize-none"
                value={`<iframe src="http://localhost:3000/${studio?.subdomain}/embed" width="100%" height="600" frameborder="0"></iframe>`}
              />
              <Button variant="outline">Copy Code</Button>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-gray-400" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  id="color" 
                  defaultValue={studio?.primaryColor || "#7c3aed"} 
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input 
                  defaultValue={studio?.primaryColor || "#7c3aed"} 
                  className="w-32"
                />
              </div>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
