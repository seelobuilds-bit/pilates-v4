import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, Zap } from "lucide-react"

export default async function StudioLandingPage({
  params,
}: {
  params: { subdomain: string }
}) {
  const studio = await db.studio.findUnique({
    where: { subdomain: params.subdomain },
    include: {
      locations: { where: { isActive: true } },
      classTypes: { where: { isActive: true } }
    }
  })

  if (!studio) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {studio.name}
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Book your next class with us
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Link href={`/${params.subdomain}/book`} className="block">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-violet-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Book a Class</h3>
                  <p className="text-sm text-gray-500">Browse and book available classes</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${params.subdomain}/account`} className="block">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">My Account</h3>
                  <p className="text-sm text-gray-500">View bookings and manage your account</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            {studio.locations.length} locations • {studio.classTypes.length} class types
          </p>
        </div>
      </div>
    </div>
  )
}
