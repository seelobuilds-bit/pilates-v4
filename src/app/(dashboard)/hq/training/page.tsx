"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Loader2,
  BookOpen,
  Video,
  FileText,
  Award,
  Calendar,
  Users,
  Edit,
  Trash2,
  GripVertical,
  Clock,
  MapPin,
  Link as LinkIcon,
  Lightbulb
} from "lucide-react"

interface Homework {
  id: string
  title: string
  description: string
  requirements: string
  points: number
  dueInDays: number | null
}

interface Module {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  isLive: boolean
  liveDate: string | null
  liveUrl: string | null
  isInPerson: boolean
  eventLocation: string | null
  eventAddress: string | null
  maxAttendees: number | null
  resources: string | null
  order: number
  homework: Homework[]
  _count: {
    progress: number
    registrations: number
  }
}

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  order: number
  modules: Module[]
}

interface ContentIdea {
  id: string
  title: string
  description: string | null
  category: string
  exampleScript: string | null
  exampleVideoUrl: string | null
  weekOf: string
}

export default function HQTrainingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [activeTab, setActiveTab] = useState("courses")
  
  // Modals
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddModule, setShowAddModule] = useState<string | null>(null) // categoryId
  const [showAddHomework, setShowAddHomework] = useState<string | null>(null) // moduleId
  const [showAddIdea, setShowAddIdea] = useState(false)
  
  // Forms
  const [newCategory, setNewCategory] = useState({ name: "", description: "", icon: "BookOpen" })
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
    isLive: false,
    liveDate: "",
    liveUrl: "",
    isInPerson: false,
    eventLocation: "",
    eventAddress: "",
    maxAttendees: ""
  })
  const [newHomework, setNewHomework] = useState({
    title: "",
    description: "",
    requirements: "",
    points: "10",
    dueInDays: ""
  })
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    category: "",
    exampleScript: "",
    weekOf: ""
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/social-media/admin/training")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setContentIdeas(data.contentIdeas || [])
      }
    } catch (error) {
      console.error("Failed to fetch training data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createCategory = async () => {
    if (!newCategory.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", ...newCategory, order: categories.length })
      })
      if (res.ok) {
        setShowAddCategory(false)
        setNewCategory({ name: "", description: "", icon: "BookOpen" })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create category:", error)
    } finally {
      setSaving(false)
    }
  }

  const createModule = async () => {
    if (!showAddModule || !newModule.title.trim()) return
    setSaving(true)
    try {
      const category = categories.find(c => c.id === showAddModule)
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "module",
          categoryId: showAddModule,
          ...newModule,
          duration: newModule.duration ? parseInt(newModule.duration) : null,
          maxAttendees: newModule.maxAttendees ? parseInt(newModule.maxAttendees) : null,
          order: category?.modules.length || 0
        })
      })
      if (res.ok) {
        setShowAddModule(null)
        setNewModule({
          title: "", description: "", videoUrl: "", duration: "",
          isLive: false, liveDate: "", liveUrl: "",
          isInPerson: false, eventLocation: "", eventAddress: "", maxAttendees: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create module:", error)
    } finally {
      setSaving(false)
    }
  }

  const createHomework = async () => {
    if (!showAddHomework || !newHomework.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "homework",
          moduleId: showAddHomework,
          title: newHomework.title,
          description: newHomework.description,
          requirements: newHomework.requirements.split("\n").filter(r => r.trim()),
          points: parseInt(newHomework.points) || 10,
          dueInDays: newHomework.dueInDays ? parseInt(newHomework.dueInDays) : null
        })
      })
      if (res.ok) {
        setShowAddHomework(null)
        setNewHomework({ title: "", description: "", requirements: "", points: "10", dueInDays: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create homework:", error)
    } finally {
      setSaving(false)
    }
  }

  const createIdea = async () => {
    if (!newIdea.title.trim() || !newIdea.weekOf) return
    setSaving(true)
    try {
      const res = await fetch("/api/social-media/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "content_idea", ...newIdea })
      })
      if (res.ok) {
        setShowAddIdea(false)
        setNewIdea({ title: "", description: "", category: "", exampleScript: "", weekOf: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to create idea:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media Training</h1>
          <p className="text-gray-500 mt-1">Manage training courses and content ideas for teachers</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Training Courses
          </TabsTrigger>
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Content Ideas
          </TabsTrigger>
        </TabsList>

        {/* Training Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddCategory(true)} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Training Courses Yet</h3>
                <p className="text-gray-500 mb-4">Create categories and modules to build your training curriculum.</p>
                <Button onClick={() => setShowAddCategory(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {categories.map(category => (
                <Card key={category.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          {category.description && (
                            <p className="text-sm text-gray-500">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAddModule(category.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Module
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.modules.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No modules yet. Add your first training module.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {category.modules.map(module => (
                          <div 
                            key={module.id} 
                            className="p-4 bg-gray-50 rounded-lg flex items-start justify-between"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                {module.isLive ? (
                                  <Calendar className="h-4 w-4 text-red-500" />
                                ) : module.isInPerson ? (
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Video className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{module.title}</h4>
                                {module.description && (
                                  <p className="text-sm text-gray-500 mt-0.5">{module.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  {module.duration && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {module.duration} min
                                    </span>
                                  )}
                                  {module.isLive && (
                                    <Badge className="bg-red-100 text-red-700 text-xs">Live Event</Badge>
                                  )}
                                  {module.isInPerson && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">In-Person</Badge>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {module._count.progress} completions • {module._count.registrations} registrations
                                  </span>
                                </div>
                                {module.homework.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-xs text-violet-600 flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      {module.homework.length} homework assignment{module.homework.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAddHomework(module.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Homework
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Content Ideas Tab */}
        <TabsContent value="ideas" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddIdea(true)} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Content Idea
            </Button>
          </div>

          {contentIdeas.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Content Ideas Yet</h3>
                <p className="text-gray-500 mb-4">Create weekly content ideas to inspire teachers.</p>
                <Button onClick={() => setShowAddIdea(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Idea
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {contentIdeas.map(idea => (
                <Card key={idea.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{idea.category}</Badge>
                      <span className="text-xs text-gray-400">
                        Week of {new Date(idea.weekOf).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">{idea.title}</h4>
                    {idea.description && (
                      <p className="text-sm text-gray-500 mt-1">{idea.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Category Modal */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Training Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Instagram Basics"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="What teachers will learn..."
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
            <Button onClick={createCategory} disabled={saving || !newCategory.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Module Modal */}
      <Dialog open={!!showAddModule} onOpenChange={(open) => !open && setShowAddModule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Training Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div>
              <Label>Title *</Label>
              <Input
                value={newModule.title}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                placeholder="e.g., Creating Your First Reel"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newModule.description}
                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                placeholder="What this module covers..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Video URL</Label>
                <Input
                  value={newModule.videoUrl}
                  onChange={(e) => setNewModule({ ...newModule, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={newModule.duration}
                  onChange={(e) => setNewModule({ ...newModule, duration: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newModule.isLive}
                  onCheckedChange={(checked) => setNewModule({ ...newModule, isLive: checked })}
                />
                <Label>Live Event</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newModule.isInPerson}
                  onCheckedChange={(checked) => setNewModule({ ...newModule, isInPerson: checked })}
                />
                <Label>In-Person</Label>
              </div>
            </div>
            {newModule.isLive && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Live Date</Label>
                  <Input
                    type="datetime-local"
                    value={newModule.liveDate}
                    onChange={(e) => setNewModule({ ...newModule, liveDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Live URL</Label>
                  <Input
                    value={newModule.liveUrl}
                    onChange={(e) => setNewModule({ ...newModule, liveUrl: e.target.value })}
                    placeholder="Zoom/Meet link"
                  />
                </div>
              </div>
            )}
            {newModule.isInPerson && (
              <>
                <div>
                  <Label>Event Location</Label>
                  <Input
                    value={newModule.eventLocation}
                    onChange={(e) => setNewModule({ ...newModule, eventLocation: e.target.value })}
                    placeholder="Venue name"
                  />
                </div>
                <div>
                  <Label>Event Address</Label>
                  <Input
                    value={newModule.eventAddress}
                    onChange={(e) => setNewModule({ ...newModule, eventAddress: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
                <div>
                  <Label>Max Attendees</Label>
                  <Input
                    type="number"
                    value={newModule.maxAttendees}
                    onChange={(e) => setNewModule({ ...newModule, maxAttendees: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddModule(null)}>Cancel</Button>
            <Button onClick={createModule} disabled={saving || !newModule.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Module
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Homework Modal */}
      <Dialog open={!!showAddHomework} onOpenChange={(open) => !open && setShowAddHomework(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Homework Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newHomework.title}
                onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                placeholder="e.g., Create Your First Reel"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newHomework.description}
                onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                placeholder="What they need to do..."
                rows={2}
              />
            </div>
            <div>
              <Label>Requirements (one per line)</Label>
              <Textarea
                value={newHomework.requirements}
                onChange={(e) => setNewHomework({ ...newHomework, requirements: e.target.value })}
                placeholder="Must be at least 15 seconds&#10;Include studio branding&#10;Use trending audio"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={newHomework.points}
                  onChange={(e) => setNewHomework({ ...newHomework, points: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Due In (days)</Label>
                <Input
                  type="number"
                  value={newHomework.dueInDays}
                  onChange={(e) => setNewHomework({ ...newHomework, dueInDays: e.target.value })}
                  placeholder="7"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddHomework(null)}>Cancel</Button>
            <Button onClick={createHomework} disabled={saving || !newHomework.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Homework
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Content Idea Modal */}
      <Dialog open={showAddIdea} onOpenChange={setShowAddIdea}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                placeholder="e.g., Behind the Scenes Studio Tour"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newIdea.category} onValueChange={(v) => setNewIdea({ ...newIdea, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reel">Reel</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
                  <SelectItem value="Post">Post</SelectItem>
                  <SelectItem value="Carousel">Carousel</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Week Of *</Label>
              <Input
                type="date"
                value={newIdea.weekOf}
                onChange={(e) => setNewIdea({ ...newIdea, weekOf: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                placeholder="What the content should include..."
                rows={2}
              />
            </div>
            <div>
              <Label>Example Script</Label>
              <Textarea
                value={newIdea.exampleScript}
                onChange={(e) => setNewIdea({ ...newIdea, exampleScript: e.target.value })}
                placeholder="Sample script or talking points..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddIdea(false)}>Cancel</Button>
            <Button onClick={createIdea} disabled={saving || !newIdea.title.trim() || !newIdea.weekOf}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Idea
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
