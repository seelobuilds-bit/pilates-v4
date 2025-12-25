"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Calendar, 
  MapPin, 
  Clock, 
  LogOut, 
  User, 
  CreditCard, 
  BookOpen,
  MessageSquare,
  ShoppingBag,
  Package,
  Crown,
  Sparkles,
  Play,
  CheckCircle,
  Star,
  Loader2,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  GraduationCap,
  Home,
  Zap,
  Lock,
  AlertCircle
} from "lucide-react"

// Stripe Payment Wrapper for subscriptions
function SubscriptionPaymentWrapper({
  clientSecret,
  connectedAccountId,
  subdomain,
  paymentId,
  amount,
  planName,
  interval,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  connectedAccountId: string
  subdomain: string
  paymentId: string
  amount: number
  planName: string
  interval: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null)

  useEffect(() => {
    const promise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      { stripeAccount: connectedAccountId }
    )
    setStripePromise(promise)
  }, [connectedAccountId])

  if (!stripePromise) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading payment form...</p>
      </div>
    )
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#7c3aed',
            borderRadius: '8px',
          },
        },
      }}
    >
      <SubscriptionPaymentForm 
        subdomain={subdomain}
        paymentId={paymentId}
        amount={amount}
        planName={planName}
        interval={interval}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  )
}

// Subscription Payment Form Component
function SubscriptionPaymentForm({ 
  subdomain,
  paymentId,
  amount,
  planName,
  interval,
  onSuccess,
  onCancel,
}: { 
  subdomain: string
  paymentId: string
  amount: number
  planName: string
  interval: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePaymentSuccess(paymentIntentId: string) {
    try {
      const res = await fetch(`/api/booking/${subdomain}/confirm-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          paymentId,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to complete subscription")
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete subscription")
      setProcessing(false)
    }
  }

  async function handleExpressCheckoutConfirm() {
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || "Payment failed")
      setProcessing(false)
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })

    if (confirmError) {
      setError(confirmError.message || "Payment failed")
      setProcessing(false)
      return
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      await handlePaymentSuccess(paymentIntent.id)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })

    if (stripeError) {
      setError(stripeError.message || "Payment failed")
      setProcessing(false)
      return
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      await handlePaymentSuccess(paymentIntent.id)
    } else {
      setProcessing(false)
    }
  }

  return (
    <div>
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{planName} ({interval})</span>
          <span className="font-semibold text-gray-900">${(amount / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Express Checkout */}
      <div className="mb-4">
        <ExpressCheckoutElement 
          onConfirm={handleExpressCheckoutConfirm}
          options={{
            buttonType: {
              applePay: "subscribe",
              googlePay: "subscribe",
            },
            buttonTheme: {
              applePay: "black",
              googlePay: "black",
            },
            layout: {
              maxColumns: 2,
              maxRows: 1,
            },
          }}
        />
      </div>

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">Or pay with card</span>
        </div>
      </div>

      {/* Card Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <PaymentElement 
            options={{
              layout: "tabs",
            }}
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!stripe || processing}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Pay ${(amount / 100).toFixed(2)}
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="w-3 h-3" />
          <span>Secured by Stripe</span>
        </div>
      </form>
    </div>
  )
}

interface ClientInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  credits?: number
}

interface Booking {
  id: string
  status: string
  createdAt: string
  classSession: {
    startTime: string
    endTime: string
    classType: { name: string }
    teacher: { user: { firstName: string; lastName: string } }
    location: { name: string; address: string }
  }
}

interface Subscription {
  id: string
  status: string
  interval: string
  currentPeriodEnd: string
  plan: {
    id: string
    name: string
    audience: string
    monthlyPrice: number
    features: string[]
  }
}

interface Course {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  _count: { modules: number }
  progressPercent?: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  items: Array<{
    quantity: number
    product: { name: string }
  }>
}

interface Studio {
  id: string
  name: string
  primaryColor: string
  hasStore?: boolean
  hasVault?: boolean
  stripeEnabled?: boolean
}

interface SubscriptionPlan {
  id: string
  name: string
  audience: string
  monthlyPrice: number
  yearlyPrice: number | null
  description: string
  features: string[]
  communityChat: { id: string; isEnabled: boolean } | null
}

export default function AccountPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  
  // Auth state
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly")
  
  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Cancel subscription state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchData()
  }, [subdomain])

  async function fetchData() {
    try {
      // Get studio info
      const studioRes = await fetch(`/api/booking/${subdomain}/data`)
      if (!studioRes.ok) {
        router.push("/")
        return
      }
      const studioData = await studioRes.json()
      setStudio(studioData)

      // Check if logged in
      const meRes = await fetch(`/api/booking/${subdomain}/me`)
      if (meRes.ok) {
        const clientData = await meRes.json()
        setClient(clientData)
        setProfileForm({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          phone: clientData.phone || ""
        })

        // Fetch all client data in parallel
        const [bookingsRes, subscriptionsRes, coursesRes, plansRes, ordersRes] = await Promise.all([
          fetch(`/api/booking/${subdomain}/my-bookings`),
          fetch(`/api/booking/${subdomain}/my-subscriptions`),
          fetch(`/api/booking/${subdomain}/my-courses`),
          fetch(`/api/booking/${subdomain}/subscription-plans`),
          fetch(`/api/booking/${subdomain}/my-orders`)
        ])

        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(data)
        }

        if (subscriptionsRes.ok) {
          const data = await subscriptionsRes.json()
          setSubscriptions(data.subscriptions || [])
        }

        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setEnrolledCourses(data.courses || [])
        }

        if (plansRes.ok) {
          const data = await plansRes.json()
          setAvailablePlans(data.plans || [])
        }

        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders || [])
        }
      }
    } catch (err) {
      console.error("Error loading account:", err)
    }
    setLoading(false)
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    const endpoint = authMode === "login" 
      ? `/api/booking/${subdomain}/login`
      : `/api/booking/${subdomain}/register`

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Authentication failed")
      }

      // Reload data after login
      setAuthLoading(false)
      fetchData()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed")
      setAuthLoading(false)
    }
  }

  async function handleLogout() {
    await fetch(`/api/booking/${subdomain}/logout`, { method: "POST" })
    setClient(null)
    setBookings([])
    setSubscriptions([])
    setEnrolledCourses([])
    setOrders([])
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/booking/${subdomain}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      })

      if (res.ok) {
        const updated = await res.json()
        setClient(prev => prev ? { ...prev, ...updated } : null)
        setEditingProfile(false)
      }
    } catch (err) {
      console.error("Failed to save profile:", err)
    }
    setSavingProfile(false)
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const res = await fetch(`/api/booking/${subdomain}/my-bookings/${bookingId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status: "CANCELLED" } : b
        ))
      }
    } catch {
      alert("Failed to cancel booking")
    }
  }

  async function handleSelectPlan(plan: SubscriptionPlan, interval: "monthly" | "yearly") {
    setSelectedPlan(plan)
    setSelectedInterval(interval)
    setClientSecret(null)
    setPaymentId(null)
    setConnectedAccountId(null)
    setPaymentError(null)
    
    // Check if studio has Stripe enabled
    if (studio?.stripeEnabled) {
      setCreatingPaymentIntent(true)
      
      try {
        const res = await fetch(`/api/booking/${subdomain}/create-subscription-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan.id, interval })
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to initialize payment")
        }

        const data = await res.json()
        setClientSecret(data.clientSecret)
        setPaymentId(data.paymentId)
        setConnectedAccountId(data.connectedAccountId)
        setPaymentAmount(data.amount)
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : "Failed to initialize payment")
      }
      setCreatingPaymentIntent(false)
    } else {
      // No Stripe - free subscription (for testing)
      setPaymentAmount(interval === "yearly" ? (plan.yearlyPrice || 0) * 100 : plan.monthlyPrice * 100)
    }
    
    setShowSubscriptionModal(true)
  }

  async function handleFreeSubscribe() {
    if (!selectedPlan) return
    
    setCreatingPaymentIntent(true)
    try {
      const res = await fetch(`/api/booking/${subdomain}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, interval: selectedInterval })
      })

      if (res.ok) {
        handleSubscriptionSuccess()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to subscribe")
      }
    } catch (err) {
      console.error("Subscribe error:", err)
      alert("Failed to subscribe")
    }
    setCreatingPaymentIntent(false)
  }

  function handleSubscriptionSuccess() {
    setShowSubscriptionModal(false)
    setSelectedPlan(null)
    setClientSecret(null)
    setPaymentId(null)
    setConnectedAccountId(null)
    // Refresh data
    fetchData()
  }

  function handleCancelPayment() {
    setShowSubscriptionModal(false)
    setSelectedPlan(null)
    setClientSecret(null)
    setPaymentId(null)
    setConnectedAccountId(null)
    setPaymentError(null)
  }

  async function handleCancelSubscription() {
    if (!subscriptionToCancel) return
    
    setCancelling(true)
    try {
      const res = await fetch(`/api/booking/${subdomain}/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscriptionToCancel.id })
      })

      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        setShowCancelModal(false)
        setSubscriptionToCancel(null)
        // Update local state
        setSubscriptions(subscriptions.map(s => 
          s.id === subscriptionToCancel.id ? { ...s, status: "cancelled" } : s
        ))
      } else {
        const error = await res.json()
        alert(error.error || "Failed to cancel subscription")
      }
    } catch (err) {
      console.error("Cancel error:", err)
      alert("Failed to cancel subscription")
    }
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!studio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Studio not found</p>
      </div>
    )
  }

  const primaryColor = studio.primaryColor || "#7c3aed"

  // Not logged in - show login/register
  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href={`/${subdomain}`}>
              <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
                {studio.name}
              </h1>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                <User className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <CardTitle className="text-2xl">
                {authMode === "login" ? "Welcome Back" : "Join Us"}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                {authMode === "login" 
                  ? "Sign in to manage your bookings and subscriptions" 
                  : "Create an account to start your journey"}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAuth} className="space-y-4">
                {authError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                    {authError}
                  </div>
                )}
                {authMode === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={authForm.firstName}
                        onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={authForm.lastName}
                        onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    required
                    className="h-11"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    required
                    className="h-11"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  style={{ backgroundColor: primaryColor }}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : authMode === "login" ? "Sign In" : "Create Account"}
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600">
                  {authMode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button 
                        type="button" 
                        className="font-medium hover:underline" 
                        style={{ color: primaryColor }}
                        onClick={() => setAuthMode("register")}
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button 
                        type="button" 
                        className="font-medium hover:underline" 
                        style={{ color: primaryColor }}
                        onClick={() => setAuthMode("login")}
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(b => 
    b.status === "CONFIRMED" && new Date(b.classSession.startTime) > new Date()
  )
  const pastBookings = bookings.filter(b => 
    b.status === "COMPLETED" || b.status === "CANCELLED" || new Date(b.classSession.startTime) <= new Date()
  )

  const activeSubscriptions = subscriptions.filter(s => s.status === "active")
  const hasActiveSubscription = activeSubscriptions.length > 0
  const clientPlans = availablePlans.filter(p => p.audience === "CLIENTS")
  const teacherPlans = availablePlans.filter(p => p.audience === "TEACHERS")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${subdomain}`}>
              <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
                {studio.name}
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                    {client.firstName[0]}{client.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{client.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Banner */}
        <Card className="border-0 shadow-sm mb-8 overflow-hidden">
          <div className="p-6 md:p-8" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-1">Welcome back, {client.firstName}! 👋</h2>
                <p className="text-white/80">
                  {upcomingBookings.length > 0 
                    ? `You have ${upcomingBookings.length} upcoming class${upcomingBookings.length > 1 ? 'es' : ''}`
                    : "Ready to book your next class?"}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href={`/${subdomain}/book`}>
                  <Button className="bg-white hover:bg-gray-100" style={{ color: primaryColor }}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Class
                  </Button>
                </Link>
                {studio.hasVault && (
                  <Link href={`/${subdomain}/vault`}>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <BookOpen className="h-4 w-4 mr-2" />
                      The Vault
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
                  <p className="text-xs text-gray-500">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pastBookings.filter(b => b.status === "COMPLETED").length}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-100">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
                  <p className="text-xs text-gray-500">Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeSubscriptions.length}</p>
                  <p className="text-xs text-gray-500">Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1">
            <TabsTrigger value="bookings" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">My Courses</span>
            </TabsTrigger>
            {studio.hasStore && (
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {/* Upcoming Classes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                  Upcoming Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                            <Calendar className="h-6 w-6" style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{booking.classSession.classType.name}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(booking.classSession.startTime).toLocaleDateString()} at {new Date(booking.classSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {booking.classSession.location.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {booking.classSession.teacher.user.firstName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-100 text-green-700 border-0">Confirmed</Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-gray-400 hover:text-red-600"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">No upcoming classes</p>
                    <Link href={`/${subdomain}/book`}>
                      <Button style={{ backgroundColor: primaryColor }}>Book Your First Class</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Classes */}
            {pastBookings.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    Past Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pastBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg opacity-70">
                        <div>
                          <p className="font-medium text-gray-700">{booking.classSession.classType.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.classSession.startTime).toLocaleDateString()} • {booking.classSession.location.name}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {booking.status === "CANCELLED" ? "Cancelled" : "Completed"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {/* Active Subscriptions */}
            {activeSubscriptions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Your Active Subscriptions</h3>
                {activeSubscriptions.map(sub => (
                  <Card key={sub.id} className="border-0 shadow-sm overflow-hidden">
                    <div className="p-6" style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            {sub.plan.audience === "TEACHERS" ? (
                              <GraduationCap className="h-7 w-7 text-white" />
                            ) : (
                              <Home className="h-7 w-7 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{sub.plan.name}</h4>
                            <p className="text-sm text-gray-500">
                              {sub.interval === "yearly" ? "Annual" : "Monthly"} subscription
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-gray-600">
                            <span className="font-medium">Renews:</span> {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                          </span>
                          <span className="text-gray-600">
                            <span className="font-medium">Price:</span> ${sub.plan.monthlyPrice}/{sub.interval === "yearly" ? "year" : "month"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          onClick={() => {
                            setSubscriptionToCancel(sub)
                            setShowCancelModal(true)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      {sub.plan.features && sub.plan.features.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {sub.plan.features.slice(0, 4).map((feature, i) => (
                            <Badge key={i} variant="secondary" className="bg-white/80">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Available Plans */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {hasActiveSubscription ? "Upgrade Your Experience" : "Choose a Subscription"}
                </h3>
              </div>

              {/* At-Home Plans */}
              {clientPlans.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    At-Home Membership
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientPlans.map(plan => {
                      const isSubscribed = subscriptions.some(s => s.plan.id === plan.id && s.status === "active")
                      return (
                        <Card key={plan.id} className={`border-2 shadow-sm hover:shadow-md transition-all ${isSubscribed ? 'border-green-500 bg-green-50/30' : 'border-gray-200 hover:border-violet-300'}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                              </div>
                              {isSubscribed && (
                                <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
                              )}
                            </div>
                            <div className="mb-4">
                              <span className="text-3xl font-bold" style={{ color: primaryColor }}>${plan.monthlyPrice}</span>
                              <span className="text-gray-500">/month</span>
                              {plan.yearlyPrice && (
                                <p className="text-sm text-gray-500 mt-1">
                                  or ${plan.yearlyPrice}/year (save ${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(0)})
                                </p>
                              )}
                            </div>
                            <ul className="space-y-2 mb-6">
                              {plan.features?.slice(0, 4).map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                              {plan.communityChat?.isEnabled && (
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                  <MessageSquare className="h-4 w-4 text-violet-500 flex-shrink-0" />
                                  Community Chat Access
                                </li>
                              )}
                            </ul>
                            {!isSubscribed && (
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1"
                                  style={{ backgroundColor: primaryColor }}
                                  onClick={() => handleSelectPlan(plan, "monthly")}
                                >
                                  <Zap className="h-4 w-4 mr-2" />
                                  Monthly
                                </Button>
                                {plan.yearlyPrice && (
                                  <Button 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleSelectPlan(plan, "yearly")}
                                  >
                                    Yearly
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Teacher Plans */}
              {teacherPlans.length > 0 && (
                <div className="space-y-3 pt-4">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Teacher Training & Resources
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teacherPlans.map(plan => {
                      const isSubscribed = subscriptions.some(s => s.plan.id === plan.id && s.status === "active")
                      return (
                        <Card key={plan.id} className={`border-2 shadow-sm hover:shadow-md transition-all ${isSubscribed ? 'border-green-500 bg-green-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                              </div>
                              {isSubscribed && (
                                <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
                              )}
                            </div>
                            <div className="mb-4">
                              <span className="text-3xl font-bold text-blue-600">${plan.monthlyPrice}</span>
                              <span className="text-gray-500">/month</span>
                            </div>
                            <ul className="space-y-2 mb-6">
                              {plan.features?.slice(0, 4).map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            {!isSubscribed && (
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleSelectPlan(plan, "monthly")}
                                >
                                  <GraduationCap className="h-4 w-4 mr-2" />
                                  Monthly
                                </Button>
                                {plan.yearlyPrice && (
                                  <Button 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleSelectPlan(plan, "yearly")}
                                  >
                                    Yearly
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {clientPlans.length === 0 && teacherPlans.length === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Crown className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No subscription plans available at this time</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledCourses.map(course => (
                  <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 relative rounded-t-lg">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover rounded-t-lg" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-white/50" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            {course._count.modules} modules
                          </span>
                          {course.progressPercent !== undefined && (
                            <span>{course.progressPercent}% complete</span>
                          )}
                        </div>
                        {course.progressPercent !== undefined && (
                          <div className="h-2 bg-gray-200 rounded-full mb-4">
                            <div 
                              className="h-full bg-violet-600 rounded-full" 
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                        )}
                        <Link href={`/${subdomain}/vault/${course.slug}`}>
                          <Button className="w-full" style={{ backgroundColor: primaryColor }}>
                            <Play className="h-4 w-4 mr-2" />
                            Continue Learning
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-500 mb-6">
                    Subscribe to access exclusive courses and content
                  </p>
                  <Link href={`/${subdomain}/vault`}>
                    <Button style={{ backgroundColor: primaryColor }}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Browse The Vault
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          {studio.hasStore && (
            <TabsContent value="orders">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item{order.items.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                            <Badge variant="secondary">{order.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">Shop our exclusive merchandise</p>
                    <Link href={`/${subdomain}/store`}>
                      <Button style={{ backgroundColor: primaryColor }}>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Visit Store
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" style={{ color: primaryColor }} />
                    Profile Information
                  </CardTitle>
                  {!editingProfile && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                          {client.firstName[0]}{client.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xl font-semibold text-gray-900">{client.firstName} {client.lastName}</p>
                        <p className="text-gray-500">Member since {new Date().getFullYear()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium">{client.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium">{client.phone || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Subscription Payment Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={(open) => {
        if (!open) handleCancelPayment()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
              Subscribe to {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="py-2">
              {creatingPaymentIntent ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Initializing secure payment...</p>
                </div>
              ) : paymentError ? (
                <div className="text-center py-4">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-600 mb-4">{paymentError}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPaymentError(null)
                      handleSelectPlan(selectedPlan, selectedInterval)
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : clientSecret && connectedAccountId ? (
                <SubscriptionPaymentWrapper
                  clientSecret={clientSecret}
                  connectedAccountId={connectedAccountId}
                  subdomain={subdomain}
                  paymentId={paymentId!}
                  amount={paymentAmount}
                  planName={selectedPlan.name}
                  interval={selectedInterval}
                  onSuccess={handleSubscriptionSuccess}
                  onCancel={handleCancelPayment}
                />
              ) : !studio?.stripeEnabled ? (
                // Free subscription for testing when Stripe not enabled
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <p className="font-medium">Test Mode</p>
                    <p>Payments are not enabled. Subscribe for free to test.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{selectedPlan.name} ({selectedInterval})</span>
                      <span className="font-semibold text-gray-900">
                        ${selectedInterval === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCancelPayment} className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleFreeSubscribe}
                      disabled={creatingPaymentIntent}
                      className="flex-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {creatingPaymentIntent ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Subscribe Free
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Preparing payment form...</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Cancel Subscription
            </DialogTitle>
          </DialogHeader>
          
          {subscriptionToCancel && (
            <div className="py-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel your <strong>{subscriptionToCancel.plan.name}</strong> subscription?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> You will retain access until <strong>{new Date(subscriptionToCancel.currentPeriodEnd).toLocaleDateString()}</strong>. After that, you will lose access to subscriber-only content and community features.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCancelModal(false)
                    setSubscriptionToCancel(null)
                  }}
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Cancel Subscription
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
