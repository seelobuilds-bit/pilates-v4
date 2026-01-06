"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ShoppingBag,
  Package,
  Filter,
  Loader2,
  Star,
  Truck,
  ChevronRight
} from "lucide-react"

interface Product {
  id: string
  productId: string
  name: string
  description: string
  shortDescription: string | null
  price: number
  compareAtPrice: number | null
  category: string
  subcategory: string | null
  images: string[]
  hasCustomLogo: boolean
  inStock: boolean
  variants: Array<{
    id: string
    name: string
    size: string | null
    color: string | null
    colorHex: string | null
    price: number
    inStock: boolean
  }>
}

interface Store {
  name: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  accentColor: string
  freeShippingThreshold: number | null
  flatShippingRate: number | null
  returnPolicy: string | null
  shippingInfo: string | null
}

export default function CustomerStorePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params)
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [studioName, setStudioName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchStore()
  }, [subdomain])

  async function fetchStore() {
    try {
      const res = await fetch(`/api/booking/${subdomain}/store`)
      if (res.ok) {
        const data = await res.json()
        setStore(data.store)
        setProducts(data.products || [])
        setCategories(data.categories || [])
        setStudioName(data.studioName || "")
      }
    } catch (err) {
      console.error("Failed to fetch store:", err)
    }
    setLoading(false)
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Available</h1>
        <p className="text-gray-500 mb-6">This studio&apos;s store is currently not available.</p>
        <Link href={`/${subdomain}`}>
          <Button variant="outline">
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      {store.bannerUrl ? (
        <div 
          className="h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${store.bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-2">{store.name}</h1>
              {store.description && (
                <p className="text-lg opacity-90 max-w-xl">{store.description}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="py-12 px-8"
          style={{ backgroundColor: store.accentColor }}
        >
          <div className="max-w-6xl mx-auto text-center text-white">
            {store.logoUrl && (
              <img 
                src={store.logoUrl} 
                alt={store.name}
                className="h-16 mx-auto mb-4"
              />
            )}
            <h1 className="text-4xl font-bold mb-2">{store.name}</h1>
            {store.description && (
              <p className="text-lg opacity-90 max-w-xl mx-auto">{store.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Free Shipping Banner */}
      {store.freeShippingThreshold && (
        <div className="bg-green-600 text-white text-center py-2 px-4">
          <Truck className="inline-block h-4 w-4 mr-2" />
          Free shipping on orders over ${store.freeShippingThreshold}!
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-200" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Link 
                key={product.id} 
                href={`/${subdomain}/store/${product.id}`}
              >
                <Card className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer h-full group">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
                    {product.images[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Sale Badge */}
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <Badge className="absolute top-3 left-3 bg-red-500">
                        Sale
                      </Badge>
                    )}

                    {/* Out of Stock Overlay */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-base py-2 px-4">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {getCategoryLabel(product.category)}
                    </p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    {product.shortDescription && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {product.shortDescription}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: store.accentColor }}>
                          ${product.price.toFixed(2)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-violet-600 transition-colors" />
                    </div>

                    {product.variants.length > 1 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {product.variants.length} options available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Store Info Footer */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {store.shippingInfo && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="h-5 w-5" style={{ color: store.accentColor }} />
                  Shipping Information
                </h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{store.shippingInfo}</p>
              </CardContent>
            </Card>
          )}
          
          {store.returnPolicy && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" style={{ color: store.accentColor }} />
                  Return Policy
                </h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{store.returnPolicy}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {studioName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}















