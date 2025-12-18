// Demo Settings Page - Mirrors /studio/settings/page.tsx
// Keep in sync with the real settings page

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Building2, Globe, Palette } from "lucide-react"
import { demoStudio } from "../_data/demo-data"

export default function DemoSettingsPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your studio settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Studio Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              Studio Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Studio Name</Label>
              <Input id="name" defaultValue={demoStudio.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input id="subdomain" defaultValue={demoStudio.subdomain} />
                <span className="text-sm text-gray-500 whitespace-nowrap">.soulflow.studio</span>
              </div>
              <p className="text-xs text-gray-500">
                Your booking page: {demoStudio.subdomain}.soulflow.studio
              </p>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Booking Page */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" />
              Booking Page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Share your booking page with clients or embed it on your website.
            </p>
            <div className="space-y-2">
              <Label>Direct Link</Label>
              <div className="flex items-center gap-2">
                <Input 
                  readOnly 
                  value={`https://soulflow.studio/${demoStudio.subdomain}`} 
                  className="bg-gray-50"
                />
                <Button variant="outline">Copy</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <textarea 
                readOnly
                className="w-full h-24 p-3 text-sm font-mono bg-gray-50 border rounded-lg resize-none"
                value={`<iframe src="https://soulflow.studio/${demoStudio.subdomain}/embed" width="100%" height="600" frameborder="0"></iframe>`}
              />
              <Button variant="outline">Copy Code</Button>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-gray-400" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  id="color" 
                  defaultValue={demoStudio.primaryColor} 
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input 
                  defaultValue={demoStudio.primaryColor} 
                  className="w-32"
                />
              </div>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
