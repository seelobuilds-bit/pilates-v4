"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  MapPin, Link2, User, Calendar, CreditCard, ChevronLeft, ChevronRight, 
  Check, Clock, RefreshCw, Sparkles, Lock, LogOut, CheckCircle, Mail, CalendarCheck, Loader2
} from "lucide-react"

const TRACKING_CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,127}$/

function normalizeTrackingCode(value: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!TRACKING_CODE_PATTERN.test(trimmed)) return null
  return trimmed
}

// Stripe Payment Wrapper - loads Stripe with connected account
function StripePaymentWrapper({
  clientSecret,
  connectedAccountId,
  subdomain,
  paymentId,
  trackingCode,
  amount,
  onSuccess,
  selectedSlot,
  selectedClass,
  selectedLocation,
}: {
  clientSecret: string
  connectedAccountId: string
  subdomain: string
  paymentId: string
  trackingCode: string | null
  amount: number
  onSuccess: (bookingData: BookingDetails) => void
  selectedSlot: TimeSlot | null
  selectedClass: ClassType | null
  selectedLocation: Location | null
}) {
  const stripePromise = useMemo(
    () =>
      loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      { stripeAccount: connectedAccountId }
      ),
    [connectedAccountId]
  )

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
      <EmbeddedPaymentForm 
        subdomain={subdomain}
        paymentId={paymentId}
        trackingCode={trackingCode}
        amount={amount}
        onSuccess={onSuccess}
        selectedSlot={selectedSlot}
        selectedClass={selectedClass}
        selectedLocation={selectedLocation}
      />
    </Elements>
  )
}

// Embedded Payment Form Component
function EmbeddedPaymentForm({ 
  subdomain,
  paymentId,
  trackingCode,
  amount,
  onSuccess,
  selectedSlot,
  selectedClass,
  selectedLocation,
}: { 
  subdomain: string
  paymentId: string
  trackingCode: string | null
  amount: number
  onSuccess: (bookingData: BookingDetails) => void
  selectedSlot: TimeSlot | null
  selectedClass: ClassType | null
  selectedLocation: Location | null
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle successful payment (shared between card and express checkout)
  async function handlePaymentSuccess(paymentIntentId: string) {
    try {
      const res = await fetch(`/api/booking/${subdomain}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          paymentId,
          trackingCode,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to complete booking")
      }

      const data = await res.json()
      
      // Call success handler
      onSuccess({
        className: selectedClass?.name || data.booking.className,
        date: selectedSlot ? new Date(selectedSlot.startTime).toLocaleDateString("en-US", { 
          weekday: "long", 
          month: "long", 
          day: "numeric" 
        }) : "",
        time: selectedSlot ? new Date(selectedSlot.startTime).toLocaleTimeString([], { 
          hour: "numeric", 
          minute: "2-digit" 
        }) : "",
        location: selectedLocation?.name || data.booking.location,
        teacher: selectedSlot ? `${selectedSlot.teacher.user.firstName} ${selectedSlot.teacher.user.lastName}` : data.booking.teacher,
        price: amount,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete booking")
      setProcessing(false)
    }
  }

  // Handle Express Checkout (Apple Pay, Google Pay, Link)
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

  // Handle regular card form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    // Confirm the payment
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
      {/* Express Checkout - Apple Pay, Google Pay, Link */}
      <div className="mb-4">
        <ExpressCheckoutElement 
          onConfirm={handleExpressCheckoutConfirm}
          options={{
            buttonType: {
              applePay: "book",
              googlePay: "book",
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!stripe || processing}
          className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-lg"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="w-3 h-3" />
          <span>Secured by Stripe</span>
        </div>
      </form>
    </div>
  )
}

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
}

interface ClassType {
  id: string
  name: string
  description: string
  duration: number
  price: number
}

interface Teacher {
  id: string
  bio?: string
  user: { firstName: string; lastName: string }
}

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  teacher: Teacher
  classType: ClassType
  location: Location
  spotsLeft: number
}

interface StudioData {
  id: string
  name: string
  primaryColor: string
  locations: Location[]
  classTypes: ClassType[]
  teachers: Teacher[]
  stripeEnabled: boolean
}

interface ClientInfo {
  id: string
  firstName: string
  lastName: string
  email: string
}

type Step = "location" | "class" | "teacher" | "time" | "checkout"
const STEPS: Step[] = ["location", "class", "teacher", "time", "checkout"]

const stepIcons = {
  location: MapPin,
  class: Link2,
  teacher: User,
  time: Calendar,
  checkout: CreditCard
}

interface BookingDetails {
  className: string
  date: string
  time: string
  location: string
  teacher: string
  price: number
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  
  // Check for payment success/cancel from URL
  const paymentSuccess = searchParams.get("success") === "true"
  const paymentCanceled = searchParams.get("canceled") === "true"
  const sessionId = searchParams.get("session_id")
  const trackingCodeFromUrl = normalizeTrackingCode(searchParams.get("sf_track"))

  const [step, setStep] = useState<Step>("location")
  const [studioData, setStudioData] = useState<StudioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [dateOffset, setDateOffset] = useState(0)

  const [bookingType, setBookingType] = useState<"single" | "recurring" | "pack">("single")
  const [packSize, setPackSize] = useState(5)
  const [autoRenew, setAutoRenew] = useState(false)

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", firstName: "", lastName: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  // Stripe embedded payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false)
  const [storedTrackingCode, setStoredTrackingCode] = useState<string | null>(null)
  const activeTrackingCode = trackingCodeFromUrl || storedTrackingCode

  useEffect(() => {
    if (typeof window === "undefined") return
    const storageKey = `social_tracking_code:${subdomain}`
    if (trackingCodeFromUrl) {
      window.sessionStorage.setItem(storageKey, trackingCodeFromUrl)
      setStoredTrackingCode(trackingCodeFromUrl)
      return
    }
    setStoredTrackingCode(normalizeTrackingCode(window.sessionStorage.getItem(storageKey)))
  }, [subdomain, trackingCodeFromUrl])

  useEffect(() => {
    if (!trackingCodeFromUrl || typeof window === "undefined") return
    const dedupeKey = `social_track_click:${subdomain}:${trackingCodeFromUrl}`
    if (window.sessionStorage.getItem(dedupeKey)) return
    window.sessionStorage.setItem(dedupeKey, "1")
    void fetch(`/api/booking/${subdomain}/track-link-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingCode: trackingCodeFromUrl })
    }).catch(() => {
      window.sessionStorage.removeItem(dedupeKey)
    })
  }, [subdomain, trackingCodeFromUrl])

  useEffect(() => {
    if ((!bookingComplete && !paymentSuccess) || typeof window === "undefined") return
    window.sessionStorage.removeItem(`social_tracking_code:${subdomain}`)
  }, [bookingComplete, paymentSuccess, subdomain])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/booking/${subdomain}/data`)
        if (!res.ok) throw new Error("Studio not found")
        const data = await res.json()
        setStudioData(data)
      } catch {
        router.push("/")
      }
      setLoading(false)
    }
    fetchData()
  }, [subdomain, router])

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`/api/booking/${subdomain}/me`)
        if (res.ok) {
          const data = await res.json()
          setClient(data)
        }
      } catch {}
    }
    checkAuth()
  }, [subdomain])

  // Handle payment success
  useEffect(() => {
    if (paymentSuccess && sessionId) {
      // Fetch booking details from session
      async function fetchBookingDetails() {
        try {
          const res = await fetch(`/api/booking/${subdomain}/session/${sessionId}`)
          if (res.ok) {
            const data = await res.json()
            setBookingDetails(data)
          }
        } catch (error) {
          console.error("Error fetching booking details:", error)
        }
        setBookingComplete(true)
      }
      fetchBookingDetails()
    }
  }, [paymentSuccess, sessionId, subdomain])

  useEffect(() => {
    if (step === "time" && selectedLocation && selectedClass) {
      fetchSlots()
    }
  }, [step, selectedLocation, selectedClass, selectedTeacher, selectedDate])

  async function fetchSlots() {
    setSlotsLoading(true)
    try {
      const searchParams = new URLSearchParams({
        locationId: selectedLocation!.id,
        classTypeId: selectedClass!.id,
        ...(selectedTeacher && { teacherId: selectedTeacher.id }),
        ...(selectedDate && { date: selectedDate })
      })
      const res = await fetch(`/api/booking/${subdomain}/slots?${searchParams}`)
      const data = await res.json()
      setTimeSlots(data)
    } catch {
      setTimeSlots([])
    }
    setSlotsLoading(false)
  }

  function getAvailableDates() {
    const dates: { date: string; label: string; subLabel?: string; isToday: boolean; isTomorrow: boolean }[] = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
      const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dates.push({
        date: dateStr,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${weekday}, ${monthDay}`,
        subLabel: i <= 1 ? undefined : undefined,
        isToday: i === 0,
        isTomorrow: i === 1
      })
    }
    return dates
  }

  const availableDates = getAvailableDates()
  const visibleDates = availableDates.slice(dateOffset, dateOffset + 5)

  function selectLocationAndContinue(loc: Location) {
    setSelectedLocation(loc)
    setStep("class")
  }

  function selectClassAndContinue(ct: ClassType) {
    setSelectedClass(ct)
    setStep("teacher")
  }

  function selectTeacherAndContinue(t: Teacher | null) {
    setSelectedTeacher(t)
    setStep("time")
  }

  function selectSlotAndContinue(slot: TimeSlot) {
    setSelectedSlot(slot)
    setStep("checkout")
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

      const data = await res.json()
      setClient(data)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed")
    }
    setAuthLoading(false)
  }

  async function handleLogout() {
    await fetch(`/api/booking/${subdomain}/logout`, { method: "POST" })
    setClient(null)
  }

  // Create PaymentIntent when user is logged in and on checkout step with Stripe enabled
  useEffect(() => {
    async function createPaymentIntent() {
      if (step !== "checkout" || !client || !selectedSlot || !studioData?.stripeEnabled || clientSecret) return
      
      setCreatingPaymentIntent(true)
      setPaymentError(null)

      try {
        const res = await fetch(`/api/booking/${subdomain}/create-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classSessionId: selectedSlot.id,
            clientEmail: client.email,
            clientFirstName: client.firstName,
            clientLastName: client.lastName,
            trackingCode: activeTrackingCode,
          })
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to initialize payment")
        }

        const data = await res.json()
        setClientSecret(data.clientSecret)
        setPaymentId(data.paymentId)
        setConnectedAccountId(data.connectedAccountId)
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : "Failed to initialize payment")
      }
      setCreatingPaymentIntent(false)
    }

    createPaymentIntent()
  }, [step, client, selectedSlot, studioData?.stripeEnabled, subdomain, clientSecret, activeTrackingCode])

  // Handle successful payment completion
  function handlePaymentSuccess(bookingData: BookingDetails) {
    setBookingDetails(bookingData)
    setBookingComplete(true)
  }

  async function handleConfirmBooking() {
    if (!selectedSlot || !client) return
    setBookingLoading(true)

    try {
      // Free booking (no Stripe) - payment handled by embedded form when Stripe is enabled
      const res = await fetch(`/api/booking/${subdomain}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: selectedSlot.id,
          bookingType,
          packSize: bookingType === "pack" ? packSize : undefined,
          autoRenew: bookingType === "pack" ? autoRenew : undefined,
          trackingCode: activeTrackingCode
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Booking failed")
      }

      router.push(`/${subdomain}/account`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Booking failed")
    }
    setBookingLoading(false)
  }

  function calculatePrice() {
    if (!selectedClass) return 0
    const base = selectedClass.price
    if (bookingType === "recurring") return base * 0.85
    if (bookingType === "pack") {
      const discount = packSize === 5 ? 0.9 : packSize === 10 ? 0.8 : 0.75
      return base * packSize * discount
    }
    return base
  }

  if (loading || !studioData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Show booking success screen
  if (bookingComplete || paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-500 mb-6">Your class has been booked successfully.</p>

            {/* Booking Details */}
            {bookingDetails ? (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <CalendarCheck className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{bookingDetails.className}</p>
                      <p className="text-sm text-gray-500">{bookingDetails.date} at {bookingDetails.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{bookingDetails.location}</p>
                      <p className="text-sm text-gray-500">with {bookingDetails.teacher}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-gray-600">Your booking details have been sent to your email.</p>
              </div>
            )}

            {/* Email Confirmation Notice */}
            <div className="flex items-center gap-2 justify-center text-sm text-gray-500 mb-6">
              <Mail className="h-4 w-4" />
              <span>A confirmation email has been sent to you</span>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={() => router.push(`/${subdomain}/account`)}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                View My Bookings
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setBookingComplete(false)
                  router.push(`/${subdomain}/book`)
                }}
                className="w-full"
              >
                Book Another Class
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show payment canceled message
  if (paymentCanceled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-amber-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Canceled</h1>
            <p className="text-gray-500 mb-6">Your payment was canceled. No charges were made.</p>

            <Button 
              onClick={() => router.push(`/${subdomain}/book`)}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStepIndex = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Book a Class</h1>
        <p className="text-gray-500 mt-1">{studioData.name}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex flex-wrap items-center justify-center gap-3 pb-6">
        {STEPS.map((s, i) => {
          const Icon = stepIcons[s]
          const isCompleted = i < currentStepIndex
          const isCurrent = i === currentStepIndex
          return (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isCompleted
                  ? "bg-violet-600 text-white"
                  : isCurrent
                  ? "bg-violet-600 text-white"
                  : "bg-white border-2 border-gray-200 text-gray-400"
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
          )
        })}
      </div>

      {/* Breadcrumb */}
      {(selectedLocation || selectedClass) && step !== "location" && (
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm">
            {selectedLocation && (
              <span className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="w-4 h-4" />
                {selectedLocation.name}
              </span>
            )}
            {selectedClass && (
              <span className="flex items-center gap-1.5 text-gray-500">
                <Link2 className="w-4 h-4" />
                {selectedClass.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Button */}
        {step !== "location" && (
          <button
            onClick={() => setStep(STEPS[currentStepIndex - 1])}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-5 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Location Step */}
        {step === "location" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Location</h2>
              </div>
              <div className="space-y-3">
                {studioData.locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => selectLocationAndContinue(loc)}
                    className="w-full p-4 border border-gray-200 rounded-2xl hover:border-violet-300 hover:bg-violet-50/30 transition-all flex items-start sm:items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{loc.name}</p>
                      <p className="text-sm text-gray-500">{loc.address}, {loc.city}, {loc.state}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Step */}
        {step === "class" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Link2 className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Class Type</h2>
              </div>
              <div className="space-y-3">
                {studioData.classTypes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => selectClassAndContinue(ct)}
                    className="w-full p-4 border border-gray-200 rounded-2xl hover:border-violet-300 hover:bg-violet-50/30 transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ct.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{ct.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {ct.duration} min
                          </span>
                          <span className="font-medium text-gray-900">${ct.price}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teacher Step */}
        {step === "teacher" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Teacher</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => selectTeacherAndContinue(null)}
                  className="w-full p-4 border border-gray-200 rounded-2xl hover:border-violet-300 hover:bg-violet-50/30 transition-all flex items-start sm:items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">Any Available Teacher</p>
                    <p className="text-sm text-gray-500">Show all available time slots</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
                {studioData.teachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTeacherAndContinue(t)}
                    className="w-full p-4 border border-gray-200 rounded-2xl hover:border-violet-300 hover:bg-violet-50/30 transition-all flex items-start sm:items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-medium shrink-0">
                        {t.user.firstName[0]}{t.user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t.user.firstName} {t.user.lastName}</p>
                        <p className="text-sm text-gray-500">{t.bio || "Certified Pilates instructor."}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Step */}
        {step === "time" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Select Date & Time</h2>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Select Date</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDateOffset(Math.max(0, dateOffset - 1))}
                    disabled={dateOffset === 0}
                    className="p-1 disabled:opacity-20 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <div className="flex gap-2 flex-1">
                    {visibleDates.map((d) => {
                      const isSelected = selectedDate === d.date
                      const dateParts = d.label.split(", ")
                      const weekday = dateParts[0]
                      const monthDay = dateParts[1] || ""
                      const month = monthDay.split(" ")[0]
                      const day = monthDay.split(" ")[1]
                      return (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          className={`flex-1 py-2 px-1 rounded-xl text-center transition-all ${
                            isSelected
                              ? "bg-violet-600 text-white"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                        >
                          {d.isToday || d.isTomorrow ? (
                            <p className="font-medium text-sm">{d.label}</p>
                          ) : (
                            <>
                              <p className="text-xs font-medium">{weekday}, {month}</p>
                              <p className="text-sm font-semibold">{day}</p>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setDateOffset(Math.min(availableDates.length - 5, dateOffset + 1))}
                    disabled={dateOffset >= availableDates.length - 5}
                    className="p-1 disabled:opacity-20 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Available Times</p>
                {slotsLoading ? (
                  <p className="text-gray-500 text-center py-8">Loading times...</p>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => selectSlotAndContinue(slot)}
                        className="py-4 px-6 border border-gray-200 rounded-2xl hover:border-violet-300 hover:bg-violet-50/30 transition-all text-center"
                      >
                        <p className="font-bold text-gray-900">
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <p className="text-sm text-gray-500">{slot.teacher.user.firstName}</p>
                        <p className="text-sm text-gray-400">{slot.spotsLeft} spots</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No classes available. Try another date.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkout Step */}
        {step === "checkout" && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Complete Booking</h2>
                </div>

                {/* Plan Selection */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Choose Your Plan</p>
                  <div className="space-y-3">
                    {/* Drop-in */}
                    <button
                      onClick={() => setBookingType("single")}
                      className={`w-full p-4 border rounded-xl transition-all flex items-center justify-between ${
                        bookingType === "single" ? "border-violet-600 bg-violet-50" : "hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          bookingType === "single" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Drop-in Class</p>
                          <p className="text-sm text-gray-500">Pay for just this class</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">${selectedClass?.price}</p>
                    </button>

                    {/* Weekly Subscription */}
                    <button
                      onClick={() => setBookingType("recurring")}
                      className={`w-full p-4 border rounded-xl transition-all ${
                        bookingType === "recurring" ? "border-violet-600 bg-violet-50" : "hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            bookingType === "recurring" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                          }`}>
                            <RefreshCw className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">Weekly Subscription</p>
                              <Badge className="bg-emerald-100 text-emerald-700 border-0">Save 15%</Badge>
                            </div>
                            <p className="text-sm text-gray-500">Same class, same time, every week</p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">${((selectedClass?.price || 0) * 0.85).toFixed(0)}<span className="text-sm font-normal text-gray-500">/week</span></p>
                      </div>
                    </button>

                    {/* Class Pack */}
                    <button
                      onClick={() => setBookingType("pack")}
                      className={`w-full p-4 border rounded-xl transition-all ${
                        bookingType === "pack" ? "border-violet-600 bg-violet-50" : "hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            bookingType === "pack" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                          }`}>
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">Class Pack</p>
                              <Badge className="bg-emerald-100 text-emerald-700 border-0">Up to 25% off</Badge>
                            </div>
                            <p className="text-sm text-gray-500">Buy classes in bulk & save</p>
                          </div>
                        </div>
                        <p className="text-sm text-violet-600 font-medium">Choose size →</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Weekly Details */}
                {bookingType === "recurring" && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-4 h-4 text-violet-600" />
                      <p className="font-medium text-gray-900">Weekly Subscription</p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-violet-600" />
                        Same class every {selectedSlot ? new Date(selectedSlot.startTime).toLocaleDateString("en-US", { weekday: "long" }) : "week"} at {selectedSlot ? new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-violet-600" />
                        Charged weekly - cancel anytime
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-violet-600" />
                        15% discount on every class
                      </p>
                    </div>
                  </div>
                )}

                {/* Pack Selection */}
                {bookingType === "pack" && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <p className="font-medium text-gray-900">Choose Your Pack</p>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[5, 10, 20].map((size) => {
                        const discount = size === 5 ? 10 : size === 10 ? 20 : 25
                        return (
                          <button
                            key={size}
                            onClick={() => setPackSize(size)}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              packSize === size ? "border-violet-600 bg-white" : "hover:border-gray-300"
                            }`}
                          >
                            <p className="font-bold text-gray-900">{size}</p>
                            <p className="text-xs text-gray-500">classes</p>
                            <p className="text-xs text-emerald-600">{discount}% off</p>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2 sm:items-center">
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Auto-renew pack</p>
                          <p className="text-xs text-gray-500">Automatically buy another when empty</p>
                        </div>
                      </div>
                      <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <p className="font-medium text-gray-900 mb-3">Order Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Class</span>
                      <span className="text-gray-900">{selectedClass?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="text-gray-900">{selectedLocation?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{bookingType === "pack" ? "First Class" : "Date & Time"}</span>
                      <span className="text-gray-900">
                        {selectedSlot && new Date(selectedSlot.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {selectedSlot && new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    {bookingType === "recurring" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Schedule</span>
                        <span className="text-gray-900">Every {selectedSlot && new Date(selectedSlot.startTime).toLocaleDateString("en-US", { weekday: "long" })}</span>
                      </div>
                    )}
                    {bookingType === "pack" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pack Size</span>
                          <span className="text-gray-900">{packSize} classes</span>
                        </div>
                        {autoRenew && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Auto-renew</span>
                            <span className="text-emerald-600">Enabled</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Instructor</span>
                      <span className="text-gray-900">{selectedSlot?.teacher.user.firstName} {selectedSlot?.teacher.user.lastName}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-500">{bookingType === "recurring" ? "Weekly Payment" : bookingType === "pack" ? `Total (${packSize} classes)` : "Total"}</span>
                      <span className="flex items-center gap-2">
                        {bookingType === "recurring" && (
                          <span className="text-gray-400 line-through">${selectedClass?.price.toFixed(2)}</span>
                        )}
                        <span className={`text-lg font-semibold ${bookingType === "recurring" ? "text-emerald-600" : "text-violet-600"}`}>${calculatePrice().toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auth / Booking */}
            {!client ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <p className="font-medium text-gray-900 mb-4">{authMode === "login" ? "Sign in to complete booking" : "Create an account"}</p>
                  <form onSubmit={handleAuth} className="space-y-4">
                    {authError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{authError}</div>}
                    {authMode === "register" && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label>First Name</Label>
                          <Input value={authForm.firstName} onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input value={authForm.lastName} onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} required />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Password</Label>
                        {authMode === "login" && (
                          <a href={`/${subdomain}/forgot-password`} className="text-xs text-violet-600 hover:underline">Forgot password?</a>
                        )}
                      </div>
                      <Input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={authLoading}>
                      {authLoading ? "Loading..." : authMode === "login" ? "Sign In" : "Create Account"}
                    </Button>
                    <p className="text-center text-sm text-gray-500">
                      {authMode === "login" ? (
                        <>Don&apos;t have an account? <button type="button" className="text-violet-600 hover:underline" onClick={() => setAuthMode("register")}>Sign up</button></>
                      ) : (
                        <>Already have an account? <button type="button" className="text-violet-600 hover:underline" onClick={() => setAuthMode("login")}>Sign in</button></>
                      )}
                    </p>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Booking As */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Booking as</p>
                      <p className="text-sm text-violet-600">{client.email}</p>
                    </div>
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <LogOut className="w-4 h-4" />
                      Change
                    </button>
                  </CardContent>
                </Card>

                {/* Payment */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-violet-600" />
                      <p className="font-medium text-gray-900">Payment Details</p>
                    </div>
                    {studioData?.stripeEnabled ? (
                      creatingPaymentIntent ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
                          <p className="text-gray-500">Initializing secure payment...</p>
                        </div>
                      ) : paymentError ? (
                        <div className="text-center py-4">
                          <p className="text-red-600 mb-2">{paymentError}</p>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setClientSecret(null)
                              setPaymentError(null)
                            }}
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : clientSecret && connectedAccountId ? (
                        <StripePaymentWrapper
                          clientSecret={clientSecret}
                          connectedAccountId={connectedAccountId}
                          subdomain={subdomain}
                          paymentId={paymentId!}
                          trackingCode={activeTrackingCode}
                          amount={calculatePrice()}
                          onSuccess={handlePaymentSuccess}
                          selectedSlot={selectedSlot}
                          selectedClass={selectedClass}
                          selectedLocation={selectedLocation}
                        />
                      ) : (
                        <div className="text-center py-4">
                          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Lock className="w-8 h-8 text-violet-600" />
                          </div>
                          <p className="text-gray-600 mb-2">Secure payment via Stripe</p>
                          <p className="text-sm text-gray-400">Card form will appear here</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-2">Payments not enabled</p>
                        <p className="text-sm text-gray-400">This studio hasn&apos;t set up payments yet. Your booking will be free.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Only show confirm button if Stripe is NOT enabled (free booking) */}
                {!studioData?.stripeEnabled && (
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-lg"
                  >
                    {bookingLoading ? "Processing..." : "Confirm Booking"}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
