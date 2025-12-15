import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clients = await db.client.findMany({
    where: { studioId: session.user.studioId },
    include: {
      _count: { select: { bookings: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(clients)
}



