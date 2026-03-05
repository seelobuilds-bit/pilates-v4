import Link from "next/link"
import { DM_Sans, Instrument_Serif } from "next/font/google"
import { DashboardView } from "@/components/studio"
import type { DashboardData } from "@/components/studio"
import {
  demoAtRiskClients,
  demoRecentBookings,
  demoScheduleClasses,
  demoStats,
  demoStudio,
  demoTodayClasses,
} from "@/app/demo/_data/demo-data"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-brand-preview-body",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-brand-preview-display",
})

function buildPreviewDashboardData(): DashboardData {
  const now = new Date()
  const todayLabel = now.toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const todayClasses = demoTodayClasses.map((session, index) => ({
    id: session.id,
    startTime: session.startTime,
    endTime: new Date(new Date(session.startTime).getTime() + 50 * 60 * 1000),
    capacity: session.capacity,
    classType: {
      id: `class-type-${index + 1}`,
      name: session.classType.name,
      color: null,
    },
    teacher: session.teacher,
    location: {
      id: `location-${index + 1}`,
      name: session.location.name,
    },
    _count: session._count,
  }))

  const upcomingClasses = demoScheduleClasses.slice(0, 6).map((session, index) => ({
    id: session.id,
    startTime: session.startTime,
    endTime: new Date(new Date(session.startTime).getTime() + 50 * 60 * 1000),
    capacity: session.capacity,
    classType: {
      id: `class-type-upcoming-${index + 1}`,
      name: session.classType.name,
      color: null,
    },
    teacher: session.teacher,
    location: {
      id: `location-upcoming-${index + 1}`,
      name: session.location.name,
    },
    _count: session._count,
  }))

  return {
    greeting: "Good afternoon",
    currentDate: todayLabel,
    currency: "gbp",
    selectedRange: {
      key: "this_month",
      label: "This month",
      compareLabel: "same period last month",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
    },
    stats: {
      monthlyRevenue: demoStats.monthlyRevenue,
      revenueChange: demoStats.revenueChange,
      activeClients: demoStats.activeClients,
      newClientsThisWeek: demoStats.newClientsThisWeek,
      weekBookings: demoStats.weekBookings,
      todayBookings: demoStats.todayBookings,
      atRiskClientsCount: demoAtRiskClients.length,
      churnRate: String(demoStats.churnRate),
    },
    todayOverview: {
      classCount: demoStats.todayClasses,
      bookingsCount: demoStats.todayTotalBookings,
      fillRate: demoStats.todayFillRate,
    },
    todayClasses,
    upcomingClasses,
    recentBookings: demoRecentBookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      createdAt: booking.createdAt,
      client: booking.client,
      classSession: {
        classType: {
          name: booking.classSession.classType.name,
        },
        location: {
          name: booking.classSession.location.name,
        },
      },
    })),
    atRiskClients: demoAtRiskClients.map((client, index) => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: null,
      isActive: true,
      createdAt: new Date(Date.now() - (index + 24) * 24 * 60 * 60 * 1000),
    })),
    studioStats: {
      locations: 3,
      teachers: 8,
      classTypes: 9,
      totalClients: demoStats.totalClients,
      totalBookings: demoStats.bookings,
    },
    reportDatapoints: [
      { id: "avgFillRate", title: "Avg Fill Rate", value: `${demoStats.todayFillRate}%`, description: "Report datapoint" },
      { id: "classesThisMonth", title: "Classes This Month", value: 156, description: "Report datapoint" },
      { id: "bookingsThisMonth", title: "Bookings This Month", value: demoStats.bookings, description: "Report datapoint" },
      { id: "locationsActive", title: "Locations Active", value: 3, description: "Report datapoint" },
    ],
  }
}

export default function BrandPreviewStudioDashboardPage() {
  const dashboardData = buildPreviewDashboardData()

  return (
    <div className={`${dmSans.variable} ${instrumentSerif.variable} min-h-screen brand-preview-dashboard studio-brand-scope`}>
      <style>{`
        .brand-preview-dashboard {
          --background: 36 33% 97%;
          --foreground: 0 0% 5%;
          --card: 36 33% 97%;
          --card-foreground: 0 0% 5%;
          --popover: 0 0% 100%;
          --popover-foreground: 0 0% 5%;
          --primary: 0 0% 5%;
          --primary-foreground: 36 33% 97%;
          --secondary: 34 24% 91%;
          --secondary-foreground: 0 0% 5%;
          --muted: 34 24% 91%;
          --muted-foreground: 30 5% 52%;
          --accent: 34 24% 91%;
          --accent-foreground: 0 0% 5%;
          --border: 34 19% 82%;
          --input: 34 19% 82%;
          --ring: 0 0% 5%;

          --studio-50: #faf8f5;
          --studio-100: #f5f2ed;
          --studio-200: #efebe4;
          --studio-300: #d4cec4;
          --studio-400: #8a8580;
          --studio-500: #4a4540;
          --studio-600: #1a1a1a;
          --studio-700: #0d0d0d;
          --studio-800: #0d0d0d;
          --studio-900: #0d0d0d;
          --studio-950: #000000;
        }

        .brand-preview-dashboard * {
          font-family: var(--font-brand-preview-body), sans-serif;
        }

        .brand-preview-dashboard h1,
        .brand-preview-dashboard h2,
        .brand-preview-dashboard h3 {
          font-family: var(--font-brand-preview-display), serif;
          letter-spacing: -0.02em;
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1300px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Brand Preview</p>
            <h1 className="text-2xl text-foreground sm:text-3xl">{demoStudio.name} Dashboard Theme</h1>
          </div>
          <Link
            href="/brand-preview"
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm text-foreground hover:bg-muted"
          >
            Back to Homepage Preview
          </Link>
        </div>

        <DashboardView data={dashboardData} linkPrefix="/brand-preview/studio-dashboard" />
      </div>
    </div>
  )
}
