// Demo Locations Page - Mirrors /studio/locations/page.tsx
// Keep in sync with the real locations page

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Calendar } from "lucide-react"
import { demoLocations } from "../_data/demo-data"

export default function DemoLocationsPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500 mt-1">Manage your studio locations</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoLocations.map((location) => (
          <Card key={location.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{location.address}</p>
                  </div>
                </div>
                <Badge className={location.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                  {location.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Classes this month
                  </span>
                  <span className="font-medium text-gray-900">{location._count.classSessions}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/demo/locations/${location.id}`}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Manage Location
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
