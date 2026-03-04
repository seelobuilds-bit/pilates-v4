export function buildTeacherEntityResponse<TTeacher extends Record<string, unknown>>(args: {
  teacher: TTeacher
  upcomingClasses: unknown[]
  stats: unknown
  extendedStats: unknown
  scheduleClasses?: unknown[]
}) {
  return {
    ...args.teacher,
    upcomingClasses: args.upcomingClasses,
    ...(args.scheduleClasses ? { scheduleClasses: args.scheduleClasses } : {}),
    stats: args.stats,
    extendedStats: args.extendedStats,
  }
}

export function buildClientEntityResponse(args: {
  client: unknown
  bookings: unknown[]
  stats: unknown
  communications: unknown[]
}) {
  return {
    client: args.client,
    bookings: args.bookings,
    stats: args.stats,
    communications: args.communications,
  }
}

export function buildClassTypeEntityResponse<TClassType extends Record<string, unknown>>(args: {
  classType: TClassType
  stats: unknown
  locationIds: string[]
  teacherIds: string[]
}) {
  return {
    ...args.classType,
    stats: args.stats,
    locationIds: args.locationIds,
    teacherIds: args.teacherIds,
  }
}

export function buildLocationEntityResponse<TLocation extends Record<string, unknown>>(args: {
  location: TLocation
  stats: unknown
}) {
  return {
    ...args.location,
    stats: args.stats,
  }
}
