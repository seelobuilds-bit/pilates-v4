import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare,
  Users,
  Send,
  Settings,
  Plus
} from "lucide-react"

const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoCommunityPage() {
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

  // Get community chats
  const communityChats = await db.vaultSubscriptionChat.findMany({
    where: { 
      plan: { studioId: studio.id }
    },
    include: {
      plan: true,
      _count: { select: { members: true, messages: true } }
    }
  })

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">Manage subscription community chats</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List Sidebar */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Communities</h3>
          
          {communityChats.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No communities yet</p>
                <p className="text-xs text-gray-400 mt-1">Create a subscription plan with community access</p>
              </CardContent>
            </Card>
          ) : (
            communityChats.map(chat => (
              <Card 
                key={chat.id}
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {chat.plan.name}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {chat._count.members} members
                      </p>
                    </div>
                    {!chat.isEnabled && (
                      <Badge variant="secondary" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Default Community Groups */}
          {communityChats.length === 0 && (
            <>
              <p className="text-xs text-gray-400 mt-4">Example communities:</p>
              {[
                { name: "Studio Owners", members: 12, icon: "🏢" },
                { name: "Teachers", members: 45, icon: "🎓" },
                { name: "At-Home Members", members: 156, icon: "🏠" }
              ].map((group, i) => (
                <Card key={i} className="border-0 shadow-sm opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                        {group.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{group.name}</h4>
                        <p className="text-xs text-gray-500">{group.members} members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm h-full flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Community Chat</h3>
                    <p className="text-sm text-gray-500">Select a community to view messages</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                  <h4 className="font-medium text-gray-900 mb-1">Select a Community</h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Choose a community from the left to view and manage the chat. 
                    Members can share updates, ask questions, and support each other.
                  </p>
                </div>
              </div>

              {/* Chat Input */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    className="flex-1"
                    disabled
                  />
                  <Button className="bg-violet-600 hover:bg-violet-700" disabled>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


