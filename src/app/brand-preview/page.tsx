import { DM_Sans, Instrument_Serif } from "next/font/google"
import MarketingHomePage from "@/components/marketing/home-page"

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

export default function BrandPreviewPage() {
  return (
    <div className={`${dmSans.variable} ${instrumentSerif.variable} brand-preview-shell`}>
      <style>{`
        .brand-preview-shell {
          --brand-accent: #9d7350;
          --brand-accent-strong: #6f4d34;
          --brand-ink: #1a1a1a;
          --brand-cream: #faf8f5;
          background:
            radial-gradient(circle at 12% 18%, rgba(212, 206, 196, 0.4), transparent 26%),
            radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.1), transparent 22%),
            linear-gradient(180deg, #faf8f5 0%, #f5f2ed 44%, #efebe4 100%);
          color: #1a1a1a;
          font-family: var(--font-brand-preview-body), sans-serif;
        }

        .brand-preview-shell header {
          background: #faf8f5 !important;
          border-bottom: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
        }

        .brand-preview-shell header nav.hidden.md\\:flex.items-center.gap-8 {
          display: none !important;
        }

        .brand-preview-shell * {
          font-family: inherit;
        }

        .brand-preview-shell h1,
        .brand-preview-shell h2,
        .brand-preview-shell h3,
        .brand-preview-shell h4,
        .brand-preview-shell h5,
        .brand-preview-shell h6 {
          font-family: var(--font-brand-preview-display), serif !important;
          font-weight: 400 !important;
          color: #0d0d0d !important;
          letter-spacing: -0.02em;
        }

        .brand-preview-shell p,
        .brand-preview-shell span,
        .brand-preview-shell li,
        .brand-preview-shell label,
        .brand-preview-shell input,
        .brand-preview-shell textarea {
          font-family: var(--font-brand-preview-body), sans-serif !important;
        }

        .brand-preview-shell .bg-white,
        .brand-preview-shell .bg-gray-50,
        .brand-preview-shell .bg-gray-100,
        .brand-preview-shell .bg-zinc-50,
        .brand-preview-shell .bg-zinc-100 {
          background-color: rgba(245, 242, 237, 0.92) !important;
        }

        .brand-preview-shell [class*="bg-white/"],
        .brand-preview-shell [class*="bg-gray-50/"],
        .brand-preview-shell [class*="bg-zinc-50/"] {
          background-color: rgba(250, 248, 245, 0.95) !important;
          backdrop-filter: blur(18px);
        }

        .brand-preview-shell .bg-gray-900\\/50,
        .brand-preview-shell .bg-black\\/50,
        .brand-preview-shell .bg-zinc-900\\/50 {
          background-color: rgba(250, 248, 245, 0.82) !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell .text-gray-400,
        .brand-preview-shell .text-gray-500,
        .brand-preview-shell .text-gray-600,
        .brand-preview-shell .text-gray-700,
        .brand-preview-shell .text-zinc-500,
        .brand-preview-shell .text-zinc-600,
        .brand-preview-shell .text-zinc-700 {
          color: #8a8580 !important;
        }

        .brand-preview-shell .text-gray-900,
        .brand-preview-shell .text-zinc-900,
        .brand-preview-shell .text-black {
          color: #0d0d0d !important;
        }

        .brand-preview-shell .border,
        .brand-preview-shell .border-gray-100,
        .brand-preview-shell .border-gray-200,
        .brand-preview-shell .border-gray-300,
        .brand-preview-shell .border-zinc-100,
        .brand-preview-shell .border-zinc-200 {
          border-color: rgba(212, 206, 196, 0.7) !important;
        }

        .brand-preview-shell .shadow-xl,
        .brand-preview-shell .shadow-2xl,
        .brand-preview-shell .shadow-sm {
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
        }

        .brand-preview-shell button,
        .brand-preview-shell a[class*="inline-flex"],
        .brand-preview-shell [role="button"] {
          font-family: var(--font-brand-preview-body), sans-serif !important;
          font-weight: 500 !important;
        }

        .brand-preview-shell .bg-black,
        .brand-preview-shell .bg-zinc-900,
        .brand-preview-shell .bg-gray-900 {
          background-color: #1a1a1a !important;
          background-image: none !important;
          color: #faf8f5 !important;
        }

        .brand-preview-shell .bg-violet-600,
        .brand-preview-shell .bg-pink-500,
        .brand-preview-shell .bg-blue-600,
        .brand-preview-shell .bg-emerald-600,
        .brand-preview-shell .bg-amber-500,
        .brand-preview-shell .bg-violet-500,
        .brand-preview-shell .bg-pink-600 {
          background-color: #1a1a1a !important;
          background-image: none !important;
          color: #faf8f5 !important;
        }

        .brand-preview-shell .bg-violet-50,
        .brand-preview-shell .bg-pink-50,
        .brand-preview-shell .bg-emerald-50,
        .brand-preview-shell .bg-blue-50,
        .brand-preview-shell .bg-amber-50 {
          background-color: rgba(212, 206, 196, 0.28) !important;
          border-color: rgba(212, 206, 196, 0.7) !important;
        }

        .brand-preview-shell .text-violet-600,
        .brand-preview-shell .text-pink-600,
        .brand-preview-shell .text-emerald-600,
        .brand-preview-shell .text-blue-600,
        .brand-preview-shell .text-amber-600,
        .brand-preview-shell .text-pink-700,
        .brand-preview-shell .text-violet-700,
        .brand-preview-shell .text-emerald-700 {
          color: #1a1a1a !important;
        }

        .brand-preview-shell .ring-1,
        .brand-preview-shell .ring-gray-200,
        .brand-preview-shell .ring-gray-300 {
          --tw-ring-color: rgba(212, 206, 196, 0.6) !important;
        }

        .brand-preview-shell .bg-clip-text.text-transparent {
          background-image: none !important;
          color: #1a1a1a !important;
          -webkit-text-fill-color: #1a1a1a !important;
          font-family: var(--font-brand-preview-display), serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          letter-spacing: -0.04em !important;
          text-transform: uppercase;
        }

        .brand-preview-shell section:first-of-type .inline-flex span.bg-clip-text.text-transparent {
          background-image: linear-gradient(90deg, var(--brand-accent), var(--brand-accent-strong)) !important;
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
          letter-spacing: 0 !important;
          text-transform: uppercase;
        }

        .brand-preview-shell section:first-of-type .inline-flex .text-pink-500 {
          color: var(--brand-accent) !important;
        }

        .brand-preview-shell #videos {
          display: none !important;
        }

        .brand-preview-shell #videos + section {
          display: none !important;
        }

        .brand-preview-shell #videos .text-pink-600 {
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell #features .w-12.h-12 {
          background-image: none !important;
          background-color: rgba(212, 206, 196, 0.42) !important;
          border: 1px solid rgba(212, 206, 196, 0.75) !important;
        }

        .brand-preview-shell #features .w-6.h-6 {
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] {
          background: linear-gradient(150deg, #111111 0%, #1a1a1a 52%, #131313 100%) !important;
          color: var(--brand-cream) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .bg-purple-100 {
          background-color: rgba(157, 115, 80, 0.25) !important;
          border: 1px solid rgba(157, 115, 80, 0.4) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .text-purple-700 {
          color: #dec6ad !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .bg-white {
          background-color: rgba(250, 248, 245, 0.05) !important;
          border: 1px solid rgba(250, 248, 245, 0.14) !important;
          box-shadow: none !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .text-gray-900 {
          color: var(--brand-cream) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .text-gray-600 {
          color: rgba(250, 248, 245, 0.8) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .from-purple-500,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .from-pink-500,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .from-amber-500 {
          --tw-gradient-from: var(--brand-accent) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .to-violet-600,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .to-rose-500,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .to-orange-500 {
          --tw-gradient-to: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] a[href="/demo"] button {
          background-color: rgba(250, 248, 245, 0.9) !important;
          border-color: rgba(250, 248, 245, 0.95) !important;
          color: var(--brand-ink) !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] a[href="/demo"] button:hover {
          background-color: var(--brand-cream) !important;
          color: #0d0d0d !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] a[href="/demo"] button svg {
          color: var(--brand-ink) !important;
        }

        .brand-preview-shell header .text-2xl.font-bold,
        .brand-preview-shell header .text-2xl.font-bold span {
          font-family: var(--font-brand-preview-display), serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          letter-spacing: -0.05em !important;
          color: #1a1a1a !important;
          -webkit-text-fill-color: #1a1a1a !important;
        }

        .brand-preview-shell .text-white,
        .brand-preview-shell .text-gray-50,
        .brand-preview-shell .text-zinc-50 {
          color: #faf8f5 !important;
        }

        .brand-preview-shell .bg-violet-100,
        .brand-preview-shell .bg-pink-100,
        .brand-preview-shell .bg-blue-100,
        .brand-preview-shell .bg-emerald-100,
        .brand-preview-shell .bg-amber-100 {
          background-color: rgba(212, 206, 196, 0.38) !important;
          color: #1a1a1a !important;
          border-color: rgba(212, 206, 196, 0.65) !important;
        }

        .brand-preview-shell .from-pink-500,
        .brand-preview-shell .from-rose-500,
        .brand-preview-shell .from-violet-500,
        .brand-preview-shell .from-violet-600,
        .brand-preview-shell .from-purple-500,
        .brand-preview-shell .from-purple-600,
        .brand-preview-shell .from-amber-500,
        .brand-preview-shell .from-orange-500,
        .brand-preview-shell .from-pink-400 {
          --tw-gradient-from: #1a1a1a !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(26, 26, 26, 0)) !important;
        }

        .brand-preview-shell .to-violet-600,
        .brand-preview-shell .to-violet-700,
        .brand-preview-shell .to-purple-600,
        .brand-preview-shell .to-rose-500,
        .brand-preview-shell .to-orange-500,
        .brand-preview-shell .to-pink-500,
        .brand-preview-shell .to-violet-500 {
          --tw-gradient-to: #0d0d0d !important;
        }

        .brand-preview-shell .from-pink-50,
        .brand-preview-shell .from-violet-50,
        .brand-preview-shell .from-amber-50,
        .brand-preview-shell .from-emerald-50,
        .brand-preview-shell .from-blue-50,
        .brand-preview-shell .from-purple-50 {
          --tw-gradient-from: #efebe4 !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 235, 228, 0)) !important;
        }

        .brand-preview-shell .to-white {
          --tw-gradient-to: #f5f2ed !important;
        }

        .brand-preview-shell .via-violet-950,
        .brand-preview-shell .via-gray-800 {
          --tw-gradient-stops: var(--tw-gradient-from), #1a1a1a, var(--tw-gradient-to) !important;
        }

        .brand-preview-shell .from-gray-900 {
          --tw-gradient-from: #1a1a1a !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(26, 26, 26, 0)) !important;
        }

        .brand-preview-shell .to-gray-900 {
          --tw-gradient-to: #0d0d0d !important;
        }

        .brand-preview-shell .from-pink-200\\/40,
        .brand-preview-shell .from-violet-200\\/30,
        .brand-preview-shell .via-violet-200\\/30,
        .brand-preview-shell .via-purple-100\\/20 {
          --tw-gradient-from: rgba(212, 206, 196, 0.45) !important;
          --tw-gradient-stops: var(--tw-gradient-from), rgba(245, 242, 237, 0.18), var(--tw-gradient-to, transparent) !important;
        }

        .brand-preview-shell .bg-pink-500\\/20,
        .brand-preview-shell .bg-violet-500\\/20 {
          background-color: rgba(212, 206, 196, 0.18) !important;
        }

        .brand-preview-shell .shadow-violet-500\\/25,
        .brand-preview-shell .shadow-violet-500\\/30,
        .brand-preview-shell .shadow-pink-500\\/25,
        .brand-preview-shell .shadow-pink-500\\/30,
        .brand-preview-shell .shadow-purple-500\\/30,
        .brand-preview-shell .shadow-amber-500\\/30 {
          --tw-shadow-color: rgba(26, 26, 26, 0.12) !important;
        }

        .brand-preview-shell .hover\\:bg-violet-700:hover,
        .brand-preview-shell .hover\\:bg-pink-600:hover,
        .brand-preview-shell .hover\\:bg-black:hover,
        .brand-preview-shell .hover\\:bg-gray-900:hover {
          background-color: #0d0d0d !important;
          color: #faf8f5 !important;
        }

        .brand-preview-shell .hover\\:from-pink-600:hover,
        .brand-preview-shell .hover\\:to-violet-700:hover {
          --tw-gradient-from: #0d0d0d !important;
          --tw-gradient-to: #1a1a1a !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }

        .brand-preview-shell .border-white\\/30 {
          border-color: rgba(212, 206, 196, 0.45) !important;
        }

        .brand-preview-shell .hover\\:bg-white\\/10:hover,
        .brand-preview-shell .bg-white\\/10 {
          background-color: rgba(250, 248, 245, 0.08) !important;
        }

        .brand-preview-shell .bg-white\\/20 {
          background-color: rgba(250, 248, 245, 0.18) !important;
        }

        .brand-preview-shell .hover\\:bg-white\\/30:hover {
          background-color: rgba(250, 248, 245, 0.24) !important;
        }

        .brand-preview-shell footer {
          background-color: #121212 !important;
          border-top: 1px solid rgba(212, 206, 196, 0.16) !important;
        }

        .brand-preview-shell footer h1,
        .brand-preview-shell footer h2,
        .brand-preview-shell footer h3,
        .brand-preview-shell footer h4,
        .brand-preview-shell footer h5,
        .brand-preview-shell footer h6 {
          color: var(--brand-cream) !important;
          -webkit-text-fill-color: var(--brand-cream) !important;
        }

        .brand-preview-shell footer .bg-clip-text.text-transparent {
          background-image: none !important;
          color: var(--brand-cream) !important;
          -webkit-text-fill-color: var(--brand-cream) !important;
        }

        .brand-preview-shell footer .text-gray-400,
        .brand-preview-shell footer .text-gray-500 {
          color: rgba(250, 248, 245, 0.72) !important;
        }

        .brand-preview-shell footer .border-gray-800 {
          border-color: rgba(250, 248, 245, 0.16) !important;
        }

        .brand-preview-shell footer button {
          background-color: var(--brand-cream) !important;
          background-image: none !important;
          color: var(--brand-ink) !important;
          border: 1px solid rgba(250, 248, 245, 0.8) !important;
        }

        .brand-preview-shell footer button:hover {
          background-color: #f2ede6 !important;
          color: #0d0d0d !important;
        }

        .brand-preview-shell input,
        .brand-preview-shell textarea {
          background: rgba(250, 248, 245, 0.95) !important;
          border-color: rgba(212, 206, 196, 0.8) !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell input::placeholder,
        .brand-preview-shell textarea::placeholder {
          color: #8a8580 !important;
        }

        .brand-preview-shell svg {
          color: currentColor;
        }
      `}</style>
      <MarketingHomePage />
    </div>
  )
}
