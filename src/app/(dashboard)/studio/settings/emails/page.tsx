"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Mail,
  Check,
  X,
  Loader2,
  Save,
  Eye,
  Code,
  FileText,
  Calendar,
  CreditCard,
  Key,
  UserPlus,
  AlertTriangle,
  Info,
  RefreshCcw
} from "lucide-react"

interface EmailTemplate {
  id: string
  type: string
  name: string
  subject: string
  body: string
  htmlBody: string
  isEnabled: boolean
  variables: string[]
}

const templateIcons: Record<string, React.ReactNode> = {
  BOOKING_CONFIRMATION: <Calendar className="h-5 w-5" />,
  CLASS_CANCELLED_BY_STUDIO: <X className="h-5 w-5" />,
  CLASS_CANCELLED_BY_CLIENT: <X className="h-5 w-5" />,
  PAYMENT_SUCCESS: <CreditCard className="h-5 w-5" />,
  PAYMENT_FAILED: <AlertTriangle className="h-5 w-5" />,
  PAYMENT_REFUND: <RefreshCcw className="h-5 w-5" />,
  PASSWORD_RESET: <Key className="h-5 w-5" />,
  WELCOME: <UserPlus className="h-5 w-5" />
}

const templateColors: Record<string, string> = {
  BOOKING_CONFIRMATION: "bg-violet-100 text-violet-600",
  CLASS_CANCELLED_BY_STUDIO: "bg-red-100 text-red-600",
  CLASS_CANCELLED_BY_CLIENT: "bg-gray-100 text-gray-600",
  PAYMENT_SUCCESS: "bg-emerald-100 text-emerald-600",
  PAYMENT_FAILED: "bg-red-100 text-red-600",
  PAYMENT_REFUND: "bg-cyan-100 text-cyan-600",
  PASSWORD_RESET: "bg-blue-100 text-blue-600",
  WELCOME: "bg-amber-100 text-amber-600"
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editMode, setEditMode] = useState<"visual" | "html">("visual")
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Edit state
  const [editSubject, setEditSubject] = useState("")
  const [editBody, setEditBody] = useState("")
  const [editHtmlBody, setEditHtmlBody] = useState("")

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/studio/email-templates")
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
        if (data.length > 0 && !selectedTemplate) {
          selectTemplate(data[0])
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setLoading(false)
    }
  }

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template)
    setEditSubject(template.subject)
    setEditBody(template.body)
    setEditHtmlBody(template.htmlBody)
    setPreviewMode(false)
  }

  async function handleSave() {
    if (!selectedTemplate) return
    setSaving(true)

    try {
      const res = await fetch(`/api/studio/email-templates/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject,
          body: editBody,
          htmlBody: editHtmlBody
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
        setSelectedTemplate(updated)
      }
    } catch (error) {
      console.error("Failed to save template:", error)
    } finally {
      setSaving(false)
    }
  }

  async function toggleEnabled(template: EmailTemplate) {
    try {
      const res = await fetch(`/api/studio/email-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !template.isEnabled })
      })

      if (res.ok) {
        const updated = await res.json()
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
        if (selectedTemplate?.id === updated.id) {
          setSelectedTemplate(updated)
        }
      }
    } catch (error) {
      console.error("Failed to toggle template:", error)
    }
  }

  // Replace variables with example values for preview
  function getPreviewHtml(html: string) {
    return html
      .replace(/\{\{firstName\}\}/g, "Sarah")
      .replace(/\{\{lastName\}\}/g, "Johnson")
      .replace(/\{\{className\}\}/g, "Reformer Pilates")
      .replace(/\{\{date\}\}/g, "Monday, December 18, 2025")
      .replace(/\{\{time\}\}/g, "9:00 AM")
      .replace(/\{\{locationName\}\}/g, "Downtown Studio")
      .replace(/\{\{teacherName\}\}/g, "Emily Davis")
      .replace(/\{\{studioName\}\}/g, "Zenith Pilates")
      .replace(/\{\{amount\}\}/g, "$45.00")
      .replace(/\{\{description\}\}/g, "Reformer Class")
      .replace(/\{\{receiptUrl\}\}/g, "#")
      .replace(/\{\{failureReason\}\}/g, "Card declined")
      .replace(/\{\{updatePaymentUrl\}\}/g, "#")
      .replace(/\{\{resetLink\}\}/g, "#")
      .replace(/\{\{bookingLink\}\}/g, "#")
      .replace(/\{\{cancellationReason\}\}/g, "Due to instructor illness")
  }

  const hasChanges = selectedTemplate && (
    editSubject !== selectedTemplate.subject ||
    editBody !== selectedTemplate.body ||
    editHtmlBody !== selectedTemplate.htmlBody
  )

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/studio/settings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-500 mt-1">Customize your automated email notifications</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Template List */}
          <div className="col-span-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Email Types</h3>
                <div className="space-y-2">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "bg-violet-50 border border-violet-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${templateColors[template.type]}`}>
                        {templateIcons[template.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{template.name}</p>
                        <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                      </div>
                      <Switch
                        checked={template.isEnabled}
                        onCheckedChange={() => toggleEnabled(template)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-0 shadow-sm mt-4 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Available Variables</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Use {`{{variableName}}`} in your templates. Variables will be replaced with actual values when the email is sent.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Editor */}
          <div className="col-span-8">
            {selectedTemplate ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  {/* Template Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${templateColors[selectedTemplate.type]}`}>
                        {templateIcons[selectedTemplate.type]}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={selectedTemplate.isEnabled ? "default" : "secondary"} className={selectedTemplate.isEnabled ? "bg-emerald-100 text-emerald-700" : ""}>
                            {selectedTemplate.isEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {previewMode ? "Edit" : "Preview"}
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>

                  {previewMode ? (
                    /* Preview Mode */
                    <div>
                      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Subject:</strong> {getPreviewHtml(editSubject)}
                        </p>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b">
                          <p className="text-xs text-gray-500">Email Preview</p>
                        </div>
                        <iframe
                          srcDoc={getPreviewHtml(editHtmlBody)}
                          className="w-full h-[500px] bg-white"
                          title="Email Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Edit Mode */
                    <div className="space-y-6">
                      {/* Subject */}
                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>

                      {/* Variables */}
                      <div>
                        <Label>Available Variables</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTemplate.variables.map(v => (
                            <Badge
                              key={v}
                              variant="outline"
                              className="cursor-pointer hover:bg-violet-50"
                              onClick={() => {
                                navigator.clipboard.writeText(`{{${v}}}`)
                              }}
                            >
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Click to copy</p>
                      </div>

                      {/* Content Tabs */}
                      <Tabs value={editMode} onValueChange={(v) => setEditMode(v as "visual" | "html")}>
                        <TabsList className="mb-4">
                          <TabsTrigger value="visual" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Plain Text
                          </TabsTrigger>
                          <TabsTrigger value="html" className="gap-2">
                            <Code className="h-4 w-4" />
                            HTML
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="visual">
                          <div>
                            <Label>Plain Text Body</Label>
                            <Textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              className="mt-1.5 font-mono text-sm"
                              rows={15}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              This is used when HTML is not supported by the email client
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="html">
                          <div>
                            <Label>HTML Body</Label>
                            <Textarea
                              value={editHtmlBody}
                              onChange={(e) => setEditHtmlBody(e.target.value)}
                              className="mt-1.5 font-mono text-sm"
                              rows={15}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Edit the HTML markup for rich email formatting
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select an email template to edit</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}











