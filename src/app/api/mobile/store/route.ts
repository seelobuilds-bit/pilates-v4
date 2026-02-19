import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

export async function GET(request: NextRequest) {
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

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const search = String(request.nextUrl.searchParams.get("search") || "").trim()
    const status = String(request.nextUrl.searchParams.get("status") || "active").toLowerCase() === "all" ? "all" : "active"

    const store = await db.studioStore.findUnique({
      where: { studioId: studio.id },
      select: {
        id: true,
        isEnabled: true,
        storeName: true,
        storeDescription: true,
        accentColor: true,
      },
    })

    if (!store) {
      return NextResponse.json({
        role: "OWNER",
        studio: studioSummary,
        subdomain: studio.subdomain,
        filters: { search, status },
        store: {
          isEnabled: false,
          storeName: `${studio.name} Shop`,
          storeDescription: null,
          accentColor: null,
          products: [],
          orders: [],
          sampleOrders: [],
        },
        stats: {
          totalProducts: 0,
          activeProducts: 0,
          pendingOrders: 0,
          totalRevenue: 0,
        },
      })
    }

    const productWhere: Prisma.StudioProductWhereInput = {
      storeId: store.id,
      ...(status === "active" ? { isActive: true } : {}),
      ...(search
        ? {
            OR: [
              { customTitle: { contains: search, mode: "insensitive" } },
              { product: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    }

    const [products, orders, sampleOrders, totalProducts, activeProducts, pendingOrders, revenue] = await Promise.all([
      db.studioProduct.findMany({
        where: productWhere,
        select: {
          id: true,
          price: true,
          compareAtPrice: true,
          isActive: true,
          hasCustomLogo: true,
          customTitle: true,
          displayOrder: true,
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              images: true,
              suggestedRetail: true,
              inStock: true,
            },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        take: 250,
      }),
      db.merchOrder.findMany({
        where: { storeId: store.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          customerName: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.sampleOrder.findMany({
        where: { storeId: store.id },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.studioProduct.count({
        where: { storeId: store.id },
      }),
      db.studioProduct.count({
        where: { storeId: store.id, isActive: true },
      }),
      db.merchOrder.count({
        where: { storeId: store.id, status: { in: ["PENDING", "PROCESSING"] } },
      }),
      db.merchOrder.aggregate({
        where: { storeId: store.id, paymentStatus: "paid" },
        _sum: { studioEarnings: true },
      }),
    ])

    return NextResponse.json({
      role: "OWNER",
      studio: studioSummary,
      subdomain: studio.subdomain,
      filters: { search, status },
      store: {
        isEnabled: store.isEnabled,
        storeName: store.storeName || `${studio.name} Shop`,
        storeDescription: store.storeDescription,
        accentColor: store.accentColor,
        products: products.map((product) => ({
          id: product.id,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          isActive: product.isActive,
          hasCustomLogo: product.hasCustomLogo,
          customTitle: product.customTitle,
          displayOrder: product.displayOrder,
          product: {
            id: product.product.id,
            name: product.product.name,
            category: product.product.category,
            images: product.product.images || [],
            suggestedRetail: product.product.suggestedRetail,
            inStock: product.product.inStock,
          },
        })),
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          customerName: order.customerName,
          createdAt: order.createdAt.toISOString(),
        })),
        sampleOrders: sampleOrders.map((order) => ({
          id: order.id,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt.toISOString(),
        })),
      },
      stats: {
        totalProducts,
        activeProducts,
        pendingOrders,
        totalRevenue: revenue._sum.studioEarnings || 0,
      },
    })
  } catch (error) {
    console.error("Mobile store error:", error)
    return NextResponse.json({ error: "Failed to load store" }, { status: 500 })
  }
}
