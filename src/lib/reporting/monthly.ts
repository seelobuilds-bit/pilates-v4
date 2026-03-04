export type MonthlyCountBucket = {
  key: string
  month: string
  count: number
}

export type MonthlyRevenueBucket = {
  key: string
  month: string
  revenue: number
}

function resolveMonthlyBucketKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function buildMonthlyBucketBase(endDate: Date, months: number) {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(endDate.getFullYear(), endDate.getMonth() - (months - 1) + index, 1)
    return {
      key: resolveMonthlyBucketKey(date),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    }
  })
}

function buildMonthlyBucketBaseByOffsets(referenceDate: Date, monthOffsets: number[]) {
  return monthOffsets.map((offset) => {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + offset, 1)
    return {
      key: resolveMonthlyBucketKey(date),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    }
  })
}

export function buildMonthlyCountBuckets(endDate: Date, months = 6): MonthlyCountBucket[] {
  return buildMonthlyBucketBase(endDate, months).map((bucket) => ({
    ...bucket,
    count: 0,
  }))
}

export function buildMonthlyCountBucketsByOffsets(referenceDate: Date, monthOffsets: number[]) {
  return buildMonthlyBucketBaseByOffsets(referenceDate, monthOffsets).map((bucket) => ({
    ...bucket,
    count: 0,
  }))
}

export function buildMonthlyRevenueBuckets(endDate: Date, months = 6): MonthlyRevenueBucket[] {
  return buildMonthlyBucketBase(endDate, months).map((bucket) => ({
    ...bucket,
    revenue: 0,
  }))
}

export function buildMonthlyBucketLookup<T extends { key: string }>(buckets: T[]) {
  return new Map(buckets.map((bucket) => [bucket.key, bucket]))
}

export function addCountToMonthlyBuckets(
  lookup: Map<string, MonthlyCountBucket>,
  date: Date,
  count = 1
) {
  const key = resolveMonthlyBucketKey(date)
  const bucket = lookup.get(key)
  if (bucket) {
    bucket.count += count
  }
}

export function addRevenueToMonthlyBuckets(
  lookup: Map<string, MonthlyRevenueBucket>,
  date: Date,
  revenue: number
) {
  const key = resolveMonthlyBucketKey(date)
  const bucket = lookup.get(key)
  if (bucket) {
    bucket.revenue += revenue
  }
}
