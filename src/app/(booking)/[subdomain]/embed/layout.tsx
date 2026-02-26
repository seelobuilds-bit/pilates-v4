export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-transparent" style={{ minHeight: "100vh", overflow: "visible" }}>
      {children}
    </div>
  )
}
