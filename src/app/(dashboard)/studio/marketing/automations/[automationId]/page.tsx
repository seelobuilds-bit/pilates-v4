"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Clock,
  Target,
  TrendingUp,
  Gift,
  Bell,
  Sparkles,
  Zap,
  Save,
  Loader2,
  MapPin,
  Check,
  UserPlus,
  Calendar,
  Star
} from "lucide-react"

interface AutomationConfig {
  id: string
  title: string
  description: string
  icon: string
  trigger: string
  inactivityDays: number
  reminderHours: number
  enabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  emailSubject: string
  emailBody: string
  smsBody: string
  delay: number
  delayUnit: "hours" | "days"
  sendTime: string
  targetAudience: string
  targetLocation: string
}

interface Location {
  id: string
  name: string
  clientCount: number
}

const triggerTypes = [
  { 
    id: "signup", 
    label: "Client Signs Up", 
    description: "When a new client creates an account",
    icon: UserPlus
  },
  { 
    id: "booking", 
    label: "Client Books Class", 
    description: "When a client books a class",
    icon: Calendar
  },
  { 
    id: "attendance", 
    label: "After Class Attendance", 
    description: "After a client attends a class",
    icon: Star
  },
  { 
    id: "inactivity", 
    label: "Client Inactive", 
    description: "When a client hasn't booked for X days",
    icon: TrendingUp
  },
  { 
    id: "birthday", 
    label: "Client Birthday", 
    description: "On the client's birthday",
    icon: Gift
  },
  { 
    id: "reminder", 
    label: "Class Reminder", 
    description: "Before a scheduled class",
    icon: Bell
  }
]

const automationDefaults: Record<string, AutomationConfig> = {
  "winback-30": {
    id: "winback-30",
    title: "Win-back 30 Days",
    description: "Re-engage clients who haven't booked in 30 days",
    icon: "trending",
    trigger: "inactivity",
    inactivityDays: 30,
    reminderHours: 24,
    enabled: false,
    emailEnabled: true,
    smsEnabled: false,
    emailSubject: "We miss you at {studioName}!",
    emailBody: "Hi {firstName},\n\nWe noticed you haven't visited us in a while. We'd love to see you back on the mat!\n\nBook your next class today and get 10% off.\n\nSee you soon,\n{studioName}",
    smsBody: "Hi {firstName}! We miss you at {studioName}. Book a class this week and get 10% off! {bookingLink}",
    delay: 0,
    delayUnit: "days",
    sendTime: "10:00",
    targetAudience: "inactive_clients",
    targetLocation: "all"
  },
  "winback-60": {
    id: "winback-60",
    title: "Win-back 60 Days",
    description: "Last chance offer for clients inactive for 60 days",
    icon: "trending",
    trigger: "inactivity",
    inactivityDays: 60,
    reminderHours: 24,
    enabled: false,
    emailEnabled: true,
    smsEnabled: false,
    emailSubject: "We want you back! Special offer inside",
    emailBody: "Hi {firstName},\n\nIt's been 60 days since your last visit and we really miss having you in class!\n\nAs a special offer, enjoy 20% off your next class pack.\n\nUse code: COMEBACK20\n\nHope to see you soon!\n{studioName}",
    smsBody: "Hi {firstName}! It's been a while. Come back to {studioName} with 20% off! Use code COMEBACK20. {bookingLink}",
    delay: 0,
    delayUnit: "days",
    sendTime: "10:00",
    targetAudience: "inactive_clients",
    targetLocation: "all"
  },
  "birthday": {
    id: "birthday",
    title: "Birthday Message",
    description: "Celebrate clients on their special day",
    icon: "gift",
    trigger: "birthday",
    inactivityDays: 30,
    reminderHours: 24,
    enabled: false,
    emailEnabled: true,
    smsEnabled: true,
    emailSubject: "🎂 Happy Birthday, {firstName}!",
    emailBody: "Happy Birthday, {firstName}! 🎉\n\nWe hope you have an amazing day filled with joy!\n\nAs a birthday gift from us, enjoy a FREE class on us. Just mention this email when you book.\n\nCheers,\n{studioName}",
    smsBody: "🎂 Happy Birthday {firstName}! Enjoy a FREE class at {studioName} as our gift to you. Book now: {bookingLink}",
    delay: 0,
    delayUnit: "days",
    sendTime: "09:00",
    targetAudience: "birthday_today",
    targetLocation: "all"
  },
  "reminder-24h": {
    id: "reminder-24h",
    title: "Class Reminder (24h)",
    description: "Remind clients about their upcoming class",
    icon: "bell",
    trigger: "reminder",
    inactivityDays: 30,
    reminderHours: 24,
    enabled: false,
    emailEnabled: true,
    smsEnabled: true,
    emailSubject: "Reminder: {className} tomorrow at {time}",
    emailBody: "Hi {firstName},\n\nJust a friendly reminder that you have {className} scheduled for tomorrow:\n\n📅 Date: {date}\n⏰ Time: {time}\n📍 Location: {location}\n👩‍🏫 Teacher: {teacherName}\n\nWe look forward to seeing you!\n\n{studioName}",
    smsBody: "Reminder: {className} tomorrow at {time} with {teacherName}. See you at {location}! - {studioName}",
    delay: 0,
    delayUnit: "hours",
    sendTime: "auto",
    targetAudience: "booked_clients",
    targetLocation: "all"
  },
  "reminder-2h": {
    id: "reminder-2h",
    title: "Class Reminder (2h)",
    description: "Last-minute reminder before class",
    icon: "clock",
    trigger: "reminder",
    inactivityDays: 30,
    reminderHours: 2,
    enabled: false,
    emailEnabled: false,
    smsEnabled: true,
    emailSubject: "",
    emailBody: "",
    smsBody: "Hi {firstName}! Your {className} starts in 2 hours at {location}. See you soon! 🧘",
    delay: 0,
    delayUnit: "hours",
    sendTime: "auto",
    targetAudience: "booked_clients",
    targetLocation: "all"
  },
  "welcome": {
    id: "welcome",
    title: "Welcome Series",
    description: "Welcome new clients to your studio",
    icon: "sparkles",
    trigger: "signup",
    inactivityDays: 30,
    reminderHours: 24,
    enabled: false,
    emailEnabled: true,
    smsEnabled: false,
    emailSubject: "Welcome to {studioName}! 🎉",
    emailBody: "Hi {firstName},\n\nWelcome to {studioName}! We're so excited to have you join our community.\n\nHere's what you need to know:\n• Arrive 10 minutes early for your first class\n• Wear comfortable clothing\n• We provide all equipment\n• Water bottles are welcome\n\nReady to book your first class? Click below to get started.\n\nSee you on the mat!\n{studioName}",
    smsBody: "",
    delay: 0,
    delayUnit: "hours",
    sendTime: "immediate",
    targetAudience: "new_clients",
    targetLocation: "all"
  },
  "post-class": {
    id: "post-class",
    title: "Post-Class Follow-up",
    description: "Thank clients after their class",
    icon: "message",
    trigger: "attendance",
    inactivityDays: 30,
    reminderHours: 24,
    enabled: false,
    emailEnabled: true,
    smsEnabled: false,
    emailSubject: "Thanks for joining us today!",
    emailBody: "Hi {firstName},\n\nThank you for joining {className} today with {teacherName}!\n\nWe hope you enjoyed your session. Your feedback helps us improve - let us know how it went!\n\nReady for your next class? Book now to keep the momentum going.\n\nSee you soon,\n{studioName}",
    smsBody: "",
    delay: 2,
    delayUnit: "hours",
    sendTime: "auto",
    targetAudience: "attended_clients",
    targetLocation: "all"
  }
}

const iconMap: Record<string, React.ElementType> = {
  trending: TrendingUp,
  gift: Gift,
  bell: Bell,
  clock: Clock,
  sparkles: Sparkles,
  message: MessageSquare
}

// Mock locations
const mockLocations: Location[] = [
  { id: "all", name: "All Locations", clientCount: 248 },
  { id: "loc-1", name: "Downtown Studio", clientCount: 156 },
  { id: "loc-2", name: "Westside Location", clientCount: 92 }
]

export default function AutomationConfigPage({
  params,
}: {
  params: Promise<{ automationId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<AutomationConfig | null>(null)
  const [locations, setLocations] = useState<Location[]>(mockLocations)

  useEffect(() => {
    const defaultConfig = automationDefaults[resolvedParams.automationId]
    if (defaultConfig) {
      setConfig(defaultConfig)
    }
    
    // Fetch locations
    async function fetchLocations() {
      try {
        const res = await fetch("/api/studio/locations")
        if (res.ok) {
          const data = await res.json()
          const allLocations = [
            { id: "all", name: "All Locations", clientCount: 248 },
            ...data.map((loc: { id: string; name: string }) => ({ ...loc, clientCount: Math.floor(Math.random() * 100) + 20 }))
          ]
          setLocations(allLocations)
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error)
      }
    }
    fetchLocations()
    
    setLoading(false)
  }, [resolvedParams.automationId])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/studio/marketing")
  }

  if (loading) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Automation not found</p>
          <Link href="/studio/marketing">
            <Button variant="outline">Back to Marketing</Button>
          </Link>
        </div>
      </div>
    )
  }

  const Icon = iconMap[config.icon] || Zap
  const selectedLocation = locations.find(l => l.id === config.targetLocation)
  const selectedTrigger = triggerTypes.find(t => t.id === config.trigger)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketing
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Icon className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
              <p className="text-gray-500">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Enabled</span>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Trigger */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-gray-900">Trigger</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">When should this automation run?</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {triggerTypes.map((trigger) => (
                <button
                  key={trigger.id}
                  type="button"
                  onClick={() => setConfig({ ...config, trigger: trigger.id })}
                  className={`p-3 border-2 rounded-xl text-left transition-all ${
                    config.trigger === trigger.id 
                      ? "border-violet-500 bg-violet-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <trigger.icon className={`h-4 w-4 ${
                      config.trigger === trigger.id ? "text-violet-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{trigger.label}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedTrigger && (
              <div className="mt-4 p-3 bg-violet-50 rounded-lg">
                <p className="text-sm text-violet-700">
                  <strong>Trigger:</strong> {selectedTrigger.description}
                </p>
              </div>
            )}

            {/* Trigger-specific settings */}
            {config.trigger === "inactivity" && (
              <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <Label className="text-orange-900">Inactivity Period</Label>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  Trigger this automation when a client hasn&apos;t booked for:
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={config.inactivityDays}
                    onChange={(e) => setConfig({ ...config, inactivityDays: parseInt(e.target.value) || 30 })}
                    min="1"
                    max="365"
                    className="w-24 bg-white"
                  />
                  <span className="text-orange-800 font-medium">days</span>
                </div>
                <p className="text-xs text-orange-600 mt-2">
                  Common options: 30 days (win-back), 60 days (last chance), 90 days (re-engagement)
                </p>
              </div>
            )}

            {config.trigger === "reminder" && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <Label className="text-blue-900">Reminder Timing</Label>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Send reminder before the scheduled class:
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={config.reminderHours}
                    onChange={(e) => setConfig({ ...config, reminderHours: parseInt(e.target.value) || 24 })}
                    min="1"
                    max="168"
                    className="w-24 bg-white"
                  />
                  <span className="text-blue-800 font-medium">hours before</span>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Common options: 2 hours (last-minute), 24 hours (day before), 48 hours (2 days before)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Channels</h2>
            <p className="text-sm text-gray-500 mb-4">Choose how to deliver this automation</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setConfig({ ...config, emailEnabled: !config.emailEnabled })}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  config.emailEnabled ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    config.emailEnabled ? "bg-violet-500" : "bg-gray-100"
                  }`}>
                    <Mail className={`h-5 w-5 ${config.emailEnabled ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">Send via email</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConfig({ ...config, smsEnabled: !config.smsEnabled })}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  config.smsEnabled ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    config.smsEnabled ? "bg-blue-500" : "bg-gray-100"
                  }`}>
                    <MessageSquare className={`h-5 w-5 ${config.smsEnabled ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">SMS</p>
                    <p className="text-sm text-gray-500">Send via text</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Timing</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Configure when this automation triggers</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Delay</Label>
                <Input
                  type="number"
                  value={config.delay}
                  onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={config.delayUnit}
                  onValueChange={(value: "hours" | "days") => setConfig({ ...config, delayUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Send Time</Label>
                <Select
                  value={config.sendTime}
                  onValueChange={(value) => setConfig({ ...config, sendTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (relative to trigger)</SelectItem>
                    <SelectItem value="immediate">Immediately</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                    <SelectItem value="19:00">7:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Target Audience</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Who should receive this automation</p>

            {/* Location Filter */}
            {locations.length > 2 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  <p className="text-sm font-medium text-gray-700">Filter by Location</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => setConfig({ ...config, targetLocation: location.id })}
                      className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        config.targetLocation === location.id
                          ? "bg-violet-600 text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                      }`}
                    >
                      {config.targetLocation === location.id && <Check className="h-3 w-3" />}
                      <span>{location.name}</span>
                      <Badge variant="secondary" className={`text-xs ${
                        config.targetLocation === location.id ? "bg-violet-500 text-white" : ""
                      }`}>
                        {location.clientCount}
                      </Badge>
                    </button>
                  ))}
                </div>
                {config.targetLocation !== "all" && (
                  <p className="text-xs text-gray-500 mt-2">
                    Only clients who primarily book at {selectedLocation?.name} will receive this automation
                  </p>
                )}
              </div>
            )}

            <Select
              value={config.targetAudience}
              onValueChange={(value) => setConfig({ ...config, targetAudience: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_clients">All Clients</SelectItem>
                <SelectItem value="new_clients">New Clients (joined within trigger period)</SelectItem>
                <SelectItem value="active_clients">Active Clients (booked recently)</SelectItem>
                <SelectItem value="inactive_clients">Inactive Clients (no recent bookings)</SelectItem>
                <SelectItem value="booked_clients">Clients with Upcoming Bookings</SelectItem>
                <SelectItem value="attended_clients">Clients who Attended a Class</SelectItem>
                <SelectItem value="birthday_today">Clients with Birthday Today</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Email Content */}
        {config.emailEnabled && (
          <Card className="border-0 shadow-sm border-l-4 border-l-violet-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-violet-500" />
                <h2 className="text-lg font-semibold text-gray-900">Email Content</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={config.emailSubject}
                    onChange={(e) => setConfig({ ...config, emailSubject: e.target.value })}
                    placeholder="Enter email subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <Textarea
                    value={config.emailBody}
                    onChange={(e) => setConfig({ ...config, emailBody: e.target.value })}
                    placeholder="Write your email message..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SMS Content */}
        {config.smsEnabled && (
          <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">SMS Content</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message</Label>
                    <span className={`text-xs ${
                      config.smsBody.length > 160 ? "text-amber-600" : "text-gray-500"
                    }`}>
                      {config.smsBody.length}/160 characters
                    </span>
                  </div>
                  <Textarea
                    value={config.smsBody}
                    onChange={(e) => setConfig({ ...config, smsBody: e.target.value })}
                    placeholder="Write your SMS message..."
                    rows={4}
                  />
                  {config.smsBody.length > 160 && (
                    <p className="text-xs text-amber-600">
                      Messages over 160 characters will be sent as multiple texts
                    </p>
                  )}
                </div>

                {/* SMS Preview */}
                <div className="p-4 bg-gray-900 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Preview</p>
                  <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-bl-none max-w-xs text-sm">
                    {config.smsBody || "Your message will appear here..."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Variables Reference */}
        <Card className="border-0 shadow-sm bg-gray-100">
          <CardContent className="p-6">
            <h3 className="font-medium text-gray-900 mb-3">Available Variables</h3>
            <p className="text-sm text-gray-500 mb-4">Use these placeholders in your messages - they&apos;ll be replaced with actual values</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { var: "{firstName}", desc: "Client's first name" },
                { var: "{lastName}", desc: "Client's last name" },
                { var: "{studioName}", desc: "Your studio name" },
                { var: "{className}", desc: "Class name" },
                { var: "{date}", desc: "Class date" },
                { var: "{time}", desc: "Class time" },
                { var: "{location}", desc: "Location name" },
                { var: "{teacherName}", desc: "Teacher's name" },
                { var: "{bookingLink}", desc: "Link to book" }
              ].map((v) => (
                <div key={v.var} className="bg-white p-3 rounded-lg">
                  <code className="text-sm text-violet-600 font-mono">{v.var}</code>
                  <p className="text-xs text-gray-500 mt-1">{v.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link href="/studio/marketing">
            <Button variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
