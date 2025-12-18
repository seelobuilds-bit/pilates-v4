"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  FileText,
  Save,
  Loader2,
  Eye
} from "lucide-react"

export default function NewTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const [template, setTemplate] = useState({
    name: "",
    type: "" as "" | "email" | "sms",
    category: "",
    subject: "",
    body: ""
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/studio/marketing?tab=templates")
  }

  const isValid = template.name && template.type && template.category && template.body && 
    (template.type === "sms" || template.subject)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/marketing?tab=templates" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
        <p className="text-gray-500 mt-1">Create a reusable message template</p>
      </div>

      <div className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Template Details</h2>
                    <p className="text-sm text-gray-500">Name and categorize your template</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                      placeholder="e.g., Welcome Email, Class Reminder"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={template.type}
                        onValueChange={(v: "email" | "sms") => setTemplate({ ...template, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </div>
                          </SelectItem>
                          <SelectItem value="sms">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              SMS
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={template.category}
                        onValueChange={(v) => setTemplate({ ...template, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    template.type === "sms" ? "bg-blue-100" : "bg-violet-100"
                  }`}>
                    {template.type === "sms" ? (
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Mail className="h-5 w-5 text-violet-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Content</h2>
                    <p className="text-sm text-gray-500">Write your message content</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {template.type === "email" && (
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={template.subject}
                        onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                        placeholder="Enter email subject"
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
                      placeholder={template.type === "sms" ? "Write your SMS message..." : "Write your email content..."}
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
          </div>

          {/* Preview */}
          <div>
            <Card className="border-0 shadow-sm sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
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
                        {template.body || "Your email content will appear here..."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-3">SMS Preview</p>
                    <div className="flex justify-start">
                      <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-bl-none max-w-[280px] text-sm">
                        {template.body || "Your SMS message will appear here..."}
                      </div>
                    </div>
                    {template.body.length > 160 && (
                      <p className="text-xs text-amber-400 mt-3">
                        ⚠️ This message will be sent as {Math.ceil(template.body.length / 160)} SMS segments
                      </p>
                    )}
                  </div>
                )}

                {!template.type && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a template type to see preview</p>
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
            disabled={!isValid || saving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>
    </div>
  )
}
