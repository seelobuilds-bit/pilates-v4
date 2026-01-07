"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Loader2,
  Truck,
  ChevronLeft,
  ChevronRight,
  Check,
  Minus,
  Plus
} from "lucide-react"

interface Variant {
  id: string
  variantId: string
  name: string
  size: string | null
  color: string | null
  colorHex: string | null
  price: number
  inStock: boolean
}

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
  materials: string | null
  careInstructions: string | null
  variants: Variant[]
}

interface Store {
  name: string
  accentColor: string
  freeShippingThreshold: number | null
  flatShippingRate: number | null
}

export default function CustomerProductPage({ 
  params 
}: { 
  params: Promise<{ subdomain: string; productId: string }> 
}) {
  const { subdomain, productId } = use(params)
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [subdomain, productId])

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/booking/${subdomain}/store`)
      if (res.ok) {
        const data = await res.json()
        setStore(data.store)
        const prod = data.products?.find((p: Product) => p.id === productId)
        if (prod) {
          setProduct(prod)
          if (prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0])
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch product:", err)
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

  // Get unique sizes and colors from variants
  const sizes = product?.variants
    .map(v => v.size)
    .filter((s, i, arr) => s && arr.indexOf(s) === i) || []
  const colors = product?.variants
    .filter(v => v.color)
    .reduce((acc, v) => {
      if (v.color && !acc.find(c => c.color === v.color)) {
        acc.push({ color: v.color, hex: v.colorHex })
      }
      return acc
    }, [] as Array<{ color: string; hex: string | null }>) || []

  const currentPrice = selectedVariant?.price || product?.price || 0
  const isOnSale = product?.compareAtPrice && product.compareAtPrice > currentPrice
  const savings = isOnSale ? product!.compareAtPrice! - currentPrice : 0

  async function addToCart() {
    setAdding(true)
    // TODO: Implement cart functionality
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert("Added to cart! (Cart functionality coming soon)")
    setAdding(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">This product is no longer available.</p>
        <Link href={`/${subdomain}/store`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${subdomain}/store`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
          </Link>
          <h1 className="font-semibold" style={{ color: store.accentColor }}>
            {store.name}
          </h1>
          <Button variant="outline" size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
          </Button>
        </div>
      </header>

      {/* Free Shipping Banner */}
      {store.freeShippingThreshold && (
        <div 
          className="text-white text-center py-2 px-4 text-sm"
          style={{ backgroundColor: store.accentColor }}
        >
          <Truck className="inline-block h-4 w-4 mr-2" />
          Free shipping on orders over ${store.freeShippingThreshold}!
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {product.images[currentImageIndex] ? (
                  <img 
                    src={product.images[currentImageIndex]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}

                {/* Sale Badge */}
                {isOnSale && (
                  <Badge className="absolute top-4 left-4 bg-red-500 text-lg py-1 px-3">
                    Save ${savings.toFixed(2)}
                  </Badge>
                )}

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-sm"
                      onClick={() => setCurrentImageIndex(i => i === 0 ? product.images.length - 1 : i - 1)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-sm"
                      onClick={() => setCurrentImageIndex(i => i === product.images.length - 1 ? 0 : i + 1)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex 
                        ? "border-2" 
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    style={idx === currentImageIndex ? { borderColor: store.accentColor } : {}}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-wide mb-2" style={{ color: store.accentColor }}>
                {getCategoryLabel(product.category)}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold" style={{ color: store.accentColor }}>
                  ${currentPrice.toFixed(2)}
                </span>
                {isOnSale && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.compareAtPrice!.toFixed(2)}
                    </span>
                    <Badge className="bg-red-500">
                      {Math.round((savings / product.compareAtPrice!) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {product.shortDescription && (
                <p className="text-gray-600">{product.shortDescription}</p>
              )}
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color: {selectedVariant?.color}
                </label>
                <div className="flex gap-2">
                  {colors.map(c => {
                    const isSelected = selectedVariant?.color === c.color
                    return (
                      <button
                        key={c.color}
                        onClick={() => {
                          const variant = product.variants.find(v => 
                            v.color === c.color && 
                            (!selectedVariant?.size || v.size === selectedVariant.size)
                          )
                          if (variant) setSelectedVariant(variant)
                        }}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-gray-900 scale-110" : "border-gray-200 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: c.hex || "#ccc" }}
                        title={c.color}
                      >
                        {isSelected && (
                          <Check className={`h-5 w-5 ${c.hex && parseInt(c.hex.slice(1), 16) < 0x888888 ? "text-white" : "text-gray-900"}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size: {selectedVariant?.size}
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => {
                    const variant = product.variants.find(v => 
                      v.size === size && 
                      (!selectedVariant?.color || v.color === selectedVariant.color)
                    )
                    const isSelected = selectedVariant?.size === size
                    const inStock = variant?.inStock
                    return (
                      <button
                        key={size}
                        onClick={() => variant && setSelectedVariant(variant)}
                        disabled={!inStock}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                          isSelected 
                            ? "border-2 bg-gray-900 text-white" 
                            : inStock
                              ? "border-gray-200 hover:border-gray-400"
                              : "border-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                        style={isSelected ? { backgroundColor: store.accentColor, borderColor: store.accentColor } : {}}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button 
              size="lg" 
              className="w-full text-lg py-6"
              style={{ backgroundColor: store.accentColor }}
              onClick={addToCart}
              disabled={!product.inStock || adding}
            >
              {adding ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="h-5 w-5 mr-2" />
              )}
              {!product.inStock ? "Out of Stock" : `Add to Cart - $${(currentPrice * quantity).toFixed(2)}`}
            </Button>

            {/* Shipping Info */}
            {store.freeShippingThreshold && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                <Truck className="inline-block h-4 w-4 mr-2 text-green-600" />
                {currentPrice * quantity >= store.freeShippingThreshold ? (
                  <span className="text-green-700 font-medium">
                    This order qualifies for free shipping!
                  </span>
                ) : (
                  <span className="text-green-700">
                    Add ${(store.freeShippingThreshold - currentPrice * quantity).toFixed(2)} more for free shipping
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </CardContent>
          </Card>

          {(product.materials || product.careInstructions) && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Details</h2>
                {product.materials && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Materials</h3>
                    <p className="text-gray-600">{product.materials}</p>
                  </div>
                )}
                {product.careInstructions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Care Instructions</h3>
                    <p className="text-gray-600">{product.careInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
















