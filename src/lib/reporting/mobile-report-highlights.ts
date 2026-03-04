import { BookingStatus } from "@prisma/client"
import { countAttendedBookings } from "./attendance"
import { ratioPercentage } from "./metrics"

type HighlightSession = {
  classType: { name: string }
  capacity: number
  bookings: Array<{ status: BookingStatus }>
}

export function buildClassTypeHighlights(sessions: HighlightSession[]) {
  const byType = new Map<string, { sessions: number; capacity: number; attended: number }>()

  for (const session of sessions) {
    const key = session.classType.name
    const current = byType.get(key) || { sessions: 0, capacity: 0, attended: 0 }
    current.sessions += 1
    current.capacity += session.capacity
    current.attended += countAttendedBookings(session.bookings)
    byType.set(key, current)
  }

  return Array.from(byType.entries())
    .map(([name, value]) => ({
      label: name,
      value: `${value.sessions} classes · ${ratioPercentage(value.attended, value.capacity, 0)}% fill`,
      sessions: value.sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 3)
    .map(({ label, value }) => ({ label, value }))
}
