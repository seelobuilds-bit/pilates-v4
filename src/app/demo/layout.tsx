import DemoLayoutClient from "./layout-client"

export const dynamic = "force-dynamic"

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DemoLayoutClient>{children}</DemoLayoutClient>
}
