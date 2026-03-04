import { calculateAverageFillRate, countAttendedBookings } from "./attendance"
import { ratioPercentage, roundTo } from "./metrics"

type ClassSessionLike = {
  classTypeId: string
  capacity: number
  startTime: Date
  bookings: Array<{ status: string; clientId?: string }>
  location: {
    name: string
  }
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
  classType: {
    name: string
  }
  _count: {
    waitlists: number
  }
}

type ClassesSummary = {
  total: number
  totalCapacity: number
  totalAttendance: number
  averageFill: number
  byLocation: Array<{ name: string; count: number }>
  byTeacher: Array<{ name: string; count: number }>
  byTimeSlot: Array<{ time: string; fill: number; classes: number }>
  byDay: Array<{ day: string; fill: number; classes: number }>
  topClasses: Array<{ id: string; name: string; fill: number; waitlist: number }>
  underperforming: Array<{ id: string; name: string; fill: number; avgFill: number }>
}

export function buildClassesSummary(classSessions: ClassSessionLike[]): ClassesSummary {
  const classesByLocation: Record<string, number> = {}
  const classesByTeacher: Record<string, number> = {}
  const byTimeSlotMap = new Map<string, { time: string; fillTotal: number; classes: number }>()
  const byDayMap = new Map<string, { day: string; fillTotal: number; classes: number }>()
  const byClassTypeMap = new Map<
    string,
    {
      id: string
      name: string
      fillTotal: number
      classes: number
      waitlist: number
    }
  >()

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  for (const day of dayOrder) {
    byDayMap.set(day, { day, fillTotal: 0, classes: 0 })
  }

  for (const session of classSessions) {
    classesByLocation[session.location.name] = (classesByLocation[session.location.name] || 0) + 1
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`
    classesByTeacher[teacherName] = (classesByTeacher[teacherName] || 0) + 1

    const attendedCount = countAttendedBookings(session.bookings)
    const fill = ratioPercentage(attendedCount, session.capacity, 0)

    const slotLabel = new Date(session.startTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    const slotEntry = byTimeSlotMap.get(slotLabel) || { time: slotLabel, fillTotal: 0, classes: 0 }
    slotEntry.fillTotal += fill
    slotEntry.classes += 1
    byTimeSlotMap.set(slotLabel, slotEntry)

    const dayLabel = new Date(session.startTime).toLocaleDateString("en-US", { weekday: "short" })
    const dayEntry = byDayMap.get(dayLabel) || { day: dayLabel, fillTotal: 0, classes: 0 }
    dayEntry.fillTotal += fill
    dayEntry.classes += 1
    byDayMap.set(dayLabel, dayEntry)

    const classEntry = byClassTypeMap.get(session.classTypeId) || {
      id: session.classTypeId,
      name: session.classType.name,
      fillTotal: 0,
      classes: 0,
      waitlist: 0,
    }
    classEntry.fillTotal += fill
    classEntry.classes += 1
    classEntry.waitlist += session._count.waitlists
    byClassTypeMap.set(session.classTypeId, classEntry)
  }

  const totalCapacity = classSessions.reduce((sum, session) => sum + session.capacity, 0)
  const totalAttendance = classSessions.reduce((sum, session) => sum + countAttendedBookings(session.bookings), 0)
  const overallAverageFill = classSessions.length > 0 ? calculateAverageFillRate(classSessions, 0) : 0

  const byTimeSlot = Array.from(byTimeSlotMap.values())
    .map((item) => ({
      time: item.time,
      fill: item.classes > 0 ? roundTo(item.fillTotal / item.classes, 0) : 0,
      classes: item.classes,
    }))
    .sort((a, b) => b.fill - a.fill)

  const byDay = Array.from(byDayMap.values()).map((item) => ({
    day: item.day,
    fill: item.classes > 0 ? roundTo(item.fillTotal / item.classes, 0) : 0,
    classes: item.classes,
  }))

  const classFillRows = Array.from(byClassTypeMap.values()).map((item) => ({
    id: item.id,
    name: item.name,
    fill: item.classes > 0 ? roundTo(item.fillTotal / item.classes, 0) : 0,
    waitlist: item.waitlist,
  }))

  return {
    total: classSessions.length,
    totalCapacity,
    totalAttendance,
    averageFill: overallAverageFill,
    byLocation: Object.entries(classesByLocation).map(([name, count]) => ({ name, count })),
    byTeacher: Object.entries(classesByTeacher).map(([name, count]) => ({ name, count })),
    byTimeSlot,
    byDay,
    topClasses: [...classFillRows]
      .sort((a, b) => b.fill - a.fill)
      .slice(0, 5),
    underperforming: [...classFillRows]
      .filter((item) => item.fill < overallAverageFill)
      .sort((a, b) => a.fill - b.fill)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        fill: item.fill,
        avgFill: overallAverageFill,
      })),
  }
}
