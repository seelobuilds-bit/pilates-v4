"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Loader2, Mail, MessageSquare, Settings2 } from "lucide-react"
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

type StepForm = {
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

type AutomationResponse = {
  id: string
  name: string
  trigger:
    | "WELCOME"
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "CLASS_REMINDER"
    | "CLASS_FOLLOWUP"
    | "CLIENT_INACTIVE"
    | "BIRTHDAY"
    | "MEMBERSHIP_EXPIRING"
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"
  triggerDays: number | null
  reminderHours: number | null
  locationId: string | null
  stopOnBooking?: boolean
  channel: "EMAIL" | "SMS"
  subject: string | null
  body: string
  steps?: Array<{
    id: string
    order: number
    channel: "EMAIL" | "SMS"
    subject: string | null
    body: string
    delayMinutes: number
  }>
  triggerDelay?: number
}

const TRIGGERS = [
  { value: "WELCOME", label: "Client Signs Up" },
  { value: "BOOKING_CONFIRMED", label: "Booking Confirmed" },
  { value: "BOOKING_CANCELLED", label: "Booking Cancelled" },
  { value: "CLASS_REMINDER", label: "Class Reminder" },
  { value: "CLASS_FOLLOWUP", label: "Class Follow-up" },
  { value: "CLIENT_INACTIVE", label: "Client Inactive" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "MEMBERSHIP_EXPIRING", label: "Membership Expiring" },
] as const

function getDefaultStep(): StepForm {
  return {
    channel: "EMAIL",
    delayValue: 0,
    delayUnit: "minutes",
    subject: "",
    body: "",
  }
}

export default function AutomationConfigPage({
  params,
}: {
  params: Promise<{ automationId: string }>
}) {
  const { automationId } = use(params)
  const router = useRouter()

  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState<(typeof TRIGGERS)[number]["value"]>("WELCOME")
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED">("DRAFT")
  const [triggerDays, setTriggerDays] = useState(30)
  const [reminderHours, setReminderHours] = useState(24)
  const [stopOnBooking, setStopOnBooking] = useState(true)
  const [locationId, setLocationId] = useState<string>("all")
  const [step, setStep] = useState<StepForm>(getDefaultStep())
  const [locations, setLocations] = useState<Location[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationOptions = useMemo(
    () => [{ id: "all", name: "All locations" }, ...locations.filter((loc) => loc.isActive !== false)],
    [locations]
  )

  useEffect(() => {
    async function load() {
      try {
        const [automationRes, locationsRes] = await Promise.all([
          fetch(`/api/studio/automations/${automationId}`),
          fetch("/api/studio/locations"),
        ])

        if (!automationRes.ok) {
          setError("Failed to load automation")
          return
        }

        const automationData = await automationRes.json()
        const automation = automationData.automation as AutomationResponse

        setName(automation.name)
        setTrigger(automation.trigger)
        setStatus(automation.status)
        setTriggerDays(automation.triggerDays ?? 30)
        setReminderHours(automation.reminderHours ?? 24)
        setStopOnBooking(Boolean(automation.stopOnBooking))
        setLocationId(automation.locationId ?? "all")

        const primaryStep =
          Array.isArray(automation.steps) && automation.steps.length > 0
            ? [...automation.steps].sort((a, b) => a.order - b.order)[0]
            : {
                channel: automation.channel,
                subject: automation.subject,
                body: automation.body,
                delayMinutes: Number(automation.triggerDelay || 0),
              }

        const splitDelay = splitDelayMinutes(Number(primaryStep.delayMinutes || 0))
        setStep({
          channel: primaryStep.channel,
          delayValue: splitDelay.value,
          delayUnit: splitDelay.unit,
          subject: primaryStep.subject || "",
          body: primaryStep.body || "",
        })

        if (locationsRes.ok) {
          const data = await locationsRes.json()
          setLocations(data)
        }
      } catch (err) {
        console.error("Failed to load automation", err)
        setError("Failed to load automation")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [automationId])

  const canSave = name.trim().length > 0 && step.body.trim().length > 0 && (step.channel !== "EMAIL" || step.subject.trim().length > 0)

  const buildPayload = () => ({
    name: name.trim(),
    trigger,
    status,
    triggerDays: trigger === "CLIENT_INACTIVE" || trigger === "MEMBERSHIP_EXPIRING" ? triggerDays : undefined,
    reminderHours: trigger === "CLASS_REMINDER" ? reminderHours : undefined,
    locationId: locationId === "all" ? null : locationId,
    stopOnBooking,
    steps: [
      {
        id: "step-1",
        order: 0,
        channel: step.channel,
        subject: step.channel === "EMAIL" ? step.subject.trim() : null,
        body: step.body,
        htmlBody: null,
        delayMinutes: toDelayMinutes(step.delayValue, step.delayUnit),
      },
    ],
  })

  const handleSave = async () => {
    if (!canSave) {
      setError("Complete all required fields before saving")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/studio/automations/${automationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || "Failed to save automation")
        return
      }

      router.push("/studio/marketing")
    } catch (err) {
      console.error("Failed to save automation", err)
      setError("Failed to save automation")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this automation? This cannot be undone.")
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/studio/automations/${automationId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || "Failed to delete automation")
        return
      }
      router.push("/studio/marketing")
    } catch (err) {
      console.error("Failed to delete automation", err)
      setError("Failed to delete automation")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="mb-8">
        <Link href="/studio/marketing" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Automation</h1>
        <p className="mt-1 text-gray-500">Update trigger rules, timing, and message content.</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900">Automation Settings</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="automation-name">Automation Name</Label>
              <Input id="automation-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select value={trigger} onValueChange={(value) => setTrigger(value as (typeof TRIGGERS)[number]["value"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-2">
                <Label>{trigger === "CLIENT_INACTIVE" ? "Inactive days" : "Days before expiry"}</Label>
                <Input
                  type="number"
                  value={triggerDays}
                  onChange={(e) => setTriggerDays(Math.max(1, Number(e.target.value || 1)))}
                  min={1}
                  max={365}
                  className="max-w-[220px]"
                />
              </div>
            )}

            {trigger === "CLASS_REMINDER" && (
              <div className="space-y-2">
                <Label>Hours before class</Label>
                <Input
                  type="number"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(Math.max(1, Number(e.target.value || 1)))}
                  min={1}
                  max={168}
                  className="max-w-[220px]"
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div>
                <p className="text-sm font-medium text-emerald-900">Stop chain if client books</p>
                <p className="text-xs text-emerald-700">When enabled, this step pauses after qualifying bookings.</p>
              </div>
              <Switch checked={stopOnBooking} onCheckedChange={setStopOnBooking} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Message Step</h2>

            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2 md:col-span-2">
                <Label>Channel</Label>
                <Select value={step.channel} onValueChange={(value) => setStep((prev) => ({ ...prev, channel: value as "EMAIL" | "SMS" }))}>
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
                    onChange={(e) => setStep((prev) => ({ ...prev, delayValue: Math.max(0, Number(e.target.value || 0)) }))}
                  />
                  <Select
                    value={step.delayUnit}
                    onValueChange={(value) => setStep((prev) => ({ ...prev, delayUnit: value as DelayUnit }))}
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

            <p className="text-xs text-gray-500">This step sends {formatDelayLabel(step.delayValue, step.delayUnit)} after trigger.</p>

            {step.channel === "EMAIL" && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={step.subject} onChange={(e) => setStep((prev) => ({ ...prev, subject: e.target.value }))} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={6} value={step.body} onChange={(e) => setStep((prev) => ({ ...prev, body: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </Button>

          <div className="flex items-center gap-3">
            <Link href="/studio/marketing">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving || !canSave} className="bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
