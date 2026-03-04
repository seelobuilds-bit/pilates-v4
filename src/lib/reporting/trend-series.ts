const DAY_IN_MS = 1000 * 60 * 60 * 24

export function buildTrendBuckets(start: Date, end: Date, maxBuckets = 8) {
  const totalMs = Math.max(1, end.getTime() - start.getTime())
  const totalDays = Math.max(1, Math.ceil(totalMs / DAY_IN_MS))
  const bucketCount = Math.max(1, Math.min(maxBuckets, totalDays))
  const bucketMs = Math.max(1, Math.ceil(totalMs / bucketCount))

  const buckets: Array<{ start: Date; end: Date; label: string }> = []
  let cursor = start.getTime()

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketStart = new Date(cursor)
    const bucketEnd = new Date(index === bucketCount - 1 ? end.getTime() : Math.min(end.getTime(), cursor + bucketMs))
    const label = bucketStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    buckets.push({ start: bucketStart, end: bucketEnd, label })
    cursor = bucketEnd.getTime()
  }

  return buckets
}

export function bucketIndexForDate(value: Date, buckets: Array<{ start: Date; end: Date }>) {
  const timestamp = value.getTime()
  for (let index = 0; index < buckets.length; index += 1) {
    const bucket = buckets[index]
    if (timestamp >= bucket.start.getTime() && timestamp < bucket.end.getTime()) {
      return index
    }
  }
  return -1
}
