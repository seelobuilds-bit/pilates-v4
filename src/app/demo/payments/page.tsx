// Demo Payments Page - Mirrors /studio/payments/page.tsx
// Shows a connected Stripe state with mock payment data

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  CheckCircle,
  Settings,
  Banknote,
  Wallet
} from "lucide-react"
import { demoPayments, demoStats } from "../_data/demo-data"

export default function DemoPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "payouts">("overview")

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Manage your payments and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "overview" 
              ? "bg-violet-600 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Wallet className="h-4 w-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "payments" 
              ? "bg-violet-600 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <CreditCard className="h-4 w-4 inline mr-2" />
          Payments
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "payouts" 
              ? "bg-violet-600 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Banknote className="h-4 w-4 inline mr-2" />
          Payouts
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                    <p className="text-3xl font-bold text-gray-900">$4,250.00</p>
                    <p className="text-sm text-emerald-500 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> Ready to payout
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">$1,850.00</p>
                    <p className="text-sm text-gray-400 mt-2">Processing...</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">This Month</p>
                    <p className="text-3xl font-bold text-gray-900">${demoStats.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-sm text-emerald-500 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +{demoStats.revenueChange}% vs last month
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-400" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        Paid
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "payments" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              All Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "payouts" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5 text-gray-400" />
              Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Chase ****4521</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">$3,250.00</p>
                    <p className="text-xs text-gray-500">Dec 15, 2024</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    Completed
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Chase ****4521</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">$2,890.00</p>
                    <p className="text-xs text-gray-500">Dec 8, 2024</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    Completed
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Chase ****4521</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">$4,120.00</p>
                    <p className="text-xs text-gray-500">Dec 1, 2024</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    Completed
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}











