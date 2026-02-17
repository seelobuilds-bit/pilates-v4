import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"

const ALLOWED_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud", "nzd"]

// GET - Fetch studio settings
export async function GET() {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  try {
    const studio = await db.studio.findUnique({
      where: { id: auth.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to fetch studio settings:", error)
    return NextResponse.json({ error: "Failed to fetch studio settings" }, { status: 500 })
  }
}

// PATCH - Update studio settings
export async function PATCH(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  try {
    const body = await request.json()
    const { name, primaryColor, currency } = body

    const normalizedCurrency = currency ? String(currency).toLowerCase() : undefined
    if (normalizedCurrency && !ALLOWED_CURRENCIES.includes(normalizedCurrency)) {
      return NextResponse.json({ error: "Invalid currency code" }, { status: 400 })
    }

    const studio = await db.studio.update({
      where: { id: auth.studioId },
      data: {
        ...(name !== undefined && { name }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(normalizedCurrency !== undefined && { stripeCurrency: normalizedCurrency }),
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      }
    })

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to update studio settings:", error)
    return NextResponse.json({ error: "Failed to update studio settings" }, { status: 500 })
  }
}
