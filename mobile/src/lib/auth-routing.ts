export type AppRoute =
  | "/(app)"
  | "/(app)/schedule"
  | "/(app)/inbox"
  | "/(app)/workspace"
  | "/(app)/profile"
  | "/(app)/reports"
  | "/(app)/people"
  | "/(app)/classes"
  | "/(app)/class-flows"
  | "/(app)/teachers"
  | "/(app)/locations"
  | "/(app)/invoices"
  | "/(app)/payments"
  | "/(app)/store"
  | "/(app)/vault"
  | "/(app)/community"
  | "/(app)/marketing"
  | "/(app)/social"
  | "/(app)/leaderboards"

const APP_ROUTE_ALLOWLIST = new Set<AppRoute>([
  "/(app)",
  "/(app)/schedule",
  "/(app)/inbox",
  "/(app)/workspace",
  "/(app)/profile",
  "/(app)/reports",
  "/(app)/people",
  "/(app)/classes",
  "/(app)/class-flows",
  "/(app)/teachers",
  "/(app)/locations",
  "/(app)/invoices",
  "/(app)/payments",
  "/(app)/store",
  "/(app)/vault",
  "/(app)/community",
  "/(app)/marketing",
  "/(app)/social",
  "/(app)/leaderboards",
])

export function isAllowedAppRoute(value: unknown): value is AppRoute {
  if (typeof value !== "string") return false
  return APP_ROUTE_ALLOWLIST.has(value as AppRoute)
}

export function parseRequestedAppRoute(segments: string[]): AppRoute {
  const section = segments[1]
  if (!section || section === "index") return "/(app)"

  const candidate = `/(app)/${section}`
  if (isAllowedAppRoute(candidate)) {
    return candidate
  }

  return "/(app)"
}

export function resolvePostLoginRoute(params: {
  pendingPushRoute: AppRoute | null
  postLoginRoute: AppRoute | null
}): AppRoute {
  if (params.pendingPushRoute && isAllowedAppRoute(params.pendingPushRoute)) {
    return params.pendingPushRoute
  }

  if (params.postLoginRoute && isAllowedAppRoute(params.postLoginRoute)) {
    return params.postLoginRoute
  }

  return "/(app)"
}
