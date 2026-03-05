"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Mail,
  MessageSquare,
  Sparkles,
  Trophy,
  Check,
  ChevronDown,
  Star,
  Play,
  ArrowRight,
  Clock,
  Heart,
  TrendingUp,
  Target,
  Gift,
  Zap,
  Shield,
  Menu,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react"

// UGC Video Testimonials
const ugcVideos = [
  { 
    hook: "I got 23 clients back in one month with zero effort", 
    creator: "Sarah Chen",
    studio: "Align Pilates",
    location: "San Francisco",
    verified: true,
  },
  { 
    hook: "POV: You finally found software that just works", 
    creator: "Jess Martinez",
    studio: "Flow State Yoga", 
    location: "Austin",
    verified: true,
  },
  { 
    hook: "Switching from Mindbody was the best decision ever", 
    creator: "Amanda Foster",
    studio: "Pure Movement",
    location: "Denver",
    verified: true,
  },
  { 
    hook: "My teachers actually love checking their dashboards now", 
    creator: "Rachel Kim",
    studio: "The Pilates Room",
    location: "Seattle",
    verified: true,
  },
  { 
    hook: "No more spreadsheets. No more chaos. Just flow.", 
    creator: "Michelle Torres",
    studio: "Breathe Studio",
    location: "Miami",
    verified: true,
  },
]

// Written testimonials
const testimonials = [
  {
    quote: "We reduced no-shows by 40% with automated reminders. That alone pays for CURRENT twice over.",
    author: "Sarah Chen",
    role: "Owner",
    studio: "Align Pilates, SF",
    metric: "40% fewer no-shows",
    avatar: "SC"
  },
  {
    quote: "I was spending 15 hours a week on admin. Now it's maybe 2. I actually teach again.",
    author: "Jessica Martinez",
    role: "Owner & Instructor",
    studio: "Flow State, Austin",
    metric: "13 hrs saved weekly",
    avatar: "JM"
  },
  {
    quote: "The win-back emails brought 34 clients back in the first month. I didn't send a single one manually.",
    author: "Amanda Foster",
    role: "Studio Manager",
    studio: "Pure Movement, Denver",
    metric: "34 clients recovered",
    avatar: "AF"
  },
  {
    quote: "My instructors compete on the leaderboard now. Class quality went up because everyone wants to be #1.",
    author: "David Park",
    role: "Senior Instructor",
    studio: "Core Studio, LA",
    metric: "Top performer 3x",
    avatar: "DP"
  },
  {
    quote: "Setup took 48 hours. They migrated everything from Mindbody. I just had to approve.",
    author: "Rachel Kim",
    role: "Owner",
    studio: "The Pilates Room, Seattle",
    metric: "48hr migration",
    avatar: "RK"
  },
  {
    quote: "The reporting tells me exactly which clients are about to leave. I reach out before they do.",
    author: "Michelle Torres",
    role: "Multi-Studio Owner",
    studio: "Breathe Studio, Miami",
    metric: "23% less churn",
    avatar: "MT"
  },
]

// FAQ Data
const faqs = [
  {
    question: "How fast can I get started?",
    answer: "Most studios are live within 48 hours. We handle everything: importing your clients, setting up your schedule, configuring automations. You just review and approve."
  },
  {
    question: "I'm on Mindbody. Is switching a nightmare?",
    answer: "The opposite. We've migrated dozens of studios from Mindbody, WellnessLiving, and others. We handle the full data transfer — clients, history, memberships — so nothing gets lost. Most owners tell us they wish they'd switched sooner."
  },
  {
    question: "I'm not technical. Will I be able to use this?",
    answer: "If you can scroll Instagram, you can use CURRENT. It's designed for studio owners, not engineers. And our support team is available 24/7 via chat if you ever get stuck."
  },
  {
    question: "What does it cost?",
    answer: "Simple, transparent pricing based on your studio size. No hidden fees, no per-booking charges, no lock-in contracts. Book a demo and we'll build you a custom quote."
  },
  {
    question: "Can my teachers see their own performance?",
    answer: "Yes! Each teacher gets their own dashboard with revenue contribution, client retention, class fill rates, and attendance trends. It's motivating for them and transparent for you."
  },
  {
    question: "Do my clients need to download an app?",
    answer: "Nope. Your booking page works beautifully on any device. Clients book and pay in seconds, no app required. (We're building custom branded apps for studios that want them.)"
  },
  {
    question: "What kind of support do you offer?",
    answer: "24/7 live chat with real humans who understand studios. Average response time: under 2 minutes. Plus onboarding calls, video tutorials, and a full knowledge base."
  },
  {
    question: "Can I see it before I commit?",
    answer: "Absolutely. Book a demo and we'll show you CURRENT with your actual use case. No pressure, no commitment — just a real look at how it would work for your studio."
  },
]

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const motionEnabled = process.env.NEXT_PUBLIC_MARKETING_MOTION_ENABLED !== "0" &&
    process.env.NEXT_PUBLIC_MARKETING_MOTION_ENABLED !== "false"
  const monitoringEnabled = process.env.NEXT_PUBLIC_FRONTEND_MONITORING_DISABLED !== "1"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [demoSubmitted, setDemoSubmitted] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body

    const prevHtmlFontSize = html.style.fontSize

    html.style.fontSize = "110%"
    html.classList.add("homepage-scroll-owner")
    body.classList.add("homepage-no-scroll")

    return () => {
      html.style.fontSize = prevHtmlFontSize
      html.classList.remove("homepage-scroll-owner")
      body.classList.remove("homepage-no-scroll")
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (!motionEnabled) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(
        "section, footer, .motion-card, .motion-hero-chip, .motion-hero-title, .motion-hero-copy, .motion-hero-actions, .motion-hero-trust, header .max-w-7xl"
      )
    )

    targets.forEach((node, index) => {
      node.classList.add("motion-reveal")
      node.style.setProperty("--motion-delay", `${Math.min(index * 18, 280)}ms`)
    })

    const heroTargets = Array.from(
      root.querySelectorAll<HTMLElement>(".motion-hero-chip, .motion-hero-title, .motion-hero-copy, .motion-hero-actions, .motion-hero-trust")
    )
    heroTargets.forEach((node, index) => {
      node.style.setProperty("--motion-delay", `${index * 120}ms`)
      requestAnimationFrame(() => node.classList.add("is-visible"))
    })

    const headerShell = root.querySelector<HTMLElement>("header .max-w-7xl")
    headerShell?.classList.add("is-visible")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).classList.add("is-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    )

    targets.forEach((target) => {
      if (!target.classList.contains("is-visible")) observer.observe(target)
    })

    return () => observer.disconnect()
  }, [motionEnabled])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !motionEnabled) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    let raf = 0
    let lastScrollY = window.scrollY

    const updateParallax = () => {
      const currentY = window.scrollY
      const delta = Math.abs(currentY - lastScrollY)
      lastScrollY = currentY

      const velocityFactor = Math.min(1.8, 1 + delta * 0.015)
      const fastShift = Math.min(72, currentY * 0.085 * velocityFactor)
      const softShift = Math.min(44, currentY * 0.05 * velocityFactor)

      root.style.setProperty("--hero-parallax-fast", `${fastShift.toFixed(2)}px`)
      root.style.setProperty("--hero-parallax-soft", `${softShift.toFixed(2)}px`)
    }

    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        updateParallax()
        raf = 0
      })
    }

    updateParallax()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [motionEnabled])

  useEffect(() => {
    if (!monitoringEnabled) return

    const reportFrontendIssue = (payload: Record<string, unknown>) => {
      fetch("/api/monitoring/frontend-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          page: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {})
    }

    const onError = (event: ErrorEvent) => {
      reportFrontendIssue({
        type: "window.error",
        message: event.message?.slice(0, 500),
        source: event.filename?.slice(0, 300),
        line: event.lineno,
        column: event.colno,
        stack: typeof event.error?.stack === "string" ? event.error.stack.slice(0, 2000) : null,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || JSON.stringify(event.reason)
      reportFrontendIssue({
        type: "unhandledrejection",
        message: String(reason).slice(0, 500),
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [monitoringEnabled])

  const handleDemoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDemoLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    
    try {
      const res = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioName: formData.get("studioName"),
          contactName: `${firstName} ${lastName}`,
          contactEmail: formData.get("email"),
          interests: formData.get("message"),
          referralSource: "website"
        })
      })

      if (res.ok) {
        setDemoSubmitted(true)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to submit. Please try again.")
      }
    } catch (error) {
      console.error("Demo submission error:", error)
      alert("Failed to submit. Please try again.")
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`marketing-motion-shell min-h-screen bg-white overflow-x-hidden ${motionEnabled ? "motion-enabled" : ""}`}
    >
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <span className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent">CURRENT</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#why" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Why CURRENT</a>
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Stories</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-600">Sign In</Button>
              </Link>
              <Button 
                size="sm" 
                className="motion-shine bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 shadow-lg shadow-violet-500/25"
                onClick={() => setDemoModalOpen(true)}
              >
                Book a Demo
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="marketing-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div id="marketing-mobile-menu" className="md:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-xl">
            <nav className="flex flex-col gap-4">
              <a href="#why" className="text-gray-600 py-2">Why CURRENT</a>
              <a href="#features" className="text-gray-600 py-2">Features</a>
              <a href="#testimonials" className="text-gray-600 py-2">Stories</a>
              <a href="#faq" className="text-gray-600 py-2">FAQ</a>
              <hr className="my-2" />
              <Link href="/login" className="text-gray-600 py-2">Sign In</Link>
              <Button 
                className="motion-shine bg-gradient-to-r from-pink-500 to-violet-600 w-full"
                onClick={() => { setDemoModalOpen(true); setMobileMenuOpen(false); }}
              >
                Book a Demo
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="pt-24 pb-8 sm:pt-32 sm:pb-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="hero-blob-fast absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-slate-200/35 via-slate-100/20 to-transparent rounded-full blur-3xl" />
          <div className="hero-blob-soft absolute -top-20 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-zinc-200/24 via-zinc-100/14 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div className="motion-hero-chip inline-flex items-center gap-2 bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100/50 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span className="bg-gradient-to-r from-pink-600 to-violet-600 bg-clip-text text-transparent">
              The studio platform built for growth
            </span>
          </div>

          {/* Headline */}
          <h1 className="motion-hero-title text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
            Stop managing software.
            <br />
            <span className="hero-gradient-accent bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 bg-clip-text text-transparent">
              Start growing your studio.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="motion-hero-copy text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Bookings, payments, marketing, and reporting — all handled. 
            <span className="text-gray-900 font-medium"> You focus on teaching. We focus on everything else.</span>
          </p>

          {/* CTAs */}
          <div className="motion-hero-actions flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button 
              size="lg" 
              className="motion-shine bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 px-8 h-14 text-lg shadow-xl shadow-violet-500/25 w-full sm:w-auto"
              onClick={() => setDemoModalOpen(true)}
            >
              Book a Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/demo">
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 h-14 text-lg border-gray-200 hover:bg-gray-50 group w-full sm:w-auto"
              >
                <Play className="mr-2 h-5 w-5 text-pink-500 group-hover:scale-110 transition-transform" />
                See It in Action
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="motion-hero-trust flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              Set up in 48 hours
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              Free migration from Mindbody
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* UGC VIDEO TESTIMONIALS (right after hero) */}
      {/* ============================================ */}
      <section id="videos" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-pink-600 mb-2">Real studios. Real results.</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              See why owners are switching
            </h2>
          </div>

          {/* UGC Reels Grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
            {ugcVideos.map((video, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[200px] sm:w-auto snap-center"
              >
                <div className="motion-card bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl aspect-[9/16] relative overflow-hidden group cursor-pointer shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    {video.verified && (
                      <Badge className="bg-white/20 text-white text-xs backdrop-blur-sm border-0">
                        <Check className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-medium text-sm mb-3 leading-snug">
                      &ldquo;{video.hook}&rdquo;
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {video.creator.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{video.creator}</p>
                        <p className="text-white/60 text-xs">{video.studio}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TRUSTED BY / LOGOS */}
      {/* ============================================ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-gray-500 mb-8">Trusted by 200+ studios across the US, UK, and Australia</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {['ALIGN', 'BREATHE', 'CORE', 'FLOW STATE', 'PURE', 'REFORM'].map((name) => (
              <span key={name} className="text-xl font-bold text-gray-800 tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHY CURRENT WORKS */}
      {/* ============================================ */}
      <section id="why" className="pt-20 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-700 mb-4 px-4 py-1">Why CURRENT</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Built for studios. <br className="sm:hidden" />Not for software companies.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We&apos;ve talked to hundreds of studio owners. The problem isn&apos;t finding software — it&apos;s finding software that doesn&apos;t create more work.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="motion-card bg-gradient-to-br from-pink-50 to-white p-6 sm:p-8 rounded-3xl border border-pink-100/50 hover:shadow-xl hover:shadow-pink-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Booking that feels like you</h3>
              <p className="text-gray-600 leading-relaxed">
                Your booking lives inside your site. Same fonts. Same colours. Same vibe. Clients book seamlessly without ever knowing we&apos;re behind it. Because the best technology is invisible.
              </p>
            </div>

            {/* Card 2 */}
            <div className="motion-card bg-gradient-to-br from-violet-50 to-white p-6 sm:p-8 rounded-3xl border border-violet-100/50 hover:shadow-xl hover:shadow-violet-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Reporting that actually makes sense</h3>
              <p className="text-gray-600 leading-relaxed">
                Clean, visual and built for studio owners — not accountants. See what&apos;s working, act on it immediately, and spend less time decoding spreadsheets.
              </p>
            </div>

            {/* Card 3 */}
            <div className="motion-card bg-gradient-to-br from-amber-50 to-white p-6 sm:p-8 rounded-3xl border border-amber-100/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Your software, your way</h3>
              <p className="text-gray-600 leading-relaxed">
                Want to strip it back to bare essentials? Done. Want every metric front and centre? Also done. Current molds around how you work — not the other way around.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ============================================ */}
      {/* FEATURES GRID */}
      {/* ============================================ */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-violet-100 text-violet-700 mb-4 px-4 py-1">Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No bloat. No complexity. Just the tools that actually move the needle for your studio.
            </p>
          </div>

          {/* Core Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Calendar, title: "Clean Embed Booking", desc: "Seamless booking inside your site. No redirects. No third-party feel. Fully branded to you." },
              { icon: CreditCard, title: "Invoicing on Autopilot", desc: "Teachers pick a date range. Current generates a perfect itemised invoice. You approve. You pay. Done." },
              { icon: Users, title: "Custom App", desc: "A fully custom app for your studio on the App Store and Google Play. Your name. Your brand. Your clients connected to everything." },
              { icon: BarChart3, title: "Easy Reporting", desc: "Revenue. Retention. Teacher performance. All in one clean, readable view built for studio owners." },
              { icon: Mail, title: "Email & SMS Marketing", desc: "Simple flows. Real engagement. Clients who come back. Or let us manage it completely for you." },
              { icon: MessageSquare, title: "24/7 Support", desc: "Not “24/7” with an asterisk. Actually 24/7. We’re always on because your studio never really stops." },
            ].map((feature, i) => (
              <Card key={i} className="motion-card border-0 shadow-sm hover:shadow-lg transition-all bg-gray-50/50 hover:bg-white group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================ */}
      {/* MARKETING & RETENTION */}
      {/* ============================================ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Badge className="bg-emerald-100 text-emerald-700 mb-4 px-4 py-1">Marketing</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Social media. Finally figured out.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                TikTok and Instagram are the most powerful tools your studio has right now — most studios just don&apos;t know how to use them yet. Current changes that.
              </p>

              <div className="space-y-4">
                {[
                  { title: "Growth Academy", desc: "Structured courses teaching you and your teachers to fill classes and grow a real following" },
                  { title: "Daily Inspiration", desc: "Constantly refreshing trend library and daily hook list so you can plug in and post" },
                  { title: "Tools & Automation", desc: "Set up TikTok and Instagram campaigns inside Current, linked directly to your studio and teacher accounts" },
                  { title: "Tracking & Attribution", desc: "Know exactly where every sale came from so you can double down on what works" },
                  { title: "Teacher Commissions", desc: "Teachers earn on every subscription or product they sell. A win for them. A win for you." },
                  { title: "Live Weekly Q&As", desc: "With pilates influencers from around the world for tips, tricks and class inspiration" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{item.title}</span>
                      <span className="text-gray-600"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Card */}
            <div className="motion-card bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-gray-900">This month&apos;s growth snapshot</h4>
                <Badge className="bg-emerald-100 text-emerald-700">Live</Badge>
              </div>
              
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Classes filled</span>
                    <span className="text-2xl font-bold text-emerald-600">+340</span>
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">This month</div>
                </div>
                
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Teacher posts made</span>
                    <span className="text-2xl font-bold text-violet-600">186</span>
                  </div>
                  <div className="text-sm text-violet-600 font-medium">Via Growth Academy</div>
                </div>
                
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">New followers</span>
                    <span className="text-2xl font-bold text-pink-600">2.4k</span>
                  </div>
                  <div className="text-sm text-pink-600 font-medium">Across all teachers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* REPORTING */}
      {/* ============================================ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual Card */}
            <div className="motion-card order-2 lg:order-1 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h4 className="font-semibold text-gray-900">Weekly insights • Dec 11-17</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">The Vault has 3 courses ready to publish</p>
                    <p className="text-sm text-gray-600">
                      Start earning → <button className="text-violet-600 font-medium hover:underline">Publish now</button>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Thursday 7am is your most profitable slot</p>
                    <p className="text-sm text-gray-600">
                      Consider adding another class → <button className="text-violet-600 font-medium hover:underline">View schedule</button>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Your store made 12 sales this week</p>
                    <p className="text-sm text-gray-600">
                      Top seller this month → <button className="text-violet-600 font-medium hover:underline">See details</button>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Badge className="bg-violet-100 text-violet-700 mb-4 px-4 py-1">Reporting</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Reports that tell you what to do. Not just what happened.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Most dashboards give you charts. We give you recommendations. 
                Every insight comes with a clear next step.
              </p>

              <ul className="space-y-4">
                {[
                  "Spot at-risk clients before they churn",
                  "See which classes and teachers drive the most revenue",
                  "Get weekly summaries with specific action items",
                  "Customise your dashboard to only show what matters to you",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TEACHERS */}
      {/* ============================================ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-violet-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 mb-4 px-4 py-1">For Teachers</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              When teachers grow, your studio grows.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Give your teachers the tools, the motivation and the rewards to show up, grow and perform at their best.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="motion-card border-0 shadow-lg bg-white">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Class Flows</h3>
                <p className="text-gray-600">
                  An internal content library packed with new class styles, formats and flows. Fresh inspiration always on hand.
                </p>
              </CardContent>
            </Card>

            <Card className="motion-card border-0 shadow-lg bg-white">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/30">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Leaderboards & Prizes</h3>
                <p className="text-gray-600">
                  Compete across all studios on Current. Trips to Bali. Cash prizes. Lululemon sets. Real rewards for real growth.
                </p>
              </CardContent>
            </Card>

            <Card className="motion-card border-0 shadow-lg bg-white">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Request Training</h3>
                <p className="text-gray-600">
                  One-on-one training with expert pilates instructors or growth specialists. Any problem, solved fast.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* THE VAULT */}
      {/* ============================================ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Badge className="bg-emerald-100 text-emerald-700 mb-4 px-4 py-1">The Vault</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Your knowledge. Your empire.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                You&apos;ve spent years building expertise — The Vault turns it into a platform that earns while you sleep.
              </p>

              <div className="space-y-4">
                {[
                  "Build courses and sell them individually or as subscriptions",
                  "Sell to your clients, independent teachers or the wider pilates community",
                  "Built-in community chat for every tier — clients, teachers and studio owners",
                  "Your own platform, inside Current, completely under your brand",
                  "A brand new revenue stream that runs 24/7",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="motion-card bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-gray-900">Vault growth</h4>
                <Badge className="bg-emerald-100 text-emerald-700">Live</Badge>
              </div>

              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Active subscribers</span>
                    <span className="text-2xl font-bold text-emerald-600">128</span>
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">Growing monthly</div>
                </div>

                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Courses published</span>
                    <span className="text-2xl font-bold text-violet-600">9</span>
                  </div>
                  <div className="text-sm text-violet-600 font-medium">Earning passively</div>
                </div>

                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Community members</span>
                    <span className="text-2xl font-bold text-pink-600">460</span>
                  </div>
                  <div className="text-sm text-pink-600 font-medium">And counting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* GROW & EARN */}
      {/* ============================================ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-700 mb-4 px-4 py-1">Grow &amp; Earn</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              More revenue streams. Zero extra work.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Current isn&apos;t just software — it&apos;s an entire ecosystem built to make your studio more profitable from every angle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="motion-card bg-gradient-to-br from-pink-50 to-white p-6 sm:p-8 rounded-3xl border border-pink-100/50 hover:shadow-xl hover:shadow-pink-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Your Branded Store</h3>
              <p className="text-gray-600 leading-relaxed">
                We source the products — reformers, sets, socks — brand them in your identity and set up your shop on your website and TikTok Shop. Your teachers post. Someone orders. We fulfil from our warehouse. You earn. Zero logistics.
              </p>
            </div>

            <div className="motion-card bg-gradient-to-br from-violet-50 to-white p-6 sm:p-8 rounded-3xl border border-violet-100/50 hover:shadow-xl hover:shadow-violet-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">We Run Your Ads</h3>
              <p className="text-gray-600 leading-relaxed">
                Want us to run your social media ads too? We&apos;ve got you. And the organic content your teachers create through Growth Academy almost always makes the best ad creative anyway. Less spend. Better results.
              </p>
            </div>

            <div className="motion-card bg-gradient-to-br from-amber-50 to-white p-6 sm:p-8 rounded-3xl border border-amber-100/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Free Custom Website</h3>
              <p className="text-gray-600 leading-relaxed">
                When you join Current we build you a full custom website — designed exactly how you want it, matched perfectly to your studio&apos;s vision. No templates. No compromises. Consider it our welcome gift.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section id="testimonials" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-700 mb-4 px-4 py-1">Stories</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Studios that made the switch
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="motion-card border-0 shadow-sm hover:shadow-lg transition-all bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{t.author}</p>
                        <p className="text-gray-500 text-xs">{t.studio}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">{t.metric}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING TEASER */}
      {/* ============================================ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Simple pricing. No surprises.
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            One plan. All features. Scales with your studio. No hidden fees. No per-booking charges.
          </p>
          <Button 
            className="motion-shine bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 shadow-lg shadow-violet-500/25"
            onClick={() => setDemoModalOpen(true)}
          >
            Get Custom Quote
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-violet-100 text-violet-700 mb-4 px-4 py-1">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Questions? Answered.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="motion-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-violet-950 to-gray-900 relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to run your studio the easy way?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join hundreds of studios that simplified their operations, 
            grew their revenue, and fell back in love with their business.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 h-14 text-lg shadow-2xl w-full sm:w-auto"
              onClick={() => setDemoModalOpen(true)}
            >
              Book a Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/demo">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white px-8 h-14 text-lg w-full sm:w-auto"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              30-minute call
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              No commitment
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              Built for studios
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center mb-4 select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent">CURRENT</span>
                </span>
              </Link>
              <p className="text-gray-400 text-sm max-w-sm mb-6">
                The studio platform that lets you focus on what matters: 
                teaching, community, and growth.
              </p>
              <Button 
                className="motion-shine bg-gradient-to-r from-pink-500 to-violet-600"
                onClick={() => setDemoModalOpen(true)}
              >
                Book a Demo
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-500 text-center">
              © 2025 CURRENT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Request Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setDemoModalOpen(false); setDemoSubmitted(false); }}
          />
          
          {/* Modal */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Book demo request form"
          >
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
              onClick={() => { setDemoModalOpen(false); setDemoSubmitted(false); }}
            >
              <X className="w-5 h-5" />
            </button>

            {!demoSubmitted ? (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-violet-600 px-6 py-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Book Your Demo</h3>
                  <p className="text-white/80">
                    See how CURRENT can transform your studio in a free 30-minute call.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleDemoSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="demo-first-name">First Name</Label>
                      <Input id="demo-first-name" name="firstName" required placeholder="Sarah" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="demo-last-name">Last Name</Label>
                      <Input id="demo-last-name" name="lastName" required placeholder="Chen" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="demo-email">Work Email</Label>
                    <Input id="demo-email" name="email" type="email" required placeholder="sarah@yourstudio.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="demo-studio">Studio Name</Label>
                    <Input id="demo-studio" name="studioName" required placeholder="Align Pilates" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="demo-message">What&apos;s your biggest challenge right now? (Optional)</Label>
                    <Textarea 
                      id="demo-message" 
                      name="message" 
                      placeholder="Managing schedules, retaining clients, too much admin..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="motion-shine w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 h-12 text-lg"
                    disabled={demoLoading}
                  >
                    {demoLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Request Demo
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    We&apos;ll reach out within 24 hours to schedule your call.
                  </p>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h3>
                <p className="text-gray-600 mb-6">
                  Thanks for your interest in CURRENT. We&apos;ll reach out within 24 hours to schedule your personalized demo.
                </p>
                <Button 
                  className="motion-shine bg-gradient-to-r from-pink-500 to-violet-600"
                  onClick={() => { setDemoModalOpen(false); setDemoSubmitted(false); }}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx global>{`
        html.homepage-scroll-owner {
          overflow-y: auto !important;
        }

        body.homepage-no-scroll {
          overflow-y: hidden !important;
        }

        .brand-preview-shell,
        .marketing-motion-shell {
          overflow-y: visible !important;
        }

        .marketing-motion-shell.motion-enabled .motion-reveal {
          opacity: 0;
          transform: translate3d(0, 22px, 0) scale(0.992);
          transition:
            opacity 650ms cubic-bezier(0.2, 0.75, 0.2, 1),
            transform 650ms cubic-bezier(0.2, 0.75, 0.2, 1);
          transition-delay: var(--motion-delay, 0ms);
        }

        .marketing-motion-shell.motion-enabled .motion-reveal.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }

        .marketing-motion-shell.motion-enabled .hero-gradient-accent {
          background-size: 190% 190% !important;
          animation: marketingGradientDrift 8s ease-in-out infinite;
        }

        .marketing-motion-shell.motion-enabled .motion-card {
          transition:
            transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 280ms ease;
        }

        .marketing-motion-shell.motion-enabled .motion-card:hover {
          transform: translateY(-5px);
        }

        .marketing-motion-shell.motion-enabled .motion-shine {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .marketing-motion-shell.motion-enabled .motion-shine::after {
          content: "";
          position: absolute;
          top: -160%;
          left: -45%;
          width: 34%;
          height: 420%;
          transform: rotate(24deg) translateX(-180%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.38) 50%,
            transparent 100%
          );
          pointer-events: none;
          transition: transform 620ms ease;
          z-index: 1;
        }

        .marketing-motion-shell.motion-enabled .motion-shine:hover::after {
          transform: rotate(24deg) translateX(560%);
        }

        .marketing-motion-shell.motion-enabled .motion-shine > * {
          position: relative;
          z-index: 2;
        }

        .marketing-motion-shell.motion-enabled .motion-hero-title {
          animation: heroBreathe 5.8s ease-in-out infinite;
        }

        .marketing-motion-shell.motion-enabled .motion-hero-trust > div {
          animation: trustFloat 3.6s ease-in-out infinite;
        }

        .marketing-motion-shell.motion-enabled .motion-hero-trust > div:nth-child(2) {
          animation-delay: 180ms;
        }

        .marketing-motion-shell.motion-enabled .motion-hero-trust > div:nth-child(3) {
          animation-delay: 360ms;
        }

        .marketing-motion-shell.motion-enabled .motion-hero-chip {
          animation: heroChipFloat 4.2s ease-in-out infinite;
        }

        .marketing-motion-shell.motion-enabled .hero-blob-fast {
          transform: translate3d(0, calc(var(--hero-parallax-fast, 0px) * -1), 0);
          will-change: transform;
        }

        .marketing-motion-shell.motion-enabled .hero-blob-soft {
          transform: translate3d(0, calc(var(--hero-parallax-soft, 0px) * -1), 0);
          will-change: transform;
        }

        .marketing-motion-shell.motion-enabled nav.hidden.md\\:flex a {
          position: relative;
        }

        .marketing-motion-shell.motion-enabled nav.hidden.md\\:flex a::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -6px;
          width: 100%;
          height: 1px;
          transform-origin: left center;
          transform: scaleX(0);
          transition: transform 240ms ease;
          background: currentColor;
          opacity: 0.5;
        }

        .marketing-motion-shell.motion-enabled nav.hidden.md\\:flex a:hover::after {
          transform: scaleX(1);
        }

        @keyframes marketingGradientDrift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes heroBreathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @keyframes trustFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @keyframes heroChipFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @media (min-width: 1024px) {
          .marketing-motion-shell {
            scroll-snap-type: y proximity;
          }

          .marketing-motion-shell section {
            scroll-snap-align: start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marketing-motion-shell .motion-reveal,
          .marketing-motion-shell .motion-card,
          .marketing-motion-shell .hero-gradient-accent,
          .marketing-motion-shell .motion-shine::after,
          .marketing-motion-shell .motion-hero-title,
          .marketing-motion-shell .motion-hero-trust > div,
          .marketing-motion-shell .motion-hero-chip,
          .marketing-motion-shell .hero-blob-fast,
          .marketing-motion-shell .hero-blob-soft {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            filter: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}
