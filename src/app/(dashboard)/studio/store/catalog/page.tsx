"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  Palette,
  Star,
  Package,
  ChevronRight
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
  variants: Array<{
    id: string
    name: string
    size: string | null
    color: string | null
    colorHex: string | null
  }>
}

export default function StoreCatalogPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [catalogRes, storeRes] = await Promise.all([
        fetch("/api/store/catalog"),
        fetch("/api/store")
      ])

      if (catalogRes.ok) {
        const data = await catalogRes.json()
        setProducts(data.products)
        setCategories(data.categories)
      }

      if (storeRes.ok) {
        const data = await storeRes.json()
        // Get IDs of products already in store
        const addedIds = new Set(data.store?.products?.map((p: { product: { id: string } }) => p.product.id) || [])
        setAddedProducts(addedIds as Set<string>)
      }
    } catch (err) {
      console.error("Failed to fetch catalog:", err)
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

  // Group products by category
  const groupedProducts: Record<string, Product[]> = {}
  filteredProducts.forEach(p => {
    const cat = p.category
    if (!groupedProducts[cat]) {
      groupedProducts[cat] = []
    }
    groupedProducts[cat].push(p)
  })

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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/studio/store">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-500 mt-1">Browse and add products to your store</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm mb-8">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
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
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.name} value={c.name}>
                    {getCategoryLabel(c.name)} ({c.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products by Category */}
      <div className="space-y-10">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{getCategoryLabel(category)}</h2>
              <Badge variant="secondary">{categoryProducts.length} products</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryProducts.map(product => {
                const isAdded = addedProducts.has(product.id)
                return (
                  <Link 
                    key={product.id} 
                    href={`/studio/store/catalog/${product.id}`}
                  >
                    <Card className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full ${isAdded ? 'ring-2 ring-green-500' : ''}`}>
                      <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
                        {product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.isFeatured && (
                            <Badge className="bg-amber-500 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {product.canAddLogo && (
                            <Badge className="bg-violet-600 text-xs">
                              <Palette className="h-3 w-3 mr-1" />
                              Custom Logo
                            </Badge>
                          )}
                        </div>

                        {isAdded && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-600 text-xs">In Store</Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {product.variants.length} variants
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            ${product.suggestedRetail}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}














