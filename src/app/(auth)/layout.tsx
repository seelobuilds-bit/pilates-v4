export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="app-ui-scope min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--brand-bg)" }}
    >
      {children}
    </div>
  )
}
