type NextBookingLike =
  | {
      classSession: {
        startTime: Date | string
        classType: {
          name: string
        }
      }
    }
  | null
  | undefined

export function buildMobileClientHighlights(nextBooking: NextBookingLike) {
  if (!nextBooking) {
    return [{ label: "Next class", value: "No upcoming bookings yet" }]
  }

  return [
    {
      label: "Next class",
      value: `${nextBooking.classSession.classType.name} · ${new Date(nextBooking.classSession.startTime).toLocaleString()}`,
    },
  ]
}
