import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined

  try {
    const parsed = new URL(raw)
    // Avoid queue timeouts in low-connection pooler environments.
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "30")
    }
    return parsed.toString()
  } catch {
    return raw
  }
}

const prismaUrl = resolveDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    prismaUrl
      ? {
          datasources: {
            db: {
              url: prismaUrl,
            },
          },
        }
      : undefined
  )

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
