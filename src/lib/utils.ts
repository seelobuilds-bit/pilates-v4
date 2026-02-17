import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SUPPORTED_CURRENCY_CODES = ["usd", "eur", "gbp", "cad", "aud", "nzd"] as const

function normalizeCurrencyCode(currencyCode?: string | null) {
  const normalized = (currencyCode || "usd").toLowerCase()
  return SUPPORTED_CURRENCY_CODES.includes(normalized as (typeof SUPPORTED_CURRENCY_CODES)[number])
    ? normalized
    : "usd"
}

export function formatCurrency(amount: number, currencyCode?: string | null, locale = "en-US"): string {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode).toUpperCase()

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizedCurrency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}
