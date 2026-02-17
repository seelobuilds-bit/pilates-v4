"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type ComponentType, useEffect, useMemo, useState } from "react"
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
  Menu,
  X,
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

type SidebarMode = "full" | "working"

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed-v1"
const SIDEBAR_MODE_KEY = "sidebar-mode-v1"
const SIDEBAR_WORKING_LINKS_KEY = "sidebar-working-links-v1"
const WORKING_SLOT_COUNT = 4

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
const defaultWorkingLinkHrefs = ["/studio/reports", "/studio/schedule", "/studio/inbox", "/studio"]
const studioLinkHrefs = studioLinks.map((link) => link.href)

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

function normalizeWorkingLinks(hrefs: string[]): string[] {
  const validSet = new Set(studioLinkHrefs)
  const deduped: string[] = []

  for (const href of hrefs) {
    if (validSet.has(href) && !deduped.includes(href)) {
      deduped.push(href)
    }
  }

  for (const href of defaultWorkingLinkHrefs) {
    if (validSet.has(href) && !deduped.includes(href)) {
      deduped.push(href)
    }
  }

  for (const href of studioLinkHrefs) {
    if (!deduped.includes(href)) {
      deduped.push(href)
    }
  }

  return deduped.slice(0, WORKING_SLOT_COUNT)
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("full")
  const [workingLinkHrefs, setWorkingLinkHrefs] = useState<string[]>(defaultWorkingLinkHrefs)
  const [showExtras, setShowExtras] = useState(false)
  const [showWorkingCustomize, setShowWorkingCustomize] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  let links = studioLinks
  let linkGroups: NavGroup[] = studioLinkGroups
  let title = session?.user?.studioName || "Studio"
  let subtitle = "Studio Portal"
  const isStudioOwner = role === "OWNER"

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

  const studioLinksByHref = useMemo(() => new Map(studioLinks.map((link) => [link.href, link])), [])

  const workingPrimaryLinks = useMemo<NavLink[]>(
    () =>
      workingLinkHrefs
        .map((href) => {
          const link = studioLinksByHref.get(href)
          if (!link) return null
          if (href === "/studio/reports") {
            return { ...link, label: "Overview" }
          }
          return link
        })
        .filter((link): link is NavLink => link !== null),
    [studioLinksByHref, workingLinkHrefs]
  )

  const workingSet = useMemo(() => new Set(workingLinkHrefs), [workingLinkHrefs])
  const extrasLinks = useMemo(() => studioLinks.filter((link) => !workingSet.has(link.href)), [workingSet])

  const activeGroups: NavGroup[] =
    isStudioOwner && sidebarMode === "working" ? [{ title: "Working View", links: workingPrimaryLinks }] : linkGroups

  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      const savedMode = localStorage.getItem(SIDEBAR_MODE_KEY)
      const savedWorkingLinks = localStorage.getItem(SIDEBAR_WORKING_LINKS_KEY)

      if (savedCollapsed === "true") {
        setIsCollapsed(true)
      }

      if (savedMode === "working" || savedMode === "full") {
        setSidebarMode(savedMode)
      }

      if (savedWorkingLinks) {
        const parsed = JSON.parse(savedWorkingLinks)
        if (Array.isArray(parsed)) {
          setWorkingLinkHrefs(normalizeWorkingLinks(parsed))
        }
      }
    } catch {
      setWorkingLinkHrefs(defaultWorkingLinkHrefs)
    }
  }, [])

  // Keep the dashboard route warm so top-level nav feels instant.
  useEffect(() => {
    const primaryHref =
      isStudioOwner && sidebarMode === "working" ? workingPrimaryLinks[0]?.href : links[0]?.href
    if (primaryHref) {
      router.prefetch(primaryHref)
    }
  }, [isStudioOwner, links, router, sidebarMode, workingPrimaryLinks])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed))
  }, [isCollapsed])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_MODE_KEY, sidebarMode)
  }, [sidebarMode])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WORKING_LINKS_KEY, JSON.stringify(workingLinkHrefs))
  }, [workingLinkHrefs])

  useEffect(() => {
    if (sidebarMode === "full") {
      setShowExtras(false)
      setShowWorkingCustomize(false)
    }
  }, [sidebarMode])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileOpen])

  const handleWorkingSlotChange = (index: number, nextHref: string) => {
    setWorkingLinkHrefs((prev) => {
      const next = [...prev]
      const duplicateIndex = next.findIndex((href, i) => href === nextHref && i !== index)

      if (duplicateIndex !== -1) {
        ;[next[index], next[duplicateIndex]] = [next[duplicateIndex], next[index]]
      } else {
        next[index] = nextHref
      }

      return normalizeWorkingLinks(next)
    })
  }

  const isCompact = isCollapsed && !isMobileOpen

  const renderLink = (link: NavLink) => {
    const Icon = link.icon
    const isRootRoute =
      link.href === "/studio" || link.href === "/hq" || link.href === "/teacher" || link.href === "/sales"
    const isActive = pathname === link.href || (!isRootRoute && pathname.startsWith(link.href))

    return (
      <Link
        key={link.href}
        href={link.href}
        title={isCompact ? link.label : undefined}
        className={cn(
          "rounded-lg text-sm font-medium transition-colors",
          isCompact
            ? "flex items-center justify-center px-2 py-2.5"
            : "flex items-center gap-3 px-3 py-2.5",
          isActive ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-violet-600" : "text-gray-400")} />
        {!isCompact && link.label}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open sidebar"
        className="fixed left-3 top-3 z-[75] inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white/95 p-2 text-gray-700 shadow-sm backdrop-blur lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-[72] bg-gray-900/35 lg:hidden"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[73] flex h-[100dvh] w-[min(21rem,88vw)] flex-col border-r border-gray-100 bg-white shadow-xl transition-transform duration-200 lg:relative lg:z-[70] lg:h-full lg:translate-x-0 lg:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-[76px]" : "lg:w-64"
        )}
      >
      {/* Header */}
      <div className={cn("flex items-center justify-between", isCompact ? "p-3" : "p-4")}>
        <div className={cn(isCompact && "hidden")}>
          <h1 className="font-semibold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded p-1 hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden rounded p-1 hover:bg-gray-100 lg:inline-flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 text-gray-400 transition-transform", isCollapsed && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Studio Mode Controls */}
      {isStudioOwner && !isCompact && (
        <div className="border-b border-gray-100 px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setSidebarMode("full")}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                sidebarMode === "full" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Full View
            </button>
            <button
              type="button"
              onClick={() => setSidebarMode("working")}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                sidebarMode === "working" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Working View
            </button>
          </div>

          {sidebarMode === "working" && (
            <button
              type="button"
              onClick={() => setShowWorkingCustomize((prev) => !prev)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {showWorkingCustomize ? "Hide Customization" : "Customize Quick Items"}
            </button>
          )}

          {sidebarMode === "working" && showWorkingCustomize && (
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <p className="px-1 text-[11px] font-medium text-gray-500">Choose 4 quick items</p>
              {workingLinkHrefs.map((href, index) => (
                <div key={`${href}-${index}`} className="px-1">
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">Slot {index + 1}</label>
                  <select
                    value={href}
                    onChange={(event) => handleWorkingSlotChange(index, event.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700"
                  >
                    {studioLinks.map((link) => (
                      <option key={link.href} value={link.href}>
                        {link.href === "/studio/reports" ? "Overview" : link.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {activeGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCompact && activeGroups.length > 1 && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {group.title}
              </p>
            )}
            {group.links.map(renderLink)}
          </div>
        ))}

        {isStudioOwner && sidebarMode === "working" && extrasLinks.length > 0 && (
          <div className="space-y-1">
            {!isCompact && (
              <button
                type="button"
                onClick={() => setShowExtras((prev) => !prev)}
                className="w-full rounded-lg px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:bg-gray-50"
              >
                {showExtras ? "Hide Extras" : "Show Extras"}
              </button>
            )}
            {(showExtras || isCompact) && extrasLinks.map(renderLink)}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className={cn("border-t border-gray-100", isCompact ? "p-2" : "p-3")}>
        <div className={cn("flex items-center px-3 py-2", isCompact ? "justify-center" : "gap-3")}>
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-medium text-violet-700">
            {session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}
          </div>
          <div className={cn("flex-1 min-w-0", isCompact && "hidden")}>
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
          title={isCompact ? "Sign out" : undefined}
          className={cn(
            "mt-1 w-full rounded-lg py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900",
            isCompact ? "flex items-center justify-center px-2" : "flex items-center gap-3 px-3"
          )}
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          {!isCompact && "Sign out"}
        </button>
      </div>
      </div>
    </>
  )
}
