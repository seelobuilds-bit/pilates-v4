import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Calendar, Users, GitBranch } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30" />
        {/* Grid dots */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Pilates Studio</span>
          </div>
          <Link href="/login">
            <Button className="bg-violet-600 hover:bg-violet-700">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <div className="container mx-auto px-6 pt-24 pb-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-full mb-8">
            The Modern Studio Management Platform
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
            Run Your Pilates Studio,
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
              Effortlessly
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Schedule classes, manage clients, automate marketing, and grow your business. 
            Everything you need in one beautiful platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 px-8">
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="container mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Smart Scheduling */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-6">
                  <Calendar className="h-7 w-7 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Smart Scheduling</h3>
                <p className="text-gray-600">
                  Create class types, schedule sessions, and let clients book with a beautiful calendar interface.
                </p>
              </CardContent>
            </Card>

            {/* Client Management */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Management</h3>
                <p className="text-gray-600">
                  Track client bookings, lifetime value, and engagement. Know who&apos;s at risk of churning.
                </p>
              </CardContent>
            </Card>

            {/* Marketing Automation */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <GitBranch className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Marketing Automation</h3>
                <p className="text-gray-600">
                  Win-back campaigns, birthday messages, and class reminders. All automated.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Pilates Studio Platform. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
