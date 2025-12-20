"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  GraduationCap,
  Megaphone,
  Settings,
  LogOut,
  ChevronLeft,
  Zap,
  BarChart3,
  CreditCard,
  MapPin,
  MessageSquare,
  Play,
  ArrowRight,
  X,
} from "lucide-react"

const demoLinks = [
  { href: "/demo", label: "Dashboard", icon: LayoutDashboard },
  { href: "/demo/schedule", label: "Schedule", icon: Calendar },
  { href: "/demo/classes", label: "Classes", icon: Calendar },
  { href: "/demo/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/demo/clients", label: "Clients", icon: Users },
  { href: "/demo/locations", label: "Locations", icon: MapPin },
  { href: "/demo/marketing", label: "Marketing", icon: Megaphone },
  { href: "/demo/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/demo/reports", label: "Reports", icon: BarChart3 },
  { href: "/demo/payments", label: "Payments", icon: CreditCard },
  { href: "/demo/settings", label: "Settings", icon: Settings },
]

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Demo Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-pink-500 to-violet-600 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5" />
              <span className="font-medium">You&apos;re viewing a demo of SOULFLOW</span>
              <span className="text-white/70 hidden sm:inline">— Explore the dashboard with sample data</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button size="sm" className="bg-white text-violet-600 hover:bg-gray-100">
                  Book a Demo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <button onClick={() => setShowBanner(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`flex flex-col h-full w-64 bg-white border-r border-gray-100 ${showBanner ? 'mt-[52px]' : ''}`}>
        {/* Header */}
        <div className="p-4 pt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Align Pilates</h1>
              <p className="text-xs text-gray-500">Demo Studio</p>
            </div>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {demoLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || 
              (link.href !== "/demo" && pathname.startsWith(link.href))
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
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-medium text-violet-700">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Sarah Chen</p>
              <p className="text-xs text-gray-500 truncate">sarah@alignpilates.com</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors mt-1"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            Exit Demo
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${showBanner ? 'mt-[52px]' : ''}`}>
        {children}
      </main>
    </div>
  )
}




