"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  Search,
  Filter,
  User,
  Calendar,
  CreditCard,
  Banknote,
  Download
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

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
  paidAmount: number | null
  paymentMethod: string | null
  createdAt: string
  notes: string | null
  teacherId: string
  teacher: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

interface Stats {
  total: number
  pending: number
  paid: number
  totalPending: number
  totalPaid: number
}

export default function StudioInvoicesPage() {
  const [loading, setLoading] = useState(true)
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currency, setCurrency] = useState("usd")
  
  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [paying, setPaying] = useState(false)

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    fetchInvoices()

    const fetchCurrency = async () => {
      try {
        const res = await fetch("/api/studio/settings")
        if (!res.ok) return
        const data = await res.json()
        setCurrency((data.stripeCurrency || "usd").toLowerCase())
      } catch (error) {
        console.error("Failed to fetch studio currency:", error)
      }
    }

    fetchCurrency()
  }, [])

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/studio/invoices")
      if (res.status === 403) {
        setModuleEnabled(false)
        setInvoices([])
        setStats(null)
        setLoading(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setModuleEnabled(true)
        setInvoices(data.invoices || [])
        setStats(data.stats || null)
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
    }
    setLoading(false)
  }

  async function markAsPaid() {
    if (!selectedInvoice) return
    
    setPaying(true)
    try {
      const res = await fetch("/api/studio/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          status: "PAID",
          paymentMethod,
          paymentReference,
          notes: paymentNotes || undefined
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? updated : inv))
        setShowPayModal(false)
        setSelectedInvoice(null)
        setPaymentMethod("bank_transfer")
        setPaymentReference("")
        setPaymentNotes("")
        // Refresh stats
        fetchInvoices()
      }
    } catch (err) {
      console.error("Failed to mark as paid:", err)
    }
    setPaying(false)
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

  const csvEscape = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`

  const downloadInvoice = (invoice: Invoice) => {
    const teacherName = `${invoice.teacher.user.firstName} ${invoice.teacher.user.lastName}`
    const lines = [
      ["Invoice Number", invoice.invoiceNumber],
      ["Status", invoice.status],
      ["Teacher", teacherName],
      ["Teacher Email", invoice.teacher.user.email],
      ["Period Start", new Date(invoice.periodStart).toISOString()],
      ["Period End", new Date(invoice.periodEnd).toISOString()],
      ["Currency", currency.toUpperCase()],
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

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.teacher.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.teacher.user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Group invoices
  const pendingInvoices = filteredInvoices.filter(inv => inv.status === "PENDING" || inv.status === "SENT")
  const paidInvoices = filteredInvoices.filter(inv => inv.status === "PAID")

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
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
              The Invoices module is currently disabled for this studio.
            </p>
            <Link href="/studio/settings" className="text-sm font-medium text-violet-700 hover:text-violet-600">
              Open settings to enable Invoices
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Invoices</h1>
        <p className="text-gray-500 mt-1">Review and process invoices submitted by teachers</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  <p className="text-sm text-gray-500">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPending, currency)}</p>
                  <p className="text-sm text-gray-500">Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaid, currency)}</p>
                  <p className="text-sm text-gray-500">Total Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by invoice number or teacher name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending Review
            {pendingInvoices.length > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{pendingInvoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid">
            <CheckCircle className="h-4 w-4 mr-2" />
            Paid
            {paidInvoices.length > 0 && (
              <Badge className="ml-2 bg-green-100 text-green-700">{paidInvoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            All Invoices
            <Badge className="ml-2 bg-gray-100 text-gray-600">{filteredInvoices.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <InvoiceList 
            invoices={pendingInvoices}
            currency={currency}
            getStatusBadge={getStatusBadge}
            onMarkAsPaid={(inv) => {
              setSelectedInvoice(inv)
              setShowPayModal(true)
            }}
            onViewDetail={(inv) => {
              setDetailInvoice(inv)
              setShowDetailModal(true)
            }}
          />
        </TabsContent>

        {/* Paid Tab */}
        <TabsContent value="paid">
          <InvoiceList 
            invoices={paidInvoices}
            currency={currency}
            getStatusBadge={getStatusBadge}
            onViewDetail={(inv) => {
              setDetailInvoice(inv)
              setShowDetailModal(true)
            }}
          />
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all">
          <InvoiceList 
            invoices={filteredInvoices}
            currency={currency}
            getStatusBadge={getStatusBadge}
            onMarkAsPaid={(inv) => {
              if (inv.status === "PENDING" || inv.status === "SENT") {
                setSelectedInvoice(inv)
                setShowPayModal(true)
              }
            }}
            onViewDetail={(inv) => {
              setDetailInvoice(inv)
              setShowDetailModal(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Mark as Paid Modal */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Invoice</span>
                  <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Teacher</span>
                  <span className="font-medium">
                    {selectedInvoice.teacher.user.firstName} {selectedInvoice.teacher.user.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="font-bold text-lg text-violet-600">{formatCurrency(selectedInvoice.total, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="check">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Check
                      </div>
                    </SelectItem>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="paypal">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        PayPal
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference Number (optional)</Label>
                <Input
                  placeholder="e.g., Transaction ID, Check #"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes about this payment..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={markAsPaid} 
              disabled={paying}
              className="bg-green-600 hover:bg-green-700"
            >
              {paying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          
          {detailInvoice && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-violet-500 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-bold">{detailInvoice.invoiceNumber}</h4>
                    <p className="text-violet-200 mt-1">
                      {new Date(detailInvoice.periodStart).toLocaleDateString()} - {new Date(detailInvoice.periodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(detailInvoice.status)}
                  </div>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {detailInvoice.teacher.user.firstName} {detailInvoice.teacher.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{detailInvoice.teacher.user.email}</p>
                </div>
                <Link 
                  href={`/studio/teachers/${detailInvoice.teacherId}`}
                  className="ml-auto"
                >
                  <Button variant="outline" size="sm">View Profile</Button>
                </Link>
              </div>

              {/* Line Items */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Line Items</h5>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-sm text-gray-500">
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailInvoice.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3 text-sm">{item.description}</td>
                          <td className="p-3 text-sm text-center">{item.quantity}</td>
                          <td className="p-3 text-sm text-right">{formatCurrency(item.rate, currency)}</td>
                          <td className="p-3 text-sm text-right">{formatCurrency(item.amount, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(detailInvoice.subtotal, currency)}</span>
                </div>
                {detailInvoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ({detailInvoice.taxRate}%)</span>
                    <span className="font-medium">{formatCurrency(detailInvoice.tax, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-violet-600">{formatCurrency(detailInvoice.total, currency)}</span>
                </div>
              </div>

              {/* Payment Info */}
              {detailInvoice.status === "PAID" && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Payment Received</span>
                  </div>
                  <div className="text-sm text-green-600 space-y-1">
                    <p>Paid on: {detailInvoice.paidAt ? new Date(detailInvoice.paidAt).toLocaleDateString() : "N/A"}</p>
                    {detailInvoice.paymentMethod && <p>Method: {detailInvoice.paymentMethod.replace("_", " ")}</p>}
                  </div>
                </div>
              )}

              {/* Notes */}
              {detailInvoice.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{detailInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => downloadInvoice(detailInvoice)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                {(detailInvoice.status === "PENDING" || detailInvoice.status === "SENT") && (
                  <Button 
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedInvoice(detailInvoice)
                      setShowPayModal(true)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
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
  onMarkAsPaid,
  onViewDetail
}: { 
  invoices: Invoice[]
  currency: string
  getStatusBadge: (status: string) => React.ReactNode
  onMarkAsPaid?: (invoice: Invoice) => void
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
        <Card key={invoice.id} className="border-0 shadow-sm hover:shadow transition-shadow cursor-pointer" onClick={() => onViewDetail(invoice)}>
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
                  ) : (
                    <FileText className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {invoice.teacher.user.firstName} {invoice.teacher.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{formatCurrency(invoice.total, currency)}</p>
                  <p className="text-xs text-gray-500">
                    {invoice.lineItems.length} classes
                  </p>
                </div>

                {onMarkAsPaid && (invoice.status === "PENDING" || invoice.status === "SENT") && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkAsPaid(invoice)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Pay
                  </Button>
                )}

                {invoice.status === "PAID" && invoice.paidAt && (
                  <p className="text-xs text-green-600">
                    Paid {new Date(invoice.paidAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}













