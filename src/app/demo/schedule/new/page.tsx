import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DemoNewSchedulePage() {
  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
      <Card className="max-w-2xl mx-auto border-amber-200 bg-amber-50">
        <CardContent className="p-6 sm:p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Demo mode: read-only</h1>
          <p className="text-gray-700">
            Creating new classes is disabled in the demo environment. You can still browse the existing schedule.
          </p>
          <Link href="/demo/schedule" className="inline-block">
            <Button className="bg-violet-600 hover:bg-violet-700">Back to Demo Schedule</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
