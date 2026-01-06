"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play, 
  FileText, 
  Video, 
  BookOpen,
  Plus,
  Eye,
  Users,
  CheckCircle,
  Clock,
  Star,
  GraduationCap,
  ChevronRight,
  Award,
  TrendingUp,
  File
} from "lucide-react"

const demoCategories = [
  {
    id: "1",
    name: "Reformer Fundamentals",
    description: "Essential Reformer techniques and exercises",
    icon: "💪",
    color: "#7c3aed",
    isActive: true,
    _count: { contents: 8 },
    contents: [
      { id: "c1", title: "Introduction to Reformer", type: "VIDEO", difficulty: "BEGINNER", duration: 15, isPublished: true, isFeatured: true },
      { id: "c2", title: "Footwork Series", type: "VIDEO", difficulty: "BEGINNER", duration: 20, isPublished: true, isFeatured: false },
      { id: "c3", title: "Hundred on Reformer", type: "VIDEO", difficulty: "INTERMEDIATE", duration: 12, isPublished: true, isFeatured: false },
    ]
  },
  {
    id: "2",
    name: "Mat Work Essentials",
    description: "Core mat-based Pilates exercises",
    icon: "🧘",
    color: "#ec4899",
    isActive: true,
    _count: { contents: 12 },
    contents: [
      { id: "c4", title: "The Classical Order", type: "PDF", difficulty: "BEGINNER", duration: null, isPublished: true, isFeatured: true },
      { id: "c5", title: "Roll Up Mastery", type: "VIDEO", difficulty: "INTERMEDIATE", duration: 18, isPublished: true, isFeatured: false },
    ]
  },
  {
    id: "3",
    name: "Advanced Techniques",
    description: "Challenge yourself with advanced flows",
    icon: "🔥",
    color: "#f59e0b",
    isActive: true,
    _count: { contents: 6 },
    contents: [
      { id: "c6", title: "Control Balance", type: "VIDEO", difficulty: "ADVANCED", duration: 25, isPublished: true, isFeatured: false },
      { id: "c7", title: "Star Variations", type: "VIDEO", difficulty: "EXPERT", duration: 30, isPublished: true, isFeatured: true },
    ]
  }
]

const demoTrainingRequests = [
  { id: "t1", title: "Reformer Advanced Workshop", status: "PENDING", attendeeCount: 8, contactName: "Sarah Chen", createdAt: new Date().toISOString() },
  { id: "t2", title: "Prenatal Pilates Certification", status: "APPROVED", attendeeCount: 5, contactName: "Mike Johnson", createdAt: new Date().toISOString() },
  { id: "t3", title: "Props Workshop", status: "SCHEDULED", attendeeCount: 12, contactName: "Emily Davis", createdAt: new Date().toISOString() },
]

export default function DemoClassFlowsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>(demoCategories[0].id)

  const stats = { totalViews: 1247, completedCount: 89, pendingTrainingRequests: 3 }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Flows</h1>
          <p className="text-gray-500 mt-1">Manage your training content and teacher development</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <GraduationCap className="h-4 w-4 mr-2" />
            Training Requests
            <Badge className="ml-2 bg-violet-100 text-violet-700">{stats.pendingTrainingRequests}</Badge>
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Categories</p>
                <p className="text-2xl font-bold">{demoCategories.length}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <BookOpen className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Content</p>
                <p className="text-2xl font-bold">26</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completions</p>
                <p className="text-2xl font-bold">{stats.completedCount}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Content Library</TabsTrigger>
          <TabsTrigger value="requests">Training Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories */}
            <Card className="lg:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Categories</h3>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {demoCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id 
                          ? "bg-violet-50 border-2 border-violet-200" 
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <p className="font-medium text-gray-900">{category.name}</p>
                            <p className="text-xs text-gray-500">{category._count.contents} items</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    {demoCategories.find(c => c.id === selectedCategory)?.name || "Select a category"}
                  </h3>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </div>
                <div className="space-y-3">
                  {demoCategories.find(c => c.id === selectedCategory)?.contents.map((content) => (
                    <div key={content.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${content.type === "VIDEO" ? "bg-blue-100" : "bg-amber-100"}`}>
                            {content.type === "VIDEO" ? (
                              <Video className={`h-5 w-5 ${content.type === "VIDEO" ? "text-blue-600" : "text-amber-600"}`} />
                            ) : (
                              <FileText className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{content.title}</p>
                              {content.isFeatured && (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {content.difficulty}
                              </Badge>
                              {content.duration && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {content.duration} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {demoTrainingRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-500">Requested by {request.contactName} • {request.attendeeCount} attendees</p>
                      </div>
                      <Badge className={
                        request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        "bg-blue-100 text-blue-800"
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}



