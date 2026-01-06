"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  ShoppingBag,
  Package,
  Truck,
  DollarSign,
  Plus,
  Settings,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon,
  Check,
  Loader2,
  Store,
  ShoppingCart,
  Box,
  Palette,
  ExternalLink
} from "lucide-react"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string | null
  category: string
  subcategory: string | null
  baseCost: number
  suggestedRetail: number
  images: string[]
  canAddLogo: boolean
  logoPlacement: string[]
  inStock: boolean
  isFeatured: boolean
  variants: ProductVariant[]
  _count: { studioProducts: number }
}

interface ProductVariant {
  id: string
  sku: string
  name: string
  size: string | null
  color: string | null
  colorHex: string | null
  priceAdjustment: number
  inStock: boolean
}

interface StudioProduct {
  id: string
  price: number
  compareAtPrice: number | null
  hasCustomLogo: boolean
  logoUrl: string | null
  logoPlacement: string | null
  customTitle: string | null
  customDescription: string | null
  isActive: boolean
  displayOrder: number
  product: Product
  variants: Array<{
    id: string
    price: number | null
    isActive: boolean
    variant: ProductVariant
  }>
}

interface StudioStore {
  id: string
  isEnabled: boolean
  storeName: string | null
  storeDescription: string | null
  logoUrl: string | null
  bannerUrl: string | null
  accentColor: string | null
  freeShippingThreshold: number | null
  flatShippingRate: number | null
  returnPolicy: string | null
  shippingInfo: string | null
  products: StudioProduct[]
  sampleOrders: SampleOrder[]
  orders: MerchOrder[]
}

interface SampleOrder {
  id: string
  status: string
  total: number
  createdAt: string
}

interface MerchOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  customerName: string
  createdAt: string
}

export default function StudioStorePage() {
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StudioStore | null>(null)
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, pendingOrders: 0, totalRevenue: 0 })
  
  // Modals
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Settings form
  const [storeSettings, setStoreSettings] = useState({
    isEnabled: false,
    storeName: "",
    storeDescription: "",
    logoUrl: "",
    bannerUrl: "",
    accentColor: "#7c3aed",
    freeShippingThreshold: 100,
    flatShippingRate: 10,
    returnPolicy: "",
    shippingInfo: ""
  })

  // Sample order form
  const [showSampleOrder, setShowSampleOrder] = useState(false)
  const [sampleCatalog, setSampleCatalog] = useState<Array<{ id: string; name: string; baseCost: number }>>([])
  const [sampleItems, setSampleItems] = useState<Array<{ productId: string; variantId?: string; quantity: number; includeLogoSample: boolean }>>([])
  const [sampleShipping, setSampleShipping] = useState({
    shippingName: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "US"
  })
  const [orderingSample, setOrderingSample] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const storeRes = await fetch("/api/store")

      if (storeRes.ok) {
        const data = await storeRes.json()
        setStore(data.store)
        setStats(data.stats)
        setSubdomain(data.subdomain)
        if (data.store) {
          setStoreSettings({
            isEnabled: data.store.isEnabled,
            storeName: data.store.storeName || "",
            storeDescription: data.store.storeDescription || "",
            logoUrl: data.store.logoUrl || "",
            bannerUrl: data.store.bannerUrl || "",
            accentColor: data.store.accentColor || "#7c3aed",
            freeShippingThreshold: data.store.freeShippingThreshold || 100,
            flatShippingRate: data.store.flatShippingRate || 10,
            returnPolicy: data.store.returnPolicy || "",
            shippingInfo: data.store.shippingInfo || ""
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeSettings)
      })

      if (res.ok) {
        const updated = await res.json()
        setStore(prev => prev ? { ...prev, ...updated } : null)
        setShowSettings(false)
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
    }
    setSavingSettings(false)
  }

  async function removeProduct(studioProductId: string) {
    if (!confirm("Remove this product from your store?")) return
    
    try {
      const res = await fetch(`/api/store/products?id=${studioProductId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setStore(prev => prev ? {
          ...prev,
          products: prev.products.filter(p => p.id !== studioProductId)
        } : null)
      }
    } catch (err) {
      console.error("Failed to remove product:", err)
    }
  }

  async function toggleProductActive(studioProductId: string, isActive: boolean) {
    try {
      const res = await fetch("/api/store/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioProductId, isActive: !isActive })
      })

      if (res.ok) {
        setStore(prev => prev ? {
          ...prev,
          products: prev.products.map(p => 
            p.id === studioProductId ? { ...p, isActive: !isActive } : p
          )
        } : null)
      }
    } catch (err) {
      console.error("Failed to toggle product:", err)
    }
  }

  async function openSampleOrder() {
    setShowSampleOrder(true)
    // Fetch catalog for sample selection
    try {
      const res = await fetch("/api/store/catalog")
      if (res.ok) {
        const data = await res.json()
        setSampleCatalog(data.products.slice(0, 20).map((p: { id: string; name: string; baseCost: number }) => ({
          id: p.id,
          name: p.name,
          baseCost: p.baseCost
        })))
      }
    } catch (err) {
      console.error("Failed to fetch catalog:", err)
    }
  }

  async function orderSamples() {
    if (sampleItems.length === 0) {
      alert("Please add items to your sample order")
      return
    }
    
    setOrderingSample(true)
    try {
      const res = await fetch("/api/store/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: sampleItems,
          ...sampleShipping
        })
      })

      if (res.ok) {
        alert("Sample order submitted!")
        setShowSampleOrder(false)
        setSampleItems([])
        fetchData()
      }
    } catch (err) {
      console.error("Failed to order samples:", err)
    }
    setOrderingSample(false)
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      APPAREL: "Apparel",
      EQUIPMENT: "Equipment",
      ACCESSORIES: "Accessories",
      NUTRITION: "Nutrition",
      WELLNESS: "Wellness"
    }
    return labels[cat] || cat
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500 mt-1">Manage your merchandise store and products</p>
        </div>
        <div className="flex items-center gap-3">
          {subdomain && store?.isEnabled && (
            <a href={`/${subdomain}/store`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Store
              </Button>
            </a>
          )}
          <Button variant="outline" onClick={openSampleOrder}>
            <Box className="h-4 w-4 mr-2" />
            Order Samples
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Store Settings
          </Button>
          <Link href="/studio/store/catalog">
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Browse Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-gray-500">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeProducts}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-500">Pending Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-gray-500">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Status Banner */}
      {store?.isEnabled && subdomain ? (
        <Card className="border-0 shadow-sm mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Your store is live!</p>
                <p className="text-sm text-green-600">
                  Customers can visit: <span className="font-mono bg-green-100 px-2 py-0.5 rounded">/{subdomain}/store</span>
                </p>
              </div>
            </div>
            <a href={`/${subdomain}/store`} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Store
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Your store is not live yet</p>
                <p className="text-sm text-amber-600">Enable your store in settings to start selling</p>
              </div>
            </div>
            <Button onClick={() => setShowSettings(true)} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              Enable Store
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="products">
            <ShoppingBag className="h-4 w-4 mr-2" />
            My Products
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="samples">
            <Box className="h-4 w-4 mr-2" />
            Sample Orders
          </TabsTrigger>
        </TabsList>

        {/* My Products Tab */}
        <TabsContent value="products">
          {store?.products.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products in your store</h3>
                <p className="text-gray-500 mb-4">Browse our catalog and add products to start selling</p>
                <Link href="/studio/store/catalog">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Product Catalog
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {store?.products.map(sp => (
                <Card key={sp.id} className="border-0 shadow-sm overflow-hidden">
                  <Link href={`/studio/store/catalog/${sp.product.id}`}>
                    <div className="aspect-square bg-gray-100 relative cursor-pointer hover:opacity-90 transition-opacity">
                      {sp.product.images[0] ? (
                        <img 
                          src={sp.product.images[0]} 
                          alt={sp.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {sp.hasCustomLogo && (
                        <Badge className="absolute top-2 left-2 bg-violet-600">
                          <Palette className="h-3 w-3 mr-1" />
                          Custom Logo
                        </Badge>
                      )}
                      {!sp.isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary" className="text-lg py-2 px-4">Inactive</Badge>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/studio/store/catalog/${sp.product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-violet-600 cursor-pointer">
                        {sp.customTitle || sp.product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mb-2">{getCategoryLabel(sp.product.category)}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">${sp.price}</span>
                      {sp.compareAtPrice && (
                        <span className="text-sm text-gray-400 line-through">${sp.compareAtPrice}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span>{sp.variants.length} variants</span>
                      <span>•</span>
                      <span>{sp.product.inStock ? "In Stock" : "Out of Stock"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/studio/store/catalog/${sp.product.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleProductActive(sp.id, sp.isActive)}
                      >
                        {sp.isActive ? <Eye className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeProduct(sp.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {store?.orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {store?.orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <Badge className={
                          order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                          order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                          order.status === "PROCESSING" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-700"
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sample Orders Tab */}
        <TabsContent value="samples">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {store?.sampleOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Box className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-4">No sample orders yet</p>
                  <Button onClick={() => setShowSampleOrder(true)} variant="outline">
                    Order Samples
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {store?.sampleOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Sample Order</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <Badge className={
                          order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                          order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Store Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Store Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Store</p>
                <p className="text-sm text-gray-500">Make your store visible to customers</p>
              </div>
              <Switch
                checked={storeSettings.isEnabled}
                onCheckedChange={(v) => setStoreSettings({ ...storeSettings, isEnabled: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                placeholder="My Pilates Shop"
              />
            </div>

            <div className="space-y-2">
              <Label>Store Description</Label>
              <Textarea
                value={storeSettings.storeDescription}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeDescription: e.target.value })}
                placeholder="Describe your store..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Free Shipping Threshold ($)</Label>
                <Input
                  type="number"
                  value={storeSettings.freeShippingThreshold}
                  onChange={(e) => setStoreSettings({ ...storeSettings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Flat Shipping Rate ($)</Label>
                <Input
                  type="number"
                  value={storeSettings.flatShippingRate}
                  onChange={(e) => setStoreSettings({ ...storeSettings, flatShippingRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Return Policy</Label>
              <Textarea
                value={storeSettings.returnPolicy}
                onChange={(e) => setStoreSettings({ ...storeSettings, returnPolicy: e.target.value })}
                placeholder="Describe your return policy..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveSettings} 
              disabled={savingSettings}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sample Order Modal */}
      <Dialog open={showSampleOrder} onOpenChange={setShowSampleOrder}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Samples</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Order samples to try products before adding them to your store. 
              Samples are available at 50% of wholesale cost.
            </p>

            <div className="space-y-2">
              <Label>Select Products</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {sampleCatalog.map(product => (
                  <div 
                    key={product.id}
                    className={`p-2 border rounded-lg cursor-pointer text-sm ${
                      sampleItems.some(i => i.productId === product.id)
                        ? "border-violet-500 bg-violet-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      if (sampleItems.some(i => i.productId === product.id)) {
                        setSampleItems(sampleItems.filter(i => i.productId !== product.id))
                      } else {
                        setSampleItems([...sampleItems, { productId: product.id, quantity: 1, includeLogoSample: false }])
                      }
                    }}
                  >
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-gray-500">${(product.baseCost * 0.5).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Shipping Address</Label>
              <Input
                placeholder="Full Name"
                value={sampleShipping.shippingName}
                onChange={(e) => setSampleShipping({ ...sampleShipping, shippingName: e.target.value })}
              />
              <Input
                placeholder="Street Address"
                value={sampleShipping.shippingAddress}
                onChange={(e) => setSampleShipping({ ...sampleShipping, shippingAddress: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={sampleShipping.shippingCity}
                  onChange={(e) => setSampleShipping({ ...sampleShipping, shippingCity: e.target.value })}
                />
                <Input
                  placeholder="State"
                  value={sampleShipping.shippingState}
                  onChange={(e) => setSampleShipping({ ...sampleShipping, shippingState: e.target.value })}
                />
                <Input
                  placeholder="ZIP"
                  value={sampleShipping.shippingZip}
                  onChange={(e) => setSampleShipping({ ...sampleShipping, shippingZip: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Items ({sampleItems.length})</span>
                <span>${sampleItems.reduce((sum, item) => {
                  const product = sampleCatalog.find(p => p.id === item.productId)
                  return sum + (product ? product.baseCost * 0.5 * item.quantity : 0)
                }, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Shipping</span>
                <span>$15.00</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>${(sampleItems.reduce((sum, item) => {
                  const product = sampleCatalog.find(p => p.id === item.productId)
                  return sum + (product ? product.baseCost * 0.5 * item.quantity : 0)
                }, 0) + 15).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSampleOrder(false)}>
              Cancel
            </Button>
            <Button 
              onClick={orderSamples} 
              disabled={sampleItems.length === 0 || orderingSample}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {orderingSample ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
              Order Samples
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}















