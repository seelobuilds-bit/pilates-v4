import type { MobileRole } from "@/src/types/mobile"

export type NativeAppRoute =
  | "/(app)"
  | "/(app)/schedule"
  | "/(app)/inbox"
  | "/(app)/workspace"
  | "/(app)/profile"
  | "/(app)/reports"
  | "/(app)/people"
  | "/(app)/classes"
  | "/(app)/teachers"
  | "/(app)/locations"
  | "/(app)/invoices"
  | "/(app)/leaderboards"
  | "/(app)/class-flows"
  | "/(app)/payments"
  | "/(app)/store"
  | "/(app)/vault"
  | "/(app)/community"
  | "/(app)/marketing"
  | "/(app)/social"

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

function ownerFeatures(): WorkspaceFeature[] {
  return [
    { id: "owner-dashboard", label: "Dashboard", description: "Your studio overview", icon: "speedometer-outline", target: "native", nativeRoute: "/(app)", group: "Overview" },
    { id: "owner-reports", label: "Reports", description: "Revenue and performance", icon: "bar-chart-outline", target: "native", nativeRoute: "/(app)/reports", group: "Overview" },
    { id: "owner-inbox", label: "Inbox", description: "Client messages", icon: "mail-open-outline", target: "native", nativeRoute: "/(app)/inbox", group: "Overview" },
    { id: "owner-schedule", label: "Schedule", description: "Classes and calendar", icon: "calendar-outline", target: "native", nativeRoute: "/(app)/schedule", group: "Operations" },
    { id: "owner-classes", label: "Classes", description: "Class types and pricing", icon: "grid-outline", target: "native", nativeRoute: "/(app)/classes", group: "Operations" },
    { id: "owner-class-flows", label: "Class Flows", description: "Training and requests", icon: "play-circle-outline", target: "native", nativeRoute: "/(app)/class-flows", group: "Operations" },
    { id: "owner-locations", label: "Locations", description: "Studios and rooms", icon: "location-outline", target: "native", nativeRoute: "/(app)/locations", group: "Operations" },
    { id: "owner-clients", label: "Clients", description: "Client records", icon: "people-outline", target: "native", nativeRoute: "/(app)/people", group: "People" },
    { id: "owner-teachers", label: "Teachers", description: "Your teaching team", icon: "school-outline", target: "native", nativeRoute: "/(app)/teachers", group: "People" },
    { id: "owner-community", label: "Community", description: "Community posts", icon: "chatbubbles-outline", target: "native", nativeRoute: "/(app)/community", group: "People" },
    { id: "owner-marketing", label: "Marketing", description: "Campaigns and automations", icon: "megaphone-outline", target: "native", nativeRoute: "/(app)/marketing", group: "Growth" },
    { id: "owner-leaderboards", label: "Leaderboards", description: "Goals and rankings", icon: "trophy-outline", target: "native", nativeRoute: "/(app)/leaderboards", group: "Growth" },
    { id: "owner-payments", label: "Payments", description: "Payment history", icon: "card-outline", target: "native", nativeRoute: "/(app)/payments", group: "Commerce" },
    { id: "owner-invoices", label: "Invoices", description: "Invoice status", icon: "receipt-outline", target: "native", nativeRoute: "/(app)/invoices", group: "Commerce" },
    { id: "owner-store", label: "Store", description: "Products and offers", icon: "bag-handle-outline", target: "native", nativeRoute: "/(app)/store", group: "Commerce" },
    { id: "owner-vault", label: "The Vault", description: "Courses and media", icon: "folder-open-outline", target: "native", nativeRoute: "/(app)/vault", group: "Content" },
    { id: "owner-settings", label: "Settings", description: "Studio settings", icon: "settings-outline", target: "native", nativeRoute: "/(app)/profile", group: "Settings" },
  ]
}

function teacherFeatures(): WorkspaceFeature[] {
  return [
    { id: "teacher-dashboard", label: "Dashboard", description: "Your daily overview", icon: "speedometer-outline", target: "native", nativeRoute: "/(app)", group: "Overview" },
    { id: "teacher-reports", label: "Reports", description: "Teaching performance", icon: "bar-chart-outline", target: "native", nativeRoute: "/(app)/reports", group: "Overview" },
    { id: "teacher-schedule", label: "My Schedule", description: "Classes and timetable", icon: "calendar-outline", target: "native", nativeRoute: "/(app)/schedule", group: "Operations" },
    { id: "teacher-class-flows", label: "Class Flows", description: "Training content", icon: "play-circle-outline", target: "native", nativeRoute: "/(app)/class-flows", group: "Operations" },
    { id: "teacher-clients", label: "Clients", description: "Client notes and progress", icon: "people-outline", target: "native", nativeRoute: "/(app)/people", group: "People" },
    { id: "teacher-inbox", label: "Inbox", description: "Client messages", icon: "mail-open-outline", target: "native", nativeRoute: "/(app)/inbox", group: "People" },
    { id: "teacher-community", label: "Community", description: "Community posts", icon: "chatbubbles-outline", target: "native", nativeRoute: "/(app)/community", group: "People" },
    { id: "teacher-social", label: "Social Media", description: "Social planning", icon: "images-outline", target: "native", nativeRoute: "/(app)/social", group: "Growth" },
    { id: "teacher-leaderboards", label: "Leaderboards", description: "Goals and ranking", icon: "trophy-outline", target: "native", nativeRoute: "/(app)/leaderboards", group: "Growth" },
    { id: "teacher-invoices", label: "Invoices", description: "Invoice status", icon: "receipt-outline", target: "native", nativeRoute: "/(app)/invoices", group: "Commerce" },
    { id: "teacher-vault", label: "The Vault", description: "Training resources", icon: "folder-open-outline", target: "native", nativeRoute: "/(app)/vault", group: "Content" },
    { id: "teacher-settings", label: "Settings", description: "Account settings", icon: "settings-outline", target: "native", nativeRoute: "/(app)/profile", group: "Settings" },
  ]
}

function clientFeatures(): WorkspaceFeature[] {
  return [
    {
      id: "client-book",
      label: "Book Classes",
      description: "Find and book classes",
      icon: "calendar-outline",
      target: "native",
      nativeRoute: "/(app)/schedule",
      group: "Overview",
    },
    {
      id: "client-account",
      label: "My Account",
      description: "Bookings and account settings",
      icon: "person-circle-outline",
      target: "native",
      nativeRoute: "/(app)/profile",
      group: "Settings",
    },
  ]
}

export function getWorkspaceFeatures(role: MobileRole | undefined, _studioSubdomain: string) {
  if (role === "OWNER") return ownerFeatures()
  if (role === "TEACHER") return teacherFeatures()
  return clientFeatures()
}
