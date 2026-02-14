"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  Calendar,
  Video,
  CheckCircle,
  Loader2,
  ArrowRight,
  Building2,
  Users,
  Star
} from "lucide-react"

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    studioName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    studioSize: "",
    currentSoftware: "",
    interests: "",
    referralSource: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const res = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        alert("Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Failed to submit:", error)
      alert("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Request Received!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in Current! One of our team members will reach out within 24 hours to schedule your personalized demo.
            </p>
            <div className="bg-violet-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-violet-700">
                <strong>What to expect:</strong> A 30-minute personalized walkthrough of how Current can transform your pilates studio operations.
              </p>
            </div>
            <Link href="/">
              <Button className="bg-violet-600 hover:bg-violet-700">
                Return to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
      {/* Header */}
      <header className="py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-violet-600" />
            <span className="text-2xl font-bold text-gray-900">CURRENT</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              See Current in Action
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Schedule a free, personalized demo and discover how Current can help you grow your pilates studio.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Video className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">30-Minute Personalized Demo</h3>
                  <p className="text-gray-600">Get a walkthrough tailored to your studio&apos;s specific needs</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">All-in-One Platform</h3>
                  <p className="text-gray-600">Booking, payments, marketing, and more in one place</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Expert Guidance</h3>
                  <p className="text-gray-600">Our team has helped hundreds of studios grow</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  &quot;Switching to Current was the best decision we made. Our bookings increased by 40% in the first month, and the social media tools have been a game-changer.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 font-semibold">
                    SJ
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">Owner, Zenith Pilates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Form */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-600" />
                Book Your Free Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name *</Label>
                    <Input
                      required
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label>Studio Name *</Label>
                    <Input
                      required
                      value={form.studioName}
                      onChange={(e) => setForm({ ...form, studioName: e.target.value })}
                      placeholder="Your studio"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    required
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="you@studio.com"
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label>Studio Size</Label>
                  <Select value={form.studioSize} onValueChange={(v) => setForm({ ...form, studioSize: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="just-me">Just me (solo instructor)</SelectItem>
                      <SelectItem value="1-5">1-5 instructors</SelectItem>
                      <SelectItem value="6-15">6-15 instructors</SelectItem>
                      <SelectItem value="16-30">16-30 instructors</SelectItem>
                      <SelectItem value="30+">30+ instructors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Current Software (if any)</Label>
                  <Input
                    value={form.currentSoftware}
                    onChange={(e) => setForm({ ...form, currentSoftware: e.target.value })}
                    placeholder="e.g., Mindbody, spreadsheets, none"
                  />
                </div>

                <div>
                  <Label>What are you most interested in?</Label>
                  <Textarea
                    value={form.interests}
                    onChange={(e) => setForm({ ...form, interests: e.target.value })}
                    placeholder="Tell us about your goals and what features interest you most..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>How did you hear about us?</Label>
                  <Select value={form.referralSource} onValueChange={(v) => setForm({ ...form, referralSource: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Search</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="referral">Friend/Colleague Referral</SelectItem>
                      <SelectItem value="event">Event/Conference</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Request Demo
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 border-t mt-12">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Current. All rights reserved.
        </div>
      </footer>
    </div>
  )
}











