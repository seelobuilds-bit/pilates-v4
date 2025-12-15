import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function SettingsPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const studio = await db.studio.findUnique({
    where: { id: session.user.studioId }
  })

  if (!studio) {
    redirect("/login")
  }

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${studio.subdomain}/book`

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Studio Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Studio Name</label>
              <p className="text-muted-foreground">{studio.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Subdomain</label>
              <p className="text-muted-foreground">{studio.subdomain}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Booking URL</label>
              <p className="text-muted-foreground">{bookingUrl}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embed Booking Widget</CardTitle>
            <CardDescription>
              Add this code to your website to embed the booking widget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-gray-100 rounded-lg overflow-x-auto text-sm">
{`<iframe 
  src="${bookingUrl.replace('/book', '/embed')}" 
  width="100%" 
  height="700" 
  frameborder="0"
></iframe>`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



