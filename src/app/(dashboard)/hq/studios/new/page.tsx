"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewStudioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      subdomain: formData.get("subdomain") as string,
      ownerEmail: formData.get("ownerEmail") as string,
      ownerFirstName: formData.get("ownerFirstName") as string,
      ownerLastName: formData.get("ownerLastName") as string,
    }

    try {
      const response = await fetch("/api/hq/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to create studio")
      }

      router.push("/hq/studios")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create studio")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
      <h1 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Create New Studio</h1>

      <Card>
        <CardHeader>
          <CardTitle>Studio Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-medium">Studio Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Studio Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input id="subdomain" name="subdomain" required placeholder="e.g. zenith" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Owner Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ownerFirstName">First Name</Label>
                  <Input id="ownerFirstName" name="ownerFirstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerLastName">Last Name</Label>
                  <Input id="ownerLastName" name="ownerLastName" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email</Label>
                <Input id="ownerEmail" name="ownerEmail" type="email" required />
                <p className="text-xs text-gray-500">
                  A welcome email will be sent with a link to set their password
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Creating..." : "Create Studio"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


