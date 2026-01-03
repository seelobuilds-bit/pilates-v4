"use client"

import { DashboardView } from "@/components/studio"
import type { DashboardData } from "@/components/studio"

// Demo data that mirrors what the studio dashboard would show
const demoDashboardData: DashboardData = {
  greeting: "Good morning",
  currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  stats: {
    monthlyRevenue: 12450,
    revenueChange: 8.5,
    activeClients: 156,
    newClientsThisWeek: 12,
    weekBookings: 89,
    todayBookings: 24,
    atRiskClientsCount: 8,
    churnRate: "5.2"
  },
  todayOverview: {
    classCount: 6,
    bookingsCount: 42,
    fillRate: 78
  },
  todayClasses: [
    {
      id: "1",
      startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      capacity: 12,
      classType: { id: "ct1", name: "Morning Flow", color: "#8b5cf6" },
      teacher: { user: { firstName: "Sarah", lastName: "Chen" } },
      location: { id: "loc1", name: "Main Studio" },
      _count: { bookings: 10 }
    },
    {
      id: "2",
      startTime: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
      capacity: 8,
      classType: { id: "ct2", name: "Reformer Basics", color: "#06b6d4" },
      teacher: { user: { firstName: "Mike", lastName: "Johnson" } },
      location: { id: "loc1", name: "Main Studio" },
      _count: { bookings: 8 }
    },
    {
      id: "3",
      startTime: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
      capacity: 10,
      classType: { id: "ct3", name: "Power Pilates", color: "#f59e0b" },
      teacher: { user: { firstName: "Emily", lastName: "Davis" } },
      location: { id: "loc2", name: "Downtown Studio" },
      _count: { bookings: 6 }
    },
    {
      id: "4",
      startTime: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
      capacity: 12,
      classType: { id: "ct4", name: "Evening Restore", color: "#10b981" },
      teacher: { user: { firstName: "Lisa", lastName: "Park" } },
      location: { id: "loc1", name: "Main Studio" },
      _count: { bookings: 9 }
    },
    {
      id: "5",
      startTime: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(19, 30, 0, 0)).toISOString(),
      capacity: 8,
      classType: { id: "ct2", name: "Reformer Basics", color: "#06b6d4" },
      teacher: { user: { firstName: "Sarah", lastName: "Chen" } },
      location: { id: "loc1", name: "Main Studio" },
      _count: { bookings: 7 }
    },
  ],
  upcomingClasses: [
    {
      id: "6",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      capacity: 12,
      classType: { id: "ct1", name: "Morning Flow", color: "#8b5cf6" },
      teacher: { user: { firstName: "Sarah", lastName: "Chen" } },
      location: { id: "loc1", name: "Main Studio" },
      _count: { bookings: 5 }
    },
    {
      id: "7",
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
      capacity: 10,
      classType: { id: "ct3", name: "Power Pilates", color: "#f59e0b" },
      teacher: { user: { firstName: "Emily", lastName: "Davis" } },
      location: { id: "loc2", name: "Downtown Studio" },
      _count: { bookings: 8 }
    },
    {
      id: "8",
      startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString(),
      capacity: 8,
      classType: { id: "ct5", name: "Prenatal Pilates", color: "#ec4899" },
      teacher: { user: { firstName: "Lisa", lastName: "Park" } },
      location: { id: "loc1", name: "Main Studio" },
      _count: { bookings: 3 }
    },
    {
      id: "9",
      startTime: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 97 * 60 * 60 * 1000).toISOString(),
      capacity: 12,
      classType: { id: "ct4", name: "Evening Restore", color: "#10b981" },
      teacher: { user: { firstName: "Mike", lastName: "Johnson" } },
      location: { id: "loc1", name: "Main Studio" },
      _count: { bookings: 6 }
    },
  ],
  recentBookings: [
    { id: "b1", status: "CONFIRMED", createdAt: new Date().toISOString(), client: { firstName: "Anna", lastName: "Smith" }, classSession: { classType: { name: "Morning Flow" }, location: { name: "Main Studio" } } },
    { id: "b2", status: "CONFIRMED", createdAt: new Date().toISOString(), client: { firstName: "John", lastName: "Doe" }, classSession: { classType: { name: "Reformer Basics" }, location: { name: "Main Studio" } } },
    { id: "b3", status: "CONFIRMED", createdAt: new Date().toISOString(), client: { firstName: "Maria", lastName: "Garcia" }, classSession: { classType: { name: "Power Pilates" }, location: { name: "Downtown Studio" } } },
    { id: "b4", status: "CANCELLED", createdAt: new Date().toISOString(), client: { firstName: "James", lastName: "Wilson" }, classSession: { classType: { name: "Evening Restore" }, location: { name: "Main Studio" } } },
    { id: "b5", status: "CONFIRMED", createdAt: new Date().toISOString(), client: { firstName: "Sophie", lastName: "Brown" }, classSession: { classType: { name: "Morning Flow" }, location: { name: "Main Studio" } } },
  ],
  atRiskClients: [
    { id: "c1", firstName: "Jennifer", lastName: "Taylor", email: "jennifer@example.com", phone: null, isActive: true, createdAt: new Date().toISOString() },
    { id: "c2", firstName: "Robert", lastName: "Anderson", email: "robert@example.com", phone: null, isActive: true, createdAt: new Date().toISOString() },
    { id: "c3", firstName: "Michelle", lastName: "Thomas", email: "michelle@example.com", phone: null, isActive: true, createdAt: new Date().toISOString() },
    { id: "c4", firstName: "David", lastName: "Jackson", email: "david@example.com", phone: null, isActive: true, createdAt: new Date().toISOString() },
    { id: "c5", firstName: "Karen", lastName: "White", email: "karen@example.com", phone: null, isActive: true, createdAt: new Date().toISOString() },
  ],
  studioStats: {
    locations: 2,
    teachers: 6,
    classTypes: 8,
    totalClients: 203,
    totalBookings: 1456
  }
}

export default function DemoDashboardPage() {
  return <DashboardView data={demoDashboardData} linkPrefix="/demo" />
}
