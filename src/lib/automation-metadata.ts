export const STOP_ON_BOOKING_MARKER = "[[STOP_ON_BOOKING]]"

export function hasStopOnBookingMarker(body: string | null | undefined) {
  if (!body) return false
  return body.split("\n")[0]?.trim() === STOP_ON_BOOKING_MARKER
}

export function stripAutomationBodyMarkers(body: string | null | undefined) {
  if (!body) return ""
  if (!hasStopOnBookingMarker(body)) {
    return body
  }

  return body
    .split("\n")
    .slice(1)
    .join("\n")
    .trimStart()
}

export function withAutomationBodyMarkers(params: {
  body: string
  stopOnBooking: boolean
}) {
  const cleaned = stripAutomationBodyMarkers(params.body)
  if (!params.stopOnBooking) {
    return cleaned
  }
  return `${STOP_ON_BOOKING_MARKER}\n${cleaned}`
}
