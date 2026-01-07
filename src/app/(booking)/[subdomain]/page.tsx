import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"

export default async function StudioLandingPage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  // Case-insensitive subdomain lookup
  const studio = await db.studio.findFirst({
    where: { 
      subdomain: { 
        equals: subdomain, 
        mode: 'insensitive' 
      } 
    },
    include: {
      locations: true,
      merchStore: {
        select: { isEnabled: true }
      }
    }
  })

  if (!studio) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: studio.primaryColor || "#7c3aed" }}>
            {studio.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            Book your next class with us
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Ready to book?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/${subdomain}/book`} className="block">
                <Button className="w-full" style={{ backgroundColor: studio.primaryColor || "#7c3aed" }}>
                  Book a Class
                </Button>
              </Link>
              <Link href={`/${subdomain}/account`} className="block">
                <Button variant="outline" className="w-full">
                  My Account
                </Button>
              </Link>
              {studio.merchStore?.isEnabled && (
                <Link href={`/${subdomain}/store`} className="block">
                  <Button variant="outline" className="w-full">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



