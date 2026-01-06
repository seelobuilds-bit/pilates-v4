"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Loader2,
  Package,
  Palette,
  DollarSign,
  Check,
  Upload,
  Image as ImageIcon,
  Eye,
  Plus,
  Minus,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingBag
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
  materials: string | null
  careInstructions: string | null
  variants: Array<{
    id: string
    name: string
    size: string | null
    color: string | null
    colorHex: string | null
    inStock: boolean
  }>
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
}

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [studioProduct, setStudioProduct] = useState<StudioProduct | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Form state
  const [price, setPrice] = useState(0)
  const [compareAtPrice, setCompareAtPrice] = useState<number | null>(null)
  const [hasCustomLogo, setHasCustomLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const [logoPlacement, setLogoPlacement] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  // Preview state
  const [showLogoPreview, setShowLogoPreview] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  async function fetchProduct() {
    try {
      // Fetch from catalog
      const catalogRes = await fetch("/api/store/catalog")
      if (catalogRes.ok) {
        const data = await catalogRes.json()
        const prod = data.products.find((p: Product) => p.id === productId)
        if (prod) {
          setProduct(prod)
          setPrice(prod.suggestedRetail)
          if (prod.logoPlacement.length > 0) {
            setLogoPlacement(prod.logoPlacement[0])
          }
        }
      }

      // Check if already in store
      const storeRes = await fetch("/api/store")
      if (storeRes.ok) {
        const data = await storeRes.json()
        const existing = data.store?.products?.find((p: { product: { id: string } }) => p.product.id === productId)
        if (existing) {
          setStudioProduct(existing)
          setPrice(existing.price)
          setCompareAtPrice(existing.compareAtPrice)
          setHasCustomLogo(existing.hasCustomLogo)
          setLogoUrl(existing.logoUrl || "")
          setLogoPlacement(existing.logoPlacement || "")
          setCustomTitle(existing.customTitle || "")
          setCustomDescription(existing.customDescription || "")
          setIsActive(existing.isActive)
        }
      }
    } catch (err) {
      console.error("Failed to fetch product:", err)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!product) return
    setSaving(true)

    try {
      if (studioProduct) {
        // Update existing
        const res = await fetch("/api/store/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studioProductId: studioProduct.id,
            price,
            compareAtPrice,
            hasCustomLogo,
            logoUrl: hasCustomLogo ? logoUrl : null,
            logoPlacement: hasCustomLogo ? logoPlacement : null,
            customTitle: customTitle || null,
            customDescription: customDescription || null,
            isActive
          })
        })

        if (res.ok) {
          const updated = await res.json()
          setStudioProduct(updated)
        }
      } else {
        // Add new
        const res = await fetch("/api/store/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            price,
            compareAtPrice,
            hasCustomLogo,
            logoUrl: hasCustomLogo ? logoUrl : null,
            logoPlacement: hasCustomLogo ? logoPlacement : null,
            customTitle: customTitle || null,
            customDescription: customDescription || null
          })
        })

        if (res.ok) {
          const newProduct = await res.json()
          setStudioProduct(newProduct)
        }
      }
    } catch (err) {
      console.error("Failed to save:", err)
    }
    setSaving(false)
  }

  const getPlacementLabel = (placement: string) => {
    const labels: Record<string, string> = {
      "front-center": "Front Center",
      "front-left": "Front Left (Heart)",
      "back": "Back",
      "back-large": "Back (Large)",
      "waistband": "Waistband",
      "hip": "Hip",
      "ankle": "Ankle",
      "leg": "Leg",
      "top": "Top",
      "cuff": "Cuff",
      "corner": "Corner",
      "side": "Side",
      "front": "Front",
      "wrap": "Wrap Around",
      "front-pocket": "Front Pocket",
      "strap": "Strap",
      "pouch": "Pouch",
      "frame": "Frame",
      "footbar": "Footbar",
      "barrel": "Barrel",
      "bra-front": "Bra Front",
      "leggings-waistband": "Leggings Waistband",
      "center": "Center"
    }
    return labels[placement] || placement
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

  const profit = price - (product?.baseCost || 0)
  const margin = product ? ((profit / price) * 100).toFixed(0) : 0

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-200" />
        <h2 className="text-lg font-medium text-gray-900">Product not found</h2>
        <Link href="/studio/store/catalog">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/studio/store/catalog">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {studioProduct && (
              <Badge className="bg-green-100 text-green-700">In Your Store</Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1">{getCategoryLabel(product.category)} • {product.subcategory}</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700"
          size="lg"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : studioProduct ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {studioProduct ? "Save Changes" : "Add to Store"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Product Images & Preview */}
        <div className="space-y-6">
          {/* Main Image */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="aspect-square bg-gray-100 relative">
              {product.images[currentImageIndex] ? (
                <div className="relative w-full h-full">
                  <img 
                    src={product.images[currentImageIndex]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Logo Preview Overlay */}
                  {hasCustomLogo && logoUrl && showLogoPreview && (
                    <div 
                      className={`absolute flex items-center justify-center pointer-events-none ${
                        logoPlacement === "front-center" ? "inset-0" :
                        logoPlacement === "front-left" ? "top-1/4 left-1/4 w-16 h-16" :
                        logoPlacement === "back" ? "inset-0" :
                        logoPlacement === "waistband" ? "top-1/3 left-1/4 right-1/4 h-8" :
                        logoPlacement === "hip" ? "top-1/2 right-1/4 w-12 h-12" :
                        logoPlacement === "corner" ? "bottom-4 right-4 w-16 h-16" :
                        logoPlacement === "top" ? "top-1/4 inset-x-0 h-12" :
                        "inset-0"
                      }`}
                    >
                      <img 
                        src={logoUrl} 
                        alt="Your Logo"
                        className={`object-contain opacity-80 ${
                          logoPlacement === "front-center" ? "max-w-[40%] max-h-[30%]" :
                          logoPlacement === "front-left" || logoPlacement === "corner" ? "w-full h-full" :
                          logoPlacement === "waistband" || logoPlacement === "top" ? "h-full" :
                          "max-w-[30%] max-h-[20%]"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-300" />
                </div>
              )}

              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() => setCurrentImageIndex(i => i === 0 ? product.images.length - 1 : i - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() => setCurrentImageIndex(i => i === product.images.length - 1 ? 0 : i + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isFeatured && (
                  <Badge className="bg-amber-500">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {product.canAddLogo && (
                  <Badge className="bg-violet-600">
                    <Palette className="h-3 w-3 mr-1" />
                    Customizable
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    idx === currentImageIndex ? "border-violet-500" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Product Details */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.materials && (
                  <div>
                    <span className="text-gray-500">Materials</span>
                    <p className="font-medium">{product.materials}</p>
                  </div>
                )}
                {product.careInstructions && (
                  <div>
                    <span className="text-gray-500">Care</span>
                    <p className="font-medium">{product.careInstructions}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Variants</span>
                  <p className="font-medium">{product.variants.length} options</p>
                </div>
                <div>
                  <span className="text-gray-500">Availability</span>
                  <p className="font-medium">{product.inStock ? "In Stock" : "Out of Stock"}</p>
                </div>
              </div>

              {/* Variants */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Available Variants</h4>
                <div className="flex flex-wrap gap-2">
                  {product.variants.slice(0, 12).map(variant => (
                    <Badge 
                      key={variant.id} 
                      variant="outline"
                      className="text-xs"
                      style={variant.colorHex ? { borderColor: variant.colorHex } : {}}
                    >
                      {variant.colorHex && (
                        <span 
                          className="w-3 h-3 rounded-full mr-1 inline-block border"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                      )}
                      {variant.name}
                    </Badge>
                  ))}
                  {product.variants.length > 12 && (
                    <Badge variant="secondary" className="text-xs">
                      +{product.variants.length - 12} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Customization Options */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Pricing
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Your Price ($)</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                    />
                    <p className="text-xs text-gray-500">Suggested: ${product.suggestedRetail}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Compare At ($)</Label>
                    <Input
                      type="number"
                      value={compareAtPrice || ""}
                      onChange={(e) => setCompareAtPrice(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Optional"
                      min={0}
                      step={0.01}
                    />
                    <p className="text-xs text-gray-500">Show as discounted</p>
                  </div>
                </div>

                {/* Profit Calculator */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Your Cost</span>
                    <span className="font-medium">${product.baseCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Your Price</span>
                    <span className="font-medium">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-green-200">
                    <span className="text-sm font-medium text-green-700">Your Profit</span>
                    <div className="text-right">
                      <span className="font-bold text-green-700">${profit.toFixed(2)}</span>
                      <span className="text-xs text-green-600 ml-1">({margin}% margin)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo Customization */}
          {product.canAddLogo && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-violet-600" />
                    Logo Customization
                  </h3>
                  <Switch
                    checked={hasCustomLogo}
                    onCheckedChange={setHasCustomLogo}
                  />
                </div>

                {hasCustomLogo && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://your-logo-url.com/logo.png"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">PNG with transparent background recommended</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Logo Placement</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {product.logoPlacement.map(placement => (
                          <Button
                            key={placement}
                            variant={logoPlacement === placement ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLogoPlacement(placement)}
                            className={logoPlacement === placement ? "bg-violet-600 hover:bg-violet-700" : ""}
                          >
                            {getPlacementLabel(placement)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {logoUrl && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowLogoPreview(!showLogoPreview)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {showLogoPreview ? "Hide Preview" : "Show Preview"}
                        </Button>
                        {showLogoPreview && (
                          <span className="text-xs text-gray-500">Preview shown on product image</span>
                        )}
                      </div>
                    )}

                    {/* Logo Preview Box */}
                    {logoUrl && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2">Your Logo</p>
                        <div className="bg-white border rounded-lg p-4 flex items-center justify-center h-24">
                          <img 
                            src={logoUrl} 
                            alt="Your Logo" 
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom Content */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Custom Content (Optional)</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Custom Title</Label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={product.name}
                  />
                  <p className="text-xs text-gray-500">Leave blank to use default name</p>
                </div>

                <div className="space-y-2">
                  <Label>Custom Description</Label>
                  <Textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Add your own product description..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status (only if already in store) */}
          {studioProduct && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Product Status</h3>
                    <p className="text-sm text-gray-500">Show this product in your store</p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-700"
            size="lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : studioProduct ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <ShoppingBag className="h-4 w-4 mr-2" />
            )}
            {studioProduct ? "Save Changes" : "Add to My Store"}
          </Button>
        </div>
      </div>
    </div>
  )
}















