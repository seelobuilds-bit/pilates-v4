"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  RefreshCw,
  Mail,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

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

const CURRENCY_OPTIONS = ["usd", "eur", "gbp", "cad", "aud", "nzd"] as const

type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const stripeParam = searchParams.get("stripe")
  
  const [studio, setStudio] = useState<{
    name: string
    subdomain: string
    primaryColor: string
    currency: CurrencyCode
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStudio, setSavingStudio] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [activeTemplates, setActiveTemplates] = useState(0)
  const [baseUrl, setBaseUrl] = useState("")
  const [stripeLoading, setStripeLoading] = useState(false)
  const [connectingStripe, setConnectingStripe] = useState(false)

  useEffect(() => {
    fetchStudioData()
    fetchStripeStatus()
    fetchActiveTemplates()
  }, [])
  
  const fetchActiveTemplates = async () => {
    try {
      const res = await fetch("/api/studio/email-templates")
      if (res.ok) {
        const templates = await res.json()
        const activeCount = templates.filter((t: { isEnabled: boolean }) => t.isEnabled).length
        setActiveTemplates(activeCount)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  useEffect(() => {
    // Refresh Stripe status after onboarding
    if (stripeParam === "success" || stripeParam === "refresh") {
      fetchStripeStatus()
    }
  }, [stripeParam])

  const fetchStudioData = async () => {
    try {
      // Set base URL from window location or production URL
      const url = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://thecurrent.app'
      setBaseUrl(url)
      
      const res = await fetch("/api/studio/settings")
      if (res.ok) {
        const data = await res.json()
        setStudio({
          name: data.name,
          subdomain: data.subdomain,
          primaryColor: data.primaryColor || "#7c3aed",
          currency: CURRENCY_OPTIONS.includes((data.stripeCurrency || "usd").toLowerCase())
            ? (data.stripeCurrency || "usd").toLowerCase()
            : "usd"
        })
      } else if (res.status === 401) {
        // Check if logged in as wrong user type
        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()
        console.error("Studio settings 401 - Session:", session)
        console.error("You may be logged in as HQ admin instead of a studio owner")
      }
    } catch (error) {
      console.error("Error fetching studio data:", error)
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
      
      const data = await res.json()
      
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        console.error("Stripe connect error:", data)
        alert(data.error || "Failed to connect Stripe. Please try again.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to connect Stripe. Please check your connection and try again.")
    } finally {
      setConnectingStripe(false)
    }
  }

  const handleSaveStudioSettings = async () => {
    if (!studio) return

    setSavingStudio(true)
    setSaveMessage(null)

    try {
      const res = await fetch("/api/studio/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studio.name,
          primaryColor: studio.primaryColor,
          currency: studio.currency,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSaveMessage({ type: "error", text: data?.error || "Failed to save settings" })
        return
      }

      const data = await res.json()
      setStudio((prev) => prev ? ({
        ...prev,
        name: data.name,
        primaryColor: data.primaryColor || "#7c3aed",
        currency: CURRENCY_OPTIONS.includes((data.stripeCurrency || "usd").toLowerCase())
          ? (data.stripeCurrency || "usd").toLowerCase()
          : "usd",
      }) : prev)
      setSaveMessage({ type: "success", text: "Studio settings saved" })
    } catch (error) {
      console.error("Error saving studio settings:", error)
      setSaveMessage({ type: "error", text: "Failed to save settings" })
    } finally {
      setSavingStudio(false)
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
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
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
              <Input
                id="name"
                value={studio?.name || ""}
                onChange={(e) => setStudio((prev) => prev ? ({ ...prev, name: e.target.value }) : prev)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input id="subdomain" value={studio?.subdomain || ""} disabled />
                <span className="text-sm text-gray-500 whitespace-nowrap">.current.studio</span>
              </div>
              <p className="text-xs text-gray-500">
                Your booking page: {studio?.subdomain}.current.studio
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={studio?.currency || "usd"}
                onValueChange={(value) => {
                  if (!CURRENCY_OPTIONS.includes(value as CurrencyCode)) return
                  setStudio((prev) => prev ? ({ ...prev, currency: value as CurrencyCode }) : prev)
                }}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {saveMessage && (
              <p className={`text-sm ${saveMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {saveMessage.text}
              </p>
            )}
            <Button onClick={handleSaveStudioSettings} disabled={savingStudio} className="bg-violet-600 hover:bg-violet-700">
              {savingStudio && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
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
                  value={studio?.subdomain ? `${baseUrl}/${studio.subdomain}` : (loading ? "Loading..." : "No studio found. Are you logged in as a studio owner?")} 
                  className="bg-gray-50"
                />
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (studio?.subdomain) {
                      navigator.clipboard.writeText(`${baseUrl}/${studio.subdomain}`)
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <textarea 
                readOnly
                className="w-full h-24 p-3 text-sm font-mono bg-gray-50 border rounded-lg resize-none"
                value={studio?.subdomain ? `<iframe src="${baseUrl}/${studio.subdomain}/embed" width="100%" style="min-height: 700px; height: 100%; border: none;" frameborder="0" scrolling="no"></iframe>` : (loading ? "Loading..." : "Please log out and log back in to refresh your session")}
              />
              <Button 
                variant="outline"
                onClick={() => {
                  if (studio?.subdomain) {
                    navigator.clipboard.writeText(`<iframe src="${baseUrl}/${studio.subdomain}/embed" width="100%" style="min-height: 700px; height: 100%; border: none;" frameborder="0" scrolling="no"></iframe>`)
                  }
                }}
              >
                Copy Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Customize automated emails sent to your clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/studio/settings/emails">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
                <div>
                  <p className="font-medium text-gray-900">Manage Email Templates</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Booking confirmations, cancellations, payment receipts, and more
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </Link>
            <div className="mt-4">
              <div className="p-3 bg-violet-50 rounded-lg inline-block">
                <p className="text-xs text-violet-600 font-medium">Active Templates</p>
                <p className="text-2xl font-bold text-violet-700">{activeTemplates}</p>
              </div>
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
                  value={studio?.primaryColor || "#7c3aed"}
                  onChange={(e) => setStudio((prev) => prev ? ({ ...prev, primaryColor: e.target.value }) : prev)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input 
                  value={studio?.primaryColor || "#7c3aed"}
                  onChange={(e) => setStudio((prev) => prev ? ({ ...prev, primaryColor: e.target.value }) : prev)}
                  className="w-32"
                />
              </div>
            </div>
            <Button onClick={handleSaveStudioSettings} disabled={savingStudio} className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
