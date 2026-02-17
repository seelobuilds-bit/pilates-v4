"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Mail,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  RefreshCw,
  Send,
  Info,
  Loader2,
  Check,
  X
} from "lucide-react"

interface DnsRecord {
  type: string
  name: string
  value: string
  priority?: number
  status: "pending" | "verified" | "failed"
}

interface EmailConfig {
  id: string
  fromName: string
  fromEmail: string | null
  replyToEmail: string | null
  domain: string | null
  domainStatus: string
  dnsRecords: DnsRecord[] | null
  verifiedAt: string | null
}

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [studioName, setStudioName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null)

  // Form state
  const [fromName, setFromName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [replyToEmail, setReplyToEmail] = useState("")
  const [domain, setDomain] = useState("")

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/studio/email-config")
      const data = await res.json()
      
      if (data.config) {
        setConfig(data.config)
        setFromName(data.config.fromName || "")
        setFromEmail(data.config.fromEmail || "")
        setReplyToEmail(data.config.replyToEmail || "")
        setDomain(data.config.domain || "")
      } else {
        // Set default from name
        setFromName(data.studioName || "")
      }
      
      setStudioName(data.studioName || "")
      setSubdomain(data.subdomain || "")
    } catch (error) {
      console.error("Error fetching config:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate reply-to is set (required for client replies)
    if (!replyToEmail) {
      setMessage({ type: "error", text: "Reply-To email is required so clients can respond to your emails" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/studio/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName,
          fromEmail: fromEmail || null,
          replyToEmail,
          domain: domain || null
        })
      })

      const data = await res.json()

      if (res.ok) {
        setConfig(data.config)
        setMessage({ type: "success", text: data.message || "Settings saved!" })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" })
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setMessage(null)

    try {
      const res = await fetch("/api/studio/email-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" })
      })

      const data = await res.json()

      if (res.ok) {
        setConfig(data.config)
        if (data.status === "verified") {
          setMessage({ type: "success", text: "Domain verified successfully! 🎉" })
        } else {
          setMessage({ type: "error", text: "DNS records not yet propagated. Please wait a few minutes and try again." })
        }
      } else {
        setMessage({ type: "error", text: data.error || "Verification failed" })
      }
    } catch {
      setMessage({ type: "error", text: "Verification check failed" })
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = (text: string, recordName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedRecord(recordName)
    setTimeout(() => setCopiedRecord(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }

  const getPreviewEmail = () => {
    if (config?.domainStatus === "verified" && config.domain) {
      return `${fromEmail || "hello"}@${config.domain}`
    }
    return `${subdomain}@notify.thecurrent.app`
  }

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
        <p className="text-gray-500 mt-1">Configure how emails are sent to your clients</p>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-700" : "text-red-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Email Preview</CardTitle>
                <CardDescription>How your emails will appear to clients</CardDescription>
              </div>
            </div>
            {getStatusBadge(config?.domainStatus || "not_started")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(fromName || studioName).charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{fromName || studioName}</p>
                <p className="text-sm text-gray-500">&lt;{getPreviewEmail()}&gt;</p>
              </div>
            </div>
            <div className="mt-4 pl-13">
              <p className="text-sm text-gray-600 font-medium">Subject: Your class is booked! Reformer Flow on Monday</p>
            </div>
          </div>
          
          {config?.domainStatus !== "verified" && (
            <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Without a verified domain, emails will be sent from <strong>{subdomain}@notify.thecurrent.app</strong>. 
                Add your domain below for fully branded emails.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Sender Details</CardTitle>
          <CardDescription>Basic information shown on outgoing emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name *</Label>
              <Input
                id="fromName"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Zenith Pilates"
              />
              <p className="text-xs text-gray-500">The name that appears in the &quot;From&quot; field</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyToEmail">Reply-To Email *</Label>
              <Input
                id="replyToEmail"
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="hello@zenithpilates.com"
                required
              />
              <p className="text-xs text-gray-500">
                <strong>Required:</strong> When clients reply to your emails, it goes to this inbox (e.g., your Gmail or studio email)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Verification */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Send emails from your own domain for better branding & deliverability</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Your Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="zenithpilates.com"
                disabled={config?.domainStatus === "verified"}
              />
              <p className="text-xs text-gray-500">Your business domain (without www)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Address</Label>
              <div className="flex">
                <Input
                  id="fromEmail"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="hello"
                  className="rounded-r-none"
                />
                <span className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-500">
                  @{domain || "yourdomain.com"}
                </span>
              </div>
              <p className="text-xs text-gray-500">The email address used for sending</p>
            </div>
          </div>

          {/* DNS Records */}
          {config?.dnsRecords && config.dnsRecords.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="font-medium text-gray-900">DNS Records</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full sm:w-auto"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verify Records
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-gray-600">
                Add these records to your DNS settings. This usually takes 5-10 minutes to propagate.
              </p>

              <div className="border rounded-lg overflow-hidden">
                <div className="app-scrollbar overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Value</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {config.dnsRecords.map((record, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{record.type}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs break-all max-w-[200px]">
                          {record.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs break-all max-w-[300px]">
                          {record.value.substring(0, 50)}...
                        </td>
                        <td className="px-4 py-3">
                          {record.status === "verified" ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : record.status === "failed" ? (
                            <X className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-600" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.value, record.name)}
                          >
                            {copiedRecord === record.name ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !fromName}
          className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="border-0 shadow-sm bg-gray-50">
        <CardContent className="p-6">
          <h4 className="font-medium text-gray-900 mb-3">💡 How does this work?</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Reply-To (Required):</strong> When clients reply to your emails, it goes to your Reply-To address (your Gmail, studio inbox, etc.). This is essential so you don&apos;t miss any client responses!
            </p>
            <p>
              <strong>Without a custom domain:</strong> Emails are sent from <code className="bg-gray-200 px-1 rounded">{subdomain}@notify.thecurrent.app</code>. 
              This works fine, but may not look as professional.
            </p>
            <p>
              <strong>With a verified domain:</strong> Emails are sent from your own domain (e.g., <code className="bg-gray-200 px-1 rounded">hello@zenithpilates.com</code>). 
              This looks more professional and improves deliverability.
            </p>
            <p>
              <strong>Google Workspace users:</strong> Adding DNS records does NOT affect your existing email. 
              You&apos;ll continue receiving emails in Gmail normally, and client replies still go to your Reply-To address.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
