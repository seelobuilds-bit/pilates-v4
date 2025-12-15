import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-violet-900">
            Cadence
          </h1>
          <p className="text-xl text-violet-700 max-w-2xl mx-auto">
            The complete studio management platform for Pilates, Yoga, and Fitness studios.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Register
              </Button>
            </Link>
          </div>

          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Multi-Location Support</h3>
              <p className="text-muted-foreground">
                Manage multiple studio locations from one dashboard
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Online Booking</h3>
              <p className="text-muted-foreground">
                Let clients book classes 24/7 with your own booking page
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Reports & Analytics</h3>
              <p className="text-muted-foreground">
                Track revenue, clients, and class performance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
