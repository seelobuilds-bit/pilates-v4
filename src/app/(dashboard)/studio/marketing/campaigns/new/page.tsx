"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Send, 
  Users, 
  Calendar,
  Clock,
  Eye,
  Sparkles,
  FileText,
  Check,
  MapPin
} from "lucide-react"

interface Template {
  id: string
  name: string
  type: "email" | "sms"
  category: string
  subject?: string
  body: string
}

interface Location {
  id: string
  name: string
  clientCount: number
}

const availableTemplates: Template[] = [
  {
    id: "welcome-email",
    name: "Welcome Email",
    type: "email",
    category: "Onboarding",
    subject: "Welcome to {studioName}!",
    body: "Hi {firstName},\n\nWelcome to {studioName}! We're so excited to have you join our community.\n\nHere's what you need to know:\n• Arrive 10 minutes early for your first class\n• Wear comfortable clothing\n• We provide all equipment\n• Water bottles are welcome\n\nReady to book your first class? Click below to get started.\n\nSee you on the mat!\n{studioName}"
  },
  {
    id: "promo-discount",
    name: "Promotion Discount",
    type: "email",
    category: "Promotions",
    subject: "Special offer just for you!",
    body: "Hi {firstName},\n\nWe have an exclusive offer you won't want to miss!\n\nFor a limited time, enjoy [DISCOUNT]% off your next class pack.\n\nUse code: [CODE]\n\nBook now before this offer expires!\n\n{studioName}"
  },
  {
    id: "birthday-wish",
    name: "Birthday Wishes",
    type: "email",
    category: "Special Events",
    subject: "🎂 Happy Birthday, {firstName}!",
    body: "Happy Birthday, {firstName}! 🎉\n\nWe hope your special day is filled with joy and celebration!\n\nAs a birthday gift from us, enjoy a FREE class on us. Just mention this email when you book.\n\nHave a wonderful birthday!\n\nCheers,\n{studioName}"
  },
  {
    id: "class-reminder-sms",
    name: "Class Reminder SMS",
    type: "sms",
    category: "Reminders",
    body: "Hi {firstName}! Reminder: {className} tomorrow at {time}. See you at {location}! - {studioName}"
  },
  {
    id: "promo-sms",
    name: "Promo SMS",
    type: "sms",
    category: "Promotions",
    body: "Hi {firstName}! Special offer: Get 20% off your next class. Book now: {bookingLink} - {studioName}"
  }
]

// Mock locations - in production these would come from the API
const mockLocations: Location[] = [
  { id: "all", name: "All Locations", clientCount: 248 },
  { id: "loc-1", name: "Downtown Studio", clientCount: 156 },
  { id: "loc-2", name: "Westside Location", clientCount: 92 }
]

export default function NewCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSegment = searchParams.get("segment")
  const preselectedTemplate = searchParams.get("template")
  
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string | null>(preselectedTemplate)
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>(mockLocations)
  
  const [campaign, setCampaign] = useState({
    name: "",
    type: "" as "" | "email" | "sms" | "both",
    targetAudience: preselectedSegment || "",
    targetLocation: "all",
    emailSubject: "",
    emailPreheader: "",
    emailBody: "",
    smsBody: "",
    scheduleType: "now" as "now" | "scheduled",
    scheduledDate: "",
    scheduledTime: ""
  })

  useEffect(() => {
    // Fetch locations from API
    async function fetchLocations() {
      try {
        const res = await fetch("/api/studio/locations")
        if (res.ok) {
          const data = await res.json()
          // Add "All Locations" option at the beginning
          const allLocations = [
            { id: "all", name: "All Locations", clientCount: data.reduce((acc: number, loc: Location) => acc + (loc.clientCount || 0), 0) || 248 },
            ...data.map((loc: { id: string; name: string }) => ({ ...loc, clientCount: Math.floor(Math.random() * 100) + 20 }))
          ]
          setLocations(allLocations)
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error)
      }
    }
    fetchLocations()
  }, [])

  const applyEmailTemplate = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId && t.type === "email")
    if (template) {
      setCampaign({
        ...campaign,
        emailSubject: template.subject || "",
        emailBody: template.body
      })
      setSelectedEmailTemplate(templateId)
    }
  }

  const applySmsTemplate = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId && t.type === "sms")
    if (template) {
      setCampaign({
        ...campaign,
        smsBody: template.body
      })
      setSelectedSmsTemplate(templateId)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/studio/marketing?tab=campaigns")
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return campaign.name && campaign.type
      case 2:
        return campaign.targetAudience
      case 3:
        if (campaign.type === "email" || campaign.type === "both") {
          if (!campaign.emailSubject || !campaign.emailBody) return false
        }
        if (campaign.type === "sms" || campaign.type === "both") {
          if (!campaign.smsBody) return false
        }
        return true
      case 4:
        if (campaign.scheduleType === "scheduled") {
          return campaign.scheduledDate && campaign.scheduledTime
        }
        return true
      default:
        return false
    }
  }

  const emailTemplates = availableTemplates.filter(t => t.type === "email")
  const smsTemplates = availableTemplates.filter(t => t.type === "sms")

  // Get recipient count based on selected location
  const selectedLocation = locations.find(l => l.id === campaign.targetLocation)
  const baseRecipientCount = selectedLocation?.clientCount || 248

  // Audience options with dynamic counts based on location
  const audienceOptions = [
    { value: "all", label: "All Subscribers", desc: "Everyone who has opted in to marketing", count: baseRecipientCount },
    { value: "active", label: "Active Clients", desc: "Clients who booked in the last 30 days", count: Math.round(baseRecipientCount * 0.36) },
    { value: "inactive", label: "Inactive Clients", desc: "Clients who haven't booked in 30+ days", count: Math.round(baseRecipientCount * 0.27) },
    { value: "new", label: "New Clients", desc: "Clients who joined in the last 30 days", count: Math.round(baseRecipientCount * 0.10) },
    { value: "vip", label: "VIP Clients", desc: "Clients with 10+ bookings", count: Math.round(baseRecipientCount * 0.17) },
    { value: "birthday-month", label: "Birthday This Month", desc: "Clients celebrating birthdays this month", count: Math.round(baseRecipientCount * 0.05) }
  ]

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing?tab=campaigns" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
        <p className="text-gray-500 mt-1">Send a one-time message to your clients</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 overflow-x-auto">
        <div className="mx-auto flex min-w-[720px] max-w-3xl items-center justify-between">
          {[
            { num: 1, label: "Basics" },
            { num: 2, label: "Audience" },
            { num: 3, label: "Content" },
            { num: 4, label: "Schedule" }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm ${
                step >= s.num 
                  ? "bg-violet-600 text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {s.num}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= s.num ? "text-gray-900" : "text-gray-400"
              }`}>
                {s.label}
              </span>
              {i < 3 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step > s.num ? "bg-violet-600" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Step 1: Basics */}
        {step === 1 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Campaign Basics</h2>
                  <p className="text-sm text-gray-500">Name your campaign and choose the type</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input
                    value={campaign.name}
                    onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                    placeholder="e.g., Summer Sale, New Class Announcement, Holiday Special"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Campaign Type</Label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { value: "email", label: "Email Only", icon: Mail, color: "violet", desc: "Send via email" },
                      { value: "sms", label: "SMS Only", icon: MessageSquare, color: "blue", desc: "Send via text" },
                      { value: "both", label: "Email + SMS", icon: Send, color: "teal", desc: "Send both" }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setCampaign({ ...campaign, type: type.value as typeof campaign.type })}
                        className={`p-6 border-2 rounded-xl text-center transition-all ${
                          campaign.type === type.value 
                            ? `border-${type.color}-500 bg-${type.color}-50` 
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <type.icon className={`h-8 w-8 mx-auto mb-3 ${
                          campaign.type === type.value ? `text-${type.color}-600` : "text-gray-400"
                        }`} />
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Target Audience</h2>
                  <p className="text-sm text-gray-500">Choose who will receive this campaign</p>
                </div>
              </div>

              {/* Location Filter */}
              {locations.length > 2 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium text-gray-700">Filter by Location</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => setCampaign({ ...campaign, targetLocation: location.id })}
                        className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          campaign.targetLocation === location.id
                            ? "bg-violet-600 text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                        }`}
                      >
                        {campaign.targetLocation === location.id && <Check className="h-3 w-3" />}
                        <span>{location.name}</span>
                        <Badge variant="secondary" className={`text-xs ${
                          campaign.targetLocation === location.id ? "bg-violet-500 text-white" : ""
                        }`}>
                          {location.clientCount}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {audienceOptions.map((audience) => (
                  <button
                    key={audience.value}
                    type="button"
                    onClick={() => setCampaign({ ...campaign, targetAudience: audience.value })}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center justify-between ${
                      campaign.targetAudience === audience.value 
                        ? "border-violet-500 bg-violet-50" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{audience.label}</p>
                      <p className="text-sm text-gray-500">{audience.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{audience.count}</p>
                      <p className="text-xs text-gray-500">recipients</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Content */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Email Content */}
            {(campaign.type === "email" || campaign.type === "both") && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Email Content</h2>
                        <p className="text-sm text-gray-500">Compose your email message</p>
                      </div>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Start from a template (optional)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {emailTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => applyEmailTemplate(template.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                            selectedEmailTemplate === template.id
                              ? "bg-violet-600 text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                          }`}
                        >
                          {selectedEmailTemplate === template.id && <Check className="h-3 w-3" />}
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={campaign.emailSubject}
                        onChange={(e) => {
                          setCampaign({ ...campaign, emailSubject: e.target.value })
                          setSelectedEmailTemplate(null)
                        }}
                        placeholder="Enter a compelling subject line"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preview Text (optional)</Label>
                      <Input
                        value={campaign.emailPreheader}
                        onChange={(e) => setCampaign({ ...campaign, emailPreheader: e.target.value })}
                        placeholder="Text that appears after the subject in inbox"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email Body</Label>
                      <Textarea
                        value={campaign.emailBody}
                        onChange={(e) => {
                          setCampaign({ ...campaign, emailBody: e.target.value })
                          setSelectedEmailTemplate(null)
                        }}
                        placeholder="Write your email message here..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-2">Available Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {["{firstName}", "{lastName}", "{studioName}", "{bookingLink}"].map((v) => (
                          <code 
                            key={v} 
                            className="text-xs bg-white px-2 py-1 rounded border border-gray-200 cursor-pointer hover:bg-violet-50"
                            onClick={() => setCampaign({ ...campaign, emailBody: campaign.emailBody + v })}
                          >
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SMS Content */}
            {(campaign.type === "sms" || campaign.type === "both") && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">SMS Content</h2>
                        <p className="text-sm text-gray-500">Compose your text message</p>
                      </div>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Start from a template (optional)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {smsTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => applySmsTemplate(template.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                            selectedSmsTemplate === template.id
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {selectedSmsTemplate === template.id && <Check className="h-3 w-3" />}
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Message</Label>
                        <span className={`text-xs ${
                          campaign.smsBody.length > 160 ? "text-red-500" : "text-gray-500"
                        }`}>
                          {campaign.smsBody.length}/160 characters
                        </span>
                      </div>
                      <Textarea
                        value={campaign.smsBody}
                        onChange={(e) => {
                          setCampaign({ ...campaign, smsBody: e.target.value })
                          setSelectedSmsTemplate(null)
                        }}
                        placeholder="Write your SMS message here..."
                        rows={4}
                        maxLength={320}
                      />
                      {campaign.smsBody.length > 160 && (
                        <p className="text-xs text-amber-600">
                          Messages over 160 characters will be sent as multiple texts
                        </p>
                      )}
                    </div>

                    {/* SMS Preview */}
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <p className="text-xs text-gray-400 mb-2">Preview</p>
                      <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-bl-none max-w-xs text-sm">
                        {campaign.smsBody || "Your message will appear here..."}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Schedule & Send</h2>
                  <p className="text-sm text-gray-500">Choose when to send your campaign</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCampaign({ ...campaign, scheduleType: "now" })}
                    className={`p-6 border-2 rounded-xl text-center transition-all ${
                      campaign.scheduleType === "now"
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Send className={`h-8 w-8 mx-auto mb-3 ${
                      campaign.scheduleType === "now" ? "text-violet-600" : "text-gray-400"
                    }`} />
                    <p className="font-medium text-gray-900">Send Now</p>
                    <p className="text-sm text-gray-500 mt-1">Send immediately</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaign({ ...campaign, scheduleType: "scheduled" })}
                    className={`p-6 border-2 rounded-xl text-center transition-all ${
                      campaign.scheduleType === "scheduled"
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Clock className={`h-8 w-8 mx-auto mb-3 ${
                      campaign.scheduleType === "scheduled" ? "text-violet-600" : "text-gray-400"
                    }`} />
                    <p className="font-medium text-gray-900">Schedule</p>
                    <p className="text-sm text-gray-500 mt-1">Send later</p>
                  </button>
                </div>

                {campaign.scheduleType === "scheduled" && (
                  <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-xl md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={campaign.scheduledDate}
                        onChange={(e) => setCampaign({ ...campaign, scheduledDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={campaign.scheduledTime}
                        onChange={(e) => setCampaign({ ...campaign, scheduledTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                  <h3 className="font-medium text-violet-900 mb-3">Campaign Summary</h3>
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-violet-600">Name</p>
                      <p className="font-medium text-violet-900">{campaign.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-violet-600">Type</p>
                      <p className="font-medium text-violet-900 capitalize">{campaign.type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-violet-600">Location</p>
                      <p className="font-medium text-violet-900">{selectedLocation?.name || "All Locations"}</p>
                    </div>
                    <div>
                      <p className="text-violet-600">Audience</p>
                      <p className="font-medium text-violet-900 capitalize">{campaign.targetAudience?.replace(/-/g, " ") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-violet-600">Recipients</p>
                      <p className="font-medium text-violet-900">
                        {audienceOptions.find(a => a.value === campaign.targetAudience)?.count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-violet-600">Delivery</p>
                      <p className="font-medium text-violet-900">
                        {campaign.scheduleType === "now" ? "Send immediately" : 
                          campaign.scheduledDate && campaign.scheduledTime 
                            ? `${campaign.scheduledDate} at ${campaign.scheduledTime}`
                            : "-"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : router.push("/studio/marketing?tab=campaigns")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {step === 4 && (
              <Button variant="outline" className="w-full sm:w-auto">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
              >
                {saving ? "Sending..." : campaign.scheduleType === "now" ? "Send Campaign" : "Schedule Campaign"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
