import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}
