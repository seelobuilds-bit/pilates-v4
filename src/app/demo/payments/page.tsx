// Demo Payments Page - Mirrors /studio/payments/page.tsx
// Keep in sync with the real payments page

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Check } from "lucide-react"
import { demoPayments, demoStats } from "../_data/demo-data"

export default function DemoPaymentsPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Manage your studio payments</p>
        </div>
        <Button variant="outline">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          View Stripe Dashboard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${demoStats.revenue.toLocaleString()}</p>
                <p className="text-sm text-emerald-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +12% this month
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Payouts</p>
                <p className="text-3xl font-bold text-gray-900">$2,450</p>
                <p className="text-sm text-gray-400 mt-2">Next payout: Dec 20</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stripe Connected</p>
                  <p className="text-sm text-gray-500">Payments are enabled</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {demoPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                    {payment.client.firstName[0]}{payment.client.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.client.firstName} {payment.client.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{payment.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${payment.amount}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {payment.status === "SUCCEEDED" ? "Paid" : payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
