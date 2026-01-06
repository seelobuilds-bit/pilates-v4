import { NextResponse } from "next/server"

// TwiML response for outbound calls
export async function POST(request: Request) {
  const formData = await request.formData()
  const to = formData.get("To") as string

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












