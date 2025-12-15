"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Users, TrendingUp, TrendingDown, Calendar } from "lucide-react"

interface ReportData {
  revenue: {
    total: number
    byLocation: { name: string; amount: number }[]
    byClassType: { name: string; amount: number }[]
  }
  clients: {
    total: number
    new: number
    active: number
    churned: number
  }
  classes: {
    total: number
    byLocation: { name: string; count: number }[]
    byTeacher: { name: string; count: number }[]
  }
  bookings: {
    total: number
    byStatus: { status: string; count: number }[]
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/studio/reports?days=${period}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error("Failed to fetch reports:", err)
      }
      setLoading(false)
    }
    fetchData()
  }, [period])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports</h1>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports</h1>
        <p className="text-gray-500">Failed to load reports</p>
      </div>
    )
  }

  const churnRate = data.clients.total > 0 
    ? ((data.clients.churned / data.clients.total) * 100).toFixed(1) 
    : "0"

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Analytics and insights for your studio</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">${data.revenue.total.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Clients</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.clients.total}</div>
            <p className="text-sm text-green-600 mt-1">+{data.clients.new} new</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Churn Rate</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{churnRate}%</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
            <div className="p-2 bg-violet-100 rounded-lg">
              <Calendar className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.bookings.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Revenue by Location</CardTitle>
              </CardHeader>
              <CardContent>
                {data.revenue.byLocation.length > 0 ? (
                  <div className="space-y-4">
                    {data.revenue.byLocation.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-semibold text-gray-900">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No revenue data</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Revenue by Class Type</CardTitle>
              </CardHeader>
              <CardContent>
                {data.revenue.byClassType.length > 0 ? (
                  <div className="space-y-4">
                    {data.revenue.byClassType.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-semibold text-gray-900">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No revenue data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Client Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">{data.clients.total}</p>
                  <p className="text-sm text-gray-500 mt-1">Total</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">{data.clients.new}</p>
                  <p className="text-sm text-gray-500 mt-1">New</p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">{data.clients.active}</p>
                  <p className="text-sm text-gray-500 mt-1">Active</p>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-xl">
                  <p className="text-3xl font-bold text-red-600">{data.clients.churned}</p>
                  <p className="text-sm text-gray-500 mt-1">Churned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Classes by Location</CardTitle>
              </CardHeader>
              <CardContent>
                {data.classes.byLocation.length > 0 ? (
                  <div className="space-y-4">
                    {data.classes.byLocation.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-semibold text-gray-900">{item.count} classes</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No class data</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Classes by Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                {data.classes.byTeacher.length > 0 ? (
                  <div className="space-y-4">
                    {data.classes.byTeacher.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-semibold text-gray-900">{item.count} classes</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No class data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
