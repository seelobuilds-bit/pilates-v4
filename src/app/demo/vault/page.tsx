"use client"

import { VaultView } from "@/components/studio"
import type { VaultData } from "@/components/studio"

// Demo vault data
const demoVaultData: VaultData = {
  stats: {
    totalCourses: 12,
    publishedCourses: 10,
    totalEnrollments: 1245,
    totalRevenue: 48500,
    activeStudents: 198
  },
  courses: [
    {
      id: "1",
      title: "Reformer Masterclass Series",
      slug: "reformer-masterclass",
      subtitle: "Complete guide to advanced reformer techniques",
      description: "Master the reformer with this comprehensive course",
      thumbnailUrl: null,
      audience: "CLIENTS",
      category: "Equipment",
      difficulty: "Advanced",
      pricingType: "ONE_TIME",
      price: 149.99,
      subscriptionPrice: null,
      subscriptionInterval: null,
      isPublished: true,
      isFeatured: true,
      includeInSubscription: true,
      enrollmentCount: 234,
      averageRating: 4.9,
      _count: { modules: 12, enrollments: 234, reviews: 89 }
    },
    {
      id: "2",
      title: "Prenatal Pilates Certification",
      slug: "prenatal-certification",
      subtitle: "Train to teach safe prenatal classes",
      description: "Everything you need to become a certified prenatal instructor",
      thumbnailUrl: null,
      audience: "TEACHERS",
      category: "Certification",
      difficulty: "Intermediate",
      pricingType: "ONE_TIME",
      price: 299.99,
      subscriptionPrice: null,
      subscriptionInterval: null,
      isPublished: true,
      isFeatured: true,
      includeInSubscription: true,
      enrollmentCount: 156,
      averageRating: 4.95,
      _count: { modules: 18, enrollments: 156, reviews: 62 }
    },
    {
      id: "3",
      title: "Mat Work Foundations",
      slug: "mat-work-foundations",
      subtitle: "Essential mat exercises for beginners",
      description: "Build a strong foundation with classic mat exercises",
      thumbnailUrl: null,
      audience: "CLIENTS",
      category: "Mat Work",
      difficulty: "Beginner",
      pricingType: "ONE_TIME",
      price: 79.99,
      subscriptionPrice: null,
      subscriptionInterval: null,
      isPublished: true,
      isFeatured: false,
      includeInSubscription: false,
      enrollmentCount: 412,
      averageRating: 4.8,
      _count: { modules: 8, enrollments: 412, reviews: 134 }
    },
    {
      id: "4",
      title: "Props & Equipment Workshop",
      slug: "props-workshop",
      subtitle: "Master the use of Pilates props",
      description: "Learn to effectively use all types of Pilates props",
      thumbnailUrl: null,
      audience: "CLIENTS",
      category: "Equipment",
      difficulty: "Intermediate",
      pricingType: "ONE_TIME",
      price: 99.99,
      subscriptionPrice: null,
      subscriptionInterval: null,
      isPublished: false,
      isFeatured: false,
      includeInSubscription: false,
      enrollmentCount: 189,
      averageRating: 4.85,
      _count: { modules: 10, enrollments: 189, reviews: 56 }
    }
  ],
  subscriptionPlans: [
    {
      id: "1",
      name: "Studio Owner Vault",
      description: "Exclusive business growth courses and community for studio owners.",
      audience: "STUDIO_OWNERS",
      monthlyPrice: 99,
      quarterlyPrice: 249,
      yearlyPrice: 799,
      features: ["Business growth courses", "Private community", "Monthly strategy calls", "Resource library"],
      includesClasses: false,
      classCreditsPerMonth: null,
      isActive: true,
      activeSubscribers: 12,
      includedCourses: [],
      communityChat: { id: "chat1", isEnabled: true }
    },
    {
      id: "2",
      name: "Teacher Vault",
      description: "Advanced teaching skills and career development for Pilates instructors.",
      audience: "TEACHERS",
      monthlyPrice: 49,
      quarterlyPrice: 129,
      yearlyPrice: 399,
      features: ["All teacher courses", "Certification prep", "Mentorship program", "Private community"],
      includesClasses: false,
      classCreditsPerMonth: null,
      isActive: true,
      activeSubscribers: 42,
      includedCourses: [{ id: "2", title: "Prenatal Pilates Certification" }],
      communityChat: { id: "chat2", isEnabled: true }
    },
    {
      id: "3",
      name: "At-Home Vault",
      description: "Unlimited at-home workouts and community support for your fitness journey.",
      audience: "CLIENTS",
      monthlyPrice: 29,
      quarterlyPrice: 79,
      yearlyPrice: 249,
      features: ["All client courses", "Community chat", "Monthly live Q&A", "New content weekly"],
      includesClasses: false,
      classCreditsPerMonth: null,
      isActive: true,
      activeSubscribers: 156,
      includedCourses: [{ id: "1", title: "Reformer Masterclass Series" }],
      communityChat: { id: "chat3", isEnabled: true }
    }
  ],
  enrollments: [
    { id: "e1", status: "ACTIVE", enrolledAt: new Date().toISOString(), progressPercent: 75, paidAmount: 149.99, course: { id: "1", title: "Reformer Masterclass", price: 149.99 }, clientName: "Sarah Johnson" },
    { id: "e2", status: "ACTIVE", enrolledAt: new Date().toISOString(), progressPercent: 45, paidAmount: 79.99, course: { id: "3", title: "Mat Work Foundations", price: 79.99 }, clientName: "Mike Chen" },
    { id: "e3", status: "COMPLETED", enrolledAt: new Date().toISOString(), progressPercent: 100, paidAmount: 299.99, course: { id: "2", title: "Prenatal Certification", price: 299.99 }, clientName: "Emily Davis" },
    { id: "e4", status: "ACTIVE", enrolledAt: new Date().toISOString(), progressPercent: 20, paidAmount: 149.99, course: { id: "1", title: "Reformer Masterclass", price: 149.99 }, clientName: "Lisa Park" }
  ],
  affiliateLinks: [
    { id: "a1", code: "SARAH20", clicks: 234, conversions: 18, totalEarnings: 539.64, teacherName: "Sarah Chen", courseName: "Reformer Masterclass" },
    { id: "a2", code: "MIKE15", clicks: 156, conversions: 12, totalEarnings: 143.98, teacherName: "Mike Johnson", courseName: "Mat Work Foundations" }
  ],
  categories: ["Equipment", "Mat Work", "Certification", "Wellness"]
}

export default function DemoVaultPage() {
  return <VaultView data={demoVaultData} linkPrefix="/demo" />
}
