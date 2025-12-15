import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, BarChart3, Zap, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Cadence</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Studio Management
          <br />
          <span className="text-violet-600">Made Simple</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          The complete platform for Pilates, Yoga, and Fitness studios. 
          Manage bookings, clients, teachers, and multiple locations - all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Online Booking</h3>
              <p className="text-gray-600">
                Let clients book classes 24/7 through your custom booking page or embeddable widget.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Location</h3>
              <p className="text-gray-600">
                Manage multiple studio locations from one dashboard with location-specific scheduling.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Management</h3>
              <p className="text-gray-600">
                Track client memberships, class packs, booking history, and preferences.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reports & Analytics</h3>
              <p className="text-gray-600">
                Track revenue, attendance, churn rate, and class performance with detailed reports.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Recurring Billing</h3>
              <p className="text-gray-600">
                Set up weekly memberships and class pack auto-renewals for steady revenue.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">White Label</h3>
              <p className="text-gray-600">
                Your brand, your booking page. Clients see your studio, not ours.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Cadence. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
