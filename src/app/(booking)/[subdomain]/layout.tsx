import { Providers } from "@/components/providers"
import { db } from "@/lib/db"
import { buildStudioBrandCssVariables } from "@/lib/brand-color"
import type { CSSProperties } from "react"

export default async function BookingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const studio = await db.studio.findFirst({
    where: {
      subdomain: {
        equals: subdomain,
        mode: "insensitive",
      },
    },
    select: { primaryColor: true },
  })

  const brandVariables = buildStudioBrandCssVariables(studio?.primaryColor) as CSSProperties

  return (
    <div className="studio-brand-scope" style={brandVariables}>
      <Providers>
        {children}
      </Providers>
    </div>
  )
}
