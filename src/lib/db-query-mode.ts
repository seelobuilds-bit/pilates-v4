const LOW_POOL_MODE = (() => {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.DIRECT_URL,
    process.env.SUPABASE_STAGING_DATABASE_URL,
    process.env.SUPABASE_PROD_DATABASE_URL,
  ].filter((value): value is string => typeof value === "string" && value.length > 0)

  for (const raw of candidates) {
    try {
      const parsed = new URL(raw)
      const limit = Number(parsed.searchParams.get("connection_limit"))
      if (Number.isFinite(limit) && limit > 0 && limit <= 1) {
        return true
      }
    } catch {
      // Ignore invalid URL candidates and continue.
    }
  }

  return false
})()

export function isLowPoolMode() {
  return LOW_POOL_MODE
}

export async function runDbQueries<T extends unknown[]>(
  queries: { [K in keyof T]: () => Promise<T[K]> }
): Promise<T> {
  if (!LOW_POOL_MODE) {
    return Promise.all(queries.map((query) => query())) as Promise<T>
  }

  const results: unknown[] = []
  for (const query of queries) {
    results.push(await query())
  }

  return results as T
}
