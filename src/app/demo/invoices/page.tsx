"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText,
  Plus,
  Search,
  Download,
  Send,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  MoreVertical
} from "lucide-react"

const demoInvoices = [
  { id: "INV-001", teacher: "Sarah Chen", amount: 1250, status: "PAID", dueDate: "2024-01-15", paidDate: "2024-01-14", classes: 25 },
  { id: "INV-002", teacher: "Mike Johnson", amount: 980, status: "PENDING", dueDate: "2024-01-20", paidDate: null, classes: 20 },
  { id: "INV-003", teacher: "Emily Davis", amount: 1540, status: "PAID", dueDate: "2024-01-10", paidDate: "2024-01-09", classes: 28 },
  { id: "INV-004", teacher: "Lisa Park", amount: 720, status: "OVERDUE", dueDate: "2024-01-05", paidDate: null, classes: 15 },
  { id: "INV-005", teacher: "James Wilson", amount: 1100, status: "DRAFT", dueDate: null, paidDate: null, classes: 22 },
]

const stats = {
  totalPending: 1700,
  totalPaid: 12450,
  totalOverdue: 720,
  totalDraft: 1100,
}

export default function DemoInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "OVERDUE":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
      case "DRAFT":
        return <Badge className="bg-gray-100 text-gray-800"><FileText className="h-3 w-3 mr-1" />Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage teacher invoices and payments</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">${stats.totalPending.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid (This Month)</p>
                <p className="text-2xl font-bold">${stats.totalPaid.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">${stats.totalOverdue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Drafts</p>
                <p className="text-2xl font-bold">${stats.totalDraft.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search invoices..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Invoice</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Teacher</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Classes</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Due Date</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demoInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium">{invoice.id}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{invoice.teacher}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-600">{invoice.classes} classes</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold">${invoice.amount.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-600">{invoice.dueDate || "-"}</span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
