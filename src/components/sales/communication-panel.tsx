"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  Send,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Globe
} from "lucide-react"

// Available phone numbers for outbound calls/SMS
const OUTBOUND_NUMBERS = [
  { id: "uk", number: process.env.NEXT_PUBLIC_TWILIO_UK_NUMBER || "+44 20 1234 5678", country: "UK", flag: "🇬🇧" },
  { id: "ie", number: process.env.NEXT_PUBLIC_TWILIO_IE_NUMBER || "+353 1 234 5678", country: "Ireland", flag: "🇮🇪" },
  { id: "us", number: process.env.NEXT_PUBLIC_TWILIO_US_NUMBER || "+1 (555) 123-4567", country: "US", flag: "🇺🇸" },
]

interface CommunicationPanelProps {
  leadId: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  onActivityLogged?: () => void
}

export function CommunicationPanel({
  leadId,
  contactName,
  contactEmail,
  contactPhone,
  onActivityLogged
}: CommunicationPanelProps) {
  const [activeTab, setActiveTab] = useState("email")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; simulated?: boolean } | null>(null)
  
  // Email state
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  
  // SMS state
  const [smsMessage, setSmsMessage] = useState("")
  const [smsFromNumber, setSmsFromNumber] = useState(OUTBOUND_NUMBERS[0].number)
  
  // Call state
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [callNotes, setCallNotes] = useState("")
  const [callFromNumber, setCallFromNumber] = useState(OUTBOUND_NUMBERS[0].number)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Auto-select number based on contact's phone prefix
  useEffect(() => {
    if (contactPhone) {
      if (contactPhone.startsWith("+353") || contactPhone.startsWith("353")) {
        const ieNum = OUTBOUND_NUMBERS.find(n => n.id === "ie")
        if (ieNum) {
          setCallFromNumber(ieNum.number)
          setSmsFromNumber(ieNum.number)
        }
      } else if (contactPhone.startsWith("+44") || contactPhone.startsWith("44")) {
        const ukNum = OUTBOUND_NUMBERS.find(n => n.id === "uk")
        if (ukNum) {
          setCallFromNumber(ukNum.number)
          setSmsFromNumber(ukNum.number)
        }
      } else if (contactPhone.startsWith("+1") || contactPhone.startsWith("1")) {
        const usNum = OUTBOUND_NUMBERS.find(n => n.id === "us")
        if (usNum) {
          setCallFromNumber(usNum.number)
          setSmsFromNumber(usNum.number)
        }
      }
    }
  }, [contactPhone])

  // Email templates
  const emailTemplates = [
    {
      name: "Introduction",
      subject: "Discover How Current Can Transform Your Studio",
      body: `Hi ${contactName},\n\nI hope this message finds you well. I noticed your interest in Current and wanted to reach out personally.\n\nCurrent is an all-in-one platform designed specifically for Pilates and fitness studios. We help studio owners like yourself:\n\n• Streamline booking and scheduling\n• Manage payments and memberships\n• Grow your client base with built-in marketing tools\n• Track instructor performance and payroll\n\nWould you have 15 minutes this week for a quick call? I'd love to learn more about your studio and show you how we can help.\n\nBest regards`
    },
    {
      name: "Follow Up",
      subject: "Following Up - Current Demo",
      body: `Hi ${contactName},\n\nI wanted to follow up on my previous message about Current.\n\nI understand you're busy running your studio, but I believe a quick 15-minute demo could show you exactly how Current can save you hours each week.\n\nWould any of these times work for a brief call?\n• Tomorrow at 10 AM\n• Wednesday at 2 PM\n• Thursday at 11 AM\n\nLooking forward to connecting!\n\nBest regards`
    },
    {
      name: "Post Demo",
      subject: "Great Meeting Today! - Next Steps",
      body: `Hi ${contactName},\n\nThank you for taking the time to see Current in action today!\n\nAs we discussed, Current can help you:\n[Customize based on pain points discussed]\n\nI've attached our pricing guide for your review. Let me know if you have any questions or if you'd like to discuss anything further.\n\nLooking forward to welcoming you to the Current family!\n\nBest regards`
    }
  ]

  // SMS templates
  const smsTemplates = [
    { name: "Quick Intro", text: `Hi ${contactName}! This is [Your Name] from Current. I'd love to show you how we can help your studio. Do you have 15 mins this week for a quick call?` },
    { name: "Follow Up", text: `Hi ${contactName}! Just following up on Current. Any questions I can answer? Happy to schedule a quick demo whenever works for you.` },
    { name: "Demo Reminder", text: `Hi ${contactName}! Just a friendly reminder about our demo call [TIME]. Looking forward to speaking with you!` }
  ]

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return
    
    setSending(true)
    setResult(null)
    
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          leadId,
          to: contactEmail,
          subject: emailSubject,
          content: emailBody
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setResult({ 
          success: true, 
          message: data.simulated ? "Email logged (SMTP not configured)" : "Email sent successfully!",
          simulated: data.simulated
        })
        setEmailSubject("")
        setEmailBody("")
        onActivityLogged?.()
      } else {
        setResult({ success: false, message: data.error || "Failed to send email" })
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to send email" })
    } finally {
      setSending(false)
    }
  }

  const sendSms = async () => {
    if (!smsMessage.trim() || !contactPhone) return
    
    setSending(true)
    setResult(null)
    
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sms",
          leadId,
          to: contactPhone,
          from: smsFromNumber,
          content: smsMessage
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setResult({ 
          success: true, 
          message: data.simulated ? "SMS logged (Twilio not configured)" : "SMS sent successfully!",
          simulated: data.simulated
        })
        setSmsMessage("")
        onActivityLogged?.()
      } else {
        setResult({ success: false, message: data.error || "Failed to send SMS" })
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to send SMS" })
    } finally {
      setSending(false)
    }
  }

  const startCall = async () => {
    if (!contactPhone) return
    
    setIsCallActive(true)
    setCallDuration(0)
    setResult(null)
    
    // Start timer
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
    
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "call",
          leadId,
          to: contactPhone,
          from: callFromNumber,
          recordCall: true
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setResult({ success: false, message: data.error || "Failed to initiate call" })
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to initiate call" })
    }
  }

  const endCall = async () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }
    
    setIsCallActive(false)
    
    // Log the call with notes
    if (callNotes.trim()) {
      try {
        await fetch(`/api/sales/leads/${leadId}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "CALL",
            subject: `Call with ${contactName}`,
            content: callNotes,
            duration: callDuration
          })
        })
      } catch (error) {
        console.error("Failed to log call notes:", error)
      }
    }
    
    setResult({ 
      success: true, 
      message: `Call ended (${formatDuration(callDuration)})`,
      simulated: true // Will be determined by actual Twilio integration
    })
    setCallNotes("")
    onActivityLogged?.()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Clear result after 5 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setResult(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [result])

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Contact {contactName}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Result notification */}
        {result && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm flex-1">{result.message}</span>
            {result.simulated && (
              <Badge variant="outline" className="text-xs">Simulated</Badge>
            )}
            <button onClick={() => setResult(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="call" className="flex-1" disabled={!contactPhone}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex-1" disabled={!contactPhone}>
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
          </TabsList>

          {/* Call Tab */}
          <TabsContent value="call" className="space-y-4">
            {isCallActive ? (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                    <PhoneCall className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-lg font-semibold text-green-700">Call in Progress</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{formatDuration(callDuration)}</p>
                  <p className="text-sm text-green-600 mt-1">{contactPhone}</p>
                  <p className="text-xs text-green-500 mt-1">From: {callFromNumber}</p>
                </div>
                
                <div>
                  <Label>Call Notes (will be saved when call ends)</Label>
                  <Textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Take notes during the call..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                    {isMuted ? "Unmute" : "Mute"}
                  </Button>
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={endCall}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Call From Number Selector */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Call From
                  </Label>
                  <Select value={callFromNumber} onValueChange={setCallFromNumber}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTBOUND_NUMBERS.map(num => (
                        <SelectItem key={num.id} value={num.number}>
                          <span className="flex items-center gap-2">
                            <span>{num.flag}</span>
                            <span>{num.country}</span>
                            <span className="text-gray-500">{num.number}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Phone className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="font-medium">{contactPhone || "No phone number"}</p>
                  <p className="text-sm text-gray-500 mt-1">Click to start a recorded call</p>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={startCall}
                  disabled={!contactPhone}
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Start Call
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Calls are recorded for quality and training purposes
                </p>
              </div>
            )}
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Quick Templates</Label>
              <div className="flex gap-2 flex-wrap">
                {emailTemplates.map(template => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailSubject(template.subject)
                      setEmailBody(template.body)
                    }}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>To</Label>
              <Input value={contactEmail} disabled className="bg-gray-50" />
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder={`Hi ${contactName},\n\n`}
                rows={8}
              />
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={sendEmail}
              disabled={sending || !emailSubject.trim() || !emailBody.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Email
            </Button>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Quick Templates</Label>
              <div className="flex gap-2 flex-wrap">
                {smsTemplates.map(template => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => setSmsMessage(template.text)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* SMS From Number Selector */}
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Send From
              </Label>
              <Select value={smsFromNumber} onValueChange={setSmsFromNumber}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTBOUND_NUMBERS.map(num => (
                    <SelectItem key={num.id} value={num.number}>
                      <span className="flex items-center gap-2">
                        <span>{num.flag}</span>
                        <span>{num.country}</span>
                        <span className="text-gray-500">{num.number}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>To</Label>
              <Input value={contactPhone || "No phone number"} disabled className="bg-gray-50" />
            </div>

            <div>
              <Label>Message ({smsMessage.length}/160)</Label>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                maxLength={320}
              />
              {smsMessage.length > 160 && (
                <p className="text-xs text-amber-600 mt-1">
                  Message will be sent as {Math.ceil(smsMessage.length / 160)} segments
                </p>
              )}
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={sendSms}
              disabled={sending || !smsMessage.trim() || !contactPhone}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send SMS
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}











