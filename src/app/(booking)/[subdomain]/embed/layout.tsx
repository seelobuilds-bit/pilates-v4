export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style>{`
        html,
        body {
          background: transparent !important;
          overflow: hidden !important;
        }
      `}</style>
      <div className="bg-transparent" style={{ overflow: "visible" }}>
        {children}
      </div>
    </>
  )
}
