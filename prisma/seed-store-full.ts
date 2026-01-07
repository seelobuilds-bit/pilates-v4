const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("🛍️ Seeding Full Store Catalog...")

  const products = [
    // ============ APPAREL - LEGGINGS ============
    {
      name: "High-Waist Pilates Leggings",
      slug: "high-waist-pilates-leggings",
      description: "Our bestselling high-waisted leggings with 4-way stretch fabric. Squat-proof, moisture-wicking, and features a hidden waistband pocket for your essentials.",
      shortDescription: "Bestselling high-waisted leggings",
      category: "APPAREL",
      subcategory: "Leggings",
      baseCost: 22,
      suggestedRetail: 68,
      images: ["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500"],
      canAddLogo: true,
      logoPlacement: ["waistband", "hip", "ankle"],
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
        { name: "XL / Navy", size: "XL", color: "Navy", colorHex: "#1e3a5f" },
        { name: "XS / Burgundy", size: "XS", color: "Burgundy", colorHex: "#722f37" },
        { name: "S / Burgundy", size: "S", color: "Burgundy", colorHex: "#722f37" },
        { name: "M / Burgundy", size: "M", color: "Burgundy", colorHex: "#722f37" },
        { name: "L / Burgundy", size: "L", color: "Burgundy", colorHex: "#722f37" },
      ]
    },
    {
      name: "7/8 Length Leggings",
      slug: "seven-eighth-leggings",
      description: "Ankle-length leggings perfect for showing off your grip socks. High-rise fit with compressive fabric for support during your practice.",
      shortDescription: "Ankle-length studio leggings",
      category: "APPAREL",
      subcategory: "Leggings",
      baseCost: 20,
      suggestedRetail: 62,
      images: ["https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500"],
      canAddLogo: true,
      logoPlacement: ["waistband", "hip"],
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Olive", size: "XS", color: "Olive", colorHex: "#556b2f" },
        { name: "S / Olive", size: "S", color: "Olive", colorHex: "#556b2f" },
        { name: "M / Olive", size: "M", color: "Olive", colorHex: "#556b2f" },
        { name: "L / Olive", size: "L", color: "Olive", colorHex: "#556b2f" },
      ]
    },
    {
      name: "Bike Shorts",
      slug: "bike-shorts",
      description: "5-inch inseam bike shorts with no-ride design. Perfect for reformer classes or layering under longer tops.",
      shortDescription: "5-inch inseam bike shorts",
      category: "APPAREL",
      subcategory: "Shorts",
      baseCost: 15,
      suggestedRetail: 45,
      images: ["https://images.unsplash.com/photo-1591291621164-2c6367723315?w=500"],
      canAddLogo: true,
      logoPlacement: ["waistband", "leg"],
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Charcoal", size: "XS", color: "Charcoal", colorHex: "#36454f" },
        { name: "S / Charcoal", size: "S", color: "Charcoal", colorHex: "#36454f" },
        { name: "M / Charcoal", size: "M", color: "Charcoal", colorHex: "#36454f" },
        { name: "L / Charcoal", size: "L", color: "Charcoal", colorHex: "#36454f" },
      ]
    },
    {
      name: "Flare Yoga Pants",
      slug: "flare-yoga-pants",
      description: "Retro-inspired flare pants with a flattering high waist. Super soft fabric that drapes beautifully.",
      shortDescription: "High-waist flare yoga pants",
      category: "APPAREL",
      subcategory: "Pants",
      baseCost: 24,
      suggestedRetail: 72,
      images: ["https://images.unsplash.com/photo-1594381898411-846e7d193883?w=500"],
      canAddLogo: true,
      logoPlacement: ["waistband", "hip"],
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XL / Black", size: "XL", color: "Black", colorHex: "#000000" },
      ]
    },

    // ============ APPAREL - TOPS ============
    {
      name: "Seamless Sports Bra",
      slug: "seamless-sports-bra",
      description: "Medium support seamless sports bra with removable pads. Buttery soft fabric with no irritating seams.",
      shortDescription: "Seamless medium support bra",
      category: "APPAREL",
      subcategory: "Sports Bras",
      baseCost: 16,
      suggestedRetail: 48,
      images: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center", "back"],
      isFeatured: true,
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / White", size: "XS", color: "White", colorHex: "#ffffff" },
        { name: "S / White", size: "S", color: "White", colorHex: "#ffffff" },
        { name: "M / White", size: "M", color: "White", colorHex: "#ffffff" },
        { name: "L / White", size: "L", color: "White", colorHex: "#ffffff" },
        { name: "XS / Dusty Rose", size: "XS", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "S / Dusty Rose", size: "S", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "M / Dusty Rose", size: "M", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "L / Dusty Rose", size: "L", color: "Dusty Rose", colorHex: "#d4a5a5" },
      ]
    },
    {
      name: "Longline Sports Bra",
      slug: "longline-sports-bra",
      description: "Extended coverage longline bra that can be worn alone or under layers. Light support with beautiful strappy back detail.",
      shortDescription: "Strappy longline sports bra",
      category: "APPAREL",
      subcategory: "Sports Bras",
      baseCost: 18,
      suggestedRetail: 52,
      images: ["https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center"],
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Sage", size: "XS", color: "Sage", colorHex: "#9caf88" },
        { name: "S / Sage", size: "S", color: "Sage", colorHex: "#9caf88" },
        { name: "M / Sage", size: "M", color: "Sage", colorHex: "#9caf88" },
        { name: "L / Sage", size: "L", color: "Sage", colorHex: "#9caf88" },
      ]
    },
    {
      name: "Cropped Tank",
      slug: "cropped-tank",
      description: "Relaxed fit cropped tank with raw hem. Perfect for layering over your favorite sports bra.",
      shortDescription: "Relaxed cropped tank top",
      category: "APPAREL",
      subcategory: "Tanks",
      baseCost: 12,
      suggestedRetail: 38,
      images: ["https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center", "back"],
      variants: [
        { name: "XS / White", size: "XS", color: "White", colorHex: "#ffffff" },
        { name: "S / White", size: "S", color: "White", colorHex: "#ffffff" },
        { name: "M / White", size: "M", color: "White", colorHex: "#ffffff" },
        { name: "L / White", size: "L", color: "White", colorHex: "#ffffff" },
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Oatmeal", size: "XS", color: "Oatmeal", colorHex: "#d4c8b8" },
        { name: "S / Oatmeal", size: "S", color: "Oatmeal", colorHex: "#d4c8b8" },
        { name: "M / Oatmeal", size: "M", color: "Oatmeal", colorHex: "#d4c8b8" },
        { name: "L / Oatmeal", size: "L", color: "Oatmeal", colorHex: "#d4c8b8" },
      ]
    },
    {
      name: "Muscle Tank",
      slug: "muscle-tank",
      description: "Oversized muscle tank with dropped armholes. Lightweight and breathable for intense sessions.",
      shortDescription: "Oversized muscle tank",
      category: "APPAREL",
      subcategory: "Tanks",
      baseCost: 10,
      suggestedRetail: 32,
      images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center", "back-large"],
      variants: [
        { name: "S / White", size: "S", color: "White", colorHex: "#ffffff" },
        { name: "M / White", size: "M", color: "White", colorHex: "#ffffff" },
        { name: "L / White", size: "L", color: "White", colorHex: "#ffffff" },
        { name: "XL / White", size: "XL", color: "White", colorHex: "#ffffff" },
        { name: "S / Heather Gray", size: "S", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "M / Heather Gray", size: "M", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "L / Heather Gray", size: "L", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "XL / Heather Gray", size: "XL", color: "Heather Gray", colorHex: "#9ca3af" },
      ]
    },
    {
      name: "Long Sleeve Fitted Top",
      slug: "long-sleeve-fitted-top",
      description: "Form-fitting long sleeve top with thumbholes. Perfect for cooler studios or outdoor sessions.",
      shortDescription: "Fitted long sleeve with thumbholes",
      category: "APPAREL",
      subcategory: "Long Sleeves",
      baseCost: 18,
      suggestedRetail: 54,
      images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-left", "back"],
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Navy", size: "XS", color: "Navy", colorHex: "#1e3a5f" },
        { name: "S / Navy", size: "S", color: "Navy", colorHex: "#1e3a5f" },
        { name: "M / Navy", size: "M", color: "Navy", colorHex: "#1e3a5f" },
        { name: "L / Navy", size: "L", color: "Navy", colorHex: "#1e3a5f" },
      ]
    },

    // ============ APPAREL - OUTERWEAR ============
    {
      name: "Studio Hoodie",
      slug: "studio-hoodie-classic",
      description: "Classic pullover hoodie in soft fleece. Kangaroo pocket and adjustable drawstring hood.",
      shortDescription: "Classic fleece pullover hoodie",
      category: "APPAREL",
      subcategory: "Hoodies",
      baseCost: 22,
      suggestedRetail: 65,
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center", "front-left", "back-large"],
      isFeatured: true,
      variants: [
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XL / Black", size: "XL", color: "Black", colorHex: "#000000" },
        { name: "S / Heather Gray", size: "S", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "M / Heather Gray", size: "M", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "L / Heather Gray", size: "L", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "XL / Heather Gray", size: "XL", color: "Heather Gray", colorHex: "#9ca3af" },
        { name: "S / Navy", size: "S", color: "Navy", colorHex: "#1e3a5f" },
        { name: "M / Navy", size: "M", color: "Navy", colorHex: "#1e3a5f" },
        { name: "L / Navy", size: "L", color: "Navy", colorHex: "#1e3a5f" },
        { name: "XL / Navy", size: "XL", color: "Navy", colorHex: "#1e3a5f" },
      ]
    },
    {
      name: "Zip-Up Jacket",
      slug: "zip-up-jacket",
      description: "Lightweight zip-up jacket with thumb holes and zippered pockets. Perfect for warming up.",
      shortDescription: "Lightweight warm-up jacket",
      category: "APPAREL",
      subcategory: "Jackets",
      baseCost: 28,
      suggestedRetail: 78,
      images: ["https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-left", "back"],
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Charcoal", size: "XS", color: "Charcoal", colorHex: "#36454f" },
        { name: "S / Charcoal", size: "S", color: "Charcoal", colorHex: "#36454f" },
        { name: "M / Charcoal", size: "M", color: "Charcoal", colorHex: "#36454f" },
        { name: "L / Charcoal", size: "L", color: "Charcoal", colorHex: "#36454f" },
      ]
    },
    {
      name: "Cropped Sweatshirt",
      slug: "cropped-sweatshirt",
      description: "Cozy cropped sweatshirt with raw hem. Perfect length for high-waisted bottoms.",
      shortDescription: "Cozy cropped sweatshirt",
      category: "APPAREL",
      subcategory: "Sweatshirts",
      baseCost: 20,
      suggestedRetail: 58,
      images: ["https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center", "back"],
      variants: [
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "S / Cream", size: "S", color: "Cream", colorHex: "#fffdd0" },
        { name: "M / Cream", size: "M", color: "Cream", colorHex: "#fffdd0" },
        { name: "L / Cream", size: "L", color: "Cream", colorHex: "#fffdd0" },
      ]
    },

    // ============ APPAREL - SETS ============
    {
      name: "Matching Set - Leggings & Bra",
      slug: "matching-set-leggings-bra",
      description: "Coordinated sports bra and leggings set in our bestselling seamless fabric. Save when you buy together!",
      shortDescription: "Seamless bra and leggings set",
      category: "APPAREL",
      subcategory: "Sets",
      baseCost: 35,
      suggestedRetail: 98,
      images: ["https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500"],
      canAddLogo: true,
      logoPlacement: ["bra-front", "leggings-waistband"],
      isFeatured: true,
      variants: [
        { name: "XS / Black", size: "XS", color: "Black", colorHex: "#000000" },
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "XS / Sage", size: "XS", color: "Sage", colorHex: "#9caf88" },
        { name: "S / Sage", size: "S", color: "Sage", colorHex: "#9caf88" },
        { name: "M / Sage", size: "M", color: "Sage", colorHex: "#9caf88" },
        { name: "L / Sage", size: "L", color: "Sage", colorHex: "#9caf88" },
      ]
    },

    // ============ ACCESSORIES - SOCKS ============
    {
      name: "Grip Socks - Low Cut",
      slug: "grip-socks-low-cut",
      description: "Essential low-cut grip socks with silicone dots on the bottom. Perfect for reformer and mat classes.",
      shortDescription: "Low-cut non-slip grip socks",
      category: "ACCESSORIES",
      subcategory: "Socks",
      baseCost: 5,
      suggestedRetail: 16,
      images: ["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500"],
      canAddLogo: true,
      logoPlacement: ["top"],
      isFeatured: true,
      variants: [
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "S / White", size: "S", color: "White", colorHex: "#ffffff" },
        { name: "M / White", size: "M", color: "White", colorHex: "#ffffff" },
        { name: "L / White", size: "L", color: "White", colorHex: "#ffffff" },
        { name: "S / Gray", size: "S", color: "Gray", colorHex: "#808080" },
        { name: "M / Gray", size: "M", color: "Gray", colorHex: "#808080" },
        { name: "L / Gray", size: "L", color: "Gray", colorHex: "#808080" },
      ]
    },
    {
      name: "Grip Socks - Crew",
      slug: "grip-socks-crew",
      description: "Crew-length grip socks for extra ankle coverage. Non-slip silicone pattern on bottom.",
      shortDescription: "Crew-length non-slip socks",
      category: "ACCESSORIES",
      subcategory: "Socks",
      baseCost: 6,
      suggestedRetail: 18,
      images: ["https://images.unsplash.com/photo-1556741576-1edc15f48599?w=500"],
      canAddLogo: true,
      logoPlacement: ["cuff", "top"],
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
      name: "Grip Socks - Toeless",
      slug: "grip-socks-toeless",
      description: "Open-toe grip socks for better toe grip and flexibility. Popular for barre and mat work.",
      shortDescription: "Toeless non-slip socks",
      category: "ACCESSORIES",
      subcategory: "Socks",
      baseCost: 5,
      suggestedRetail: 16,
      images: ["https://images.unsplash.com/photo-1617952385804-7b326fa42766?w=500"],
      canAddLogo: true,
      logoPlacement: ["top"],
      variants: [
        { name: "S / Black", size: "S", color: "Black", colorHex: "#000000" },
        { name: "M / Black", size: "M", color: "Black", colorHex: "#000000" },
        { name: "L / Black", size: "L", color: "Black", colorHex: "#000000" },
        { name: "S / Blush", size: "S", color: "Blush", colorHex: "#de9797" },
        { name: "M / Blush", size: "M", color: "Blush", colorHex: "#de9797" },
        { name: "L / Blush", size: "L", color: "Blush", colorHex: "#de9797" },
      ]
    },
    {
      name: "Grip Socks 3-Pack",
      slug: "grip-socks-3-pack",
      description: "Bundle of 3 pairs of our bestselling low-cut grip socks. One black, one white, one gray.",
      shortDescription: "3-pack grip socks bundle",
      category: "ACCESSORIES",
      subcategory: "Socks",
      baseCost: 12,
      suggestedRetail: 38,
      images: ["https://images.unsplash.com/photo-1556741576-1edc15f48599?w=500"],
      canAddLogo: true,
      logoPlacement: ["top"],
      variants: [
        { name: "S", size: "S" },
        { name: "M", size: "M" },
        { name: "L", size: "L" },
      ]
    },

    // ============ ACCESSORIES - BAGS ============
    {
      name: "Mat Carrier Bag",
      slug: "mat-carrier-bag",
      description: "Canvas yoga mat bag with adjustable strap. Features side pocket for phone and keys.",
      shortDescription: "Canvas mat carrier bag",
      category: "ACCESSORIES",
      subcategory: "Bags",
      baseCost: 14,
      suggestedRetail: 42,
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"],
      canAddLogo: true,
      logoPlacement: ["front"],
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Natural", color: "Natural", colorHex: "#f5f5dc" },
        { name: "Navy", color: "Navy", colorHex: "#1e3a5f" },
      ]
    },
    {
      name: "Studio Tote Bag",
      slug: "studio-tote-bag",
      description: "Large canvas tote perfect for carrying all your studio essentials. Interior pockets for organization.",
      shortDescription: "Large canvas studio tote",
      category: "ACCESSORIES",
      subcategory: "Bags",
      baseCost: 12,
      suggestedRetail: 36,
      images: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-center"],
      isFeatured: true,
      variants: [
        { name: "Natural", color: "Natural", colorHex: "#f5f5dc" },
        { name: "Black", color: "Black", colorHex: "#000000" },
      ]
    },
    {
      name: "Duffle Bag",
      slug: "duffle-bag",
      description: "Weekender-style duffle with separate shoe compartment. Perfect for studio-to-work or weekend getaways.",
      shortDescription: "Weekender duffle with shoe pocket",
      category: "ACCESSORIES",
      subcategory: "Bags",
      baseCost: 25,
      suggestedRetail: 68,
      images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"],
      canAddLogo: true,
      logoPlacement: ["front-pocket"],
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Gray", color: "Gray", colorHex: "#808080" },
      ]
    },

    // ============ ACCESSORIES - DRINKWARE ============
    {
      name: "Insulated Water Bottle 32oz",
      slug: "water-bottle-32oz",
      description: "Double-wall vacuum insulated stainless steel bottle. Keeps drinks cold 24 hours or hot 12 hours.",
      shortDescription: "32oz insulated water bottle",
      category: "ACCESSORIES",
      subcategory: "Drinkware",
      baseCost: 12,
      suggestedRetail: 34,
      images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500"],
      canAddLogo: true,
      logoPlacement: ["front"],
      variants: [
        { name: "Matte Black", color: "Matte Black", colorHex: "#1a1a1a" },
        { name: "White", color: "White", colorHex: "#ffffff" },
        { name: "Rose Gold", color: "Rose Gold", colorHex: "#b76e79" },
        { name: "Sage", color: "Sage", colorHex: "#9caf88" },
      ]
    },
    {
      name: "Insulated Water Bottle 24oz",
      slug: "water-bottle-24oz",
      description: "Compact double-wall vacuum insulated bottle. Perfect size for quick workouts.",
      shortDescription: "24oz insulated water bottle",
      category: "ACCESSORIES",
      subcategory: "Drinkware",
      baseCost: 10,
      suggestedRetail: 28,
      images: ["https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500"],
      canAddLogo: true,
      logoPlacement: ["front"],
      variants: [
        { name: "Matte Black", color: "Matte Black", colorHex: "#1a1a1a" },
        { name: "White", color: "White", colorHex: "#ffffff" },
        { name: "Blush", color: "Blush", colorHex: "#de9797" },
      ]
    },
    {
      name: "Travel Tumbler",
      slug: "travel-tumbler",
      description: "20oz travel tumbler with straw lid. Double-wall insulation keeps drinks at perfect temp.",
      shortDescription: "20oz tumbler with straw",
      category: "ACCESSORIES",
      subcategory: "Drinkware",
      baseCost: 14,
      suggestedRetail: 38,
      images: ["https://images.unsplash.com/photo-1570554520913-ce75e2d6a2a3?w=500"],
      canAddLogo: true,
      logoPlacement: ["wrap"],
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "White", color: "White", colorHex: "#ffffff" },
        { name: "Dusty Rose", color: "Dusty Rose", colorHex: "#d4a5a5" },
      ]
    },

    // ============ ACCESSORIES - OTHER ============
    {
      name: "Hair Scrunchies Set",
      slug: "hair-scrunchies-set",
      description: "Set of 3 silk satin scrunchies that are gentle on hair. Perfect for keeping hair out of your face during practice.",
      shortDescription: "3-pack silk scrunchies",
      category: "ACCESSORIES",
      subcategory: "Hair",
      baseCost: 6,
      suggestedRetail: 18,
      images: ["https://images.unsplash.com/photo-1599012307497-bde73e7f098d?w=500"],
      canAddLogo: false,
      logoPlacement: [],
      variants: [
        { name: "Neutrals (Black/Cream/Gray)" },
        { name: "Pastels (Blush/Sage/Lavender)" },
      ]
    },
    {
      name: "Headband Set",
      slug: "headband-set",
      description: "Non-slip athletic headbands in a set of 3. Moisture-wicking fabric keeps sweat out of your eyes.",
      shortDescription: "3-pack athletic headbands",
      category: "ACCESSORIES",
      subcategory: "Hair",
      baseCost: 8,
      suggestedRetail: 24,
      images: ["https://images.unsplash.com/photo-1598531939929-6a80f44c2c9a?w=500"],
      canAddLogo: true,
      logoPlacement: ["center"],
      variants: [
        { name: "Black/Gray/White" },
        { name: "Black Only (3)" },
      ]
    },
    {
      name: "Towel - Small",
      slug: "towel-small",
      description: "Quick-dry microfiber sweat towel. Compact size perfect for wiping down during class.",
      shortDescription: "Small microfiber sweat towel",
      category: "ACCESSORIES",
      subcategory: "Towels",
      baseCost: 6,
      suggestedRetail: 18,
      images: ["https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500"],
      canAddLogo: true,
      logoPlacement: ["corner"],
      variants: [
        { name: "Gray", color: "Gray", colorHex: "#808080" },
        { name: "White", color: "White", colorHex: "#ffffff" },
        { name: "Black", color: "Black", colorHex: "#000000" },
      ]
    },
    {
      name: "Mat Towel",
      slug: "mat-towel",
      description: "Full-size mat towel with grip dots on the bottom. Absorbs sweat and adds extra cushion.",
      shortDescription: "Full-size grip mat towel",
      category: "ACCESSORIES",
      subcategory: "Towels",
      baseCost: 15,
      suggestedRetail: 42,
      images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500"],
      canAddLogo: true,
      logoPlacement: ["corner", "center"],
      variants: [
        { name: "Gray", color: "Gray", colorHex: "#808080" },
        { name: "Dusty Rose", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "Sage", color: "Sage", colorHex: "#9caf88" },
      ]
    },

    // ============ EQUIPMENT - MATS ============
    {
      name: "Premium Pilates Mat - 6mm",
      slug: "pilates-mat-6mm",
      description: "Extra thick 6mm eco-friendly TPE mat with alignment lines. Non-slip on both sides.",
      shortDescription: "6mm eco-friendly Pilates mat",
      category: "EQUIPMENT",
      subcategory: "Mats",
      baseCost: 20,
      suggestedRetail: 58,
      images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500"],
      canAddLogo: true,
      logoPlacement: ["corner"],
      isFeatured: true,
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Sage Green", color: "Sage Green", colorHex: "#9caf88" },
        { name: "Dusty Rose", color: "Dusty Rose", colorHex: "#d4a5a5" },
        { name: "Navy", color: "Navy", colorHex: "#1e3a5f" },
      ]
    },
    {
      name: "Travel Mat - 3mm",
      slug: "travel-mat-3mm",
      description: "Lightweight 3mm travel mat that folds up small. Perfect for on-the-go practice.",
      shortDescription: "3mm foldable travel mat",
      category: "EQUIPMENT",
      subcategory: "Mats",
      baseCost: 15,
      suggestedRetail: 42,
      images: ["https://images.unsplash.com/photo-1599058917727-824293c6f0a2?w=500"],
      canAddLogo: true,
      logoPlacement: ["corner"],
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Gray", color: "Gray", colorHex: "#808080" },
      ]
    },

    // ============ EQUIPMENT - PROPS ============
    {
      name: "Pilates Ring / Magic Circle",
      slug: "pilates-ring",
      description: "14-inch Pilates magic circle with padded handles. Perfect for inner/outer thigh and arm toning.",
      shortDescription: "14-inch magic circle",
      category: "EQUIPMENT",
      subcategory: "Props",
      baseCost: 12,
      suggestedRetail: 35,
      images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500"],
      canAddLogo: false,
      logoPlacement: [],
      variants: [
        { name: "Black", color: "Black", colorHex: "#000000" },
        { name: "Gray", color: "Gray", colorHex: "#808080" },
      ]
    },
    {
      name: "Resistance Bands - Light Set",
      slug: "resistance-bands-light",
      description: "Set of 3 fabric resistance bands (light, medium, heavy). Great for warm-ups and glute activation.",
      shortDescription: "3-pack fabric resistance bands",
      category: "EQUIPMENT",
      subcategory: "Resistance",
      baseCost: 10,
      suggestedRetail: 28,
      images: ["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500"],
      canAddLogo: true,
      logoPlacement: ["pouch"],
      variants: [
        { name: "Black Set" },
        { name: "Pastel Set" },
      ]
    },
    {
      name: "Long Resistance Band",
      slug: "long-resistance-band",
      description: "Extra long latex resistance band for stretching and strength training. 6 feet long with multiple grip positions.",
      shortDescription: "6ft latex resistance band",
      category: "EQUIPMENT",
      subcategory: "Resistance",
      baseCost: 6,
      suggestedRetail: 18,
      images: ["https://images.unsplash.com/photo-1598966739654-5e9a252d8c32?w=500"],
      canAddLogo: false,
      logoPlacement: [],
      variants: [
        { name: "Light (Yellow)", color: "Yellow", colorHex: "#fde047" },
        { name: "Medium (Green)", color: "Green", colorHex: "#4ade80" },
        { name: "Heavy (Blue)", color: "Blue", colorHex: "#60a5fa" },
      ]
    },
    {
      name: "Pilates Ball - 9 inch",
      slug: "pilates-ball-9inch",
      description: "Mini stability ball for core work and stretching. Comes with inflation straw.",
      shortDescription: "9-inch mini stability ball",
      category: "EQUIPMENT",
      subcategory: "Props",
      baseCost: 6,
      suggestedRetail: 16,
      images: ["https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500"],
      canAddLogo: false,
      logoPlacement: [],
      variants: [
        { name: "Purple", color: "Purple", colorHex: "#7c3aed" },
        { name: "Blue", color: "Blue", colorHex: "#60a5fa" },
        { name: "Gray", color: "Gray", colorHex: "#808080" },
      ]
    },
    {
      name: "Foam Roller - 18 inch",
      slug: "foam-roller-18",
      description: "Medium density foam roller for self-massage and myofascial release. 18 inches long.",
      shortDescription: "18-inch foam roller",
      category: "EQUIPMENT",
      subcategory: "Recovery",
      baseCost: 12,
      suggestedRetail: 32,
      images: ["https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=500"],
      canAddLogo: false,
      logoPlacement: [],
      variants: [
        { name: "Black" },
        { name: "Blue" },
      ]
    },
    {
      name: "Yoga Blocks (Set of 2)",
      slug: "yoga-blocks-set",
      description: "High-density EVA foam blocks for support and alignment. Lightweight yet sturdy.",
      shortDescription: "Set of 2 foam blocks",
      category: "EQUIPMENT",
      subcategory: "Props",
      baseCost: 10,
      suggestedRetail: 28,
      images: ["https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500"],
      canAddLogo: true,
      logoPlacement: ["side"],
      variants: [
        { name: "Gray", color: "Gray", colorHex: "#808080" },
        { name: "Purple", color: "Purple", colorHex: "#7c3aed" },
        { name: "Black", color: "Black", colorHex: "#000000" },
      ]
    },
    {
      name: "Yoga Strap",
      slug: "yoga-strap",
      description: "8-foot cotton yoga strap with D-ring buckle. Helps extend reach and deepen stretches.",
      shortDescription: "8ft cotton yoga strap",
      category: "EQUIPMENT",
      subcategory: "Props",
      baseCost: 5,
      suggestedRetail: 14,
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"],
      canAddLogo: true,
      logoPlacement: ["strap"],
      variants: [
        { name: "Gray", color: "Gray", colorHex: "#808080" },
        { name: "Purple", color: "Purple", colorHex: "#7c3aed" },
        { name: "Black", color: "Black", colorHex: "#000000" },
      ]
    },

    // ============ EQUIPMENT - BIG ITEMS ============
    {
      name: "At-Home Reformer",
      slug: "at-home-reformer",
      description: "Professional-grade foldable Pilates reformer for home use. Includes jumpboard and box. Easy to fold and store.",
      shortDescription: "Foldable home Pilates reformer",
      category: "EQUIPMENT",
      subcategory: "Reformers",
      baseCost: 800,
      suggestedRetail: 1899,
      images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500"],
      canAddLogo: true,
      logoPlacement: ["frame", "footbar"],
      isFeatured: true,
      variants: [
        { name: "Gray Frame" },
        { name: "Black Frame" },
      ]
    },
    {
      name: "Pilates Chair",
      slug: "pilates-chair",
      description: "Compact Pilates chair (Wunda chair) for home or studio. Split pedal design with 4 spring settings.",
      shortDescription: "Wunda chair with split pedal",
      category: "EQUIPMENT",
      subcategory: "Chairs",
      baseCost: 350,
      suggestedRetail: 799,
      images: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500"],
      canAddLogo: true,
      logoPlacement: ["frame"],
      variants: [
        { name: "Black Frame" },
      ]
    },
    {
      name: "Ladder Barrel",
      slug: "ladder-barrel",
      description: "Classic Pilates ladder barrel for stretching and strengthening. Adjustable rungs for different exercises.",
      shortDescription: "Pilates ladder barrel",
      category: "EQUIPMENT",
      subcategory: "Barrels",
      baseCost: 500,
      suggestedRetail: 1199,
      images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500"],
      canAddLogo: true,
      logoPlacement: ["barrel"],
      variants: [
        { name: "Natural Wood" },
        { name: "Black Frame" },
      ]
    },
    {
      name: "Spine Corrector",
      slug: "spine-corrector",
      description: "Arc barrel for spinal mobility and core work. Compact size perfect for home use.",
      shortDescription: "Arc barrel spine corrector",
      category: "EQUIPMENT",
      subcategory: "Barrels",
      baseCost: 120,
      suggestedRetail: 299,
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"],
      canAddLogo: false,
      logoPlacement: [],
      variants: [
        { name: "Gray", color: "Gray", colorHex: "#808080" },
        { name: "Black", color: "Black", colorHex: "#000000" },
      ]
    },
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
            sku: `${product.slug}-${v.name.toLowerCase().replace(/[\s\/\(\)]+/g, "-")}`,
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

  console.log("✅ Full store catalog seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
















