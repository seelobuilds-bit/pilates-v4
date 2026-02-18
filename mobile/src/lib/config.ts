export const mobileConfig = {
  apiBaseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.thecurrent.app").replace(/\/$/, ""),
  studioSubdomain: (process.env.EXPO_PUBLIC_STUDIO_SUBDOMAIN || "").trim().toLowerCase(),
  studioName: process.env.EXPO_PUBLIC_STUDIO_NAME || "Current Studio",
  primaryColor: process.env.EXPO_PUBLIC_BRAND_PRIMARY || "#2563eb",
}
