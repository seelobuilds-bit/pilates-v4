import { mobileConfig } from "@/src/lib/config"
import type { MobileRole } from "@/src/types/mobile"

export type NativeAppRoute =
  | "/(app)"
  | "/(app)/schedule"
  | "/(app)/inbox"
  | "/(app)/workspace"
  | "/(app)/profile"
  | "/(app)/reports"
  | "/(app)/people"

export type WorkspaceFeature = {
  id: string
  label: string
  description: string
  icon: string
  target: "native" | "web"
  nativeRoute?: NativeAppRoute
  href?: string
  group: "Overview" | "Operations" | "People" | "Growth" | "Commerce" | "Content" | "Settings"
}

function webBaseUrl() {
  return mobileConfig.apiBaseUrl.replace(/\/$/, "")
}

function withSubdomain(path: string, subdomain: string) {
  if (!subdomain) {
    return path
  }
  return `/${subdomain}${path.startsWith("/") ? path : `/${path}`}`
}

function ownerFeatures(): WorkspaceFeature[] {
  return [
    { id: "owner-dashboard", label: "Dashboard", description: "Studio metrics and operations", icon: "speedometer-outline", target: "native", nativeRoute: "/(app)", group: "Overview" },
    { id: "owner-reports", label: "Reports", description: "Financial and performance reporting", icon: "bar-chart-outline", target: "native", nativeRoute: "/(app)/reports", group: "Overview" },
    { id: "owner-inbox", label: "Inbox", description: "Client communication", icon: "mail-open-outline", target: "native", nativeRoute: "/(app)/inbox", group: "Overview" },
    { id: "owner-schedule", label: "Schedule", description: "Calendar and class sessions", icon: "calendar-outline", target: "native", nativeRoute: "/(app)/schedule", group: "Operations" },
    { id: "owner-classes", label: "Classes", description: "Class types and rules", icon: "grid-outline", target: "web", href: "/studio/classes", group: "Operations" },
    { id: "owner-class-flows", label: "Class Flows", description: "Flows and training requests", icon: "play-circle-outline", target: "web", href: "/studio/class-flows", group: "Operations" },
    { id: "owner-locations", label: "Locations", description: "Rooms and location setup", icon: "location-outline", target: "web", href: "/studio/locations", group: "Operations" },
    { id: "owner-clients", label: "Clients", description: "Client records and activity", icon: "people-outline", target: "native", nativeRoute: "/(app)/people", group: "People" },
    { id: "owner-teachers", label: "Teachers", description: "Teacher management", icon: "school-outline", target: "web", href: "/studio/teachers", group: "People" },
    { id: "owner-community", label: "Community", description: "Community feed and comments", icon: "chatbubbles-outline", target: "web", href: "/studio/community", group: "People" },
    { id: "owner-marketing", label: "Marketing", description: "Campaigns and automations", icon: "megaphone-outline", target: "web", href: "/studio/marketing", group: "Growth" },
    { id: "owner-leaderboards", label: "Leaderboards", description: "Studio rankings and goals", icon: "trophy-outline", target: "web", href: "/studio/leaderboards", group: "Growth" },
    { id: "owner-payments", label: "Payments", description: "Transaction history", icon: "card-outline", target: "web", href: "/studio/payments", group: "Commerce" },
    { id: "owner-invoices", label: "Invoices", description: "Invoice tracking", icon: "receipt-outline", target: "web", href: "/studio/invoices", group: "Commerce" },
    { id: "owner-store", label: "Store", description: "Products and offers", icon: "bag-handle-outline", target: "web", href: "/studio/store", group: "Commerce" },
    { id: "owner-vault", label: "The Vault", description: "Courses and media", icon: "folder-open-outline", target: "web", href: "/studio/vault", group: "Content" },
    { id: "owner-settings", label: "Settings", description: "Studio preferences", icon: "settings-outline", target: "web", href: "/studio/settings", group: "Settings" },
  ]
}

function teacherFeatures(): WorkspaceFeature[] {
  return [
    { id: "teacher-dashboard", label: "Dashboard", description: "Daily summary and tasks", icon: "speedometer-outline", target: "native", nativeRoute: "/(app)", group: "Overview" },
    { id: "teacher-reports", label: "Reports", description: "Teaching performance snapshot", icon: "bar-chart-outline", target: "native", nativeRoute: "/(app)/reports", group: "Overview" },
    { id: "teacher-schedule", label: "My Schedule", description: "Classes and timetable", icon: "calendar-outline", target: "native", nativeRoute: "/(app)/schedule", group: "Operations" },
    { id: "teacher-class-flows", label: "Class Flows", description: "Programming content", icon: "play-circle-outline", target: "web", href: "/teacher/class-flows", group: "Operations" },
    { id: "teacher-clients", label: "Clients", description: "Client progress and notes", icon: "people-outline", target: "native", nativeRoute: "/(app)/people", group: "People" },
    { id: "teacher-inbox", label: "Inbox", description: "Client communication", icon: "mail-open-outline", target: "native", nativeRoute: "/(app)/inbox", group: "People" },
    { id: "teacher-community", label: "Community", description: "Community activity", icon: "chatbubbles-outline", target: "web", href: "/teacher/community", group: "People" },
    { id: "teacher-social", label: "Social Media", description: "Social planning and tracking", icon: "images-outline", target: "web", href: "/teacher/social", group: "Growth" },
    { id: "teacher-leaderboards", label: "Leaderboards", description: "Performance ranking", icon: "trophy-outline", target: "web", href: "/teacher/leaderboards", group: "Growth" },
    { id: "teacher-invoices", label: "Invoices", description: "Invoice records", icon: "receipt-outline", target: "web", href: "/teacher/invoices", group: "Commerce" },
    { id: "teacher-vault", label: "The Vault", description: "Training resources", icon: "folder-open-outline", target: "web", href: "/teacher/vault", group: "Content" },
    { id: "teacher-settings", label: "Settings", description: "Profile and account preferences", icon: "settings-outline", target: "web", href: "/teacher/settings", group: "Settings" },
  ]
}

function clientFeatures(subdomain: string): WorkspaceFeature[] {
  return [
    {
      id: "client-book",
      label: "Book Classes",
      description: "Find and reserve sessions",
      icon: "calendar-outline",
      target: "web",
      href: withSubdomain("/book", subdomain),
      group: "Overview",
    },
    {
      id: "client-account",
      label: "My Account",
      description: "Bookings and profile settings",
      icon: "person-circle-outline",
      target: "web",
      href: withSubdomain("/account", subdomain),
      group: "Settings",
    },
  ]
}

export function getWorkspaceFeatures(role: MobileRole | undefined, studioSubdomain: string) {
  if (role === "OWNER") return ownerFeatures()
  if (role === "TEACHER") return teacherFeatures()
  return clientFeatures(studioSubdomain)
}

export function toWorkspaceUrl(href: string | undefined) {
  if (!href) {
    return webBaseUrl()
  }
  const base = webBaseUrl()
  return `${base}${href}`
}
