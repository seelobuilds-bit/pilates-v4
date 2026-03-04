type StudioClientLike = {
  createdAt: Date
}

export function splitMobileOwnerClientWindows(args: {
  studioClients: StudioClientLike[]
  currentStart: Date
  previousStart: Date
  periodEnd: Date
}) {
  const { studioClients, currentStart, previousStart, periodEnd } = args

  const currentRows = studioClients.filter(
    (client) => client.createdAt >= currentStart && client.createdAt < periodEnd
  )
  const previousCount = studioClients.filter(
    (client) => client.createdAt >= previousStart && client.createdAt < currentStart
  ).length

  return {
    currentRows,
    previousCount,
  }
}
