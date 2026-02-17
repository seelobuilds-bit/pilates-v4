"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SalesSettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          <Settings className="h-7 w-7 text-violet-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <Card className="border-0 shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{session?.user?.firstName} {session?.user?.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">Sales Agent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}












