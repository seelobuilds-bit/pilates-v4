"use client"

import { useState } from "react"
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
  Headphones,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [demoSubmitted, setDemoSubmitted] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

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
    <div className="min-h-screen bg-white overflow-x-hidden">
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
                className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 shadow-lg shadow-violet-500/25"
                onClick={() => setDemoModalOpen(true)}
              >
                Book a Demo
              </Button>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-xl">
            <nav className="flex flex-col gap-4">
              <a href="#why" className="text-gray-600 py-2">Why CURRENT</a>
              <a href="#features" className="text-gray-600 py-2">Features</a>
              <a href="#testimonials" className="text-gray-600 py-2">Stories</a>
              <a href="#faq" className="text-gray-600 py-2">FAQ</a>
              <hr className="my-2" />
              <Link href="/login" className="text-gray-600 py-2">Sign In</Link>
              <Button 
                className="bg-gradient-to-r from-pink-500 to-violet-600 w-full"
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
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-pink-200/40 via-violet-200/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute -top-20 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-violet-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100/50 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span className="bg-gradient-to-r from-pink-600 to-violet-600 bg-clip-text text-transparent">
              The studio platform built for growth
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
            Stop managing software.
            <br />
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 bg-clip-text text-transparent">
              Start growing your studio.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Bookings, payments, marketing, and reporting — all handled. 
            <span className="text-gray-900 font-medium"> You focus on teaching. We focus on everything else.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 px-8 h-14 text-lg shadow-xl shadow-violet-500/25 w-full sm:w-auto"
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
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
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
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl aspect-[9/16] relative overflow-hidden group cursor-pointer shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
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

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-3xl border border-pink-100/50 hover:shadow-xl hover:shadow-pink-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Done-for-you setup</h3>
              <p className="text-gray-600 leading-relaxed">
                We migrate your data, configure your schedule, and set up your automations. You review. We launch. Live in 48 hours.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-violet-50 to-white p-8 rounded-3xl border border-violet-100/50 hover:shadow-xl hover:shadow-violet-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Retention on autopilot</h3>
              <p className="text-gray-600 leading-relaxed">
                Win-back emails. Class reminders. Birthday messages. No-show recovery. All automated. All personalized. All working while you sleep.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-3xl border border-amber-100/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Insights that matter</h3>
              <p className="text-gray-600 leading-relaxed">
                Not dashboards full of numbers. Real recommendations: &ldquo;12 clients at risk — send a win-back offer now.&rdquo; Actionable, not overwhelming.
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
              { icon: Calendar, title: "Class scheduling", desc: "Manage your entire schedule. Capacity limits. Waitlists. Recurring classes." },
              { icon: CreditCard, title: "Memberships & packages", desc: "Subscriptions, class packs, drop-ins. Automatic billing. No headaches." },
              { icon: Users, title: "Client profiles", desc: "Full history. Preferences. Attendance. Lifetime value. Know your people." },
              { icon: BarChart3, title: "Studio dashboard", desc: "Revenue. Churn. Retention. Teacher performance. All in one view." },
              { icon: Mail, title: "Marketing automation", desc: "Email + SMS flows. Win-back. Reminders. Birthday messages. All automatic." },
              { icon: MessageSquare, title: "Communication hub", desc: "Every client conversation in one inbox. Email. SMS. All organized." },
            ].map((feature, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-lg transition-all bg-gray-50/50 hover:bg-white group">
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

          {/* Coming Soon */}
          <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">Coming soon</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Trophy, title: "Points & rewards", desc: "Gamify attendance" },
                { icon: Gift, title: "Referral program", desc: "Clients bring clients" },
                { icon: BarChart3, title: "Teacher dashboards", desc: "Performance insights" },
                { icon: Headphones, title: "24/7 support chat", desc: "Always here to help" },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <feature.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{feature.title}</p>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
                Marketing that runs itself. Revenue that keeps growing.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Most studios lose 20-30% of clients each year to simple neglect. 
                Not anymore. CURRENT brings them back automatically.
              </p>

              <div className="space-y-4">
                {[
                  { title: "Win-back campaigns", desc: "Auto-email clients who haven't booked in 30 days" },
                  { title: "No-show recovery", desc: "Reschedule missed classes before they churn" },
                  { title: "Class reminders", desc: "Reduce no-shows by 40% with SMS + email" },
                  { title: "Birthday rewards", desc: "Make clients feel special (and book more)" },
                  { title: "Intro offers", desc: "Convert first-timers with welcome sequences" },
                  { title: "Referral flows", desc: "Turn happy clients into your marketing team" },
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
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-gray-900">This week&apos;s automation results</h4>
                <Badge className="bg-emerald-100 text-emerald-700">Live</Badge>
              </div>
              
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Clients won back</span>
                    <span className="text-2xl font-bold text-emerald-600">23</span>
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">$2,760 recovered revenue</div>
                </div>
                
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">No-shows prevented</span>
                    <span className="text-2xl font-bold text-violet-600">41</span>
                  </div>
                  <div className="text-sm text-violet-600 font-medium">Via SMS reminders</div>
                </div>
                
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">New referrals</span>
                    <span className="text-2xl font-bold text-pink-600">8</span>
                  </div>
                  <div className="text-sm text-pink-600 font-medium">From existing clients</div>
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
            <div className="order-2 lg:order-1 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h4 className="font-semibold text-gray-900">Weekly insights • Dec 11-17</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">12 clients at risk of churning</p>
                    <p className="text-sm text-gray-600">
                      Send a win-back offer → <button className="text-violet-600 font-medium hover:underline">Do it now</button>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Tuesday 6pm is your most profitable slot</p>
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
                    <p className="font-medium text-gray-900 mb-1">Sarah&apos;s classes have 94% retention</p>
                    <p className="text-sm text-gray-600">
                      Top performer this month → <button className="text-violet-600 font-medium hover:underline">See details</button>
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
                  "Teacher dashboards so everyone sees their impact",
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
              When teachers thrive, your studio thrives.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every instructor gets their own dashboard. They see what&apos;s working. They grow. You win.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Performance dashboards</h3>
                <p className="text-gray-600">
                  Revenue contribution. Retention rates. Fill rates. Teachers see exactly how they&apos;re doing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/30">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Leaderboards & goals</h3>
                <p className="text-gray-600">
                  Friendly competition. Monthly recognition. Teachers push each other to be better.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Training library</h3>
                <p className="text-gray-600">
                  Upload certification videos, best practices, onboarding materials. Keep everyone aligned.
                </p>
              </CardContent>
            </Card>
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
              <Card key={i} className="border-0 shadow-sm hover:shadow-lg transition-all bg-white">
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
            className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 shadow-lg shadow-violet-500/25"
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
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                className="bg-gradient-to-r from-pink-500 to-violet-600"
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 h-12 text-lg"
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
                  className="bg-gradient-to-r from-pink-500 to-violet-600"
                  onClick={() => { setDemoModalOpen(false); setDemoSubmitted(false); }}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
