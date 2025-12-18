"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Clock,
  Target,
  Zap,
  Save,
  Loader2,
  UserPlus,
  Calendar,
  Gift,
  TrendingUp,
  Bell,
  Star,
  MapPin,
  Check
} from "lucide-react"

interface Location {
  id: string
  name: string
  isActive: boolean
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

export default function NewAutomationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  
  const [automation, setAutomation] = useState({
    name: "",
    trigger: "",
    inactivityDays: 30,
    reminderHours: 24,
    emailEnabled: true,
    smsEnabled: false,
    delay: 0,
    delayUnit: "hours" as "hours" | "days",
    sendTime: "10:00",
    targetAudience: "all_clients",
    targetLocation: "all",
    emailSubject: "",
    emailBody: "",
    smsBody: ""
  })

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/studio/locations")
        if (res.ok) {
          const data = await res.json()
          setLocations(data)
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error)
      }
    }
    fetchLocations()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/studio/marketing")
  }

  const selectedTrigger = triggerTypes.find(t => t.id === automation.trigger)
  const activeLocations = locations.filter(l => l.isActive)

  const canProceed = () => {
    switch (step) {
      case 1:
        return automation.name && automation.trigger
      case 2:
        return automation.emailEnabled || automation.smsEnabled
      case 3:
        if (automation.emailEnabled && (!automation.emailSubject || !automation.emailBody)) return false
        if (automation.smsEnabled && !automation.smsBody) return false
        return true
      default:
        return false
    }
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Automation</h1>
        <p className="text-gray-500 mt-1">Set up automated messages based on client behavior</p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Trigger" },
            { num: 2, label: "Audience & Timing" },
            { num: 3, label: "Content" }
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
              {i < 2 && (
                <div className={`w-24 h-0.5 mx-4 ${
                  step > s.num ? "bg-violet-600" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Step 1: Trigger */}
        {step === 1 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Automation Basics</h2>
                  <p className="text-sm text-gray-500">Name your automation and choose when it triggers</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Automation Name</Label>
                  <Input
                    value={automation.name}
                    onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                    placeholder="e.g., Welcome New Clients, Class Reminder"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Trigger Event</Label>
                  <p className="text-sm text-gray-500">When should this automation run?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {triggerTypes.map((trigger) => (
                      <button
                        key={trigger.id}
                        type="button"
                        onClick={() => setAutomation({ ...automation, trigger: trigger.id })}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          automation.trigger === trigger.id 
                            ? "border-violet-500 bg-violet-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <trigger.icon className={`h-5 w-5 ${
                            automation.trigger === trigger.id ? "text-violet-600" : "text-gray-400"
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{trigger.label}</p>
                            <p className="text-xs text-gray-500">{trigger.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trigger-specific settings */}
                {automation.trigger === "inactivity" && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
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
                        value={automation.inactivityDays}
                        onChange={(e) => setAutomation({ ...automation, inactivityDays: parseInt(e.target.value) || 30 })}
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

                {automation.trigger === "reminder" && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
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
                        value={automation.reminderHours}
                        onChange={(e) => setAutomation({ ...automation, reminderHours: parseInt(e.target.value) || 24 })}
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Audience & Timing */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Channels */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
                    <p className="text-sm text-gray-500">Choose how to deliver this automation</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAutomation({ ...automation, emailEnabled: !automation.emailEnabled })}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      automation.emailEnabled ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        automation.emailEnabled ? "bg-violet-500" : "bg-gray-100"
                      }`}>
                        <Mail className={`h-5 w-5 ${automation.emailEnabled ? "text-white" : "text-gray-400"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-500">Send via email</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutomation({ ...automation, smsEnabled: !automation.smsEnabled })}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      automation.smsEnabled ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        automation.smsEnabled ? "bg-blue-500" : "bg-gray-100"
                      }`}>
                        <MessageSquare className={`h-5 w-5 ${automation.smsEnabled ? "text-white" : "text-gray-400"}`} />
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

            {/* Target Audience & Location */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Target Audience</h2>
                    <p className="text-sm text-gray-500">Who should receive this automation</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Audience Type</Label>
                    <Select
                      value={automation.targetAudience}
                      onValueChange={(value) => setAutomation({ ...automation, targetAudience: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_clients">All Clients</SelectItem>
                        <SelectItem value="new_clients">New Clients</SelectItem>
                        <SelectItem value="active_clients">Active Clients</SelectItem>
                        <SelectItem value="inactive_clients">Inactive Clients</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  {activeLocations.length > 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-violet-500" />
                        <Label>Filter by Location</Label>
                      </div>
                      <p className="text-sm text-gray-500">Target clients from specific locations</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAutomation({ ...automation, targetLocation: "all" })}
                          className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                            automation.targetLocation === "all"
                              ? "bg-violet-600 text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                          }`}
                        >
                          {automation.targetLocation === "all" && <Check className="h-3 w-3" />}
                          All Locations
                        </button>
                        {activeLocations.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => setAutomation({ ...automation, targetLocation: location.id })}
                            className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                              automation.targetLocation === location.id
                                ? "bg-violet-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                            }`}
                          >
                            {automation.targetLocation === location.id && <Check className="h-3 w-3" />}
                            {location.name}
                          </button>
                        ))}
                      </div>
                      {automation.targetLocation !== "all" && (
                        <p className="text-xs text-violet-600">
                          Only clients who primarily book at this location will receive this automation
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timing */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Timing</h2>
                    <p className="text-sm text-gray-500">Configure when messages are sent after the trigger</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Delay</Label>
                    <Input
                      type="number"
                      value={automation.delay}
                      onChange={(e) => setAutomation({ ...automation, delay: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={automation.delayUnit}
                      onValueChange={(value: "hours" | "days") => setAutomation({ ...automation, delayUnit: value })}
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
                      value={automation.sendTime}
                      onValueChange={(value) => setAutomation({ ...automation, sendTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediately</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="17:00">5:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedTrigger && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Summary:</strong> Send {automation.delay === 0 ? "immediately" : `${automation.delay} ${automation.delayUnit}`} after{" "}
                      <span className="text-violet-600">{selectedTrigger.label.toLowerCase()}</span>
                      {automation.sendTime !== "immediate" && ` at ${automation.sendTime}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Content */}
        {step === 3 && (
          <div className="space-y-6">
            {automation.emailEnabled && (
              <Card className="border-0 shadow-sm border-l-4 border-l-violet-500">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Email Content</h2>
                      <p className="text-sm text-gray-500">Compose your email message</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={automation.emailSubject}
                        onChange={(e) => setAutomation({ ...automation, emailSubject: e.target.value })}
                        placeholder="Enter email subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email Body</Label>
                      <Textarea
                        value={automation.emailBody}
                        onChange={(e) => setAutomation({ ...automation, emailBody: e.target.value })}
                        placeholder="Write your email message..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {automation.smsEnabled && (
              <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">SMS Content</h2>
                      <p className="text-sm text-gray-500">Compose your text message</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Message</Label>
                        <span className={`text-xs ${
                          automation.smsBody.length > 160 ? "text-amber-600" : "text-gray-500"
                        }`}>
                          {automation.smsBody.length}/160 characters
                        </span>
                      </div>
                      <Textarea
                        value={automation.smsBody}
                        onChange={(e) => setAutomation({ ...automation, smsBody: e.target.value })}
                        placeholder="Write your SMS message..."
                        rows={4}
                      />
                    </div>

                    {/* SMS Preview */}
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <p className="text-xs text-gray-400 mb-2">Preview</p>
                      <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-bl-none max-w-xs text-sm">
                        {automation.smsBody || "Your message will appear here..."}
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
                <div className="flex flex-wrap gap-2">
                  {["{firstName}", "{lastName}", "{studioName}", "{className}", "{date}", "{time}", "{location}", "{bookingLink}"].map((v) => (
                    <code key={v} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                      {v}
                    </code>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-0 shadow-sm bg-violet-50">
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-3">Automation Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Trigger:</strong> {selectedTrigger?.label}
                    {automation.trigger === "inactivity" && ` (${automation.inactivityDays} days)`}
                    {automation.trigger === "reminder" && ` (${automation.reminderHours} hours before)`}
                  </p>
                  <p><strong>Timing:</strong> {automation.delay === 0 ? "Immediately" : `${automation.delay} ${automation.delayUnit}`} after trigger</p>
                  <p><strong>Channels:</strong> {[automation.emailEnabled && "Email", automation.smsEnabled && "SMS"].filter(Boolean).join(", ")}</p>
                  <p><strong>Audience:</strong> {automation.targetAudience.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                  {automation.targetLocation !== "all" && (
                    <p><strong>Location:</strong> {activeLocations.find(l => l.id === automation.targetLocation)?.name}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : router.push("/studio/marketing")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!canProceed() || saving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Creating..." : "Create Automation"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
