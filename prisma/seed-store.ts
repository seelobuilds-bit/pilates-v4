const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("🛍️ Seeding Store Products...")

  const products = [
    // Apparel
    {
      name: "Studio Pilates Leggings",
      slug: "studio-pilates-leggings",
      description: "High-waisted, squat-proof leggings perfect for all your Pilates movements. Made with moisture-wicking fabric that moves with you.",
      shortDescription: "High-waisted, squat-proof Pilates leggings",
      category: "APPAREL",
      subcategory: "Bottoms",
      baseCost: 25,
      suggestedRetail: 68,
      images: ["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500"],
      canAddLogo: true,
      logoPlacement: ["waistband", "hip"],
      weight: 0.3,
      materials: "78% Nylon, 22% Spandex",
      careInstructions: "Machine wash cold, tumble dry low",
      isFeatured: true,
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XL / Black", size: "XL", color: "Black", colorHex: "#000000" },
        { name: "XS / Navy", size: "XS", color: "Navy", colorHex: "#1e3a5f" },
        { name: "S / Navy", size: "S", color: "Navy", colorHex: "#1e3a5f" },
        { name: "M / Navy", size: "M", color: "Navy", colorHex: "#1e3a5f" },
        { name: "L / Navy", size: "L", color: "Navy", colorHex: "#1e3a5f" },
      ]
    },
    {
      name: "Reformer Sports Bra",
      slug: "reformer-sports-bra",
      description: "Medium support sports bra designed for Pilates and yoga. Features a flattering neckline and breathable mesh back panel.",
      shortDescription: "Medium support Pilates sports bra",
      category: "APPAREL",
      subcategory: "Tops",
      baseCost: 18,
      suggestedRetail: 48,
      images: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center", "back"],
      weight: 0.15,
      materials: "82% Polyester, 18% Spandex",
      careInstructions: "Machine wash cold, hang dry",
      isFeatured: true,
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Dusty Rose", size: "XS", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "S / Dusty Rose", size: "S", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "M / Dusty Rose", size: "M", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "L / Dusty Rose", size: "L", color: "Dusty Rose", colorHex: "#d4a5a5" },
      ]
    },
    {
      name: "Pilates Tank Top",
      slug: "pilates-tank-top",
      description: "Lightweight, flowy tank top perfect for layering or wearing on its own. Features a relaxed fit and soft, breathable fabric.",
      shortDescription: "Flowy Pilates tank top",
      category: "APPAREL",
      subcategory: "Tops",
      baseCost: 12,
      suggestedRetail: 38,
      images: ["https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center", "back"],
      weight: 0.1,
      materials: "65% Polyester, 35% Rayon",
      careInstructions: "Machine wash cold, tumble dry low",
      variants: [
        { name: "XS / White", size: "XS", color: "White", colorHex: "#ffffff" },
        { name: "S / White", size: "S", color: "White", colorHex: "#ffffff" },
        { name: "M / White", size: "M", color: "White", colorHex: "#ffffff" },
        { name: "L / White", size: "L", color: "White", colorHex: "#ffffff" },
        { name: "XS / Sage", size: "XS", color: "Sage", colorHex: "#9caf88" },
        { name: "S / Sage", size: "S", color: "Sage", colorHex: "#9caf88" },
        { name: "M / Sage", size: "M", color: "Sage", colorHex: "#9caf88" },
        { name: "L / Sage", size: "L", color: "Sage", colorHex: "#9caf88" },
      ]
    },
    // Accessories
    {
      name: "Grip Pilates Socks",
      slug: "grip-pilates-socks",
      description: "Non-slip grip socks essential for reformer and mat classes. Features silicone grips on the bottom and a comfortable low-cut design.",
      shortDescription: "Non-slip grip socks for Pilates",
      category: "ACCESSORIES",
      subcategory: "Footwear",
      baseCost: 6,
      suggestedRetail: 18,
      images: ["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500"],
      canAddLogo: true,
      logoPlacement: ["top"],
      weight: 0.05,
      materials: "95% Cotton, 5% Spandex",
      careInstructions: "Machine wash cold, air dry",
      isFeatured: true,
      variants: [
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "S / White", size: "S", color: "White", colorHex: "#ffffff" },
        { name: "M / White", size: "M", color: "White", colorHex: "#ffffff" },
        { name: "L / White", size: "L", color: "White", colorHex: "#ffffff" },
      ]
    },
    {
      name: "Studio Water Bottle",
      slug: "studio-water-bottle",
      description: "32oz insulated stainless steel water bottle that keeps drinks cold for 24 hours. Features a leak-proof lid and wide mouth opening.",
      shortDescription: "32oz insulated water bottle",
      category: "ACCESSORIES",
      subcategory: "Drinkware",
      baseCost: 12,
      suggestedRetail: 32,
      images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500"],
      canAddLogo: true,
      logoPlacement: ["front"],
      weight: 0.4,
      materials: "18/8 Stainless Steel",
      careInstructions: "Hand wash only",
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "White", color: "White", colorHex: "#ffffff" },
        { name: "Rose Gold", color: "Rose Gold", colorHex: "#b76e79" },
      ]
    },
    {
      name: "Pilates Mat Bag",
      slug: "pilates-mat-bag",
      description: "Stylish and functional yoga mat carrier bag with adjustable strap. Features pockets for keys, phone, and water bottle.",
      shortDescription: "Yoga mat carrier bag with pockets",
      category: "ACCESSORIES",
      subcategory: "Bags",
      baseCost: 15,
      suggestedRetail: 42,
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-pocket"],
      weight: 0.25,
      materials: "Canvas with Vegan Leather Trim",
      careInstructions: "Spot clean only",
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Natural", color: "Natural", colorHex: "#f5f5dc" },
        { name: "Navy", color: "Navy", colorHex: "#1e3a5f" },
      ]
    },
    {
      name: "Resistance Band Set",
      slug: "resistance-band-set",
      description: "Set of 5 resistance bands in varying strengths for at-home workouts. Includes carrying pouch and exercise guide.",
      shortDescription: "5-piece resistance band set",
      category: "EQUIPMENT",
      subcategory: "Resistance",
      baseCost: 10,
      suggestedRetail: 28,
      images: ["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500"],
      canAddLogo: true,
      logoPlacement: ["pouch"],
      weight: 0.3,
      materials: "Natural Latex",
      variants: [
        { name: "Standard Set" },
      ]
    },
    {
      name: "Pilates Ring",
      slug: "pilates-ring",
      description: "14-inch Pilates magic circle for toning and strengthening. Features padded handles for comfort during inner and outer thigh exercises.",
      shortDescription: "14-inch Pilates magic circle",
      category: "EQUIPMENT",
      subcategory: "Props",
      baseCost: 12,
      suggestedRetail: 35,
      images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500"],
      canAddLogo: false,
      logoPlacement: [],
      weight: 0.4,
      materials: "Fiberglass with Foam Padding",
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Purple", color: "Purple", colorHex: "#7c3aed" },
      ]
    },
    {
      name: "Premium Pilates Mat",
      slug: "premium-pilates-mat",
      description: "Extra thick 6mm eco-friendly TPE mat with alignment markings. Non-slip surface on both sides for stability.",
      shortDescription: "6mm eco-friendly Pilates mat",
      category: "EQUIPMENT",
      subcategory: "Mats",
      baseCost: 22,
      suggestedRetail: 58,
      images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500"],
      canAddLogo: true,
      logoPlacement: ["corner"],
      weight: 1.2,
      materials: "TPE (Thermoplastic Elastomer)",
      careInstructions: "Wipe clean with damp cloth",
      isFeatured: true,
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Sage Green", color: "Sage Green", colorHex: "#9caf88" },
        { name: "Dusty Rose", color: "Dusty Rose", colorHex: "#d4a5a5" },
      ]
    },
    {
      name: "Studio Hoodie",
      slug: "studio-hoodie",
      description: "Cozy fleece-lined hoodie perfect for warming up or wearing to and from class. Features kangaroo pocket and drawstring hood.",
      shortDescription: "Fleece-lined studio hoodie",
      category: "APPAREL",
      subcategory: "Outerwear",
      baseCost: 25,
      suggestedRetail: 65,
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-left", "back"],
      weight: 0.5,
      materials: "80% Cotton, 20% Polyester",
      careInstructions: "Machine wash cold, tumble dry low",
      variants: [
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XL / Black", size: "XL", color: "Black", colorHex: "#000000" },
        { name: "S / Heather Gray", size: "S", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "M / Heather Gray", size: "M", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "L / Heather Gray", size: "L", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "XL / Heather Gray", size: "XL", color: "Heather Gray", colorHex: "#9ca3af" },
      ]
    }
  ]

  for (const productData of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug }
    })

    if (existing) {
      console.log(`⏩ Product "${productData.name}" already exists, skipping...`)
      continue
    }

    console.log(`📦 Creating product: ${productData.name}`)

    const { variants, ...product } = productData

    await prisma.product.create({
      data: {
        ...product,
        variants: {
          create: variants.map((v: { name: string; size?: string; color?: string; colorHex?: string; priceAdjustment?: number }) => ({
            sku: `${product.slug}-${v.name.toLowerCase().replace(/[\s\/]+/g, "-")}`,
            name: v.name,
            size: v.size || null,
            color: v.color || null,
            colorHex: v.colorHex || null,
            priceAdjustment: v.priceAdjustment || 0,
            inStock: true
          }))
        }
      }
    })
  }

  console.log("✅ Store products seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
