import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoStorePage() {
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

  // Get the studio store first
  const studioStore = await db.studioStore.findFirst({
    where: { studioId: studio.id }
  })

  const [products, orders] = await Promise.all([
    studioStore ? db.studioProduct.findMany({
      where: { storeId: studioStore.id },
      include: {
        product: { select: { name: true, description: true, images: true, category: true } }
      },
      orderBy: { createdAt: "desc" }
    }) : [],
    studioStore ? db.merchOrder.findMany({
      where: { storeId: studioStore.id },
      include: {
        client: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }) : []
  ])

  const activeProducts = products.filter(p => p.isActive).length
  const totalRevenue = orders.filter(o => o.status === "COMPLETED").reduce((sum, o) => sum + Number(o.total), 0)
  const pendingOrders = orders.filter(o => o.status === "PENDING" || o.status === "PROCESSING").length

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500 mt-1">Manage your merchandise and orders</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-gray-500">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-gray-500">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Orders
            {pendingOrders > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{pendingOrders}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search products..." className="pl-9" />
              </div>
            </CardContent>
          </Card>

          {products.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No products yet</p>
                <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-violet-100 to-purple-100 relative flex items-center justify-center">
                      {product.product.images && (product.product.images as string[])[0] ? (
                        <img src={(product.product.images as string[])[0]} alt={product.customTitle || product.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-violet-300" />
                      )}
                      {!product.isActive && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{product.customTitle || product.product.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.customDescription || product.product.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="font-bold text-violet-600">${Number(product.price).toFixed(2)}</p>
                        {product.compareAtPrice && (
                          <p className="text-sm text-gray-400 line-through">${Number(product.compareAtPrice).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Card key={order.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          order.status === "COMPLETED" ? "bg-green-100" :
                          order.status === "PENDING" ? "bg-amber-100" : "bg-gray-100"
                        }`}>
                          {order.status === "COMPLETED" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {order.client ? `${order.client.firstName} ${order.client.lastName}` : order.customerName} • {order._count.items} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
                        <Badge className={
                          order.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          order.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-700"
                        }>
                          {order.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}




