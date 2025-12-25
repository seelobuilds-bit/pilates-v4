import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const cookieStore = await cookies()
  const clientToken = cookieStore.get(`client_${subdomain}`)?.value

  if (!clientToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const client = await db.client.findFirst({
      where: {
        id: clientToken,
        studio: { subdomain }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get client's vault subscriptions
    const subscriptions = await db.vaultSubscriber.findMany({
      where: {
        clientId: client.id,
        status: "active"
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            audience: true,
            monthlyPrice: true,
            yearlyPrice: true,
            features: true,
            description: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}
