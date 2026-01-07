import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  Search,
  User,
  Calendar
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoInvoicesPage() {
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  const invoices = await db.teacherInvoice.findMany({
    where: { studioId: studio.id },
    include: {
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Calculate stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === "PENDING" || i.status === "SENT").length,
    paid: invoices.filter(i => i.status === "PAID").length,
    totalPending: invoices.filter(i => i.status === "PENDING" || i.status === "SENT").reduce((sum, i) => sum + Number(i.total), 0),
    totalPaid: invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + Number(i.paidAmount || i.total), 0)
  }

  const pendingInvoices = invoices.filter(i => i.status === "PENDING" || i.status === "SENT")
  const paidInvoices = invoices.filter(i => i.status === "PAID")

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

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Invoices</h1>
        <p className="text-gray-500 mt-1">Review and process invoices submitted by teachers</p>
      </div>

      {/* Stats Cards */}
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
                <p className="text-2xl font-bold text-gray-900">${stats.totalPending.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-gray-900">${stats.totalPaid.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by invoice number or teacher name..."
                className="pl-9"
              />
            </div>
            <Button variant="outline">All Status</Button>
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
            <Badge className="ml-2 bg-gray-100 text-gray-600">{invoices.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <InvoiceList invoices={pendingInvoices} getStatusBadge={getStatusBadge} />
        </TabsContent>

        {/* Paid Tab */}
        <TabsContent value="paid">
          <InvoiceList invoices={paidInvoices} getStatusBadge={getStatusBadge} />
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all">
          <InvoiceList invoices={invoices} getStatusBadge={getStatusBadge} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Invoice List Component
function InvoiceList({ 
  invoices, 
  getStatusBadge 
}: { 
  invoices: Array<{
    id: string
    invoiceNumber: string
    status: string
    periodStart: Date
    periodEnd: Date
    total: number | { toNumber: () => number }
    paidAt: Date | null
    teacher: {
      user: { firstName: string; lastName: string }
    }
    lineItems: unknown
  }>
  getStatusBadge: (status: string) => React.ReactNode
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
      {invoices.map(invoice => {
        const total = typeof invoice.total === 'number' ? invoice.total : Number(invoice.total)
        const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : []
        
        return (
          <Card key={invoice.id} className="border-0 shadow-sm hover:shadow transition-shadow cursor-pointer">
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
                    <p className="font-bold text-lg text-gray-900">${total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {lineItems.length} classes
                    </p>
                  </div>

                  {(invoice.status === "PENDING" || invoice.status === "SENT") && (
                    <Button
                      size="sm"
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
        )
      })}
    </div>
  )
}




