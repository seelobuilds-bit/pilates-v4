// Demo Classes Page - Mirrors /studio/classes/page.tsx
// Keep in sync with the real classes page

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Users, DollarSign } from "lucide-react"
import { demoClassTypes } from "../_data/demo-data"

export default function DemoClassesPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Manage your class types and pricing</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Class Type
        </Button>
      </div>

      {/* Class Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoClassTypes.map((classType) => (
          <Card key={classType.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{classType.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{classType.description || "No description"}</p>
                </div>
                <Badge className={classType.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                  {classType.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{classType.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>Max {classType.capacity} students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>${classType.price} per class</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/demo/classes/${classType.id}`}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Edit Class Type
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











