import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Inbox,
  MessageSquare,
  Mail,
  Phone,
  Search,
  Send,
  Users,
  Clock
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoInboxPage() {
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  // Get some clients for the conversation list
  const clients = await db.client.findMany({
    where: { studioId: studio.id },
    take: 10,
    orderBy: { createdAt: "desc" }
  })

  // Mock conversations
  const conversations = clients.slice(0, 5).map((client, i) => ({
    id: client.id,
    client,
    lastMessage: i === 0 ? "Thanks for the class today!" : 
                 i === 1 ? "Can I reschedule my session?" :
                 i === 2 ? "What time does the studio open?" :
                 i === 3 ? "Great class yesterday!" : "Hi there!",
    unread: i < 2,
    timestamp: new Date(Date.now() - i * 3600000)
  }))

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-gray-500 mt-1">Manage client communications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search conversations..." className="pl-9" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="space-y-3">
            <TabsList className="bg-white border w-full justify-start">
              <TabsTrigger value="all" className="flex-1">
                All
                <Badge className="ml-2 bg-violet-100 text-violet-700">{conversations.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread
                <Badge className="ml-2 bg-red-100 text-red-700">
                  {conversations.filter(c => c.unread).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="m-0">
              <div className="space-y-2">
                {conversations.map((conv, i) => (
                  <Card 
                    key={conv.id} 
                    className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                      i === 0 ? 'ring-2 ring-violet-500' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-medium text-violet-600 text-sm">
                            {conv.client.firstName[0]}{conv.client.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 truncate">
                              {conv.client.firstName} {conv.client.lastName}
                            </p>
                            <span className="text-xs text-gray-400">
                              {conv.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-sm truncate mt-0.5 ${
                            conv.unread ? 'font-medium text-gray-900' : 'text-gray-500'
                          }`}>
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unread && (
                          <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <div className="space-y-2">
                {conversations.filter(c => c.unread).map((conv, i) => (
                  <Card 
                    key={conv.id} 
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-medium text-violet-600 text-sm">
                            {conv.client.firstName[0]}{conv.client.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 truncate">
                              {conv.client.firstName} {conv.client.lastName}
                            </p>
                            <span className="text-xs text-gray-400">
                              {conv.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                            {conv.lastMessage}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Conversation View */}
        <Card className="border-0 shadow-sm lg:col-span-2 flex flex-col">
          <CardContent className="p-0 flex-1 flex flex-col">
            {/* Chat Header */}
            {conversations[0] && (
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-violet-600">
                      {conversations[0].client.firstName[0]}{conversations[0].client.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {conversations[0].client.firstName} {conversations[0].client.lastName}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {conversations[0].client.email}
                      {conversations[0].client.phone && (
                        <>
                          <span className="text-gray-300">•</span>
                          <Phone className="h-3 w-3" />
                          {conversations[0].client.phone}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Sample messages */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-violet-600">
                      {conversations[0]?.client.firstName[0]}{conversations[0]?.client.lastName[0]}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-lg rounded-tl-none p-3 max-w-md">
                    <p className="text-sm text-gray-900">Thanks for the class today! It was amazing.</p>
                    <p className="text-xs text-gray-400 mt-1">10:30 AM</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-violet-600 text-white rounded-lg rounded-tr-none p-3 max-w-md">
                    <p className="text-sm">Thank you! So glad you enjoyed it. See you next week!</p>
                    <p className="text-xs text-violet-200 mt-1">10:32 AM</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-violet-600">
                      {conversations[0]?.client.firstName[0]}{conversations[0]?.client.lastName[0]}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-lg rounded-tl-none p-3 max-w-md">
                    <p className="text-sm text-gray-900">Can I book a private session for Friday?</p>
                    <p className="text-xs text-gray-400 mt-1">10:45 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type your message..." 
                  className="flex-1"
                />
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




