export function resolveBookingRevenue(
  paidAmount: number | null | undefined,
  fallbackPrice: number | null | undefined
) {
  return paidAmount ?? fallbackPrice ?? 0
}
