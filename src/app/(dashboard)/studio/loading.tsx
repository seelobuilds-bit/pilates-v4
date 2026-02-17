export default function StudioLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
      </div>
    </div>
  )
}
