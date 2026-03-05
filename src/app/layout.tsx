import type { Metadata } from "next"
import { DM_Sans, Instrument_Serif } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-body",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "CURRENT - Studio Management",
  description: "Complete studio management platform for Pilates, Yoga, and Fitness studios",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${instrumentSerif.variable} app-brand-scope`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
