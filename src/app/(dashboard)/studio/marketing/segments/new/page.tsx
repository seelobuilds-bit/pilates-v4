"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Plus,
  Trash2,
  Filter,
  Users,
  Save,
  Loader2
} from "lucide-react"

interface Condition {
  id: string
  field: string
  operator: string
  value: string
}

const fieldOptions = [
  { value: "last_booking", label: "Last Booking Date" },
  { value: "total_bookings", label: "Total Bookings" },
  { value: "signup_date", label: "Signup Date" },
  { value: "credits", label: "Credits Balance" },
  { value: "birthday_month", label: "Birthday Month" },
  { value: "class_type", label: "Class Type Attended" },
  { value: "location", label: "Preferred Location" },
  { value: "email_opened", label: "Email Engagement" },
  { value: "status", label: "Account Status" }
]

const operatorOptions: Record<string, { value: string; label: string }[]> = {
  last_booking: [
    { value: "within_days", label: "Within last X days" },
    { value: "not_within_days", label: "Not within last X days" },
    { value: "before", label: "Before date" },
    { value: "after", label: "After date" }
  ],
  total_bookings: [
    { value: "gte", label: "Greater than or equal to" },
    { value: "lte", label: "Less than or equal to" },
    { value: "eq", label: "Equal to" },
    { value: "between", label: "Between" }
  ],
  signup_date: [
    { value: "within_days", label: "Within last X days" },
    { value: "before", label: "Before date" },
    { value: "after", label: "After date" }
  ],
  credits: [
    { value: "gte", label: "Greater than or equal to" },
    { value: "lte", label: "Less than or equal to" },
    { value: "eq", label: "Equal to" }
  ],
  birthday_month: [
    { value: "eq", label: "Is month" },
    { value: "current", label: "Current month" },
    { value: "next", label: "Next month" }
  ],
  class_type: [
    { value: "attended", label: "Has attended" },
    { value: "not_attended", label: "Has not attended" }
  ],
  location: [
    { value: "eq", label: "Is" },
    { value: "neq", label: "Is not" }
  ],
  email_opened: [
    { value: "opened_recent", label: "Opened email in last X days" },
    { value: "not_opened_recent", label: "Not opened email in last X days" }
  ],
  status: [
    { value: "eq", label: "Is" }
  ]
}

export default function NewSegmentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [matchType, setMatchType] = useState<"all" | "any">("all")
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "1", field: "", operator: "", value: "" }
  ])
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null)

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now().toString(), field: "", operator: "", value: "" }
    ])
  }

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id))
    }
  }

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ))
  }

  const previewSegment = () => {
    // Simulate calculating segment size
    const randomCount = Math.floor(Math.random() * 150) + 10
    setEstimatedCount(randomCount)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/studio/marketing?tab=segments")
  }

  const isValid = name && conditions.every(c => c.field && c.operator && c.value)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Segment</h1>
        <p className="text-gray-500 mt-1">Build a custom audience segment for targeted campaigns</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Segment Details</h2>
                <p className="text-sm text-gray-500">Name and describe your segment</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Segment Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Active Reformer Clients, High Value Customers"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this segment represents"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Filter className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conditions</h2>
                <p className="text-sm text-gray-500">Define who belongs in this segment</p>
              </div>
            </div>

            {/* Match Type */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Include clients who match</span>
                <Select value={matchType} onValueChange={(v: "all" | "any") => setMatchType(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">of the following conditions:</span>
              </div>
            </div>

            {/* Condition Rows */}
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-3">
                  {index > 0 && (
                    <span className="text-sm text-gray-400 w-12 text-center">
                      {matchType === "all" ? "AND" : "OR"}
                    </span>
                  )}
                  {index === 0 && <div className="w-12" />}
                  
                  <Select
                    value={condition.field}
                    onValueChange={(v) => updateCondition(condition.id, { field: v, operator: "", value: "" })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(v) => updateCondition(condition.id, { operator: v })}
                    disabled={!condition.field}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {condition.field && operatorOptions[condition.field]?.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder="Value"
                    className="w-32"
                    disabled={!condition.operator}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    disabled={conditions.length === 1}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addCondition}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                <p className="text-sm text-gray-500">See how many clients match your criteria</p>
              </div>
              <div className="flex items-center gap-4">
                {estimatedCount !== null && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-violet-600">{estimatedCount}</p>
                    <p className="text-xs text-gray-500">estimated clients</p>
                  </div>
                )}
                <Button variant="outline" onClick={previewSegment} disabled={!isValid}>
                  Calculate Size
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link href="/studio/marketing">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Creating..." : "Create Segment"}
          </Button>
        </div>
      </div>
    </div>
  )
}
