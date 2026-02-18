import { NextResponse } from "next/server"

export async function POST() {
  // Mobile auth tokens are bearer tokens. Logout is handled client-side by deleting token.
  return NextResponse.json({ success: true })
}
