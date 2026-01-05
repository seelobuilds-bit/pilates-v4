import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get sample orders for studio
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const store = await db.studioStore.findUnique({
      where: { studioId: session.user.studioId }
    })

    if (!store) {
      return NextResponse.json({ orders: [] })
    }

    const orders = await db.sampleOrder.findMany({
      where: { storeId: store.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Failed to fetch sample orders:", error)
    return NextResponse.json({ error: "Failed to fetch sample orders" }, { status: 500 })
  }
}

// POST - Create sample order
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      items, // Array of { productId, variantId?, quantity, includeLogoSample?, logoUrl? }
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      notes
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }

    // Get or create store
    let store = await db.studioStore.findUnique({
      where: { studioId: session.user.studioId }
    })

    if (!store) {
      store = await db.studioStore.create({
        data: {
          studioId: session.user.studioId,
          isEnabled: false
        }
      })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) continue

      // Sample pricing (usually discounted or free)
      const unitPrice = product.baseCost * 0.5 // 50% of cost for samples
      subtotal += unitPrice * (item.quantity || 1)

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
        unitPrice,
        includeLogoSample: item.includeLogoSample || false,
        logoUrl: item.logoUrl || null
      })
    }

    // Shipping cost for samples
    const shippingCost = subtotal > 100 ? 0 : 15

    const order = await db.sampleOrder.create({
      data: {
        storeId: store.id,
        status: "PENDING",
        shippingName,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry: shippingCountry || "US",
        subtotal,
        shippingCost,
        discount: 0,
        total: subtotal + shippingCost,
        notes,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to create sample order:", error)
    return NextResponse.json({ error: "Failed to create sample order" }, { status: 500 })
  }
}














