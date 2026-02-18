import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const { teacherId } = await params

  const invoices = await db.teacherInvoice.findMany({
    where: { teacherId, studioId },
    orderBy: { createdAt: "desc" }
  })

  const parsedInvoices = invoices.map((inv) => ({
    ...inv,
    lineItems: JSON.parse(inv.lineItems || "[]")
  }))

  return NextResponse.json(parsedInvoices)
}
