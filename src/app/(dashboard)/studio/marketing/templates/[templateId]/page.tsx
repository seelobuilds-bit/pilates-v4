"use client"

import { useState, useEffect, use } from "react"
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
  FileText,
  Save,
  Loader2,
  Eye,
  Send,
  Trash2,
  Copy
} from "lucide-react"

interface Template {
  id: string
  name: string
  type: "email" | "sms"
  category: string
  subject?: string
  body: string
  usedCount: number
  createdAt: string
  updatedAt: string
}

const templateData: Record<string, Template> = {
  "welcome-email": {
    id: "welcome-email",
    name: "Welcome Email",
    type: "email",
    category: "Onboarding",
    subject: "Welcome to {studioName}!",
    body: "Hi {firstName},\n\nWelcome to {studioName}! We're so excited to have you join our community.\n\nHere's what you need to know:\n• Arrive 10 minutes early for your first class\n• Wear comfortable clothing\n• We provide all equipment\n• Water bottles are welcome\n\nReady to book your first class? Click below to get started.\n\nSee you on the mat!\n{studioName}",
    usedCount: 24,
    createdAt: "Nov 15, 2024",
    updatedAt: "Dec 10, 2024"
  },
  "class-reminder": {
    id: "class-reminder",
    name: "Class Reminder",
    type: "email",
    category: "Reminders",
    subject: "Reminder: {className} tomorrow",
    body: "Hi {firstName},\n\nJust a friendly reminder that you have {className} scheduled for tomorrow:\n\n📅 Date: {date}\n⏰ Time: {time}\n📍 Location: {location}\n👩‍🏫 Teacher: {teacherName}\n\nWe look forward to seeing you!\n\n{studioName}",
    usedCount: 156,
    createdAt: "Oct 1, 2024",
    updatedAt: "Dec 15, 2024"
  },
  "promo-discount": {
    id: "promo-discount",
    name: "Promotion Discount",
    type: "email",
    category: "Promotions",
    subject: "Special offer just for you!",
    body: "Hi {firstName},\n\nWe have an exclusive offer you won't want to miss!\n\nFor a limited time, enjoy [DISCOUNT]% off your next class pack.\n\nUse code: [CODE]\n\nBook now before this offer expires!\n\n{studioName}",
    usedCount: 12,
    createdAt: "Dec 1, 2024",
    updatedAt: "Dec 5, 2024"
  },
  "birthday-wish": {
    id: "birthday-wish",
    name: "Birthday Wishes",
    type: "email",
    category: "Special Events",
    subject: "🎂 Happy Birthday, {firstName}!",
    body: "Happy Birthday, {firstName}! 🎉\n\nWe hope your special day is filled with joy and celebration!\n\nAs a birthday gift from us, enjoy a FREE class on us. Just mention this email when you book.\n\nHave a wonderful birthday!\n\nCheers,\n{studioName}",
    usedCount: 45,
    createdAt: "Sep 20, 2024",
    updatedAt: "Nov 30, 2024"
  },
  "class-reminder-sms": {
    id: "class-reminder-sms",
    name: "Class Reminder SMS",
    type: "sms",
    category: "Reminders",
    body: "Hi {firstName}! Reminder: {className} tomorrow at {time}. See you at {location}! - {studioName}",
    usedCount: 89,
    createdAt: "Oct 15, 2024",
    updatedAt: "Dec 12, 2024"
  },
  "promo-sms": {
    id: "promo-sms",
    name: "Promo SMS",
    type: "sms",
    category: "Promotions",
    body: "Hi {firstName}! Special offer: Get 20% off your next class. Book now: {bookingLink} - {studioName}",
    usedCount: 34,
    createdAt: "Nov 5, 2024",
    updatedAt: "Dec 8, 2024"
  }
}

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)

  useEffect(() => {
    const data = templateData[resolvedParams.templateId]
    if (data) {
      setTemplate(data)
    }
    setLoading(false)
  }, [resolvedParams.templateId])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/studio/marketing?tab=templates")
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this template?")) {
      router.push("/studio/marketing?tab=templates")
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Template not found</p>
          <Link href="/studio/marketing?tab=templates">
            <Button variant="outline">Back to Templates</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing?tab=templates" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              template.type === "sms" ? "bg-blue-100" : "bg-violet-100"
            }`}>
              {template.type === "sms" ? (
                <MessageSquare className="h-6 w-6 text-blue-600" />
              ) : (
                <Mail className="h-6 w-6 text-violet-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary">{template.category}</Badge>
                <span className="text-sm text-gray-500">Used {template.usedCount} times</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/studio/marketing/campaigns/new?template=${template.id}`}>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Use in Campaign
              </Button>
            </Link>
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Details</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <div className={`p-3 rounded-lg border ${
                        template.type === "sms" ? "bg-blue-50 border-blue-200" : "bg-violet-50 border-violet-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          {template.type === "sms" ? (
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Mail className="h-4 w-4 text-violet-600" />
                          )}
                          <span className="font-medium capitalize">{template.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={template.category}
                        onValueChange={(v) => setTemplate({ ...template, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Onboarding">Onboarding</SelectItem>
                          <SelectItem value="Reminders">Reminders</SelectItem>
                          <SelectItem value="Promotions">Promotions</SelectItem>
                          <SelectItem value="Special Events">Special Events</SelectItem>
                          <SelectItem value="Follow-ups">Follow-ups</SelectItem>
                          <SelectItem value="Re-engagement">Re-engagement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>

                <div className="space-y-4">
                  {template.type === "email" && (
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={template.subject || ""}
                        onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{template.type === "sms" ? "Message" : "Body"}</Label>
                      {template.type === "sms" && (
                        <span className={`text-xs ${
                          template.body.length > 160 ? "text-amber-600" : "text-gray-500"
                        }`}>
                          {template.body.length}/160 characters
                        </span>
                      )}
                    </div>
                    <Textarea
                      value={template.body}
                      onChange={(e) => setTemplate({ ...template, body: e.target.value })}
                      rows={template.type === "sms" ? 4 : 10}
                      className={template.type === "email" ? "font-mono text-sm" : ""}
                    />
                  </div>

                  {/* Variables Help */}
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Available Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {["{firstName}", "{lastName}", "{studioName}", "{className}", "{date}", "{time}", "{location}", "{bookingLink}"].map((v) => (
                        <code key={v} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 cursor-pointer hover:bg-violet-50"
                          onClick={() => setTemplate({ ...template, body: template.body + v })}
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-gray-500">
              <p>Created: {template.createdAt}</p>
              <p>Last updated: {template.updatedAt}</p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <Card className="border-0 shadow-sm sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>

                {template.type === "email" ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Subject</p>
                      <p className="font-medium text-gray-900">
                        {template.subject || "Your subject line here..."}
                      </p>
                    </div>
                    <div className="p-4 bg-white min-h-[300px]">
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                        {template.body}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-3">SMS Preview</p>
                    <div className="flex justify-start">
                      <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-bl-none max-w-[280px] text-sm">
                        {template.body}
                      </div>
                    </div>
                    {template.body.length > 160 && (
                      <p className="text-xs text-amber-400 mt-3">
                        ⚠️ This message will be sent as {Math.ceil(template.body.length / 160)} SMS segments
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <Link href="/studio/marketing?tab=templates">
            <Button variant="outline">Cancel</Button>
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
