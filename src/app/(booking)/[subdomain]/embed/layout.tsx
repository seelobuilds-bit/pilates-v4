export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white min-h-screen" style={{ minHeight: '100vh', overflow: 'auto' }}>
      {children}
    </div>
  )
}
