// Demo Locations Page - Mirrors /studio/locations/page.tsx
// Keep in sync with the real locations page

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin } from "lucide-react"
import { demoLocations } from "../_data/demo-data"

export default function DemoLocationsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Locations</h1>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoLocations.map((location) => (
          <Link key={location.id} href={`/demo/locations/${location.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {location.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{location.address}</p>
                  <p>{location.city}, {location.state} {location.zipCode}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span>{location._count.classSessions} classes</span>
                    <Badge className={location.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                      {location.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}














