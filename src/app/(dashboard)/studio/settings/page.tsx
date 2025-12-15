import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Copy } from "lucide-react"

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
  const embedUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${studio.subdomain}/embed`

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your studio settings</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Studio Information</CardTitle>
            <CardDescription>Basic information about your studio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Studio Name</label>
                <p className="text-gray-900 mt-1">{studio.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Subdomain</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{studio.subdomain}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Booking Page</CardTitle>
            <CardDescription>Share this link with your clients to book classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm text-gray-700">{bookingUrl}</code>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded">
                <ExternalLink className="h-4 w-4 text-gray-500" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Embed Widget</CardTitle>
            <CardDescription>Add this code to your website to embed the booking widget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <pre className="text-sm text-green-400">
{`<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="700" 
  frameborder="0"
  style="border-radius: 12px;"
></iframe>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
