"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, User } from "lucide-react"

export default function InviteTeacherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    specialties: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/studio/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialties: formData.specialties.split(",").map(s => s.trim()).filter(Boolean)
        })
      })

      if (res.ok) {
        router.push("/studio/teachers")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to invite teacher")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to invite teacher")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/studio/teachers"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teachers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Invite Teacher</h1>
        <p className="text-gray-500 mt-1">Add a new teacher to your studio</p>
      </div>

      <Card className="max-w-xl border-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-10"
                    placeholder="First name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  placeholder="teacher@example.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">An invitation will be sent to this email</p>
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="Mat Pilates, Reformer, Tower"
              />
              <p className="text-xs text-gray-500">Comma-separated list of specialties</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:pt-4">
              <Link href="/studio/teachers" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
                disabled={loading}
              >
                {loading ? "Inviting..." : "Invite Teacher"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
