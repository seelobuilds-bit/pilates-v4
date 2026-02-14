import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  RefreshCw,
  Package
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoPaymentsPage() {
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

  // Mock payment data since real payments would need Stripe integration
  const demoNow = new Date("2026-02-11T12:00:00Z")
  const mockPayments = [
    { id: "1", type: "Class Pack", client: "Sarah Johnson", amount: 150, status: "COMPLETED", date: demoNow },
    { id: "2", type: "Monthly Membership", client: "Mike Chen", amount: 99, status: "COMPLETED", date: new Date(demoNow.getTime() - 86400000) },
    { id: "3", type: "Drop-in Class", client: "Emily Davis", amount: 35, status: "COMPLETED", date: new Date(demoNow.getTime() - 172800000) },
    { id: "4", type: "Private Session", client: "James Wilson", amount: 120, status: "COMPLETED", date: new Date(demoNow.getTime() - 259200000) },
    { id: "5", type: "Monthly Membership", client: "Lisa Park", amount: 99, status: "PENDING", date: new Date(demoNow.getTime() - 345600000) },
  ]

  const totalRevenue = mockPayments.filter(p => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = mockPayments.filter(p => p.status === "PENDING").length

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Track revenue and manage transactions</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          Open Stripe Dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockPayments.length}</p>
                <p className="text-sm text-gray-500">Transactions</p>
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
                <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">+12%</p>
                <p className="text-sm text-gray-500">vs Last Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="transactions">
            <CreditCard className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <RefreshCw className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="packs">
            <Package className="h-4 w-4 mr-2" />
            Class Packs
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search transactions..." className="pl-9" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {mockPayments.map(payment => (
              <Card key={payment.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        payment.status === "COMPLETED" ? "bg-green-100" : "bg-amber-100"
                      }`}>
                        {payment.status === "COMPLETED" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payment.type}</p>
                        <p className="text-sm text-gray-500">
                          {payment.client} • {payment.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${payment.amount}</p>
                      <Badge className={
                        payment.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }>
                        {payment.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Subscription management coming soon</p>
              <p className="text-sm text-gray-400 mt-1">View and manage recurring memberships</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Packs Tab */}
        <TabsContent value="packs">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Class pack management coming soon</p>
              <p className="text-sm text-gray-400 mt-1">Create and manage class packages</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}



