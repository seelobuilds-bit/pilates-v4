import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Fetch public store data for customers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params

    // Find studio by subdomain
    const studio = await db.studio.findFirst({
      where: { subdomain },
      select: { id: true, name: true }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Get the store with active products
    const store = await db.studioStore.findUnique({
      where: { studioId: studio.id },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                shortDescription: true,
                category: true,
                subcategory: true,
                images: true,
                canAddLogo: true,
                inStock: true,
                materials: true,
                careInstructions: true
              }
            },
            variants: {
              where: { isActive: true },
              include: {
                variant: {
                  select: {
                    id: true,
                    name: true,
                    size: true,
                    color: true,
                    colorHex: true,
                    inStock: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // If no store or store not enabled
    if (!store || !store.isEnabled) {
      return NextResponse.json({ 
        store: null,
        message: "Store is not available"
      })
    }

    // Format products for public view
    const products = store.products.map(sp => ({
      id: sp.id,
      productId: sp.product.id,
      name: sp.customTitle || sp.product.name,
      description: sp.customDescription || sp.product.description,
      shortDescription: sp.product.shortDescription,
      price: sp.price,
      compareAtPrice: sp.compareAtPrice,
      category: sp.product.category,
      subcategory: sp.product.subcategory,
      images: sp.product.images,
      hasCustomLogo: sp.hasCustomLogo,
      inStock: sp.product.inStock,
      materials: sp.product.materials,
      careInstructions: sp.product.careInstructions,
      variants: sp.variants.map(v => ({
        id: v.id,
        variantId: v.variant.id,
        name: v.variant.name,
        size: v.variant.size,
        color: v.variant.color,
        colorHex: v.variant.colorHex,
        price: v.price || sp.price,
        inStock: v.variant.inStock
      }))
    }))

    // Group products by category
    const categories = [...new Set(products.map(p => p.category))]

    return NextResponse.json({
      store: {
        name: store.storeName || `${studio.name} Store`,
        description: store.storeDescription,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        accentColor: store.accentColor || "#7c3aed",
        freeShippingThreshold: store.freeShippingThreshold,
        flatShippingRate: store.flatShippingRate,
        returnPolicy: store.returnPolicy,
        shippingInfo: store.shippingInfo
      },
      products,
      categories,
      studioName: studio.name
    })
  } catch (error) {
    console.error("Failed to fetch public store:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



