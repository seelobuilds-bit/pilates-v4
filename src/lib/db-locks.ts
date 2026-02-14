import { Prisma } from "@prisma/client"

/**
 * Acquire a row-level lock for a ClassSession.
 *
 * This helps prevent race conditions (e.g. overbooking) by serializing
 * concurrent transactions that modify/read capacity-sensitive state.
 *
 * IMPORTANT:
 * - Must be called inside a Prisma $transaction callback
 * - Keep the locked section short (avoid network calls while holding locks)
 */
export async function lockClassSession(
  tx: Prisma.TransactionClient,
  classSessionId: string
): Promise<void> {
  await tx.$queryRaw(
    Prisma.sql`SELECT id FROM "ClassSession" WHERE id = ${classSessionId} FOR UPDATE`
  )
}

