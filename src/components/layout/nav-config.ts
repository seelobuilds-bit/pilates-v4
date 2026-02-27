import type { ComponentType } from "react"
import {
  BarChart3,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Lock,
  MapPin,
  Megaphone,
  MessageSquare,
  PlayCircle,
  Settings,
  ShoppingBag,
  Trophy,
  UserCircle,
} from "lucide-react"

export type NavLink = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export type NavGroup = {
  title: string
  links: NavLink[]
}

export const studioLinkGroups: NavGroup[] = [
  {
    title: "Overview",
    links: [
      { href: "/studio", label: "Dashboard", icon: LayoutDashboard },
      { href: "/studio/inbox", label: "Inbox", icon: Inbox },
      { href: "/studio/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/studio/schedule", label: "Schedule", icon: Calendar },
      { href: "/studio/classes", label: "Classes", icon: BookOpen },
      { href: "/studio/class-flows", label: "Class Flows", icon: PlayCircle },
      { href: "/studio/locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    title: "People",
    links: [
      { href: "/studio/clients", label: "Clients", icon: UserCircle },
      { href: "/studio/teachers", label: "Teachers", icon: GraduationCap },
      { href: "/studio/community", label: "Community", icon: MessageSquare },
    ],
  },
  {
    title: "Commerce",
    links: [
      { href: "/studio/payments", label: "Payments", icon: CreditCard },
      { href: "/studio/invoices", label: "Invoices", icon: FileText },
      { href: "/studio/employees", label: "Employees", icon: UserCircle },
      { href: "/studio/employees/time-off", label: "Time Off", icon: Calendar },
      { href: "/studio/store", label: "Store", icon: ShoppingBag },
    ],
  },
  {
    title: "Growth",
    links: [
      { href: "/studio/marketing", label: "Marketing", icon: Megaphone },
      { href: "/studio/leaderboards", label: "Leaderboards", icon: Trophy },
    ],
  },
  {
    title: "Content",
    links: [{ href: "/studio/vault", label: "The Vault", icon: Lock }],
  },
  {
    title: "Settings",
    links: [{ href: "/studio/settings", label: "Settings", icon: Settings }],
  },
]

export const studioLinks = studioLinkGroups.flatMap((group) => group.links)
export const defaultWorkingLinkHrefs = ["/studio/reports", "/studio/schedule", "/studio/inbox", "/studio"]
export const studioLinkHrefs = studioLinks.map((link) => link.href)

export function mapStudioHrefToDemo(href: string) {
  if (href === "/studio") {
    return "/demo"
  }

  if (href.startsWith("/studio/")) {
    return href.replace("/studio/", "/demo/")
  }

  return href
}
