"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  ShoppingBag,
  Plus,
  Search,
  Package,
  DollarSign,
  TrendingUp,
  Box,
  Shirt,
  Tag,
  Eye,
  Edit,
  ExternalLink
} from "lucide-react"

const demoProducts = [
  { 
    id: "1", 
    name: "Grip Socks - Studio Edition", 
    price: 24.99, 
    category: "Accessories",
    inventory: 150,
    sold: 89,
    image: "🧦",
    isActive: true,
    hasCustomLogo: true
  },
  { 
    id: "2", 
    name: "Reformer Pilates Mat", 
    price: 89.99, 
    category: "Equipment",
    inventory: 45,
    sold: 32,
    image: "🧘",
    isActive: true,
    hasCustomLogo: true
  },
  { 
    id: "3", 
    name: "Studio Logo T-Shirt", 
    price: 34.99, 
    category: "Apparel",
    inventory: 200,
    sold: 156,
    image: "👕",
    isActive: true,
    hasCustomLogo: true
  },
  { 
    id: "4", 
    name: "Resistance Bands Set", 
    price: 29.99, 
    category: "Equipment",
    inventory: 75,
    sold: 48,
    image: "💪",
    isActive: true,
    hasCustomLogo: false
  },
  { 
    id: "5", 
    name: "Water Bottle - Branded", 
    price: 19.99, 
    category: "Accessories",
    inventory: 120,
    sold: 94,
    image: "🍶",
    isActive: false,
    hasCustomLogo: true
  },
]

const demoOrders = [
  { id: "ORD-001", customer: "Sarah Chen", items: 2, total: 59.98, status: "SHIPPED", date: "2024-01-15" },
  { id: "ORD-002", customer: "Mike Johnson", items: 1, total: 89.99, status: "PROCESSING", date: "2024-01-16" },
  { id: "ORD-003", customer: "Emily Davis", items: 3, total: 84.97, status: "DELIVERED", date: "2024-01-14" },
  { id: "ORD-004", customer: "Lisa Park", items: 1, total: 34.99, status: "PENDING", date: "2024-01-17" },
]

const stats = {
  totalProducts: 24,
  totalRevenue: 12450,
  ordersThisMonth: 156,
  averageOrderValue: 52.50
}

export default function DemoStorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [storeEnabled, setStoreEnabled] = useState(true)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case "SHIPPED":
        return <Badge className="bg-blue-100 text-blue-800">Shipped</Badge>
      case "PROCESSING":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case "PENDING":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500 mt-1">Sell branded merchandise to your clients</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Store Active</span>
            <Switch checked={storeEnabled} onCheckedChange={setStoreEnabled} />
          </div>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Store
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <Package className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue (Month)</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Orders (Month)</p>
                <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Order Value</p>
                <p className="text-2xl font-bold">${stats.averageOrderValue}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {/* Search */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoProducts.map((product) => (
              <Card key={product.id} className={`hover:shadow-md transition-shadow ${!product.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{product.image}</div>
                    <div className="flex gap-2">
                      {product.hasCustomLogo && (
                        <Badge className="bg-violet-100 text-violet-700">Custom Logo</Badge>
                      )}
                      {!product.isActive && (
                        <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.category}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold">${product.price}</span>
                    <span className="text-sm text-gray-500">{product.inventory} in stock</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-500">{product.sold} sold</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Order</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Customer</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Items</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demoOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <span className="font-mono text-sm font-medium">{order.id}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{order.customer}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{order.items} items</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">${order.total}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{order.date}</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
