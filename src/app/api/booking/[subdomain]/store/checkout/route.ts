import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"

type CheckoutItemInput = {
  studioProductId: string
  variantId?: string | null
  quantity: number
}

type CheckoutCustomerInput = {
  email: string
  name: string
  phone?: string
  shippingName: string
  shippingAddress: string
  shippingAddress2?: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry?: string
}

function buildOrderNumber() {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ORD-${date}-${random}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const items = Array.isArray(body?.items) ? (body.items as CheckoutItemInput[]) : []
    const customer = (body?.customer || {}) as Partial<CheckoutCustomerInput>

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: { id: true },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const store = await db.studioStore.findUnique({
      where: { studioId: studio.id },
      select: {
        id: true,
        isEnabled: true,
        freeShippingThreshold: true,
        flatShippingRate: true,
      },
    })

    if (!store || !store.isEnabled) {
      return NextResponse.json({ error: "Store is not available" }, { status: 400 })
    }

    const decoded = await verifyClientToken(subdomain)
    const client =
      decoded && decoded.studioId === studio.id
        ? await db.client.findUnique({ where: { id: decoded.clientId } })
        : null

    const resolvedCustomer: CheckoutCustomerInput = {
      email: (customer.email || client?.email || "").trim(),
      name: (customer.name || `${client?.firstName || ""} ${client?.lastName || ""}`.trim()).trim(),
      phone: (customer.phone || client?.phone || "").trim() || undefined,
      shippingName: (customer.shippingName || customer.name || "").trim(),
      shippingAddress: (customer.shippingAddress || "").trim(),
      shippingAddress2: (customer.shippingAddress2 || "").trim() || undefined,
      shippingCity: (customer.shippingCity || "").trim(),
      shippingState: (customer.shippingState || "").trim(),
      shippingZip: (customer.shippingZip || "").trim(),
      shippingCountry: (customer.shippingCountry || "US").trim().toUpperCase(),
    }

    if (
      !resolvedCustomer.email ||
      !resolvedCustomer.name ||
      !resolvedCustomer.shippingName ||
      !resolvedCustomer.shippingAddress ||
      !resolvedCustomer.shippingCity ||
      !resolvedCustomer.shippingState ||
      !resolvedCustomer.shippingZip
    ) {
      return NextResponse.json({ error: "Missing required checkout details" }, { status: 400 })
    }

    for (const item of items) {
      if (!item.studioProductId || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 25) {
        return NextResponse.json({ error: "Invalid cart items" }, { status: 400 })
      }
    }

    const productIds = [...new Set(items.map((item) => item.studioProductId))]
    const studioProducts = await db.studioProduct.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
        isActive: true,
      },
      include: {
        product: {
          select: {
            name: true,
            inStock: true,
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            variant: {
              select: {
                id: true,
                name: true,
                inStock: true,
              },
            },
          },
        },
      },
    })

    const studioProductMap = new Map(studioProducts.map((sp) => [sp.id, sp]))
    const normalizedItems: Array<{
      studioProductId: string
      variantId?: string
      productName: string
      variantName?: string
      quantity: number
      unitPrice: number
      totalPrice: number
      hasCustomLogo: boolean
      logoUrl?: string | null
    }> = []

    for (const item of items) {
      const product = studioProductMap.get(item.studioProductId)
      if (!product) {
        return NextResponse.json({ error: "One or more products are no longer available" }, { status: 400 })
      }

      if (!product.product.inStock) {
        return NextResponse.json({ error: `${product.customTitle || product.product.name} is out of stock` }, { status: 400 })
      }

      let unitPrice = product.price
      let variantName: string | undefined
      let variantId: string | undefined

      if (item.variantId) {
        const variant = product.variants.find((v) => v.variantId === item.variantId)
        if (!variant || !variant.variant.inStock) {
          return NextResponse.json({ error: "Selected variant is unavailable" }, { status: 400 })
        }
        unitPrice = variant.price ?? product.price
        variantName = variant.variant.name
        variantId = variant.variantId
      }

      normalizedItems.push({
        studioProductId: product.id,
        variantId,
        productName: product.customTitle || product.product.name,
        variantName,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        hasCustomLogo: product.hasCustomLogo,
        logoUrl: product.logoUrl,
      })
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const freeShippingThreshold = store.freeShippingThreshold ?? null
    const shippingCost =
      freeShippingThreshold !== null && subtotal >= freeShippingThreshold
        ? 0
        : store.flatShippingRate ?? 0
    const taxAmount = 0
    const discount = 0
    const total = subtotal + shippingCost + taxAmount - discount

    let createdOrder: {
      id: string
      orderNumber: string
      total: number
      status: string
      _count: {
        items: number
      }
    } | null = null
    let attempts = 0
    while (!createdOrder && attempts < 5) {
      attempts += 1
      try {
        createdOrder = await db.merchOrder.create({
          data: {
            orderNumber: buildOrderNumber(),
            storeId: store.id,
            clientId: client?.id || null,
            customerEmail: resolvedCustomer.email,
            customerName: resolvedCustomer.name,
            customerPhone: resolvedCustomer.phone,
            shippingName: resolvedCustomer.shippingName,
            shippingAddress: resolvedCustomer.shippingAddress,
            shippingAddress2: resolvedCustomer.shippingAddress2,
            shippingCity: resolvedCustomer.shippingCity,
            shippingState: resolvedCustomer.shippingState,
            shippingZip: resolvedCustomer.shippingZip,
            shippingCountry: resolvedCustomer.shippingCountry || "US",
            subtotal,
            shippingCost,
            taxAmount,
            discount,
            total,
            paymentStatus: "pending",
            status: "PENDING",
            notes: "Created from customer storefront checkout",
            items: {
              create: normalizedItems.map((item) => ({
                studioProductId: item.studioProductId,
                variantId: item.variantId,
                productName: item.productName,
                variantName: item.variantName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                hasCustomLogo: item.hasCustomLogo,
                logoUrl: item.logoUrl || null,
              })),
            },
          },
          include: {
            _count: {
              select: {
                items: true,
              },
            },
          },
        })
      } catch (createError) {
        const message = createError instanceof Error ? createError.message : "Unknown error"
        if (!message.includes("Unique constraint")) {
          throw createError
        }
      }
    }

    if (!createdOrder) {
      return NextResponse.json({ error: "Failed to create order. Please retry." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        total: createdOrder.total,
        itemCount: createdOrder._count.items,
        status: createdOrder.status,
      },
    })
  } catch (error) {
    console.error("Failed to checkout store order:", error)
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 })
  }
}
