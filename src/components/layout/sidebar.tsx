"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Settings,
  LogOut,
  GraduationCap,
  UserCircle,
  MapPin,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const hqLinks = [
  { href: "/hq", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hq/studios", label: "Studios", icon: Building2 },
  { href: "/hq/users", label: "Users", icon: Users },
  { href: "/hq/settings", label: "Settings", icon: Settings },
]

const studioLinks = [
  { href: "/studio", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio/locations", label: "Locations", icon: MapPin },
  { href: "/studio/classes", label: "Classes", icon: Calendar },
  { href: "/studio/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/studio/clients", label: "Clients", icon: UserCircle },
  { href: "/studio/reports", label: "Reports", icon: BarChart3 },
  { href: "/studio/settings", label: "Settings", icon: Settings },
]

const teacherLinks = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/schedule", label: "My Schedule", icon: Calendar },
  { href: "/teacher/clients", label: "Clients", icon: UserCircle },
  { href: "/teacher/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  let links = studioLinks
  let title = session?.user?.studioName || "Studio"

  if (role === "HQ_ADMIN") {
    links = hqLinks
    title = "Cadence HQ"
  } else if (role === "TEACHER") {
    links = teacherLinks
    title = "Teacher Portal"
  }

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-xl font-bold">{title}</h1>
        {session?.user && (
          <p className="text-sm text-gray-400 mt-1">
            {session.user.firstName} {session.user.lastName}
          </p>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-violet-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}



