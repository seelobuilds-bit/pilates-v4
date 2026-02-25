"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Shield, Bell, Database } from "lucide-react"

const STORAGE_KEY = "hq-platform-settings-v1"

export default function HQSettingsPage() {
  const [platformName, setPlatformName] = useState("Cadence")
  const [supportEmail, setSupportEmail] = useState("support@cadence.com")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [require2fa, setRequire2fa] = useState(false)
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        platformName?: string
        supportEmail?: string
        maintenanceMode?: boolean
        emailNotifications?: boolean
        require2fa?: boolean
        sessionTimeoutEnabled?: boolean
        weeklyReports?: boolean
      }

      if (parsed.platformName) setPlatformName(parsed.platformName)
      if (parsed.supportEmail) setSupportEmail(parsed.supportEmail)
      if (typeof parsed.maintenanceMode === "boolean") setMaintenanceMode(parsed.maintenanceMode)
      if (typeof parsed.emailNotifications === "boolean") setEmailNotifications(parsed.emailNotifications)
      if (typeof parsed.require2fa === "boolean") setRequire2fa(parsed.require2fa)
      if (typeof parsed.sessionTimeoutEnabled === "boolean") setSessionTimeoutEnabled(parsed.sessionTimeoutEnabled)
      if (typeof parsed.weeklyReports === "boolean") setWeeklyReports(parsed.weeklyReports)
    } catch {
      // Ignore invalid stored settings and keep defaults.
    }
  }, [])

  function saveChanges() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          platformName,
          supportEmail,
          maintenanceMode,
          emailNotifications,
          require2fa,
          sessionTimeoutEnabled,
          weeklyReports
        })
      )
      setSaveMessage("Changes saved.")
    } catch {
      setSaveMessage("Could not save settings on this device.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Platform configuration and preferences</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* General Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-gray-400" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="Platform name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-gray-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Require 2FA for all admin users</p>
              </div>
              <Switch checked={require2fa} onCheckedChange={setRequire2fa} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">Session Timeout</p>
                <p className="text-sm text-gray-500">Auto logout after 30 minutes of inactivity</p>
              </div>
              <Switch checked={sessionTimeoutEnabled} onCheckedChange={setSessionTimeoutEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-gray-400" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email alerts for new studios</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">Weekly Reports</p>
                <p className="text-sm text-gray-500">Get weekly platform summary emails</p>
              </div>
              <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
            </div>
          </CardContent>
        </Card>

        {/* System */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-gray-400" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Temporarily disable public access</p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">Database Actions</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">Export Data</Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">Clear Cache</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {saveMessage && <p className="text-sm text-gray-500">{saveMessage}</p>}
          <Button onClick={saveChanges} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
