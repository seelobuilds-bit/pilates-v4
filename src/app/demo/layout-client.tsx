"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, LogOut, Menu, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  defaultWorkingLinkHrefs,
  mapStudioHrefToDemo,
  studioLinkGroups,
  type NavGroup,
  type NavLink,
} from "@/components/layout/nav-config"

type SidebarMode = "full" | "working"

const SIDEBAR_MODE_KEY = "demo-sidebar-mode-v1"
const SIDEBAR_WORKING_LINKS_KEY = "demo-sidebar-working-links-v1"
const WORKING_SLOT_COUNT = 4
const defaultDemoWorkingLinkHrefs = defaultWorkingLinkHrefs.map((href) => mapStudioHrefToDemo(href))

function normalizeDemoWorkingLinks(input: string[], validLinks: NavLink[]) {
  const validSet = new Set(validLinks.map((link) => link.href))
  const deduped: string[] = []

  for (const href of input) {
    if (validSet.has(href) && !deduped.includes(href)) {
      deduped.push(href)
    }
  }

  for (const href of defaultDemoWorkingLinkHrefs) {
    if (validSet.has(href) && !deduped.includes(href)) {
      deduped.push(href)
    }
  }

  for (const href of validSet) {
    if (!deduped.includes(href)) {
      deduped.push(href)
    }
  }

  return deduped.slice(0, WORKING_SLOT_COUNT)
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("full")
  const [showExtras, setShowExtras] = useState(false)
  const [showWorkingCustomize, setShowWorkingCustomize] = useState(false)

  const demoLinkGroups = useMemo<NavGroup[]>(
    () =>
      studioLinkGroups.map((group) => ({
        title: group.title,
        links: group.links.map((link) => ({
          ...link,
          href: mapStudioHrefToDemo(link.href),
        })),
      })),
    []
  )

  const demoLinks = useMemo(() => demoLinkGroups.flatMap((group) => group.links), [demoLinkGroups])
  const [workingLinkHrefs, setWorkingLinkHrefs] = useState<string[]>(defaultDemoWorkingLinkHrefs)
  const demoLinksByHref = useMemo(() => new Map(demoLinks.map((link) => [link.href, link])), [demoLinks])

  const workingPrimaryLinks = useMemo<NavLink[]>(
    () =>
      workingLinkHrefs
        .map((href) => demoLinksByHref.get(href) || null)
        .filter((link): link is NavLink => Boolean(link)),
    [demoLinksByHref, workingLinkHrefs]
  )

  const extrasLinks = useMemo(() => {
    const workingSet = new Set(workingLinkHrefs)
    return demoLinks.filter((link) => !workingSet.has(link.href))
  }, [demoLinks, workingLinkHrefs])

  const activeGroups: NavGroup[] =
    sidebarMode === "working" ? [{ title: "Working View", links: workingPrimaryLinks }] : demoLinkGroups

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(SIDEBAR_MODE_KEY)
      const savedWorking = localStorage.getItem(SIDEBAR_WORKING_LINKS_KEY)

      if (savedMode === "full" || savedMode === "working") {
        setSidebarMode(savedMode)
      }

      if (savedWorking) {
        const parsed = JSON.parse(savedWorking)
        if (Array.isArray(parsed)) {
          setWorkingLinkHrefs(normalizeDemoWorkingLinks(parsed, demoLinks))
        }
      }
    } catch {
      setWorkingLinkHrefs(defaultDemoWorkingLinkHrefs)
    }
  }, [demoLinks])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_MODE_KEY, sidebarMode)
  }, [sidebarMode])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WORKING_LINKS_KEY, JSON.stringify(workingLinkHrefs))
  }, [workingLinkHrefs])

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

  useEffect(() => {
    if (sidebarMode === "full") {
      setShowExtras(false)
      setShowWorkingCustomize(false)
    }
  }, [sidebarMode])

  const handleWorkingSlotChange = (index: number, nextHref: string) => {
    setWorkingLinkHrefs((previous) => {
      const next = [...previous]
      const duplicateIndex = next.findIndex((href, slotIndex) => href === nextHref && slotIndex !== index)

      if (duplicateIndex !== -1) {
        ;[next[index], next[duplicateIndex]] = [next[duplicateIndex], next[index]]
      } else {
        next[index] = nextHref
      }

      return normalizeDemoWorkingLinks(next, demoLinks)
    })
  }

  const renderLink = (link: NavLink) => {
    const Icon = link.icon
    const isActive = pathname === link.href || (link.href !== "/demo" && pathname.startsWith(link.href))

    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-violet-600" : "text-gray-400")} />
        {link.label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showBanner && (
        <div className="fixed inset-x-0 top-0 z-[80] bg-gradient-to-r from-pink-500 to-violet-600 px-4 py-3 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Play className="h-5 w-5 shrink-0" />
              <span className="truncate text-sm font-medium sm:text-base">You&apos;re viewing a live demo of CURRENT</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button size="sm" className="bg-white text-violet-600 hover:bg-gray-100">
                  Book a Demo
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="rounded p-1 hover:bg-white/20"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isMobileOpen && (
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={() => setIsMobileOpen(true)}
          className={cn(
            "fixed left-3 z-[75] inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white/95 p-2 text-gray-700 shadow-sm backdrop-blur lg:hidden",
            showBanner ? "top-16" : "top-3"
          )}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsMobileOpen(false)}
          className={cn("fixed inset-0 z-[72] bg-gray-900/35 lg:hidden", showBanner ? "top-[52px]" : "top-0")}
        />
      )}

      <div className={cn("flex h-dvh min-h-screen overflow-hidden", showBanner ? "pt-[52px]" : "")}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-[73] flex h-[100dvh] w-[min(21rem,88vw)] flex-col border-r border-gray-100 bg-white shadow-xl transition-transform duration-200 lg:relative lg:z-[70] lg:h-full lg:translate-x-0 lg:shadow-none",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="font-semibold text-gray-900">CURRENT Demo</h1>
              <p className="text-xs text-gray-500">Studio Portal</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="rounded p-1 hover:bg-gray-100 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2 border-b border-gray-100 px-3 pb-3">
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
                onClick={() => setShowWorkingCustomize((previous) => !previous)}
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
                      {demoLinks.map((link) => (
                        <option key={link.href} value={link.href}>
                          {link.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <nav className="sidebar-scroll flex-1 space-y-4 overflow-y-auto px-3 py-2">
            {activeGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {activeGroups.length > 1 && (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{group.title}</p>
                )}
                {group.links.map(renderLink)}
              </div>
            ))}

            {sidebarMode === "working" && extrasLinks.length > 0 && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setShowExtras((previous) => !previous)}
                  className="w-full rounded-lg px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:bg-gray-50"
                >
                  {showExtras ? "Hide Extras" : "Show Extras"}
                </button>
                {showExtras && extrasLinks.map(renderLink)}
              </div>
            )}
          </nav>

          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
                DM
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">Demo User</p>
                <p className="truncate text-xs text-gray-500">demo@thecurrent.app</p>
              </div>
            </div>
            <Link
              href="/"
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 text-gray-400" />
              Exit Demo
            </Link>
          </div>
        </aside>

        <main className="app-scrollbar min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  )
}
