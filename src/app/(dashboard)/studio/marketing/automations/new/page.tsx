"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  Gift,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  UserPlus,
  UserX,
  Zap,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  DELAY_UNIT_OPTIONS,
  DelayUnit,
  formatDelayLabel,
  splitDelayMinutes,
  toDelayMinutes,
} from "@/lib/automation-delay"

const TRIGGERS = [
  {
    value: "WELCOME",
    label: "Client Signs Up",
    description: "Start onboarding when a new client joins",
    icon: UserPlus,
    badgeClass: "bg-violet-100 text-violet-700",
  },
  {
    value: "BOOKING_CONFIRMED",
    label: "Booking Confirmed",
    description: "Send sequence after a booking is made",
    icon: CalendarClock,
    badgeClass: "bg-blue-100 text-blue-700",
  },
  {
    value: "BOOKING_CANCELLED",
    label: "Booking Cancelled",
    description: "Recover cancelled bookings with follow-ups",
    icon: UserX,
    badgeClass: "bg-rose-100 text-rose-700",
  },
  {
    value: "CLASS_REMINDER",
    label: "Class Reminder",
    description: "Remind clients before upcoming classes",
    icon: Bell,
    badgeClass: "bg-amber-100 text-amber-700",
  },
  {
    value: "CLASS_FOLLOWUP",
    label: "Class Follow-up",
    description: "Send message after class completion",
    icon: MessageSquare,
    badgeClass: "bg-teal-100 text-teal-700",
  },
  {
    value: "CLIENT_INACTIVE",
    label: "Client Inactive",
    description: "Win-back clients inactive for X days",
    icon: Zap,
    badgeClass: "bg-orange-100 text-orange-700",
  },
  {
    value: "BIRTHDAY",
    label: "Birthday",
    description: "Celebrate clients on their birthday",
    icon: Gift,
    badgeClass: "bg-pink-100 text-pink-700",
  },
  {
    value: "MEMBERSHIP_EXPIRING",
    label: "Membership Expiring",
    description: "Nudge renewals before plan expiry",
    icon: CalendarClock,
    badgeClass: "bg-indigo-100 text-indigo-700",
  },
] as const

type TriggerValue = (typeof TRIGGERS)[number]["value"]

type StepForm = {
  id: string
  channel: "EMAIL" | "SMS"
  delayValue: number
  delayUnit: DelayUnit
  subject: string
  body: string
}

type Location = {
  id: string
  name: string
  isActive?: boolean
}

function makeStep(index: number): StepForm {
  const seedDelay = index === 0 ? 0 : index * 24 * 60
  const initialDelay = splitDelayMinutes(seedDelay)
  return {
    id: `step-${index + 1}`,
    channel: index % 2 === 0 ? "EMAIL" : "SMS",
    delayValue: initialDelay.value,
    delayUnit: initialDelay.unit,
    subject: index === 0 ? "Welcome to {{studioName}}" : "",
    body: "",
  }
}

export default function NewAutomationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState<TriggerValue>("WELCOME")
  const [triggerDays, setTriggerDays] = useState(30)
  const [reminderHours, setReminderHours] = useState(24)
  const [stopOnBooking, setStopOnBooking] = useState(true)
  const [locationId, setLocationId] = useState<string>("all")
  const [steps, setSteps] = useState<StepForm[]>([makeStep(0)])
  const [locations, setLocations] = useState<Location[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTrigger = useMemo(
    () => TRIGGERS.find((item) => item.value === trigger) ?? TRIGGERS[0],
    [trigger]
  )

  const locationOptions = useMemo(
    () => [{ id: "all", name: "All locations" }, ...locations.filter((loc) => loc.isActive !== false)],
    [locations]
  )

  useEffect(() => {
    const triggerFromQuery = searchParams.get("trigger")
    if (!triggerFromQuery) return

    const matched = TRIGGERS.find((item) => item.value === triggerFromQuery)
    if (!matched) return

    setTrigger(matched.value)
  }, [searchParams])

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/studio/locations")
        if (res.ok) {
          const data = await res.json()
          setLocations(data)
        }
      } catch (err) {
        console.error("Failed to fetch locations", err)
      }
    }
    fetchLocations()
  }, [])

  const updateStep = (stepId: string, patch: Partial<StepForm>) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...patch } : step)))
  }

  const addStep = () => {
    setSteps((prev) => [...prev, makeStep(prev.length)])
  }

  const removeStep = (stepId: string) => {
    setSteps((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((step) => step.id !== stepId)
    })
  }

  const canSave =
    name.trim().length > 0 &&
    steps.length > 0 &&
    steps.every((step) => {
      if (!step.body.trim()) return false
      if (step.channel === "EMAIL" && !step.subject.trim()) return false
      if (step.delayValue < 0) return false
      return true
    })

  const handleSave = async () => {
    if (!canSave) {
      setError("Complete all required fields before saving")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: name.trim(),
        trigger,
        triggerDays: trigger === "CLIENT_INACTIVE" || trigger === "MEMBERSHIP_EXPIRING" ? triggerDays : undefined,
        reminderHours: trigger === "CLASS_REMINDER" ? reminderHours : undefined,
        locationId: locationId === "all" ? null : locationId,
        stopOnBooking,
        steps: steps.map((step, index) => ({
          id: `step-${index + 1}`,
          order: index,
          channel: step.channel,
          subject: step.channel === "EMAIL" ? step.subject.trim() : null,
          body: step.body,
          htmlBody: null,
          delayMinutes: toDelayMinutes(step.delayValue, step.delayUnit),
        })),
      }

      const res = await fetch("/api/studio/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || "Failed to create automation")
        return
      }

      router.push("/studio/marketing")
    } catch (err) {
      console.error("Failed to create automation", err)
      setError("Failed to create automation")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="mb-8">
        <Link href="/studio/marketing" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Automation Chain</h1>
        <p className="mt-1 text-gray-500">Build multi-step email and SMS sequences from one trigger.</p>
      </div>

      <div className="max-w-5xl space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Step 1</p>
            <p className="text-sm font-medium text-violet-900">Choose Trigger</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step 2</p>
            <p className="text-sm font-medium text-blue-900">Build Sequence</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Step 3</p>
            <p className="text-sm font-medium text-emerald-900">Activate</p>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <selectedTrigger.icon className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900">Trigger & Rules</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="automation-name">Automation Name</Label>
              <Input
                id="automation-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. New Client Onboarding"
                className="text-base"
              />
            </div>

            <div className="space-y-3">
              <Label>Trigger</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {TRIGGERS.map((item) => {
                  const Icon = item.icon
                  const isActive = trigger === item.value

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTrigger(item.value)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        isActive
                          ? "border-violet-400 bg-violet-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.badgeClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(trigger === "CLIENT_INACTIVE" || trigger === "MEMBERSHIP_EXPIRING") && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Label>{trigger === "CLIENT_INACTIVE" ? "Inactive days" : "Days before expiry"}</Label>
                <Input
                  type="number"
                  value={triggerDays}
                  onChange={(e) => setTriggerDays(Math.max(1, Number(e.target.value || 1)))}
                  min={1}
                  max={365}
                  className="max-w-[220px] bg-white"
                />
              </div>
            )}

            {trigger === "CLASS_REMINDER" && (
              <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Label>Hours before class</Label>
                <Input
                  type="number"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(Math.max(1, Number(e.target.value || 1)))}
                  min={1}
                  max={168}
                  className="max-w-[220px] bg-white"
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div>
                <p className="text-sm font-medium text-emerald-900">Stop chain if client books</p>
                <p className="text-xs text-emerald-700">Recommended for nurture and reactivation sequences.</p>
              </div>
              <Switch checked={stopOnBooking} onCheckedChange={setStopOnBooking} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sequence Steps</h2>
              <Button type="button" variant="outline" onClick={addStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Step {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                      disabled={steps.length <= 1}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Channel</Label>
                      <Select value={step.channel} onValueChange={(value) => updateStep(step.id, { channel: value as "EMAIL" | "SMS" })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMAIL">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </div>
                          </SelectItem>
                          <SelectItem value="SMS">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              SMS
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Send after trigger</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          value={step.delayValue}
                          min={0}
                          onChange={(e) => updateStep(step.id, { delayValue: Math.max(0, Number(e.target.value || 0)) })}
                        />
                        <Select
                          value={step.delayUnit}
                          onValueChange={(value) => updateStep(step.id, { delayUnit: value as DelayUnit })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DELAY_UNIT_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option[0].toUpperCase() + option.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">This step sends {formatDelayLabel(step.delayValue, step.delayUnit)} after trigger.</p>

                  {step.channel === "EMAIL" && (
                    <div className="mt-4 space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={step.subject}
                        onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                        placeholder="e.g. Quick check-in from {{studioName}}"
                      />
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      rows={5}
                      value={step.body}
                      onChange={(e) => updateStep(step.id, { body: e.target.value })}
                      placeholder="Use variables like {{firstName}}, {{studioName}}, {{className}}"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Link href="/studio/marketing">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || !canSave} className="bg-violet-600 hover:bg-violet-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Automation
          </Button>
        </div>
      </div>
    </div>
  )
}
