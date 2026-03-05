export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-ui-scope min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f2ed] to-[#ebebe4]">
      {children}
    </div>
  )
}

