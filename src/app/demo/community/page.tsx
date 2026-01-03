"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare,
  Users,
  Crown,
  Send,
  Image,
  Smile,
  MoreVertical,
  Pin,
  Star
} from "lucide-react"

const demoChats = [
  {
    id: "1",
    name: "At-Home Community",
    description: "For clients with at-home subscriptions",
    memberCount: 156,
    lastMessage: "Great class today! Loved the reformer sequence.",
    lastMessageTime: "2 min ago",
    unreadCount: 3,
    isEnabled: true,
  },
  {
    id: "2", 
    name: "Teachers Community",
    description: "Private space for certified teachers",
    memberCount: 24,
    lastMessage: "Workshop reminder: Saturday 10am",
    lastMessageTime: "1 hour ago",
    unreadCount: 0,
    isEnabled: true,
  },
  {
    id: "3",
    name: "VIP Members",
    description: "Exclusive content and discussions",
    memberCount: 42,
    lastMessage: "New advanced series dropping next week!",
    lastMessageTime: "3 hours ago",
    unreadCount: 1,
    isEnabled: true,
  }
]

const demoMessages = [
  { id: "1", author: "Sarah Chen", avatar: "SC", content: "Just finished the new reformer flow - absolutely loved it! 🔥", time: "10:32 AM", isPinned: false },
  { id: "2", author: "Mike Johnson", avatar: "MJ", content: "Can anyone recommend a good props sequence for beginners?", time: "10:28 AM", isPinned: false },
  { id: "3", author: "Studio Admin", avatar: "SA", content: "📢 Reminder: New workshop this Saturday at 10am. Sign up in the app!", time: "9:45 AM", isPinned: true, isAdmin: true },
  { id: "4", author: "Emily Davis", avatar: "ED", content: "The side-lying series from yesterday was challenging but so good!", time: "9:30 AM", isPinned: false },
  { id: "5", author: "Lisa Park", avatar: "LP", content: "Thanks for the modification tips in class today 🙏", time: "9:15 AM", isPinned: false },
]

export default function DemoCommunityPage() {
  const [selectedChat, setSelectedChat] = useState(demoChats[0])
  const [message, setMessage] = useState("")

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">Manage your subscription community chats</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          Create Chat
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Chats</p>
                <p className="text-2xl font-bold">{demoChats.length}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold">222</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Messages Today</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Community Chats</h3>
            <div className="space-y-2">
              {demoChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedChat.id === chat.id 
                      ? "bg-violet-50 border-2 border-violet-200" 
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                        <Crown className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{chat.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{chat.lastMessage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{chat.lastMessageTime}</p>
                      {chat.unreadCount > 0 && (
                        <Badge className="mt-1 bg-violet-600">{chat.unreadCount}</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <Crown className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium">{selectedChat.name}</p>
                  <p className="text-xs text-gray-500">{selectedChat.memberCount} members</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {demoMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isPinned ? "bg-amber-50 -mx-4 px-4 py-2 border-l-4 border-amber-400" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    msg.isAdmin ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {msg.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{msg.author}</span>
                      {msg.isAdmin && <Badge className="text-xs bg-violet-100 text-violet-700">Admin</Badge>}
                      {msg.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input 
                  placeholder="Type a message..." 
                  className="flex-1"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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
