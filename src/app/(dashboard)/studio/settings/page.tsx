"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { EMBED_FONT_OPTIONS, EmbedFontKey, isEmbedFontKey } from "@/lib/embed-fonts"
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
  ChevronRight,
  Settings,
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
const COUNTRY_OPTIONS = ["IE", "UK", "US"] as const

type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]
type CountryCode = (typeof COUNTRY_OPTIONS)[number]

type StudioSettings = {
  name: string
  subdomain: string
  primaryColor: string
  logoUrl: string | null
  logoScale: number
  currency: CurrencyCode
  requiresClassSwapApproval: boolean
  invoicesEnabled: boolean
  employeesEnabled: boolean
  timeOffEnabled: boolean
  country: CountryCode
  timeOffPolicy: {
    annualLeaveWeeks: number
    paidSickDaysPerYear: number
    workingDaysPerWeek: number
  }
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const stripeParam = searchParams.get("stripe")
  
  const [studio, setStudio] = useState<StudioSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStudio, setSavingStudio] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [activeTemplates, setActiveTemplates] = useState(0)
  const [baseUrl, setBaseUrl] = useState("")
  const [embedFont, setEmbedFont] = useState<EmbedFontKey>("inter")
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

  useEffect(() => {
    if (!studio?.subdomain || typeof window === "undefined") return
    window.localStorage.setItem(`embed-font:${studio.subdomain}`, embedFont)
  }, [studio?.subdomain, embedFont])

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
        const storedFont =
          typeof window !== "undefined" ? window.localStorage.getItem(`embed-font:${data.subdomain}`) : null
        if (isEmbedFontKey(storedFont)) {
          setEmbedFont(storedFont)
        } else {
          setEmbedFont("inter")
        }
        setStudio({
          name: data.name,
          subdomain: data.subdomain,
          primaryColor: data.primaryColor || "#7c3aed",
          logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
          logoScale: typeof data.logoScale === "number" ? data.logoScale : 100,
          currency: CURRENCY_OPTIONS.includes((data.stripeCurrency || "usd").toLowerCase())
            ? (data.stripeCurrency || "usd").toLowerCase()
            : "usd",
          requiresClassSwapApproval: data.requiresClassSwapApproval !== false,
          invoicesEnabled: data.invoicesEnabled !== false,
          employeesEnabled: data.employeesEnabled === true,
          timeOffEnabled: data.timeOffEnabled !== false,
          country: COUNTRY_OPTIONS.includes(data.country) ? data.country : "IE",
          timeOffPolicy: {
            annualLeaveWeeks: Number(data.timeOffPolicy?.annualLeaveWeeks ?? 4),
            paidSickDaysPerYear: Number(data.timeOffPolicy?.paidSickDaysPerYear ?? 5),
            workingDaysPerWeek: Number(data.timeOffPolicy?.workingDaysPerWeek ?? 5),
          },
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
          logoUrl: studio.logoUrl,
          logoScale: studio.logoScale,
          currency: studio.currency,
          requiresClassSwapApproval: studio.requiresClassSwapApproval,
          invoicesEnabled: studio.invoicesEnabled,
          employeesEnabled: studio.employeesEnabled,
          timeOffEnabled: studio.timeOffEnabled,
          country: studio.country,
          timeOffPolicy: studio.timeOffPolicy,
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
        logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
        logoScale: typeof data.logoScale === "number" ? data.logoScale : prev.logoScale,
        currency: CURRENCY_OPTIONS.includes((data.stripeCurrency || "usd").toLowerCase())
          ? (data.stripeCurrency || "usd").toLowerCase()
          : "usd",
        requiresClassSwapApproval: data.requiresClassSwapApproval !== false,
        invoicesEnabled: data.invoicesEnabled !== false,
        employeesEnabled: data.employeesEnabled === true,
        timeOffEnabled: data.timeOffEnabled !== false,
        country: COUNTRY_OPTIONS.includes(data.country) ? data.country : "IE",
        timeOffPolicy: {
          annualLeaveWeeks: Number(data.timeOffPolicy?.annualLeaveWeeks ?? prev.timeOffPolicy.annualLeaveWeeks),
          paidSickDaysPerYear: Number(data.timeOffPolicy?.paidSickDaysPerYear ?? prev.timeOffPolicy.paidSickDaysPerYear),
          workingDaysPerWeek: Number(data.timeOffPolicy?.workingDaysPerWeek ?? prev.timeOffPolicy.workingDaysPerWeek),
        },
      }) : prev)
      setSaveMessage({ type: "success", text: "Studio settings saved" })
    } catch (error) {
      console.error("Error saving studio settings:", error)
      setSaveMessage({ type: "error", text: "Failed to save settings" })
    } finally {
      setSavingStudio(false)
    }
  }

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setSaveMessage({ type: "error", text: "Logo must be an image file" })
      return
    }

    setUploadingLogo(true)
    setSaveMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "studio-logos")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.url) {
        setSaveMessage({ type: "error", text: data?.error || "Failed to upload logo" })
        return
      }

      setStudio((prev) => (prev ? { ...prev, logoUrl: data.url } : prev))
      setSaveMessage({ type: "success", text: "Logo uploaded. Click Save Changes to publish it." })
    } catch (error) {
      console.error("Error uploading logo:", error)
      setSaveMessage({ type: "error", text: "Failed to upload logo" })
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const bookingEmbedCode = studio?.subdomain
    ? `<iframe id="sf-booking-embed-${studio.subdomain}" src="${baseUrl}/${studio.subdomain}/embed${embedFont !== "inter" ? `?font=${encodeURIComponent(embedFont)}` : ""}" width="100%" style="display:block;width:100%;height:1200px;min-height:1200px;border:0 !important;outline:0 !important;box-shadow:none !important;border-radius:0 !important;background:transparent !important;overflow:hidden;" frameborder="0" scrolling="no" loading="lazy" allowtransparency="true"></iframe>
<script>
(function () {
  var iframe = document.getElementById("sf-booking-embed-${studio.subdomain}");
  if (!iframe) return;
  function clearFrameChrome() {
    iframe.style.background = "transparent";
    iframe.style.border = "0";
    iframe.style.outline = "0";
    iframe.style.boxShadow = "none";
    iframe.style.borderRadius = "0";
    var parent = iframe.parentElement;
    if (parent) {
      parent.style.background = "transparent";
      parent.style.border = "0";
      parent.style.boxShadow = "none";
    }
  }
  function setFrameHeight(height) {
    iframe.style.setProperty("height", height + "px", "important");
    iframe.style.setProperty("min-height", height + "px", "important");
  }
  setFrameHeight(1200);
  clearFrameChrome();
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "sf-booking-embed-resize") return;
    var height = Math.max(900, Number(data.height) || 0);
    setFrameHeight(height);
    clearFrameChrome();
  });
})();
</script>`
    : (loading ? "Loading..." : "Please log out and log back in to refresh your session")

  const authEmbedCode = studio?.subdomain
    ? `<iframe id="sf-account-embed-${studio.subdomain}" src="${baseUrl}/${studio.subdomain}/embed/account${embedFont !== "inter" ? `?font=${encodeURIComponent(embedFont)}` : ""}" width="100%" style="display:block;width:100%;height:980px;min-height:980px;border:0 !important;outline:0 !important;box-shadow:none !important;border-radius:0 !important;background:transparent !important;overflow:hidden;" frameborder="0" scrolling="no" loading="lazy" allowtransparency="true"></iframe>
<script>
(function () {
  var iframe = document.getElementById("sf-account-embed-${studio.subdomain}");
  if (!iframe) return;
  function clearFrameChrome() {
    iframe.style.background = "transparent";
    iframe.style.border = "0";
    iframe.style.outline = "0";
    iframe.style.boxShadow = "none";
    iframe.style.borderRadius = "0";
    var parent = iframe.parentElement;
    if (parent) {
      parent.style.background = "transparent";
      parent.style.border = "0";
      parent.style.boxShadow = "none";
    }
  }
  function setFrameHeight(height) {
    iframe.style.setProperty("height", height + "px", "important");
    iframe.style.setProperty("min-height", height + "px", "important");
  }
  setFrameHeight(980);
  clearFrameChrome();
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "sf-booking-embed-resize") return;
    var height = Math.max(760, Number(data.height) || 0);
    setFrameHeight(height);
    clearFrameChrome();
  });
})();
</script>`
    : (loading ? "Loading..." : "Please log out and log back in to refresh your session")

  const brandingPreviewHeight = Math.round(32 + (((studio?.logoScale ?? 100) - 50) / 150) * 64)

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

        {/* Modules */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              Modules
            </CardTitle>
            <CardDescription>Configure workforce modules and country policy defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor="invoices-enabled">Enable Invoices</Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Show teacher contractor invoices and related review/payment flows.
                  </p>
                </div>
                <Switch
                  id="invoices-enabled"
                  checked={studio?.invoicesEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setStudio((prev) => (prev ? { ...prev, invoicesEnabled: checked } : prev))
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor="employees-enabled">Enable Employees</Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Enable Employees workspace and payroll features for staff.
                  </p>
                </div>
                <Switch
                  id="employees-enabled"
                  checked={studio?.employeesEnabled ?? false}
                  onCheckedChange={(checked) =>
                    setStudio((prev) => (prev ? { ...prev, employeesEnabled: checked } : prev))
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor="timeoff-enabled">Enable Time Off</Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Enable Time Off requests/approvals for teachers (employees and contractors).
                  </p>
                </div>
                <Switch
                  id="timeoff-enabled"
                  checked={studio?.timeOffEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setStudio((prev) => (prev ? { ...prev, timeOffEnabled: checked } : prev))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={studio?.country || "IE"}
                onValueChange={(value) => {
                  if (!COUNTRY_OPTIONS.includes(value as CountryCode)) return
                  setStudio((prev) => (prev ? { ...prev, country: value as CountryCode } : prev))
                }}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IE">Ireland</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {studio?.employeesEnabled && studio?.timeOffEnabled && (
              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">Time Off Policy</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="policy-working-days">Working Days / Week</Label>
                    <Input
                      id="policy-working-days"
                      type="number"
                      min={1}
                      max={7}
                      value={studio?.timeOffPolicy.workingDaysPerWeek ?? 5}
                      onChange={(e) =>
                        setStudio((prev) =>
                          prev
                            ? {
                                ...prev,
                                timeOffPolicy: {
                                  ...prev.timeOffPolicy,
                                  workingDaysPerWeek: Number(e.target.value || 5),
                                },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policy-annual-weeks">Annual Leave (Weeks)</Label>
                    <Input
                      id="policy-annual-weeks"
                      type="number"
                      min={0}
                      max={12}
                      step={0.5}
                      value={studio?.timeOffPolicy.annualLeaveWeeks ?? 4}
                      onChange={(e) =>
                        setStudio((prev) =>
                          prev
                            ? {
                                ...prev,
                                timeOffPolicy: {
                                  ...prev.timeOffPolicy,
                                  annualLeaveWeeks: Number(e.target.value || 0),
                                },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policy-sick-days">Paid Sick Days / Year</Label>
                    <Input
                      id="policy-sick-days"
                      type="number"
                      min={0}
                      max={365}
                      value={studio?.timeOffPolicy.paidSickDaysPerYear ?? 5}
                      onChange={(e) =>
                        setStudio((prev) =>
                          prev
                            ? {
                                ...prev,
                                timeOffPolicy: {
                                  ...prev.timeOffPolicy,
                                  paidSickDaysPerYear: Number(e.target.value || 0),
                                },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSaveStudioSettings} disabled={savingStudio} className="bg-violet-600 hover:bg-violet-700">
              {savingStudio && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
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
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor="swap-approval">Require swap approval</Label>
                  <p className="mt-1 text-xs text-gray-500">
                    When enabled, teachers must request owner approval before swapping a class with another teacher.
                  </p>
                </div>
                <Switch
                  id="swap-approval"
                  checked={studio?.requiresClassSwapApproval ?? true}
                  onCheckedChange={(checked) =>
                    setStudio((prev) =>
                      prev ? { ...prev, requiresClassSwapApproval: checked } : prev
                    )
                  }
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="embed-font">Embed Font</Label>
                <Select value={embedFont} onValueChange={(value) => {
                  if (isEmbedFontKey(value)) {
                    setEmbedFont(value)
                  }
                }}>
                  <SelectTrigger id="embed-font">
                    <SelectValue placeholder="Select embed font" />
                  </SelectTrigger>
                  <SelectContent
                    position="item-aligned"
                    className="max-h-80 overflow-y-auto overscroll-contain"
                  >
                    {EMBED_FONT_OPTIONS.map((fontOption) => (
                      <SelectItem key={fontOption.key} value={fontOption.key}>
                        {fontOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <textarea 
                readOnly
                className="w-full h-24 p-3 text-sm font-mono bg-gray-50 border rounded-lg resize-none"
                value={bookingEmbedCode}
              />
              <Button 
                variant="outline"
                onClick={() => {
                  if (studio?.subdomain) navigator.clipboard.writeText(bookingEmbedCode)
                }}
              >
                Copy Code
              </Button>
            </div>
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <Label>Account Sign-In Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={studio?.subdomain ? `${baseUrl}/${studio.subdomain}/embed/account` : (loading ? "Loading..." : "No studio found.")}
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (studio?.subdomain) {
                      navigator.clipboard.writeText(`${baseUrl}/${studio.subdomain}/embed/account`)
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Sign-In Embed Code</Label>
              <textarea
                readOnly
                className="w-full h-24 p-3 text-sm font-mono bg-gray-50 border rounded-lg resize-none"
                value={authEmbedCode}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (studio?.subdomain) navigator.clipboard.writeText(authEmbedCode)
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
              <Label htmlFor="logo-upload">Studio Logo</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {studio?.logoUrl ? (
                  <div className="rounded-lg bg-gray-50 px-3 py-4">
                    <img
                      src={studio.logoUrl}
                      alt={`${studio?.name || "Studio"} logo`}
                      className="block max-w-full object-contain"
                      style={{ height: `${brandingPreviewHeight}px`, width: "auto" }}
                    />
                  </div>
                ) : (
                  <div className="flex h-16 min-w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 text-xs font-medium text-gray-400">
                    No logo
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      void handleLogoUpload(file)
                      e.target.value = ""
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-gray-500">The logo keeps its natural aspect ratio in the sidebar.</p>
                    {uploadingLogo && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading...
                      </span>
                    )}
                  </div>
                  {studio?.logoUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="logo-scale" className="text-xs text-gray-600">
                          Logo Size
                        </Label>
                        <span className="text-xs font-medium text-gray-500">{studio.logoScale}%</span>
                      </div>
                      <input
                        id="logo-scale"
                        type="range"
                        min={50}
                        max={200}
                        step={5}
                        value={studio.logoScale}
                        onChange={(e) =>
                          setStudio((prev) =>
                            prev ? { ...prev, logoScale: Number(e.target.value) } : prev
                          )
                        }
                        className="w-full accent-violet-600"
                      />
                    </div>
                  )}
                  {studio?.logoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStudio((prev) => (prev ? { ...prev, logoUrl: null } : prev))
                        setSaveMessage({ type: "success", text: "Logo removed. Click Save Changes to publish it." })
                      }}
                    >
                      Remove Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
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
            {saveMessage && (
              <p className={`text-sm ${saveMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {saveMessage.text}
              </p>
            )}
            <Button onClick={handleSaveStudioSettings} disabled={savingStudio} className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
