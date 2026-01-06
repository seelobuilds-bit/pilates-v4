import { NextResponse } from "next/server"

// DEPRECATED: Course-level chat has been removed.
// Community chat is now subscription-tier only.
// Use /api/vault/subscription/chat instead.

export async function GET() {
  return NextResponse.json({ 
    error: "Course-level chat has been deprecated. Community chat is now subscription-tier only.",
    redirect: "/api/vault/subscription/chat"
  }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ 
    error: "Course-level chat has been deprecated. Community chat is now subscription-tier only.",
    redirect: "/api/vault/subscription/chat"
  }, { status: 410 })
}















