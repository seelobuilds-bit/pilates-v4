import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// POST - Add product to studio store
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      productId,
      price,
      compareAtPrice,
      hasCustomLogo,
      logoUrl,
      logoPlacement,
      customTitle,
      customDescription
    } = body

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

    // Get product to get suggested retail
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if already added
    const existing = await db.studioProduct.findUnique({
      where: {
        storeId_productId: {
          storeId: store.id,
          productId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Product already in store" }, { status: 400 })
    }

    // Create studio product
    const studioProduct = await db.studioProduct.create({
      data: {
        storeId: store.id,
        productId,
        price: price || product.suggestedRetail,
        compareAtPrice,
        hasCustomLogo: hasCustomLogo ?? false,
        logoUrl,
        logoPlacement,
        customTitle,
        customDescription,
        // Create variants for each product variant
        variants: {
          create: product.variants.map(v => ({
            variantId: v.id,
            price: v.priceAdjustment ? (price || product.suggestedRetail) + v.priceAdjustment : null,
            isActive: true
          }))
        }
      },
      include: {
        product: {
          include: { variants: true }
        },
        variants: {
          include: { variant: true }
        }
      }
    })

    return NextResponse.json(studioProduct)
  } catch (error) {
    console.error("Failed to add product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}

// PATCH - Update studio product settings
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      studioProductId,
      price,
      compareAtPrice,
      hasCustomLogo,
      logoUrl,
      logoPlacement,
      customTitle,
      customDescription,
      isActive,
      displayOrder
    } = body

    // Verify ownership
    const studioProduct = await db.studioProduct.findFirst({
      where: {
        id: studioProductId,
        store: { studioId: session.user.studioId }
      }
    })

    if (!studioProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const updated = await db.studioProduct.update({
      where: { id: studioProductId },
      data: {
        ...(price !== undefined && { price }),
        ...(compareAtPrice !== undefined && { compareAtPrice }),
        ...(hasCustomLogo !== undefined && { hasCustomLogo }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(logoPlacement !== undefined && { logoPlacement }),
        ...(customTitle !== undefined && { customTitle }),
        ...(customDescription !== undefined && { customDescription }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder })
      },
      include: {
        product: {
          include: { variants: true }
        },
        variants: {
          include: { variant: true }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE - Remove product from store
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  const studioProductId = searchParams.get("id")

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!studioProductId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 })
  }

  try {
    // Verify ownership
    const studioProduct = await db.studioProduct.findFirst({
      where: {
        id: studioProductId,
        store: { studioId: session.user.studioId }
      }
    })

    if (!studioProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await db.studioProduct.delete({
      where: { id: studioProductId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}














