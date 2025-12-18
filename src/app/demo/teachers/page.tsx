// Demo Teachers Page - Mirrors /studio/teachers/page.tsx
// Keep in sync with the real teachers page

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, Calendar } from "lucide-react"
import { demoTeachers } from "../_data/demo-data"

export default function DemoTeachersPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1">Manage your teaching staff</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Invite Teacher
        </Button>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoTeachers.map((teacher) => (
          <Card key={teacher.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center text-lg font-semibold text-violet-700">
                  {teacher.user.firstName[0]}{teacher.user.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {teacher.user.firstName} {teacher.user.lastName}
                    </h3>
                    <Badge className={teacher.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                      {teacher.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {teacher.user.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Classes scheduled
                  </span>
                  <span className="font-medium text-gray-900">{teacher._count.classSessions}</span>
                </div>
              </div>

              {teacher.specialties && teacher.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {teacher.specialties.map((specialty, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/demo/teachers/${teacher.id}`}>
                  <Button variant="ghost" size="sm" className="w-full">View Profile</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
