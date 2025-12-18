"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  Building,
  Settings,
  BarChart3,
  MessageSquare
} from "lucide-react"

interface Studio {
  id: string
  name: string
  subdomain: string
  primaryColor: string
  createdAt: string
  owner: {
    firstName: string
    lastName: string
    email: string
  }
  locations: Array<{
    id: string
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    isActive: boolean
  }>
  teachers: Array<{
    id: string
    isActive: boolean
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }>
  _count: {
    clients: number
    classSessions: number
    bookings: number
  }
}

interface EmailConfig {
  id?: string
  provider: string
  apiKey: string
  fromEmail: string
  fromName: string
  replyToEmail: string
  smtpHost: string
  smtpPort: number | null
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  isVerified: boolean
}

interface SmsConfig {
  id?: string
  provider: string
  accountSid: string
  authToken: string
  fromNumber: string
  isVerified: boolean
  monthlyLimit: number
  currentMonthUsage: number
}

export default function StudioDetailPage({
  params,
}: {
  params: Promise<{ studioId: string }>
}) {
  const { studioId } = use(params)
  
  const [studio, setStudio] = useState<Studio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Communication configs
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: "sendgrid",
    apiKey: "",
    fromEmail: "",
    fromName: "",
    replyToEmail: "",
    smtpHost: "",
    smtpPort: null,
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
    isVerified: false,
  })
  
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    isVerified: false,
    monthlyLimit: 1000,
    currentMonthUsage: 0,
  })

  useEffect(() => {
    fetchStudio()
    fetchCommunicationSettings()
  }, [studioId])

  const fetchStudio = async () => {
    try {
      const res = await fetch(`/api/hq/studios/${studioId}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok) {
        setStudio(data)
      } else {
        console.error("Error fetching studio:", data.error)
        // Show error to user
        alert(`Error: ${data.error || 'Failed to load studio'}`)
      }
    } catch (error) {
      console.error("Error fetching studio:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunicationSettings = async () => {
    try {
      const res = await fetch(`/api/hq/studios/${studioId}/communications`)
      if (res.ok) {
        const data = await res.json()
        if (data.emailConfig) {
          setEmailConfig(data.emailConfig)
        }
        if (data.smsConfig) {
          setSmsConfig(data.smsConfig)
        }
      }
    } catch (error) {
      console.error("Error fetching communication settings:", error)
    }
  }

  const saveCommunicationSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/hq/studios/${studioId}/communications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailConfig, smsConfig }),
      })
      
      if (res.ok) {
        // Refetch to get updated masked values
        await fetchCommunicationSettings()
        alert("Communication settings saved successfully!")
      } else {
        alert("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!studio) {
    return (
      <div className="p-8">
        <p>Studio not found</p>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <Link href="/hq/studios" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Studios
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{studio.name}</h1>
            <Badge variant="secondary">{studio.subdomain}</Badge>
          </div>
          <p className="text-gray-500 mt-1">
            Created {new Date(studio.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline">Edit Studio</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage & Stats
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{studio._count.clients}</p>
                    <p className="text-sm text-gray-500">Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{studio._count.classSessions}</p>
                    <p className="text-sm text-gray-500">Classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{studio._count.bookings}</p>
                    <p className="text-sm text-gray-500">Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{studio.locations.length}</p>
                    <p className="text-sm text-gray-500">Locations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-medium">
                    {studio.owner.firstName[0]}{studio.owner.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{studio.owner.firstName} {studio.owner.lastName}</p>
                    <p className="text-sm text-gray-500">{studio.owner.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Communication Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Email</span>
                  </div>
                  {emailConfig.fromEmail ? (
                    <div className="flex items-center gap-2">
                      {emailConfig.isVerified ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Not configured</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">SMS</span>
                  </div>
                  {smsConfig.fromNumber ? (
                    <div className="flex items-center gap-2">
                      {smsConfig.isVerified ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Not configured</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {studio.locations.length > 0 ? (
                <div className="space-y-3">
                  {studio.locations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{location.name}</p>
                          <p className="text-sm text-gray-500">
                            {location.address}, {location.city}, {location.state} {location.zipCode}
                          </p>
                        </div>
                      </div>
                      <Badge className={location.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No locations configured</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              {studio.teachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studio.teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-medium text-sm">
                        {teacher.user.firstName[0]}{teacher.user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{teacher.user.firstName} {teacher.user.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{teacher.user.email}</p>
                      </div>
                      {teacher.isActive ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No teachers yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Communication Settings</h2>
              <p className="text-sm text-gray-500">Configure email and SMS for this studio</p>
            </div>
            <Button onClick={saveCommunicationSettings} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* Email Configuration */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Email Configuration</CardTitle>
                    <CardDescription>Setup email sending for marketing and communications</CardDescription>
                  </div>
                </div>
                {emailConfig.isVerified ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : emailConfig.fromEmail ? (
                  <Badge className="bg-amber-100 text-amber-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending Verification
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Provider</Label>
                  <Select
                    value={emailConfig.provider}
                    onValueChange={(value) => setEmailConfig({ ...emailConfig, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid (Recommended)</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                      <SelectItem value="smtp">Custom SMTP / Google Workspace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {emailConfig.provider !== "smtp" && (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter API key"
                      value={emailConfig.apiKey}
                      onChange={(e) => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Provider-specific setup instructions */}
              {emailConfig.provider === "sendgrid" && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800 mb-2">📧 SendGrid Setup</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="font-mono">sendgrid.com</span> and create an account</li>
                    <li>Verify the studio&apos;s domain (Settings → Sender Authentication)</li>
                    <li>Create an API key (Settings → API Keys → Create API Key)</li>
                    <li>Paste the API key above</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-2">Free tier: 100 emails/day</p>
                </div>
              )}

              {emailConfig.provider === "mailgun" && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm font-medium text-orange-800 mb-2">📧 Mailgun Setup</p>
                  <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="font-mono">mailgun.com</span> and create an account</li>
                    <li>Add and verify the studio&apos;s domain</li>
                    <li>Copy the Private API Key from Settings</li>
                    <li>Paste the API key above</li>
                  </ol>
                </div>
              )}

              {emailConfig.provider === "ses" && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-2">📧 Amazon SES Setup</p>
                  <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                    <li>Create an AWS account if needed</li>
                    <li>Go to SES console and verify the domain</li>
                    <li>Request production access (to exit sandbox)</li>
                    <li>Create SMTP credentials in SES</li>
                  </ol>
                  <p className="text-xs text-amber-600 mt-2">Cheapest option for high volume</p>
                </div>
              )}

              {emailConfig.provider === "smtp" && (
                <div className="space-y-4">
                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                    <p className="text-sm font-medium text-violet-800 mb-2">📧 Google Workspace / Gmail Setup</p>
                    <div className="text-sm text-violet-700 space-y-1">
                      <p><strong>Host:</strong> smtp.gmail.com</p>
                      <p><strong>Port:</strong> 587</p>
                      <p><strong>Username:</strong> Their full email (hello@studio.com)</p>
                      <p><strong>Password:</strong> App Password (not regular password)</p>
                    </div>
                    <p className="text-xs text-violet-600 mt-2">
                      ⚠️ Client must enable 2FA, then generate an App Password at: 
                      Google Account → Security → App Passwords
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <p className="text-sm font-medium text-gray-700">SMTP Settings</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input
                          placeholder="smtp.gmail.com"
                          value={emailConfig.smtpHost}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input
                          type="number"
                          placeholder="587"
                          value={emailConfig.smtpPort || ""}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) || null })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP Username</Label>
                        <Input
                          placeholder="hello@studio.com"
                          value={emailConfig.smtpUser}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP Password / App Password</Label>
                        <Input
                          type="password"
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={emailConfig.smtpPassword}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={emailConfig.smtpSecure}
                        onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, smtpSecure: checked })}
                      />
                      <Label>Use TLS/SSL</Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Email Address</Label>
                  <Input
                    type="email"
                    placeholder="noreply@studio.com"
                    value={emailConfig.fromEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">The email address that appears as the sender</p>
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    placeholder="Studio Name"
                    value={emailConfig.fromName}
                    onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">The name that appears as the sender</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reply-To Email (Optional)</Label>
                <Input
                  type="email"
                  placeholder="hello@studio.com"
                  value={emailConfig.replyToEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, replyToEmail: e.target.value })}
                />
                <p className="text-xs text-gray-500">Where replies should be sent (defaults to from email)</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Send Test Email
                </Button>
                <Button variant="outline" size="sm">
                  Verify Domain
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SMS Configuration */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle>SMS Configuration</CardTitle>
                    <CardDescription>Setup SMS sending for reminders and communications</CardDescription>
                  </div>
                </div>
                {smsConfig.isVerified ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : smsConfig.fromNumber ? (
                  <Badge className="bg-amber-100 text-amber-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending Verification
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMS Provider</Label>
                  <Select
                    value={smsConfig.provider}
                    onValueChange={(value) => setSmsConfig({ ...smsConfig, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio (Recommended)</SelectItem>
                      <SelectItem value="messagebird">MessageBird</SelectItem>
                      <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From Phone Number</Label>
                  <Input
                    placeholder="+1234567890"
                    value={smsConfig.fromNumber}
                    onChange={(e) => setSmsConfig({ ...smsConfig, fromNumber: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Must be a verified number from your provider</p>
                </div>
              </div>

              {/* Provider-specific setup instructions */}
              {smsConfig.provider === "twilio" && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm font-medium text-red-800 mb-2">📱 Twilio Setup</p>
                  <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="font-mono">twilio.com</span> and create an account</li>
                    <li>Buy a phone number (or use trial number)</li>
                    <li>Find Account SID and Auth Token on the Console Dashboard</li>
                    <li>Enter credentials below</li>
                  </ol>
                  <p className="text-xs text-red-600 mt-2">Trial: Free with +$15 credit • Paid: ~$0.0075/SMS</p>
                </div>
              )}

              {smsConfig.provider === "messagebird" && (
                <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
                  <p className="text-sm font-medium text-sky-800 mb-2">📱 MessageBird Setup</p>
                  <ol className="text-sm text-sky-700 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="font-mono">messagebird.com</span> and create an account</li>
                    <li>Buy a virtual number</li>
                    <li>Get API key from Dashboard → Developers → API access</li>
                    <li>Enter credentials below</li>
                  </ol>
                </div>
              )}

              {smsConfig.provider === "vonage" && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-purple-800 mb-2">📱 Vonage Setup</p>
                  <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="font-mono">vonage.com</span> and create an account</li>
                    <li>Buy a virtual number</li>
                    <li>Get API Key and Secret from Dashboard</li>
                    <li>Enter credentials below</li>
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{smsConfig.provider === "twilio" ? "Account SID" : "API Key"}</Label>
                  <Input
                    type="password"
                    placeholder={smsConfig.provider === "twilio" ? "ACxxxxxxxxxxxxxxxx" : "Enter API key"}
                    value={smsConfig.accountSid}
                    onChange={(e) => setSmsConfig({ ...smsConfig, accountSid: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{smsConfig.provider === "twilio" ? "Auth Token" : "API Secret"}</Label>
                  <Input
                    type="password"
                    placeholder="Enter auth token"
                    value={smsConfig.authToken}
                    onChange={(e) => setSmsConfig({ ...smsConfig, authToken: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <p className="text-sm font-medium text-gray-700">Usage Limits</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly SMS Limit</Label>
                    <Input
                      type="number"
                      value={smsConfig.monthlyLimit}
                      onChange={(e) => setSmsConfig({ ...smsConfig, monthlyLimit: parseInt(e.target.value) || 1000 })}
                    />
                    <p className="text-xs text-gray-500">Maximum SMS messages per month</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Month Usage</Label>
                    <div className="p-3 bg-white rounded border">
                      <p className="text-lg font-semibold text-gray-900">
                        {smsConfig.currentMonthUsage} / {smsConfig.monthlyLimit}
                      </p>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((smsConfig.currentMonthUsage / smsConfig.monthlyLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Send Test SMS
                </Button>
                <Button variant="outline" size="sm">
                  Verify Number
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>Communication metrics for this studio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-500">Emails Sent</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-500">SMS Sent</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-500">Email Open Rate</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-500">SMS Delivery Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Studio Settings</CardTitle>
              <CardDescription>General configuration for this studio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Subdomain</p>
                  <p className="text-sm text-gray-500">{studio.subdomain}.pilates.app</p>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Primary Color</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: studio.primaryColor }}
                    />
                    <span className="text-sm text-gray-500">{studio.primaryColor}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Suspend Studio</p>
                  <p className="text-sm text-gray-500">Temporarily disable this studio</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  Suspend
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Delete Studio</p>
                  <p className="text-sm text-gray-500">Permanently delete this studio and all data</p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
