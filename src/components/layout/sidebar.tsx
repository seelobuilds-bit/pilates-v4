"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type ComponentType, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Settings,
  LogOut,
  GraduationCap,
  UserCircle,
  Megaphone,
  ChevronLeft,
  BarChart3,
  MapPin,
  BookOpen,
  Inbox,
  CreditCard,
  PlayCircle,
  Instagram,
  FileText,
  Lock,
  MessageSquare,
  ShoppingBag,
  Trophy,
  Headphones,
  Target,
  Video,
} from "lucide-react"

type NavLink = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

type NavGroup = {
  title: string
  links: NavLink[]
}

const hqLinks: NavLink[] = [
  { href: "/hq", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hq/studios", label: "Studios", icon: Building2 },
  { href: "/hq/inbox", label: "Studio Comms", icon: Inbox },
  { href: "/hq/sales", label: "Sales CRM", icon: Target },
  { href: "/hq/training", label: "Training Hub", icon: Video },
  { href: "/hq/support", label: "Support Inbox", icon: Headphones },
  { href: "/hq/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/hq/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/hq/settings", label: "Settings", icon: Settings },
]

const studioLinkGroups: NavGroup[] = [
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

const studioLinks = studioLinkGroups.flatMap((group) => group.links)

const teacherLinks: NavLink[] = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/schedule", label: "My Schedule", icon: Calendar },
  { href: "/teacher/class-flows", label: "Class Flows", icon: PlayCircle },
  { href: "/teacher/clients", label: "Clients", icon: UserCircle },
  { href: "/teacher/invoices", label: "Invoices", icon: FileText },
  { href: "/teacher/vault", label: "The Vault", icon: Lock },
  { href: "/teacher/inbox", label: "Inbox", icon: Inbox },
  { href: "/teacher/community", label: "Community", icon: MessageSquare },
  { href: "/teacher/social", label: "Social Media", icon: Instagram },
  { href: "/teacher/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/teacher/settings", label: "Settings", icon: Settings },
]

const salesAgentLinks: NavLink[] = [
  { href: "/sales", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales/leads", label: "My Leads", icon: Target },
  { href: "/sales/demos", label: "Demo Requests", icon: Video },
  { href: "/sales/calendar", label: "Calendar", icon: Calendar },
  { href: "/sales/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role

  let links = studioLinks
  let linkGroups: NavGroup[] = studioLinkGroups
  let title = session?.user?.studioName || "Studio"
  let subtitle = "Studio Portal"

  if (role === "HQ_ADMIN") {
    links = hqLinks
    linkGroups = [{ title: "Navigation", links: hqLinks }]
    title = "CURRENT HQ"
    subtitle = "Admin Portal"
  } else if (role === "SALES_AGENT") {
    links = salesAgentLinks
    linkGroups = [{ title: "Navigation", links: salesAgentLinks }]
    title = "CURRENT"
    subtitle = "Sales Portal"
  } else if (role === "TEACHER") {
    links = teacherLinks
    linkGroups = [{ title: "Navigation", links: teacherLinks }]
    title = session?.user?.studioName || "Studio"
    subtitle = "Teacher Portal"
  }

  // Keep the dashboard route warm so top-level nav feels instant.
  useEffect(() => {
    if (links[0]?.href) {
      router.prefetch(links[0].href)
    }
  }, [links, router])

  return (
    <div className="relative z-[70] flex h-full w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {linkGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {linkGroups.length > 1 && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {group.title}
              </p>
            )}
            {group.links.map((link) => {
              const Icon = link.icon
              const isRootRoute =
                link.href === "/studio" || link.href === "/hq" || link.href === "/teacher" || link.href === "/sales"
              const isActive = pathname === link.href || (!isRootRoute && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-50 text-violet-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-violet-600" : "text-gray-400")} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-medium text-violet-700">
            {session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.firstName} {session?.user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors mt-1"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          Sign out
        </button>
      </div>
    </div>
  )
}
