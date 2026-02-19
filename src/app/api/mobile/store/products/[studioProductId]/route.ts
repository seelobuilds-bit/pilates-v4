import { OrderStatus, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const NON_CANCELLED_ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"]
const OPEN_ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioProductId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Store is available for studio owner accounts only" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const { studioProductId } = await params

    const studioProduct = await db.studioProduct.findFirst({
      where: {
        id: studioProductId,
        store: {
          studioId: studio.id,
        },
      },
      select: {
        id: true,
        storeId: true,
        price: true,
        compareAtPrice: true,
        isActive: true,
        hasCustomLogo: true,
        logoUrl: true,
        logoPlacement: true,
        customTitle: true,
        customDescription: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            shortDescription: true,
            category: true,
            images: true,
            suggestedRetail: true,
            baseCost: true,
            inStock: true,
            leadTimeDays: true,
            materials: true,
            careInstructions: true,
          },
        },
        variants: {
          select: {
            id: true,
            price: true,
            isActive: true,
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                size: true,
                color: true,
                inStock: true,
              },
            },
          },
          orderBy: {
            variant: {
              name: "asc",
            },
          },
        },
      },
    })

    if (!studioProduct) {
      return NextResponse.json({ error: "Store product not found" }, { status: 404 })
    }

    const orderItemWhere: Prisma.MerchOrderItemWhereInput = {
      studioProductId: studioProduct.id,
      order: {
        storeId: studioProduct.storeId,
      },
    }

    const [recentOrderItems, aggregatedSales, openOrderItems] = await Promise.all([
      db.merchOrderItem.findMany({
        where: orderItemWhere,
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          fulfilledQuantity: true,
          variantName: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              customerName: true,
              customerEmail: true,
              createdAt: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: "desc",
          },
        },
        take: 30,
      }),
      db.merchOrderItem.aggregate({
        where: {
          ...orderItemWhere,
          order: {
            storeId: studioProduct.storeId,
            status: {
              in: NON_CANCELLED_ORDER_STATUSES,
            },
          },
        },
        _sum: {
          quantity: true,
          totalPrice: true,
        },
      }),
      db.merchOrderItem.findMany({
        where: {
          ...orderItemWhere,
          order: {
            storeId: studioProduct.storeId,
            status: {
              in: OPEN_ORDER_STATUSES,
            },
          },
        },
        select: {
          quantity: true,
          fulfilledQuantity: true,
        },
      }),
    ])

    const pendingFulfillmentUnits = openOrderItems.reduce(
      (sum, item) => sum + Math.max(item.quantity - item.fulfilledQuantity, 0),
      0
    )

    return NextResponse.json({
      role: "OWNER",
      studio: {
        id: studio.id,
        name: studio.name,
        subdomain: studio.subdomain,
        primaryColor: studio.primaryColor,
        currency: studio.stripeCurrency,
      },
      product: {
        id: studioProduct.id,
        price: studioProduct.price,
        compareAtPrice: studioProduct.compareAtPrice,
        isActive: studioProduct.isActive,
        hasCustomLogo: studioProduct.hasCustomLogo,
        logoUrl: studioProduct.logoUrl,
        logoPlacement: studioProduct.logoPlacement,
        customTitle: studioProduct.customTitle,
        customDescription: studioProduct.customDescription,
        displayOrder: studioProduct.displayOrder,
        createdAt: studioProduct.createdAt.toISOString(),
        updatedAt: studioProduct.updatedAt.toISOString(),
        catalog: {
          id: studioProduct.product.id,
          name: studioProduct.product.name,
          slug: studioProduct.product.slug,
          description: studioProduct.product.description,
          shortDescription: studioProduct.product.shortDescription,
          category: studioProduct.product.category,
          images: studioProduct.product.images || [],
          suggestedRetail: studioProduct.product.suggestedRetail,
          baseCost: studioProduct.product.baseCost,
          inStock: studioProduct.product.inStock,
          leadTimeDays: studioProduct.product.leadTimeDays,
          materials: studioProduct.product.materials,
          careInstructions: studioProduct.product.careInstructions,
        },
        variants: studioProduct.variants.map((variant) => ({
          id: variant.id,
          price: variant.price,
          isActive: variant.isActive,
          variant: {
            id: variant.variant.id,
            name: variant.variant.name,
            sku: variant.variant.sku,
            size: variant.variant.size,
            color: variant.variant.color,
            inStock: variant.variant.inStock,
          },
        })),
      },
      stats: {
        unitsSold: aggregatedSales._sum.quantity || 0,
        grossSales: aggregatedSales._sum.totalPrice || 0,
        pendingFulfillmentUnits,
      },
      recentOrders: recentOrderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        fulfilledQuantity: item.fulfilledQuantity,
        variantName: item.variantName,
        order: {
          id: item.order.id,
          orderNumber: item.order.orderNumber,
          status: item.order.status,
          paymentStatus: item.order.paymentStatus,
          customerName: item.order.customerName,
          customerEmail: item.order.customerEmail,
          createdAt: item.order.createdAt.toISOString(),
          shippedAt: item.order.shippedAt?.toISOString() || null,
          deliveredAt: item.order.deliveredAt?.toISOString() || null,
        },
      })),
    })
  } catch (error) {
    console.error("Mobile store product detail error:", error)
    return NextResponse.json({ error: "Failed to load store product detail" }, { status: 500 })
  }
}
