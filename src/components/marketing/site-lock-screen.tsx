"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SiteLockScreen() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/site-access/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setError(data?.error || "Password not recognised.")
        return
      }

      router.refresh()
    } catch {
      setError("Could not unlock the site right now.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06010f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.28),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.3),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(236,72,153,0.08),rgba(124,58,237,0.12),rgba(236,72,153,0.08))] opacity-80" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-12">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/80">
            <Lock className="h-4 w-4" />
            Private Preview
          </div>

          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">CURRENT</p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              The CURRENT is coming soon
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              For studio owners wanting to get a early demo please contact us at{" "}
              <a href="mailto:admin@thecurrent.app" className="font-semibold text-white underline decoration-white/30 underline-offset-4">
                admin@thecurrent.app
              </a>
              .
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <label className="block text-sm font-medium text-white/80" htmlFor="site-lock-password">
              Admin access
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="site-lock-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="h-12 border-white/15 bg-white/10 text-white placeholder:text-white/40"
                autoComplete="current-password"
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 min-w-40 bg-gradient-to-r from-pink-500 to-violet-600 text-white hover:from-pink-600 hover:to-violet-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlocking
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            {error ? <p className="text-sm text-red-200">{error}</p> : null}
          </form>
        </div>
      </div>
    </div>
  )
}
