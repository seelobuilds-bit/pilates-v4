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
          overflow-x: hidden !important;
          overflow-y: auto !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        #__next,
        [data-nextjs-scroll-focus-boundary] {
          background: transparent !important;
        }
      `}</style>
      <div className="bg-transparent" style={{ overflowX: "hidden", overflowY: "visible" }}>
        {children}
      </div>
    </>
  )
}
