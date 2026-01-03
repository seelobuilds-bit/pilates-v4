import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings,
  Building2,
  CreditCard,
  Bell,
  Mail,
  Globe,
  Palette,
  Lock,
  Save,
  Link as LinkIcon
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoSettingsPage() {
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your studio settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="booking">
            <Globe className="h-4 w-4 mr-2" />
            Booking
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Studio Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Studio Name</Label>
                    <Input value={studio.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Subdomain</Label>
                    <div className="flex items-center">
                      <Input value={studio.subdomain} disabled className="rounded-r-none" />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-500">
                        .soulflow.app
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={studio.description || "A modern pilates studio focused on mind-body wellness."}
                    disabled
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input value="hello@zenithpilates.com" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value="+1 (555) 123-4567" disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value="https://zenithpilates.com" disabled />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex justify-end">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Tab */}
        <TabsContent value="booking">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Online Booking</p>
                    <p className="text-sm text-gray-500">Allow clients to book classes online</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Waitlist</p>
                    <p className="text-sm text-gray-500">Enable waitlist for full classes</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Late Cancellation Fee</p>
                    <p className="text-sm text-gray-500">Charge for cancellations within 24 hours</p>
                  </div>
                  <Switch checked={false} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Booking Window (days ahead)</Label>
                    <Input value="30" type="number" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Cancellation Deadline (hours)</Label>
                    <Input value="24" type="number" disabled />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Booking Widget</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Embed the booking widget on your website to let clients book directly.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <code className="text-sm text-gray-600">
                    {`<script src="https://soulflow.app/embed/${studio.subdomain}"></script>`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Settings</h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Stripe Connected</p>
                      <p className="text-sm text-gray-500">Accepting payments</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Connected</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Accept Credit Cards</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, Amex</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Accept Apple Pay</p>
                    <p className="text-sm text-gray-500">Allow Apple Pay payments</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value="USD" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input value="0" type="number" disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Email Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Booking Confirmations</p>
                      <p className="text-sm text-gray-500">Send confirmation when client books</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Class Reminders (24h)</p>
                      <p className="text-sm text-gray-500">Remind clients about upcoming classes</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Cancellation Notices</p>
                      <p className="text-sm text-gray-500">Notify when class is cancelled</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Payment Receipts</p>
                      <p className="text-sm text-gray-500">Send receipts for payments</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Brand Settings</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg border"
                      style={{ backgroundColor: studio.brandColor || '#8B5CF6' }}
                    />
                    <Input value={studio.brandColor || '#8B5CF6'} disabled className="w-32" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    {studio.logoUrl ? (
                      <img src={studio.logoUrl} alt="Logo" className="max-h-20 mx-auto" />
                    ) : (
                      <>
                        <Palette className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No logo uploaded</p>
                        <Button variant="outline" size="sm" className="mt-2">Upload Logo</Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Custom Domain</Label>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                    <Input value="" placeholder="book.yourstudio.com" disabled />
                    <Button variant="outline">Configure</Button>
                  </div>
                  <p className="text-xs text-gray-500">Use your own domain for the booking page</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
