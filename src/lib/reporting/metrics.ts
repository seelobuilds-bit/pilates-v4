function toFiniteNumber(value: number) {
  return Number.isFinite(value) ? value : 0
}

export function roundTo(value: number, decimals = 0) {
  const safeValue = toFiniteNumber(value)
  const factor = 10 ** Math.max(0, decimals)
  return Math.round(safeValue * factor) / factor
}

export function clampPercentage(value: number, decimals = 1) {
  const bounded = Math.min(100, Math.max(0, toFiniteNumber(value)))
  return roundTo(bounded, decimals)
}

export function ratioPercentage(numerator: number, denominator: number, decimals = 1) {
  const safeDenominator = toFiniteNumber(denominator)
  if (safeDenominator <= 0) return 0
  const safeNumerator = toFiniteNumber(numerator)
  return clampPercentage((safeNumerator / safeDenominator) * 100, decimals)
}

export function roundCurrency(value: number) {
  return roundTo(value, 2)
}
