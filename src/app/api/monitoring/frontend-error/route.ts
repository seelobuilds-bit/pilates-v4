import { NextResponse } from "next/server"

const MAX_TEXT = 500
const MAX_STACK = 2000

function truncate(value: unknown, max = MAX_TEXT) {
  if (typeof value !== "string") return null
  return value.slice(0, max)
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}))

    const type = truncate(payload?.type)
    const message = truncate(payload?.message)
    const source = truncate(payload?.source)
    const page = truncate(payload?.page)
    const stack = truncate(payload?.stack, MAX_STACK)
    const line = typeof payload?.line === "number" ? payload.line : null
    const column = typeof payload?.column === "number" ? payload.column : null

    if (type || message) {
      console.error("[frontend-error]", {
        type,
        message,
        source,
        page,
        line,
        column,
        stack,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
