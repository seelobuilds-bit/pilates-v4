import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret")

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${params.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const clientId = payload.clientId as string

    const bookings = await db.booking.findMany({
      where: { clientId },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: {
              include: { user: { select: { firstName: true, lastName: true } } }
            },
            location: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
}



