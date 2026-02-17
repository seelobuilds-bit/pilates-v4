"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Search, 
  Users,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react"

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  bookingsCount: number
  lastBooking: string | null
}

export default function TeacherClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Communication state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [smsMessage, setSmsMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/teacher/clients")
        if (res.ok) {
          const data = await res.json()
          setClients(data)
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  const filteredClients = clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  )

  const openEmailModal = (client: Client) => {
    setSelectedClient(client)
    setEmailSubject("")
    setEmailBody("")
    setSendResult(null)
    setShowEmailModal(true)
  }

  const openSmsModal = (client: Client) => {
    if (!client.phone) {
      alert("This client doesn't have a phone number on file.")
      return
    }
    setSelectedClient(client)
    setSmsMessage("")
    setSendResult(null)
    setShowSmsModal(true)
  }

  const sendEmail = async () => {
    if (!selectedClient || !emailSubject || !emailBody) return
    
    setSending(true)
    setSendResult(null)
    
    try {
      const res = await fetch("/api/teacher/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          clientId: selectedClient.id,
          subject: emailSubject,
          message: emailBody
        })
      })

      if (res.ok) {
        setSendResult({ success: true, message: "Email sent successfully!" })
        setTimeout(() => {
          setShowEmailModal(false)
          setSendResult(null)
        }, 2000)
      } else {
        const data = await res.json()
        setSendResult({ success: false, message: data.error || "Failed to send email" })
      }
    } catch {
      setSendResult({ success: false, message: "Failed to send email" })
    } finally {
      setSending(false)
    }
  }

  const sendSms = async () => {
    if (!selectedClient || !smsMessage) return
    
    setSending(true)
    setSendResult(null)
    
    try {
      const res = await fetch("/api/teacher/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sms",
          clientId: selectedClient.id,
          message: smsMessage
        })
      })

      if (res.ok) {
        setSendResult({ success: true, message: "SMS sent successfully!" })
        setTimeout(() => {
          setShowSmsModal(false)
          setSendResult(null)
        }, 2000)
      } else {
        const data = await res.json()
        setSendResult({ success: false, message: data.error || "Failed to send SMS" })
      }
    } catch {
      setSendResult({ success: false, message: "Failed to send SMS" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Clients</h1>
        <p className="text-gray-500 mt-1">Students who have taken classes with you - reach out via Email or SMS</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search clients..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                <p className="text-sm text-gray-500">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + c.bookingsCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.length > 0 ? (clients.reduce((sum, c) => sum + c.bookingsCount, 0) / clients.length).toFixed(1) : 0}
                </p>
                <p className="text-sm text-gray-500">Avg. Bookings/Client</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Client List</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <div key={client.id} className="group flex flex-col gap-3 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/teacher/clients/${client.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="truncate text-sm text-gray-500">{client.email}</p>
                      {client.phone && (
                        <p className="text-xs text-gray-400">{client.phone}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 sm:hidden">
                        {client.bookingsCount} classes
                        {client.lastBooking ? ` • Last: ${new Date(client.lastBooking).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <div className="mr-2 hidden text-right sm:block">
                      <p className="font-medium text-gray-900">{client.bookingsCount} classes</p>
                      {client.lastBooking && (
                        <p className="text-sm text-gray-500">
                          Last: {new Date(client.lastBooking).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="hidden h-5 w-5 text-gray-400 transition-colors group-hover:text-violet-600 sm:block" />
                  </Link>
                  <div className="flex items-center gap-2 border-t pt-3 sm:ml-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    {/* Quick Communication Buttons */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.preventDefault(); openEmailModal(client) }}
                      className="gap-1"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.preventDefault(); openSmsModal(client) }}
                      disabled={!client.phone}
                      className="gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {search ? "No clients match your search" : "No clients yet - clients will appear here after they book your classes"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Send Email to {selectedClient?.firstName} {selectedClient?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>To</Label>
              <Input value={selectedClient?.email || ""} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message..."
                rows={6}
              />
            </div>
            {sendResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                sendResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {sendResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                {sendResult.message}
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowEmailModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button 
              onClick={sendEmail}
              disabled={sending || !emailSubject || !emailBody}
              className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Modal */}
      <Dialog open={showSmsModal} onOpenChange={setShowSmsModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Send SMS to {selectedClient?.firstName} {selectedClient?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>To</Label>
              <Input value={selectedClient?.phone || ""} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Message * <span className="text-xs text-gray-400">({smsMessage.length}/160 characters)</span></Label>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Write your SMS message..."
                rows={4}
                maxLength={320}
              />
            </div>
            {sendResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                sendResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {sendResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                {sendResult.message}
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowSmsModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button 
              onClick={sendSms}
              disabled={sending || !smsMessage}
              className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}











