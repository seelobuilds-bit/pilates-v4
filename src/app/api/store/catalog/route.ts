import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch product catalog (available to all studio owners)
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const featured = searchParams.get("featured")

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const where: Record<string, unknown> = {
      status: "ACTIVE"
    }

    if (category) {
      where.category = category
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const products = await db.product.findMany({
      where,
      include: {
        variants: {
          where: { inStock: true },
          orderBy: { name: "asc" }
        },
        _count: {
          select: { studioProducts: true }
        }
      },
      orderBy: [
        { isFeatured: "desc" },
        { name: "asc" }
      ]
    })

    // Get categories for filtering
    const categories = await db.product.groupBy({
      by: ["category"],
      where: { status: "ACTIVE" },
      _count: { id: true }
    })

    return NextResponse.json({
      products,
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.id
      }))
    })
  } catch (error) {
    console.error("Failed to fetch catalog:", error)
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 })
  }
}

// POST - Add product to catalog (HQ only)
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (session?.user?.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      shortDescription,
      category,
      subcategory,
      baseCost,
      suggestedRetail,
      images,
      canAddLogo,
      logoPlacement,
      weight,
      dimensions,
      materials,
      careInstructions,
      variants
    } = body

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    let slug = baseSlug
    let counter = 1
    while (await db.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        category,
        subcategory,
        baseCost,
        suggestedRetail,
        images: images || [],
        canAddLogo: canAddLogo ?? true,
        logoPlacement: logoPlacement || [],
        weight,
        dimensions,
        materials,
        careInstructions,
        variants: {
          create: variants?.map((v: { name: string; size?: string; color?: string; colorHex?: string; priceAdjustment?: number }) => ({
            sku: `${slug}-${v.name.toLowerCase().replace(/\s+/g, "-")}`,
            name: v.name,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            priceAdjustment: v.priceAdjustment || 0
          })) || []
        }
      },
      include: {
        variants: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Failed to create product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
















