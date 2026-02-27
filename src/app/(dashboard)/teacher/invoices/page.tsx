"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import {
  FileText,
  Plus,
  Loader2,
  DollarSign,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Eye,
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
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [disabledReason, setDisabledReason] = useState("Your studio has disabled the Invoices module.")
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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

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
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        setModuleEnabled(false)
        setDisabledReason(data?.error || "Invoices are not available for this account.")
        setInvoices([])
        setLoading(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setModuleEnabled(true)
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

  const currency = payRate?.currency || "USD"
  const formatCurrency = (amount: number, currencyCode: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount || 0)

  const csvEscape = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`

  const downloadInvoice = (invoice: Invoice) => {
    const lines = [
      ["Invoice Number", invoice.invoiceNumber],
      ["Status", invoice.status],
      ["Studio", invoice.studio.name],
      ["Period Start", new Date(invoice.periodStart).toISOString()],
      ["Period End", new Date(invoice.periodEnd).toISOString()],
      ["Subtotal", invoice.subtotal],
      ["Tax", invoice.tax],
      ["Tax Rate", invoice.taxRate],
      ["Total", invoice.total],
      [],
      ["Description", "Quantity", "Rate", "Amount"],
      ...invoice.lineItems.map((item) => [item.description, item.quantity, item.rate, item.amount])
    ]

    const csv = lines
      .map((line) => line.map((cell) => csvEscape(cell)).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${invoice.invoiceNumber}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Group invoices by status
  const draftInvoices = invoices.filter(inv => inv.status === "DRAFT")
  const pendingInvoices = invoices.filter(inv => inv.status === "PENDING" || inv.status === "SENT")
  const paidInvoices = invoices.filter(inv => inv.status === "PAID")

  if (loading) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!moduleEnabled) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
        <Card className="border-0 shadow-sm max-w-2xl">
          <CardContent className="p-6 space-y-3">
            <h1 className="text-xl font-semibold text-gray-900">Invoices Disabled</h1>
            <p className="text-sm text-gray-600">
              {disabledReason}
            </p>
            <Link href="/teacher/time-off" className="text-sm font-medium text-violet-700 hover:text-violet-600">
              Go to Time Off
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Create and manage your invoices for {studioName || "your studio"}</p>
        </div>
        {!showCreator && (
          <Button onClick={() => setShowCreator(true)} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700">
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
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="app-scrollbar overflow-x-auto">
                    <table className="min-w-[640px] w-full">
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
                    </div>

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
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2 border-t mt-2">
                        <div className="flex flex-wrap items-center gap-2">
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
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => createInvoice(false)}
                    disabled={creating}
                    className="w-full sm:w-auto"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => createInvoice(true)}
                    disabled={creating}
                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
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
        <TabsList className="app-scrollbar w-full justify-start overflow-x-auto bg-white border">
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
            currency={currency}
            getStatusBadge={getStatusBadge}
            onDownload={downloadInvoice}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
            onViewDetail={setSelectedInvoice}
          />
        </TabsContent>

        {/* Drafts */}
        <TabsContent value="drafts">
          <InvoiceList 
            invoices={draftInvoices} 
            currency={currency}
            getStatusBadge={getStatusBadge}
            onDownload={downloadInvoice}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
            onViewDetail={setSelectedInvoice}
          />
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending">
          <InvoiceList 
            invoices={pendingInvoices} 
            currency={currency}
            getStatusBadge={getStatusBadge}
            onDownload={downloadInvoice}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
            onViewDetail={setSelectedInvoice}
          />
        </TabsContent>

        {/* Paid */}
        <TabsContent value="paid">
          <InvoiceList 
            invoices={paidInvoices} 
            currency={currency}
            getStatusBadge={getStatusBadge}
            onDownload={downloadInvoice}
            onSubmit={submitInvoice}
            onDelete={deleteInvoice}
            submitting={submitting}
            onViewDetail={setSelectedInvoice}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedInvoice)} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-5">
              <div className="rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedInvoice.invoiceNumber}</h3>
                    <p className="mt-1 text-sm text-violet-100">
                      {new Date(selectedInvoice.periodStart).toLocaleDateString()} - {new Date(selectedInvoice.periodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div>{getStatusBadge(selectedInvoice.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-gray-500">Studio</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.studio.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedInvoice.sentAt && (
                  <div>
                    <p className="text-gray-500">Sent</p>
                    <p className="font-medium text-gray-900">{new Date(selectedInvoice.sentAt).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedInvoice.paidAt && (
                  <div>
                    <p className="text-gray-500">Paid</p>
                    <p className="font-medium text-gray-900">{new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.lineItems.map((item, index) => (
                      <tr key={`${item.description}-${index}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{item.description}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.rate, currency)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(item.amount, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-100 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedInvoice.subtotal, currency)}</span>
                </div>
                {selectedInvoice.tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tax ({selectedInvoice.taxRate}%)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedInvoice.tax, currency)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span className="text-violet-600">{formatCurrency(selectedInvoice.total, currency)}</span>
                </div>
              </div>

              {selectedInvoice.lineItems.length > 0 && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => downloadInvoice(selectedInvoice)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Invoice List Component
function InvoiceList({ 
  invoices, 
  currency,
  getStatusBadge,
  onDownload,
  onSubmit,
  onDelete,
  submitting,
  onViewDetail
}: { 
  invoices: Invoice[]
  currency: string
  getStatusBadge: (status: string) => React.ReactNode
  onDownload: (invoice: Invoice) => void
  onSubmit: (id: string) => void
  onDelete: (id: string) => void
  submitting: string | null
  onViewDetail: (invoice: Invoice) => void
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 min-w-0">
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
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{invoice.invoiceNumber}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:gap-4">
                <div className="text-left sm:text-right">
                  <p className="font-bold text-lg text-gray-900">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency,
                      minimumFractionDigits: 2,
                    }).format(invoice.total || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {invoice.lineItems.length} classes
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetail(invoice)}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(invoice)}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {invoice.status === "DRAFT" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(invoice.id)}
                        className="w-full sm:w-auto"
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onSubmit(invoice.id)}
                        disabled={submitting === invoice.id}
                        className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
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









