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
          margin: 0 !important;
          padding: 0 !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none !important;
        }
        #__next,
        [data-nextjs-scroll-focus-boundary] {
          background: transparent !important;
        }
      `}</style>
      <div className="bg-transparent" style={{ overflow: "hidden" }}>
        {children}
      </div>
    </>
  )
}
