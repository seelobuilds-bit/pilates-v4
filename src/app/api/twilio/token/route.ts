import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getTwilioToken } from "@/lib/communications"

// GET - Get Twilio capability token for browser calling
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user || !["HQ_ADMIN", "SALES_AGENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const identity = `agent-${session.user.id}`
    const token = await getTwilioToken(identity)

    if (!token) {
      return NextResponse.json({ 
        error: "Twilio not configured", 
        message: "To enable browser-based calling, configure TWILIO_APP_SID, TWILIO_API_KEY, and TWILIO_API_SECRET"
      }, { status: 503 })
    }

    return NextResponse.json({ token, identity })
  } catch (error) {
    console.error("Failed to generate Twilio token:", error)
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }
}













