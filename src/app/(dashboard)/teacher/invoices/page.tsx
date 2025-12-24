"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Plus,
  Loader2,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react"

interface PayRate {
  type: "PER_CLASS" | "HOURLY" | "PER_STUDENT"
  rate: number
  currency: string
}

interface InvoiceClass {
  id: string
  date: string
  startTime: string
  endTime: string
  classType: string
  location: string
  students: number
  earnings: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: "DRAFT" | "PENDING" | "SENT" | "PAID" | "CANCELLED"
  periodStart: string
  periodEnd: string
  lineItems: { description: string; quantity: number; rate: number; amount: number }[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  sentAt: string | null
  paidAt: string | null
  createdAt: string
  studio: { name: string }
}

export default function TeacherInvoicesPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payRate, setPayRate] = useState<PayRate | null>(null)
  const [studioName, setStudioName] = useState("")
  
  // Invoice creation state
  const [showCreator, setShowCreator] = useState(false)
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [invoiceClasses, setInvoiceClasses] = useState<InvoiceClass[]>([])
  const [invoiceSummary, setInvoiceSummary] = useState<{ totalClasses: number; totalStudents: number; totalEarnings: number } | null>(null)
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  // Fetch classes when period changes
  useEffect(() => {
    if (!periodStart || !periodEnd) {
      setInvoiceClasses([])
      setInvoiceSummary(null)
      return
    }

    async function fetchClasses() {
      setLoadingClasses(true)
      try {
        const res = await fetch(`/api/teacher/invoices?action=classes&startDate=${periodStart}&endDate=${periodEnd}`)
        if (res.ok) {
          const data = await res.json()
          setInvoiceClasses(data.classes || [])
          setInvoiceSummary(data.summary || null)
          if (data.payRate) setPayRate(data.payRate)
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err)
      }
      setLoadingClasses(false)
    }
    fetchClasses()
  }, [periodStart, periodEnd])

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/teacher/invoices")
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
        if (data.payRate) setPayRate(data.payRate)
        if (data.studio) setStudioName(data.studio.name)
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
    }
    setLoading(false)
  }

  async function createInvoice(submit: boolean = false) {
    if (!invoiceSummary || invoiceClasses.length === 0) return
    
    setCreating(true)
    try {
      const lineItems = invoiceClasses.map(cls => ({
        description: `${cls.classType} - ${new Date(cls.date).toLocaleDateString()}`,
        classId: cls.id,
        quantity: 1,
        rate: cls.earnings,
        amount: cls.earnings
      }))

      const subtotal = invoiceSummary.totalEarnings
      const tax = Math.round((subtotal * taxRate / 100) * 100) / 100
      const total = subtotal + tax

      const res = await fetch("/api/teacher/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          lineItems,
          subtotal,
          tax,
          taxRate,
          total,
          notes,
          submit
        })
      })

      if (res.ok) {
        const newInvoice = await res.json()
        setInvoices([newInvoice, ...invoices])
        setShowCreator(false)
        setPeriodStart("")
        setPeriodEnd("")
        setNotes("")
        setTaxRate(0)
      }
    } catch (err) {
      console.error("Failed to create invoice:", err)
    }
    setCreating(false)
  }

  async function submitInvoice(invoiceId: string) {
    setSubmitting(invoiceId)
    try {
      const res = await fetch("/api/teacher/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action: "submit" })
      })
      if (res.ok) {
        const updated = await res.json()
        setInvoices(invoices.map(inv => inv.id === invoiceId ? updated : inv))
      }
    } catch (err) {
      console.error("Failed to submit invoice:", err)
    }
    setSubmitting(null)
  }

  async function deleteInvoice(invoiceId: string) {
    try {
      const res = await fetch(`/api/teacher/invoices?invoiceId=${invoiceId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setInvoices(invoices.filter(inv => inv.id !== invoiceId))
      }
    } catch (err) {
      console.error("Failed to delete invoice:", err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Draft</Badge>
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>
      case "SENT":
        return <Badge className="bg-blue-100 text-blue-700">Sent</Badge>
      case "PAID":
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>
      case "CANCELLED":
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Group invoices by status
  const draftInvoices = invoices.filter(inv => inv.status === "DRAFT")
  const pendingInvoices = invoices.filter(inv => inv.status === "PENDING" || inv.status === "SENT")
  const paidInvoices = invoices.filter(inv => inv.status === "PAID")

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Create and manage your invoices for {studioName || "your studio"}</p>
        </div>
        {!showCreator && (
          <Button onClick={() => setShowCreator(true)} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        )}
      </div>

      {/* Pay Rate Info */}
      {payRate && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Pay Rate</p>
                <p className="font-semibold text-gray-900">
                  ${payRate.rate.toFixed(2)} {payRate.currency} / {payRate.type === "PER_CLASS" ? "class" : payRate.type === "HOURLY" ? "hour" : "student"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Creator */}
      {showCreator && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Create New Invoice</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCreator(false)}>
                Cancel
              </Button>
            </div>

            <div className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period Start</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period End</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Loading */}
              {loadingClasses && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                </div>
              )}

              {/* Invoice Preview */}
              {!loadingClasses && invoiceSummary && invoiceClasses.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Invoice Header */}
                  <div className="bg-gradient-to-r from-violet-600 to-violet-500 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-2xl font-bold">INVOICE</h4>
                        <p className="text-violet-200 mt-1">
                          {new Date(periodStart).toLocaleDateString()} - {new Date(periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-violet-200">Bill To</p>
                        <p className="font-semibold">{studioName || "Studio"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Classes Table */}
                  <div className="p-6">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-3">Class</th>
                          <th className="pb-3 text-center">Date</th>
                          <th className="pb-3 text-center">Students</th>
                          <th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceClasses.slice(0, 10).map((cls) => (
                          <tr key={cls.id} className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">{cls.classType}</td>
                            <td className="py-3 text-sm text-gray-500 text-center">
                              {new Date(cls.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-sm text-gray-500 text-center">{cls.students}</td>
                            <td className="py-3 text-sm text-gray-900 text-right">${cls.earnings.toFixed(2)}</td>
                          </tr>
                        ))}
                        {invoiceClasses.length > 10 && (
                          <tr>
                            <td colSpan={4} className="py-3 text-sm text-gray-500 text-center">
                              ... and {invoiceClasses.length - 10} more classes
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div className="mt-6 border-t pt-4">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">Total Classes</span>
                        <span className="font-medium">{invoiceSummary.totalClasses}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">Total Students</span>
                        <span className="font-medium">{invoiceSummary.totalStudents}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">${invoiceSummary.totalEarnings.toFixed(2)}</span>
                      </div>
                      
                      {/* Tax Input */}
                      <div className="flex items-center justify-between py-2 border-t mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Tax</span>
                          <Input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            className="w-20 h-8"
                            min={0}
                            max={100}
                          />
                          <span className="text-gray-500">%</span>
                        </div>
                        <span className="font-medium">
                          ${(invoiceSummary.totalEarnings * taxRate / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-2 border-t text-lg font-bold">
                        <span>Total</span>
                        <span className="text-violet-600">
                          ${(invoiceSummary.totalEarnings * (1 + taxRate / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4 space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes for this invoice..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* No Classes Found */}
              {!loadingClasses && periodStart && periodEnd && invoiceClasses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No classes found for this period</p>
                  <p className="text-sm">Try selecting a different date range</p>
                </div>
              )}

              {/* Actions */}
              {invoiceSummary && invoiceClasses.length > 0 && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => createInvoice(false)}
                    disabled={creating}
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => createInvoice(true)}
                    disabled={creating}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Create & Submit
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="all">
            All Invoices
            <Badge className="ml-2 bg-gray-100 text-gray-600">{invoices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts
            {draftInvoices.length > 0 && (
              <Badge className="ml-2 bg-gray-100 text-gray-600">{draftInvoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingInvoices.length > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{pendingInvoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid
            {paidInvoices.length > 0 && (
              <Badge className="ml-2 bg-green-100 text-green-700">{paidInvoices.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Invoices */}
        <TabsContent value="all">
          <InvoiceList 
            invoices={invoices} 
            getStatusBadge={getStatusBadge}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
          />
        </TabsContent>

        {/* Drafts */}
        <TabsContent value="drafts">
          <InvoiceList 
            invoices={draftInvoices} 
            getStatusBadge={getStatusBadge}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
          />
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending">
          <InvoiceList 
            invoices={pendingInvoices} 
            getStatusBadge={getStatusBadge}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
          />
        </TabsContent>

        {/* Paid */}
        <TabsContent value="paid">
          <InvoiceList 
            invoices={paidInvoices} 
            getStatusBadge={getStatusBadge}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Invoice List Component
function InvoiceList({ 
  invoices, 
  getStatusBadge,
  onSubmit,
  onDelete,
  submitting
}: { 
  invoices: Invoice[]
  getStatusBadge: (status: string) => React.ReactNode
  onSubmit: (id: string) => void
  onDelete: (id: string) => void
  submitting: string | null
}) {
  if (invoices.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No invoices found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map(invoice => (
        <Card key={invoice.id} className="border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  invoice.status === "PAID" ? "bg-green-100" :
                  invoice.status === "PENDING" ? "bg-amber-100" :
                  "bg-gray-100"
                }`}>
                  {invoice.status === "PAID" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : invoice.status === "PENDING" ? (
                    <Clock className="h-5 w-5 text-amber-600" />
                  ) : invoice.status === "CANCELLED" ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">${invoice.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {invoice.lineItems.length} classes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {invoice.status === "DRAFT" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(invoice.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onSubmit(invoice.id)}
                        disabled={submitting === invoice.id}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        {submitting === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {invoice.status === "PAID" && invoice.paidAt && (
                    <p className="text-xs text-green-600">
                      Paid {new Date(invoice.paidAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
