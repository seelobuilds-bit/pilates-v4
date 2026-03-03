import Link from "next/link"
import { DM_Sans, Instrument_Serif } from "next/font/google"
import { ArrowRight, Check, Play } from "lucide-react"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-preview-body",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-preview-display",
})

const featureCards = [
  {
    title: "Booking that feels like you",
    body: "Your booking lives inside your site. Same fonts. Same colours. Same vibe. Clients book seamlessly without ever knowing we're behind it.",
  },
  {
    title: "Reporting that actually makes sense",
    body: "Clean, visual and built for studio owners. See what's working, act on it immediately, and spend less time decoding spreadsheets.",
  },
  {
    title: "Your software, your way",
    body: "Want to strip it back to bare essentials? Done. Want every metric front and centre? Also done. Current molds around how you work.",
  },
]

const platformChecks = [
  "Growth Academy with daily inspiration",
  "Easy reporting built for owners",
  "A custom app for your studio",
  "Email and SMS flows that actually convert",
  "24/7 support from a real team",
  "A clean embed that feels native to your site",
]

const vaultChecks = [
  "Build courses and sell them individually or as subscriptions",
  "Sell to your clients, independent teachers or the wider pilates community",
  "Built-in community chat for every tier",
  "Your own platform, inside Current, under your brand",
  "A revenue stream that keeps running",
]

const growCards = [
  {
    title: "Your Branded Store",
    body: "We source the products, brand them in your identity, and fulfil from our warehouse while your studio earns on every order.",
  },
  {
    title: "We Run Your Ads",
    body: "Organic content and paid campaigns can work together. Current gives you both and keeps the data connected.",
  },
  {
    title: "Free Custom Website",
    body: "A custom site built around your studio vision, matched to your booking flow and your brand from day one.",
  },
]

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.22em]"
      style={{
        borderColor: "rgba(212, 206, 196, 0.7)",
        background: "rgba(250, 248, 245, 0.95)",
        color: "#8A8580",
      }}
    >
      {children}
    </div>
  )
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[2rem] border p-6 md:p-8 ${className}`}
      style={{
        borderColor: "rgba(212, 206, 196, 0.6)",
        background:
          "linear-gradient(145deg, rgba(250, 248, 245, 0.95), rgba(245, 242, 237, 0.9))",
        boxShadow:
          "0 30px 80px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(18px)",
      }}
    >
      {children}
    </div>
  )
}

export default function BrandPreviewPage() {
  return (
    <main
      className={`${dmSans.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden`}
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(212, 206, 196, 0.4), transparent 30%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1), transparent 25%), linear-gradient(180deg, #FAF8F5 0%, #F5F2ED 48%, #EFEBE4 100%)",
        color: "#1A1A1A",
        fontFamily: "var(--font-preview-body)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-[-10%] top-[-10%] h-[28rem] w-[28rem] animate-pulse rounded-full blur-3xl"
          style={{ background: "rgba(212, 206, 196, 0.4)" }}
        />
        <div
          className="absolute right-[-8%] top-[18%] h-[24rem] w-[24rem] animate-pulse rounded-full blur-3xl"
          style={{ background: "rgba(255, 255, 255, 0.1)", animationDelay: "900ms" }}
        />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header
          className="sticky top-4 z-20 rounded-[1.75rem] border px-4 py-4 md:px-6"
          style={{
            borderColor: "rgba(212, 206, 196, 0.6)",
            background: "rgba(250, 248, 245, 0.95)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-medium"
                style={{
                  borderColor: "rgba(212, 206, 196, 0.7)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#0D0D0D",
                }}
              >
                C
              </div>
              <div>
                <p
                  className="text-2xl leading-none"
                  style={{ fontFamily: "var(--font-preview-display)", color: "#0D0D0D" }}
                >
                  The CURRENT App
                </p>
                <p className="mt-1 text-sm" style={{ color: "#8A8580" }}>
                  Brand preview route only. Live homepage unchanged.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5"
                style={{
                  background: "#0D0D0D",
                  color: "#FAF8F5",
                }}
              >
                Back to live site
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium"
                style={{
                  borderColor: "rgba(212, 206, 196, 0.8)",
                  background: "rgba(250, 248, 245, 0.95)",
                  color: "#1A1A1A",
                }}
              >
                <Play className="h-4 w-4" />
                Preview demo flow
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background:
                  "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 35%, transparent 100%)",
              }}
            />
            <div className="relative">
              <SectionBadge>Brand Preview</SectionBadge>
              <h1
                className="mt-6 max-w-4xl text-5xl leading-[0.95] md:text-7xl"
                style={{ fontFamily: "var(--font-preview-display)", color: "#0D0D0D" }}
              >
                Built for studios. Not for software companies.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 md:text-lg" style={{ color: "#8A8580" }}>
                We&apos;ve talked to hundreds of studio owners. The problem isn&apos;t finding
                software. It&apos;s finding software that doesn&apos;t create more work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="rounded-full px-6 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5"
                  style={{ background: "#0D0D0D", color: "#FAF8F5" }}
                >
                  Book a private demo
                </button>
                <button
                  className="rounded-full border px-6 py-3 text-sm font-medium"
                  style={{
                    borderColor: "rgba(212, 206, 196, 0.8)",
                    background: "rgba(250, 248, 245, 0.95)",
                    color: "#1A1A1A",
                  }}
                >
                  Explore the platform
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionBadge>At a Glance</SectionBadge>
            <div className="mt-6 space-y-4">
              {platformChecks.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div
                    className="mt-1 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "rgba(212, 206, 196, 0.4)", color: "#0D0D0D" }}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 md:text-base" style={{ color: "#1A1A1A" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Studios moving", "Live in days"],
                ["Reporting built", "For decision-making"],
                ["Client booking", "Fully embedded"],
                ["Support", "24/7"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-3xl border p-4"
                  style={{
                    borderColor: "rgba(212, 206, 196, 0.7)",
                    background: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#8A8580" }}>
                    {label}
                  </p>
                  <p className="mt-3 text-base font-medium" style={{ color: "#0D0D0D" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {featureCards.map((card) => (
            <GlassCard key={card.title}>
              <SectionBadge>Why Current</SectionBadge>
              <h2
                className="mt-5 text-3xl leading-tight"
                style={{ fontFamily: "var(--font-preview-display)", color: "#0D0D0D" }}
              >
                {card.title}
              </h2>
              <p className="mt-4 text-sm leading-7 md:text-base" style={{ color: "#8A8580" }}>
                {card.body}
              </p>
            </GlassCard>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard>
            <SectionBadge>The Vault</SectionBadge>
            <h2
              className="mt-5 text-4xl leading-tight md:text-5xl"
              style={{ fontFamily: "var(--font-preview-display)", color: "#0D0D0D" }}
            >
              Your knowledge. Your empire.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 md:text-base" style={{ color: "#8A8580" }}>
              You&apos;ve spent years building expertise. The Vault turns it into a platform that earns
              while you sleep.
            </p>
            <div className="mt-8 space-y-4">
              {vaultChecks.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div
                    className="mt-1 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "rgba(212, 206, 196, 0.4)", color: "#0D0D0D" }}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 md:text-base" style={{ color: "#1A1A1A" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between">
            <div>
              <SectionBadge>Metrics Preview</SectionBadge>
              <div className="mt-6 grid gap-4">
                {[
                  ["Active subscribers", "Growing monthly"],
                  ["Courses published", "Earning passively"],
                  ["Community members", "And counting"],
                ].map(([title, detail]) => (
                  <div
                    key={title}
                    className="rounded-3xl border p-5"
                    style={{
                      borderColor: "rgba(212, 206, 196, 0.7)",
                      background:
                        "linear-gradient(145deg, rgba(250, 248, 245, 0.95), rgba(239, 235, 228, 0.85))",
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#8A8580" }}>
                      {title}
                    </p>
                    <p
                      className="mt-4 text-3xl"
                      style={{ fontFamily: "var(--font-preview-display)", color: "#0D0D0D" }}
                    >
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        <section>
          <SectionBadge>Grow &amp; Earn</SectionBadge>
          <h2
            className="mt-6 max-w-4xl text-4xl leading-tight md:text-6xl"
            style={{ fontFamily: "var(--font-preview-display)", color: "#0D0D0D" }}
          >
            More revenue streams. Zero extra work.
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 md:text-base" style={{ color: "#8A8580" }}>
            Current isn&apos;t just software. It&apos;s an ecosystem built to make your studio more
            profitable from every angle.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {growCards.map((card) => (
              <GlassCard key={card.title}>
                <h3
                  className="text-3xl leading-tight"
                  style={{ fontFamily: "var(--font-preview-display)", color: "#0D0D0D" }}
                >
                  {card.title}
                </h3>
                <p className="mt-4 text-sm leading-7 md:text-base" style={{ color: "#8A8580" }}>
                  {card.body}
                </p>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
