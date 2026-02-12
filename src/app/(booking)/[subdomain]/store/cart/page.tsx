"use client"

import { use, useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

interface CartItem {
  studioProductId: string
  productId: string
  name: string
  image: string | null
  unitPrice: number
  quantity: number
  variantId?: string
  variantName?: string
}

interface StoreInfo {
  name: string
  accentColor: string
  freeShippingThreshold: number | null
  flatShippingRate: number | null
}

interface CheckoutForm {
  email: string
  name: string
  phone: string
  shippingName: string
  shippingAddress: string
  shippingAddress2: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
}

export default function StoreCartPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params)
  const router = useRouter()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CheckoutForm>({
    email: "",
    name: "",
    phone: "",
    shippingName: "",
    shippingAddress: "",
    shippingAddress2: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "US",
  })

  const cartKey = `store_cart_${subdomain}`

  const fetchContext = useCallback(async () => {
    try {
      const [storeRes, meRes] = await Promise.all([
        fetch(`/api/booking/${subdomain}/store`),
        fetch(`/api/booking/${subdomain}/me`),
      ])

      if (storeRes.ok) {
        const storeData = await storeRes.json()
        setStore(storeData.store)
      }

      if (meRes.ok) {
        const me = await meRes.json()
        setForm((prev) => ({
          ...prev,
          email: me.email || prev.email,
          name: `${me.firstName || ""} ${me.lastName || ""}`.trim() || prev.name,
          phone: me.phone || prev.phone,
          shippingName: `${me.firstName || ""} ${me.lastName || ""}`.trim() || prev.shippingName,
        }))
      }

      const raw = window.localStorage.getItem(cartKey)
      setItems(raw ? (JSON.parse(raw) as CartItem[]) : [])
    } catch (err) {
      console.error("Failed to load cart context:", err)
      setError("Failed to load cart")
    }

    setLoading(false)
  }, [cartKey, subdomain])

  useEffect(() => {
    void fetchContext()
  }, [fetchContext])

  function persist(nextItems: CartItem[]) {
    setItems(nextItems)
    window.localStorage.setItem(cartKey, JSON.stringify(nextItems))
  }

  function updateQuantity(index: number, delta: number) {
    const next = [...items]
    next[index].quantity = Math.max(1, next[index].quantity + delta)
    persist(next)
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index)
    persist(next)
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  )

  const shippingCost = useMemo(() => {
    if (!store) return 0
    if (store.freeShippingThreshold !== null && subtotal >= store.freeShippingThreshold) return 0
    return store.flatShippingRate ?? 0
  }, [store, subtotal])

  const total = subtotal + shippingCost

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError("Your cart is empty")
      return
    }

    setPlacingOrder(true)
    try {
      const res = await fetch(`/api/booking/${subdomain}/store/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            studioProductId: item.studioProductId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          })),
          customer: {
            email: form.email,
            name: form.name,
            phone: form.phone || undefined,
            shippingName: form.shippingName,
            shippingAddress: form.shippingAddress,
            shippingAddress2: form.shippingAddress2 || undefined,
            shippingCity: form.shippingCity,
            shippingState: form.shippingState,
            shippingZip: form.shippingZip,
            shippingCountry: form.shippingCountry || "US",
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to place order")
        setPlacingOrder(false)
        return
      }

      window.localStorage.removeItem(cartKey)
      setItems([])
      setOrderNumber(data.order?.orderNumber || null)
      setPlacingOrder(false)
    } catch (err) {
      console.error("Checkout failed:", err)
      setError("Failed to place order")
      setPlacingOrder(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Available</h1>
        <Link href={`/${subdomain}/store`}>
          <Button variant="outline">Back to Store</Button>
        </Link>
      </div>
    )
  }

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <Card className="max-w-xl mx-auto border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Order placed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your order <span className="font-semibold">#{orderNumber}</span> has been created.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push(`/${subdomain}/account`)} className="flex-1">
                Go to Account
              </Button>
              <Link href={`/${subdomain}/store`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
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
          <Badge variant="secondary">
            <ShoppingCart className="h-3 w-3 mr-1" />
            {items.length} item{items.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Your cart is empty.
              </div>
            ) : (
              items.map((item, index) => (
                <div key={`${item.studioProductId}-${item.variantId || "base"}-${index}`} className="border rounded-lg p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.variantName && <p className="text-sm text-gray-500">{item.variantName}</p>}
                      <p className="text-sm text-gray-600 mt-1">${item.unitPrice.toFixed(2)} each</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(index, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(index, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-semibold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckout} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shippingName">Shipping Name</Label>
                <Input
                  id="shippingName"
                  value={form.shippingName}
                  onChange={(e) => setForm((prev) => ({ ...prev, shippingName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Input
                  id="shippingAddress"
                  value={form.shippingAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, shippingAddress: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shippingAddress2">Address Line 2</Label>
                <Input
                  id="shippingAddress2"
                  value={form.shippingAddress2}
                  onChange={(e) => setForm((prev) => ({ ...prev, shippingAddress2: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    value={form.shippingCity}
                    onChange={(e) => setForm((prev) => ({ ...prev, shippingCity: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="shippingState">State</Label>
                  <Input
                    id="shippingState"
                    value={form.shippingState}
                    onChange={(e) => setForm((prev) => ({ ...prev, shippingState: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="shippingZip">ZIP</Label>
                  <Input
                    id="shippingZip"
                    value={form.shippingZip}
                    onChange={(e) => setForm((prev) => ({ ...prev, shippingZip: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="shippingCountry">Country</Label>
                  <Input
                    id="shippingCountry"
                    value={form.shippingCountry}
                    onChange={(e) => setForm((prev) => ({ ...prev, shippingCountry: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="my-2 border-t" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={placingOrder || items.length === 0}>
                {placingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
