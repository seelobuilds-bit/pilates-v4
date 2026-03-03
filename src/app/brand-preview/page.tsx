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
          background:
            radial-gradient(circle at 12% 18%, rgba(212, 206, 196, 0.4), transparent 26%),
            radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.1), transparent 22%),
            linear-gradient(180deg, #faf8f5 0%, #f5f2ed 44%, #efebe4 100%);
          color: #1a1a1a;
          font-family: var(--font-brand-preview-body), sans-serif;
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
          background-color: rgba(212, 206, 196, 0.9) !important;
          background-image: none !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell .from-pink-500,
        .brand-preview-shell .to-violet-600,
        .brand-preview-shell .from-violet-600,
        .brand-preview-shell .to-pink-500 {
          --tw-gradient-from: rgba(212, 206, 196, 0.92) !important;
          --tw-gradient-to: rgba(245, 242, 237, 0.96) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }

        .brand-preview-shell .bg-gradient-to-r,
        .brand-preview-shell .bg-gradient-to-br,
        .brand-preview-shell .bg-gradient-to-b {
          background-image: linear-gradient(135deg, rgba(212, 206, 196, 0.92), rgba(245, 242, 237, 0.96)) !important;
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
        .brand-preview-shell .text-amber-600 {
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

        .brand-preview-shell .hover\\:bg-violet-700:hover,
        .brand-preview-shell .hover\\:bg-pink-600:hover,
        .brand-preview-shell .hover\\:bg-black:hover,
        .brand-preview-shell .hover\\:bg-gray-900:hover {
          background-color: #0d0d0d !important;
          color: #faf8f5 !important;
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
