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
        html,
        body {
          overflow-y: auto !important;
          overscroll-behavior-y: auto !important;
        }

        body {
          overflow-x: hidden !important;
        }

        .brand-preview-shell {
          --brand-accent: #e3120b;
          --brand-accent-strong: #b10e08;
          --brand-accent-soft: #f2e5e5;
          --brand-accent-rgb: 227, 18, 11;
          --brand-accent-strong-rgb: 177, 14, 8;
          --brand-accent-soft-rgb: 242, 229, 229;
          --brand-ink: #1a1a1a;
          --brand-cream: #f9f9f9;
          background:
            radial-gradient(circle at 12% 18%, rgba(212, 206, 196, 0.4), transparent 26%),
            radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.1), transparent 22%),
            linear-gradient(180deg, #f9f9f9 0%, #f2f2f2 44%, #ebebeb 100%);
          color: #1a1a1a;
          font-family: var(--font-brand-preview-body), sans-serif;
          overflow-y: visible !important;
          overflow-x: clip;
        }

        .brand-preview-shell header {
          top: 1rem !important;
          left: 0 !important;
          right: 0 !important;
          background: transparent !important;
          border-bottom: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
        }

        .brand-preview-shell header.bg-white\\/80 {
          background: transparent !important;
        }

        .brand-preview-shell header .max-w-7xl {
          max-width: min(760px, calc(100% - 1.25rem)) !important;
          background: linear-gradient(145deg, rgba(242, 242, 242, 0.78), rgba(235, 235, 235, 0.72)) !important;
          border: 1px solid rgba(212, 206, 196, 0.72) !important;
          border-radius: 1.1rem !important;
          backdrop-filter: blur(14px) saturate(130%);
          -webkit-backdrop-filter: blur(14px) saturate(130%);
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
        }

        .brand-preview-shell header nav.hidden.md\\:flex.items-center.gap-8 {
          display: none !important;
        }

        .brand-preview-shell header .text-gray-600 {
          color: rgba(26, 26, 26, 0.74) !important;
        }

        .brand-preview-shell header .hover\\:text-gray-900:hover {
          color: #0d0d0d !important;
        }

        .brand-preview-shell header .md\\:hidden.p-2 {
          color: #1a1a1a !important;
        }

        .brand-preview-shell header .md\\:hidden.bg-white {
          background: rgba(249, 249, 249, 0.96) !important;
          border-color: rgba(26, 26, 26, 0.12) !important;
          border-radius: 0 0 1rem 1rem;
          margin-top: 0.5rem;
        }

        .brand-preview-shell header .hidden.md\\:flex.items-center.gap-3 > a button {
          background: transparent !important;
          color: rgba(26, 26, 26, 0.82) !important;
        }

        .brand-preview-shell header .hidden.md\\:flex.items-center.gap-3 > a button:hover {
          background: rgba(26, 26, 26, 0.06) !important;
          color: #0d0d0d !important;
        }

        .brand-preview-shell header .hidden.md\\:flex.items-center.gap-3 > button {
          background: transparent !important;
          background-image: none !important;
          color: rgba(26, 26, 26, 0.82) !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .brand-preview-shell header .hidden.md\\:flex.items-center.gap-3 > button:hover {
          background: rgba(26, 26, 26, 0.06) !important;
          color: #0d0d0d !important;
        }

        .brand-preview-shell header .md\\:hidden.bg-white .text-gray-600 {
          color: rgba(26, 26, 26, 0.8) !important;
        }

        .brand-preview-shell header .md\\:hidden.bg-white hr {
          border-color: rgba(26, 26, 26, 0.12) !important;
        }

        .brand-preview-shell header .md\\:hidden.bg-white button {
          background: transparent !important;
          background-image: none !important;
          color: rgba(26, 26, 26, 0.82) !important;
          border: none !important;
          justify-content: flex-start !important;
          padding-left: 0 !important;
        }

        .brand-preview-shell header .md\\:hidden.bg-white button:hover {
          background: rgba(26, 26, 26, 0.06) !important;
          color: #0d0d0d !important;
        }

        .brand-preview-shell header .flex.items-center.justify-between.h-16 {
          position: relative;
        }

        .brand-preview-shell header .flex.items-center.select-none {
          position: absolute !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 2;
        }

        .brand-preview-shell header .hidden.md\\:flex.items-center.gap-3 {
          display: flex !important;
          width: 100% !important;
          justify-content: space-between !important;
          align-items: center !important;
          gap: 0 !important;
        }

        .brand-preview-shell header .hidden.md\\:flex.items-center.gap-3 > a:first-child {
          margin-left: 0 !important;
        }

        .brand-preview-shell header .hidden.md\\:flex.items-center.gap-3 > button:last-child {
          margin-right: 0 !important;
        }

        .brand-preview-shell header .md\\:hidden.p-2 {
          margin-left: auto;
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
          background-color: rgba(242, 242, 242, 0.92) !important;
        }

        .brand-preview-shell [class*="bg-white/"]:not(header),
        .brand-preview-shell [class*="bg-gray-50/"]:not(header),
        .brand-preview-shell [class*="bg-zinc-50/"]:not(header) {
          background-color: rgba(249, 249, 249, 0.95) !important;
          backdrop-filter: blur(18px);
        }

        .brand-preview-shell .bg-gray-900\\/50,
        .brand-preview-shell .bg-black\\/50,
        .brand-preview-shell .bg-zinc-900\\/50 {
          background-color: rgba(249, 249, 249, 0.82) !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell .text-gray-400,
        .brand-preview-shell .text-gray-500,
        .brand-preview-shell .text-gray-600,
        .brand-preview-shell .text-gray-700,
        .brand-preview-shell .text-zinc-500,
        .brand-preview-shell .text-zinc-600,
        .brand-preview-shell .text-zinc-700 {
          color: #706f6e !important;
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
          color: #f9f9f9 !important;
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
          color: #f9f9f9 !important;
        }

        .brand-preview-shell .bg-violet-50,
        .brand-preview-shell .bg-pink-50,
        .brand-preview-shell .bg-emerald-50,
        .brand-preview-shell .bg-blue-50,
        .brand-preview-shell .bg-amber-50 {
          background-color: rgba(var(--brand-accent-soft-rgb), 0.2) !important;
          border-color: rgba(var(--brand-accent-rgb), 0.32) !important;
        }

        .brand-preview-shell .text-violet-600,
        .brand-preview-shell .text-pink-600,
        .brand-preview-shell .text-emerald-600,
        .brand-preview-shell .text-blue-600,
        .brand-preview-shell .text-amber-600,
        .brand-preview-shell .text-pink-700,
        .brand-preview-shell .text-violet-700,
        .brand-preview-shell .text-emerald-700 {
          color: var(--brand-accent-strong) !important;
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
          background-image: none !important;
          color: #0d0d0d !important;
          -webkit-text-fill-color: #0d0d0d !important;
          font-family: var(--font-brand-preview-display), serif !important;
          font-style: normal !important;
          font-weight: 400 !important;
          letter-spacing: 0 !important;
          text-transform: uppercase !important;
        }

        .brand-preview-shell section:first-of-type h1 > span.bg-clip-text.text-transparent {
          background-image: none !important;
          color: var(--brand-accent) !important;
          -webkit-text-fill-color: var(--brand-accent) !important;
        }

        .brand-preview-shell section:first-of-type {
          min-height: 100svh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding-top: 2.8rem !important;
          padding-bottom: 1rem !important;
        }

        .brand-preview-shell section:first-of-type > .max-w-4xl {
          width: 100%;
          transform: translateY(-3.7rem);
        }

        @media (min-width: 1024px) {
          .brand-preview-shell section:first-of-type {
            min-height: 100svh !important;
            align-items: center !important;
            padding-top: 4.2rem !important;
            padding-bottom: 1rem !important;
          }

          .brand-preview-shell section:first-of-type > .max-w-4xl {
            transform: translateY(-3.5rem);
            transform-origin: top center;
          }
        }

        .brand-preview-shell section:first-of-type .inline-flex.items-center.gap-2 {
          background-image: none !important;
          background-color: rgba(242, 242, 242, 0.86) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
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

        .brand-preview-shell #testimonials {
          display: none !important;
        }

        .brand-preview-shell #videos .text-pink-600 {
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell #features .w-12.h-12 {
          background-image: none !important;
          background-color: rgba(var(--brand-accent-soft-rgb), 0.24) !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.36) !important;
        }

        .brand-preview-shell #features .w-6.h-6 {
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div,
        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div,
        .brand-preview-shell section:has(+ #testimonials) .grid.md\\:grid-cols-3 > div {
          text-align: center !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div .w-14.h-14,
        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div .w-12.h-12,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div .w-16.h-16,
        .brand-preview-shell section:has(+ #testimonials) .grid.md\\:grid-cols-3 > div .w-14.h-14 {
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div {
          background: rgba(249, 249, 249, 0.05) !important;
          border: 1px solid rgba(249, 249, 249, 0.2) !important;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.14) !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div .w-14.h-14 {
          background: var(--brand-accent) !important;
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.62) !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div .w-14.h-14 svg {
          color: #fcf2f2 !important;
        }

        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div {
          background: transparent !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.46) !important;
          box-shadow: none !important;
        }

        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:hover {
          background: transparent !important;
        }

        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div .text-gray-900 {
          color: #0d0d0d !important;
        }

        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div .text-gray-600 {
          color: #706f6e !important;
        }

        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div .w-12.h-12 {
          background: rgba(var(--brand-accent-soft-rgb), 0.22) !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.5) !important;
        }

        .brand-preview-shell #features .grid.sm\\:grid-cols-2.lg\\:grid-cols-3 > div svg {
          color: var(--brand-accent) !important;
        }

        .brand-preview-shell section:has(+ #testimonials) .grid.md\\:grid-cols-3 > div {
          background: transparent !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.46) !important;
          box-shadow: none !important;
        }

        .brand-preview-shell section:has(+ #testimonials) .grid.md\\:grid-cols-3 > div .text-gray-900 {
          color: #0d0d0d !important;
        }

        .brand-preview-shell section:has(+ #testimonials) .grid.md\\:grid-cols-3 > div .text-gray-600 {
          color: #706f6e !important;
        }

        .brand-preview-shell section:has(+ #testimonials) .grid.md\\:grid-cols-3 > div .w-14.h-14 {
          background: rgba(var(--brand-accent-soft-rgb), 0.22) !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.5) !important;
        }

        .brand-preview-shell section:has(+ #testimonials) .grid.md\\:grid-cols-3 > div svg {
          color: var(--brand-accent) !important;
        }

        .brand-preview-shell #why {
          background: linear-gradient(180deg, #f9f9f9 0%, #f2f2f2 52%, #ebebeb 100%) !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell #why .text-gray-900 {
          color: #0d0d0d !important;
        }

        .brand-preview-shell #why .text-gray-600,
        .brand-preview-shell #why .text-gray-700 {
          color: #706f6e !important;
        }

        .brand-preview-shell #why .bg-pink-100 {
          background-color: rgba(var(--brand-accent-soft-rgb), 0.22) !important;
          border-color: rgba(var(--brand-accent-rgb), 0.34) !important;
        }

        .brand-preview-shell #why .text-pink-700 {
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div:nth-child(1) {
          background: linear-gradient(160deg, #f9f9f9 0%, #f2f2f2 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div:nth-child(2) {
          background: linear-gradient(160deg, #f9f9f9 0%, #ebebeb 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div:nth-child(3) {
          background: linear-gradient(160deg, #f2f2f2 0%, #ebebeb 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
        }

        .brand-preview-shell #why .grid.md\\:grid-cols-3 > div .w-14.h-14 {
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.62) !important;
        }

        .brand-preview-shell #features + section {
          background-color: rgba(242, 242, 242, 0.92) !important;
          background-image: none !important;
        }

        .brand-preview-shell #faq {
          background-image: linear-gradient(180deg, rgba(249, 249, 249, 0.94) 0%, rgba(242, 242, 242, 0.92) 100%) !important;
          border-top: 1px solid rgba(212, 206, 196, 0.36) !important;
          border-bottom: 1px solid rgba(212, 206, 196, 0.36) !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child {
          background: linear-gradient(160deg, #f9f9f9 0%, #f2f2f2 58%, #ebebeb 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.08) !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child h4,
        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .text-gray-900 {
          color: #0d0d0d !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .text-gray-600 {
          color: #706f6e !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .text-emerald-700,
        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .text-emerald-600,
        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .text-violet-600,
        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .text-pink-600 {
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .bg-emerald-100.text-emerald-700 {
          background-color: rgba(var(--brand-accent-soft-rgb), 0.24) !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.42) !important;
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .bg-emerald-50 {
          background: rgba(249, 249, 249, 0.82) !important;
          border-color: rgba(212, 206, 196, 0.5) !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .bg-violet-50 {
          background: rgba(249, 249, 249, 0.82) !important;
          border-color: rgba(212, 206, 196, 0.5) !important;
        }

        .brand-preview-shell #features + section .grid.lg\\:grid-cols-2 > div:last-child .bg-pink-50 {
          background: rgba(249, 249, 249, 0.82) !important;
          border-color: rgba(212, 206, 196, 0.5) !important;
        }

        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50 {
          background: linear-gradient(180deg, #f9f9f9 0%, #f2f2f2 55%, #ebebeb 100%) !important;
          border-top: 1px solid rgba(212, 206, 196, 0.46) !important;
          border-bottom: 1px solid rgba(212, 206, 196, 0.46) !important;
        }

        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50 .text-gray-900 {
          color: #0d0d0d !important;
        }

        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50 .text-gray-600 {
          color: #706f6e !important;
        }

        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50 button {
          background-image: linear-gradient(100deg, var(--brand-accent), var(--brand-accent-strong)) !important;
          color: #fcf2f2 !important;
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.52) !important;
        }

        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50 button svg {
          display: none !important;
        }

        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50 button {
          font-size: 0 !important;
        }

        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50 button::before {
          content: "Book a Demo";
          font-size: 1rem;
          line-height: 1;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child {
          background: linear-gradient(160deg, #f9f9f9 0%, #f2f2f2 58%, #ebebeb 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.08) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .text-gray-900,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .text-gray-600,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .text-emerald-700,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .text-emerald-600,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .text-violet-600,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .text-pink-600 {
          color: #0d0d0d !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .bg-emerald-50,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .bg-violet-50,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] + section .grid.lg\\:grid-cols-2 > div:last-child .bg-pink-50 {
          background: rgba(249, 249, 249, 0.82) !important;
          border-color: rgba(212, 206, 196, 0.5) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] {
          background: linear-gradient(180deg, #f9f9f9 0%, #f2f2f2 52%, #ebebeb 100%) !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .bg-purple-100 {
          background-color: rgba(var(--brand-accent-soft-rgb), 0.24) !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.42) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .text-purple-700 {
          color: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .bg-white {
          background-color: rgba(249, 249, 249, 0.86) !important;
          border: 1px solid rgba(212, 206, 196, 0.58) !important;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .text-gray-900 {
          color: #0d0d0d !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .text-gray-600 {
          color: #706f6e !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div {
          background: rgba(249, 249, 249, 0.86) !important;
          border: 1px solid rgba(212, 206, 196, 0.58) !important;
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08) !important;
          border-radius: 1.5rem !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div:nth-child(1) {
          background: linear-gradient(160deg, #f9f9f9 0%, #f2f2f2 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div:nth-child(2) {
          background: linear-gradient(160deg, #f9f9f9 0%, #ebebeb 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div:nth-child(3) {
          background: linear-gradient(160deg, #f2f2f2 0%, #ebebeb 100%) !important;
          border-color: rgba(212, 206, 196, 0.58) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div .w-16.h-16 {
          background: var(--brand-accent) !important;
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.62) !important;
        }

        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"] .grid.md\\:grid-cols-3 > div svg {
          color: #fcf2f2 !important;
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

        .brand-preview-shell section[class*="via-violet-950"] .flex.flex-col.sm\\:flex-row.items-center.justify-center.gap-4 > button {
          background-image: linear-gradient(100deg, var(--brand-accent), var(--brand-accent-strong)) !important;
          color: #fcf2f2 !important;
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.52) !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] .flex.flex-col.sm\\:flex-row.items-center.justify-center.gap-4 > a[href="/demo"] button {
          background-color: transparent !important;
          border: 1px solid rgba(26, 26, 26, 0.24) !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] .flex.flex-col.sm\\:flex-row.items-center.justify-center.gap-4 > a[href="/demo"] button:hover {
          background-color: rgba(26, 26, 26, 0.05) !important;
          color: #0d0d0d !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] .flex.flex-col.sm\\:flex-row.items-center.justify-center.gap-4 > a[href="/demo"] button svg {
          color: #1a1a1a !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] {
          background: linear-gradient(180deg, #f9f9f9 0%, #f2f2f2 52%, #ebebeb 100%) !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] h1,
        .brand-preview-shell section[class*="via-violet-950"] h2,
        .brand-preview-shell section[class*="via-violet-950"] h3,
        .brand-preview-shell section[class*="via-violet-950"] .text-white {
          color: #0d0d0d !important;
          -webkit-text-fill-color: #0d0d0d !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] .text-gray-300,
        .brand-preview-shell section[class*="via-violet-950"] .text-gray-400 {
          color: #706f6e !important;
        }

        .brand-preview-shell section[class*="via-violet-950"] .bg-pink-500\\/20,
        .brand-preview-shell section[class*="via-violet-950"] .bg-violet-500\\/20 {
          background-color: rgba(var(--brand-accent-soft-rgb), 0.26) !important;
        }

        .brand-preview-shell #why,
        .brand-preview-shell #features + section,
        .brand-preview-shell #faq,
        .brand-preview-shell section.bg-gray-50,
        .brand-preview-shell section.py-16.px-4.sm\\:px-6.lg\\:px-8.bg-gray-50,
        .brand-preview-shell section[class*="from-purple-50"][class*="via-pink-50"][class*="to-violet-50"],
        .brand-preview-shell section[class*="via-violet-950"] {
          background: transparent !important;
          background-image: none !important;
          border-top: none !important;
          border-bottom: none !important;
        }

        .brand-preview-shell #why .bg-pink-100.text-pink-700.mb-4.px-4.py-1 {
          background: linear-gradient(100deg, var(--brand-accent), var(--brand-accent-strong)) !important;
          color: #fcf2f2 !important;
          -webkit-text-fill-color: #fcf2f2 !important;
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.56) !important;
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
          color: #f9f9f9 !important;
        }

        .brand-preview-shell .bg-violet-100,
        .brand-preview-shell .bg-pink-100,
        .brand-preview-shell .bg-blue-100,
        .brand-preview-shell .bg-emerald-100,
        .brand-preview-shell .bg-amber-100 {
          background-color: rgba(var(--brand-accent-soft-rgb), 0.28) !important;
          color: #1a1a1a !important;
          border-color: rgba(var(--brand-accent-rgb), 0.48) !important;
        }

        .brand-preview-shell [class*="bg-emerald-100"][class*="text-emerald-700"][class*="mb-4"][class*="px-4"][class*="py-1"],
        .brand-preview-shell [class*="bg-violet-100"][class*="text-violet-700"][class*="mb-4"][class*="px-4"][class*="py-1"],
        .brand-preview-shell [class*="bg-pink-100"][class*="text-pink-700"][class*="mb-4"][class*="px-4"][class*="py-1"],
        .brand-preview-shell [class*="bg-purple-100"][class*="text-purple-700"][class*="mb-4"][class*="px-4"][class*="py-1"] {
          background: linear-gradient(100deg, var(--brand-accent), var(--brand-accent-strong)) !important;
          color: #fcf2f2 !important;
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.56) !important;
        }

        .brand-preview-shell .w-6.h-6.rounded-full.bg-emerald-100,
        .brand-preview-shell .w-6.h-6.rounded-full.bg-violet-100 {
          background-color: var(--brand-accent) !important;
          border: 1px solid rgba(var(--brand-accent-soft-rgb), 0.6) !important;
        }

        .brand-preview-shell .w-6.h-6.rounded-full.bg-emerald-100 .w-4.h-4,
        .brand-preview-shell .w-6.h-6.rounded-full.bg-violet-100 .w-4.h-4 {
          color: #fcf2f2 !important;
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
          --tw-gradient-from: var(--brand-accent) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(var(--brand-accent-rgb), 0)) !important;
        }

        .brand-preview-shell .to-violet-600,
        .brand-preview-shell .to-violet-700,
        .brand-preview-shell .to-purple-600,
        .brand-preview-shell .to-rose-500,
        .brand-preview-shell .to-orange-500,
        .brand-preview-shell .to-pink-500,
        .brand-preview-shell .to-violet-500 {
          --tw-gradient-to: var(--brand-accent-strong) !important;
        }

        .brand-preview-shell .from-pink-50,
        .brand-preview-shell .from-violet-50,
        .brand-preview-shell .from-amber-50,
        .brand-preview-shell .from-emerald-50,
        .brand-preview-shell .from-blue-50,
        .brand-preview-shell .from-purple-50 {
          --tw-gradient-from: #ebebeb !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(235, 235, 235, 0)) !important;
        }

        .brand-preview-shell .to-white {
          --tw-gradient-to: #f2f2f2 !important;
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
          --tw-gradient-from: rgba(212, 206, 196, 0.34) !important;
          --tw-gradient-stops: var(--tw-gradient-from), rgba(242, 242, 242, 0.18), var(--tw-gradient-to, transparent) !important;
        }

        .brand-preview-shell .bg-pink-500\\/20,
        .brand-preview-shell .bg-violet-500\\/20 {
          background-color: rgba(212, 206, 196, 0.18) !important;
        }

        .brand-preview-shell section:first-of-type .w-5.h-5.rounded-full.bg-emerald-100 {
          background-color: rgba(var(--brand-accent-soft-rgb), 0.36) !important;
          border: 1px solid rgba(var(--brand-accent-rgb), 0.5) !important;
        }

        .brand-preview-shell section:first-of-type .w-5.h-5.rounded-full.bg-emerald-100 .text-emerald-600 {
          color: var(--brand-accent-strong) !important;
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
          color: #f9f9f9 !important;
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
          background-color: rgba(249, 249, 249, 0.08) !important;
        }

        .brand-preview-shell .bg-white\\/20 {
          background-color: rgba(249, 249, 249, 0.18) !important;
        }

        .brand-preview-shell .hover\\:bg-white\\/30:hover {
          background-color: rgba(249, 249, 249, 0.24) !important;
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
          color: rgba(249, 249, 249, 0.72) !important;
        }

        .brand-preview-shell footer .border-gray-800 {
          border-color: rgba(249, 249, 249, 0.16) !important;
        }

        .brand-preview-shell footer button {
          background-color: var(--brand-cream) !important;
          background-image: none !important;
          color: var(--brand-ink) !important;
          border: 1px solid rgba(249, 249, 249, 0.8) !important;
        }

        .brand-preview-shell footer button,
        .brand-preview-shell footer button * {
          color: #1a1a1a !important;
          -webkit-text-fill-color: #1a1a1a !important;
        }

        .brand-preview-shell footer button:hover {
          background-color: #f0f0f0 !important;
          color: #0d0d0d !important;
        }

        .brand-preview-shell footer button:hover,
        .brand-preview-shell footer button:hover * {
          color: #0d0d0d !important;
          -webkit-text-fill-color: #0d0d0d !important;
        }

        .brand-preview-shell .fixed.inset-0.z-\\[100\\] .relative.bg-white.rounded-2xl .bg-gradient-to-r.from-pink-500.to-violet-600 {
          background: linear-gradient(140deg, #121212 0%, #1a1a1a 60%, #0f0f0f 100%) !important;
          color: #f9f9f9 !important;
        }

        .brand-preview-shell .fixed.inset-0.z-\\[100\\] .relative.bg-white.rounded-2xl .bg-gradient-to-r.from-pink-500.to-violet-600 h3,
        .brand-preview-shell .fixed.inset-0.z-\\[100\\] .relative.bg-white.rounded-2xl .bg-gradient-to-r.from-pink-500.to-violet-600 p {
          color: #f9f9f9 !important;
          -webkit-text-fill-color: #f9f9f9 !important;
        }

        .brand-preview-shell input,
        .brand-preview-shell textarea {
          background: rgba(249, 249, 249, 0.95) !important;
          border-color: rgba(212, 206, 196, 0.8) !important;
          color: #1a1a1a !important;
        }

        .brand-preview-shell input::placeholder,
        .brand-preview-shell textarea::placeholder {
          color: #706f6e !important;
        }

        .brand-preview-shell svg {
          color: currentColor;
        }
      `}</style>
      <MarketingHomePage />
    </div>
  )
}
