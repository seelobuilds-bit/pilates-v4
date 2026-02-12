import { NextRequest, NextResponse } from "next/server"
import { validateRequest } from "twilio"

// TwiML response for outbound calls
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const to = formData.get("To") as string
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioSignature = request.headers.get("x-twilio-signature")
  const isProduction = process.env.NODE_ENV === "production"

  if (isProduction && !authToken) {
    console.error("[TWILIO VOICE] Missing TWILIO_AUTH_TOKEN in production")
    return NextResponse.json({ error: "Webhook misconfigured" }, { status: 500 })
  }

  // Enforce signature verification in production. In non-production, verify when possible.
  if (authToken && twilioSignature) {
    const params: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      params[key] = String(value)
    }

    const isValid = validateRequest(authToken, twilioSignature, request.url, params)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  } else if (isProduction) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 })
  }

  // Generate TwiML for connecting the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your call...</Say>
  <Dial callerId="${process.env.TWILIO_PHONE_NUMBER}" record="record-from-answer">
    <Number>${to}</Number>
  </Dial>
</Response>`

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}












