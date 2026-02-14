import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get studio's store settings and products
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get or create store
    let store = await db.studioStore.findUnique({
      where: { studioId: session.user.studioId },
      include: {
        products: {
          include: {
            product: {
              include: {
                variants: true
              }
            },
            variants: {
              include: {
                variant: true
              }
            }
          },
          orderBy: { displayOrder: "asc" }
        },
        sampleOrders: {
          orderBy: { createdAt: "desc" },
          take: 5
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            items: true
          }
        }
      }
    })

    if (!store) {
      // Create store if doesn't exist
      const studio = await db.studio.findUnique({
        where: { id: session.user.studioId },
        select: { name: true }
      })

      store = await db.studioStore.create({
        data: {
          studioId: session.user.studioId,
          storeName: `${studio?.name} Shop`,
          isEnabled: false
        },
        include: {
          products: {
            include: {
              product: {
                include: {
                  variants: true
                }
              },
              variants: {
                include: {
                  variant: true
                }
              }
            }
          },
          sampleOrders: true,
          orders: {
            include: {
              items: true
            }
          }
        }
      })
    }

    // Get studio subdomain for preview link
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId },
      select: { subdomain: true }
    })

    // Get stats
    const stats = {
      totalProducts: store.products.length,
      activeProducts: store.products.filter(p => p.isActive).length,
      pendingOrders: store.orders.filter(o => o.status === "PENDING" || o.status === "PROCESSING").length,
      totalRevenue: store.orders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.studioEarnings || 0), 0)
    }

    return NextResponse.json({ store, stats, subdomain: studio?.subdomain })
  } catch (error) {
    console.error("Failed to fetch store:", error)
    return NextResponse.json({ error: "Failed to fetch store" }, { status: 500 })
  }
}

// POST - Update store settings
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      isEnabled,
      storeName,
      storeDescription,
      logoUrl,
      bannerUrl,
      accentColor,
      freeShippingThreshold,
      flatShippingRate,
      returnPolicy,
      shippingInfo
    } = body

    const store = await db.studioStore.upsert({
      where: { studioId: session.user.studioId },
      update: {
        isEnabled,
        storeName,
        storeDescription,
        logoUrl,
        bannerUrl,
        accentColor,
        freeShippingThreshold,
        flatShippingRate,
        returnPolicy,
        shippingInfo
      },
      create: {
        studioId: session.user.studioId,
        isEnabled: isEnabled ?? false,
        storeName,
        storeDescription,
        logoUrl,
        bannerUrl,
        accentColor,
        freeShippingThreshold,
        flatShippingRate,
        returnPolicy,
        shippingInfo
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error("Failed to update store:", error)
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 })
  }
}















