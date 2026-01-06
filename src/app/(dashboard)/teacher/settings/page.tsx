"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  User,
  Bell,
  Save,
  Loader2
} from "lucide-react"

export default function TeacherSettingsPage() {
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [bio, setBio] = useState("")
  const [specialties, setSpecialties] = useState("")

  async function handleSave() {
    setSaving(true)
    try {
      await fetch("/api/teacher/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, specialties: specialties.split(",").map(s => s.trim()).filter(Boolean) })
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your teacher profile and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Profile Information
            </CardTitle>
            <CardDescription>
              This information will be shown to clients when they book classes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={session?.user?.firstName || ""} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={session?.user?.lastName || ""} disabled className="bg-gray-50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={session?.user?.email || ""} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">Contact your studio admin to change your email</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about your background and teaching style..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Input 
                id="specialties"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="e.g., Reformer, Mat, Prenatal (comma separated)"
              />
              <p className="text-xs text-gray-500">Separate multiple specialties with commas</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-400" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">New Booking Alerts</p>
                <p className="text-sm text-gray-500">Get notified when a client books your class</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Cancellation Alerts</p>
                <p className="text-sm text-gray-500">Get notified when a client cancels</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Daily Schedule Summary</p>
                <p className="text-sm text-gray-500">Receive a daily email with your schedule</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}


























