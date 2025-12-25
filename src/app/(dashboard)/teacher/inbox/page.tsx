"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search,
  Send,
  RefreshCw,
  X,
  Loader2,
  Instagram,
  Plus,
  Edit3
} from "lucide-react"

interface SocialAccount {
  id: string
  platform: "INSTAGRAM" | "TIKTOK"
  username: string
}

interface SocialConversation {
  platformUserId: string
  platformUsername: string | null
  profilePicture: string | null
  lastMessage: {
    content: string
    createdAt: string
    direction: string
  }
  unreadCount: number
  account: SocialAccount | undefined
}

interface SocialMessage {
  id: string
  content: string
  direction: string
  createdAt: string
  isRead: boolean
}

export default function TeacherInboxPage() {
  const [loading, setLoading] = useState(true)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [socialConversations, setSocialConversations] = useState<SocialConversation[]>([])
  const [selectedConv, setSelectedConv] = useState<SocialConversation | null>(null)
  const [messages, setMessages] = useState<SocialMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Compose state
  const [composing, setComposing] = useState(false)
  const [composeUsername, setComposeUsername] = useState("")
  const [composeMessage, setComposeMessage] = useState("")
  const [composePlatform, setComposePlatform] = useState<"INSTAGRAM" | "TIKTOK">("INSTAGRAM")
  const [composeAccountId, setComposeAccountId] = useState("")
  
  // Platform filter
  const [platformFilter, setPlatformFilter] = useState<"all" | "INSTAGRAM" | "TIKTOK">("all")

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/social-media/messages')
      if (res.ok) {
        const data = await res.json()
        setSocialAccounts(data.accounts || [])
        setSocialConversations(data.conversations || [])
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
    }
    setLoading(false)
  }, [])

  const fetchMessages = async (accountId: string, platformUserId: string) => {
    try {
      const res = await fetch(`/api/social-media/messages?accountId=${accountId}&platformUserId=${platformUserId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        // Mark as read
        await fetch('/api/social-media/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId, platformUserId })
        })
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return
    
    setSending(true)
    try {
      const res = await fetch('/api/social-media/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedConv.account?.id,
          platformUserId: selectedConv.platformUserId,
          platformUsername: selectedConv.platformUsername,
          content: newMessage
        })
      })
      if (res.ok) {
        setNewMessage("")
        if (selectedConv.account?.id) {
          await fetchMessages(selectedConv.account.id, selectedConv.platformUserId)
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setSending(false)
    }
  }

  const handleStartCompose = () => {
    setComposing(true)
    setSelectedConv(null)
    setComposeUsername("")
    setComposeMessage("")
    // Set default account if available
    const defaultAccount = socialAccounts.find(a => a.platform === composePlatform) || socialAccounts[0]
    if (defaultAccount) {
      setComposeAccountId(defaultAccount.id)
      setComposePlatform(defaultAccount.platform)
    }
  }

  const handleSendNewMessage = async () => {
    if (!composeAccountId || !composeUsername.trim() || !composeMessage.trim()) return
    
    setSending(true)
    try {
      // Generate a platform user ID from username
      const platformUserId = `new_${composeUsername.replace('@', '')}_${Date.now()}`
      
      const res = await fetch('/api/social-media/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: composeAccountId,
          platformUserId,
          platformUsername: composeUsername.replace('@', ''),
          content: composeMessage
        })
      })
      if (res.ok) {
        await fetchConversations()
        setComposing(false)
        setComposeUsername("")
        setComposeMessage("")
      }
    } catch (err) {
      console.error("Failed to send new message:", err)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Filter conversations by search and platform
  const filteredConversations = socialConversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.platformUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = platformFilter === "all" || conv.account?.platform === platformFilter
    return matchesSearch && matchesPlatform
  })

  const totalUnread = socialConversations.reduce((sum, c) => sum + c.unreadCount, 0)

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Social Inbox</h1>
              {totalUnread > 0 && (
                <p className="text-sm text-gray-500">{totalUnread} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchConversations}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                onClick={handleStartCompose}
                disabled={socialAccounts.length === 0}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Compose
              </Button>
            </div>
          </div>

          {socialAccounts.length === 0 ? (
            <div className="p-3 bg-pink-50 rounded-lg text-sm text-pink-700">
              Connect your Instagram or TikTok in <a href="/teacher/social" className="underline font-medium">Social Media</a> to see DMs here.
            </div>
          ) : (
            /* Search & Filter */
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as typeof platformFilter)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="INSTAGRAM">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-3 w-3" />
                      Instagram
                    </div>
                  </SelectItem>
                  <SelectItem value="TIKTOK">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">TT</span>
                      TikTok
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Instagram className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start by composing a new message</p>
              {socialAccounts.length > 0 && (
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={handleStartCompose}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start a conversation
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.platformUserId}
                onClick={() => {
                  setSelectedConv(conv)
                  setComposing(false)
                  if (conv.account?.id) {
                    fetchMessages(conv.account.id, conv.platformUserId)
                  }
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConv?.platformUserId === conv.platformUserId ? 'bg-pink-50 border-l-4 border-l-pink-500' : ''
                } ${conv.unreadCount > 0 ? 'bg-pink-50/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    conv.account?.platform === "INSTAGRAM" 
                      ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                      : "bg-black"
                  }`}>
                    {conv.profilePicture ? (
                      <img src={conv.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : conv.account?.platform === "INSTAGRAM" ? (
                      <Instagram className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white font-bold text-sm">TT</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        @{conv.platformUsername || "Unknown"}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {conv.lastMessage?.createdAt && new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conv.lastMessage?.direction === "OUTBOUND" && "You: "}
                      {conv.lastMessage?.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {conv.account?.platform === "INSTAGRAM" ? (
                        <Badge variant="secondary" className="text-xs bg-pink-50 text-pink-700">
                          <Instagram className="h-3 w-3 mr-1" />
                          Instagram
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          <span className="font-bold mr-1">TT</span>
                          TikTok
                        </Badge>
                      )}
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-pink-600 text-white text-xs">
                          {conv.unreadCount} new
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Thread or Compose */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {composing ? (
          <>
            {/* Compose Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center">
                    <Edit3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New Message</p>
                    <p className="text-xs text-gray-500">Start a new conversation</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Compose Form */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {/* Platform & Account Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Platform</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={composePlatform === "INSTAGRAM" ? "default" : "outline"}
                      className={`flex-1 ${composePlatform === "INSTAGRAM" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}`}
                      onClick={() => {
                        setComposePlatform("INSTAGRAM")
                        const igAccount = socialAccounts.find(a => a.platform === "INSTAGRAM")
                        if (igAccount) setComposeAccountId(igAccount.id)
                      }}
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </Button>
                    <Button
                      type="button"
                      variant={composePlatform === "TIKTOK" ? "default" : "outline"}
                      className={`flex-1 ${composePlatform === "TIKTOK" ? "bg-black" : ""}`}
                      onClick={() => {
                        setComposePlatform("TIKTOK")
                        const ttAccount = socialAccounts.find(a => a.platform === "TIKTOK")
                        if (ttAccount) setComposeAccountId(ttAccount.id)
                      }}
                    >
                      <span className="font-bold mr-2">TT</span>
                      TikTok
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Send From</label>
                  <Select
                    value={composeAccountId}
                    onValueChange={setComposeAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {socialAccounts
                        .filter(a => a.platform === composePlatform)
                        .map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            @{account.username}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">To</label>
                <Input
                  placeholder="@username"
                  value={composeUsername}
                  onChange={(e) => setComposeUsername(e.target.value)}
                />
                <p className="text-xs text-gray-500">Enter the Instagram or TikTok username</p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Note */}
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p><strong>Note:</strong> Messages are sent via the platform&apos;s messaging API. The recipient must follow your account or have messaging enabled for non-followers.</p>
              </div>
            </div>

            {/* Send Button */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setComposing(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendNewMessage}
                  disabled={!composeAccountId || !composeUsername.trim() || !composeMessage.trim() || sending}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send Message</>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : selectedConv ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedConv.account?.platform === "INSTAGRAM" 
                      ? "bg-pink-100 text-pink-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedConv.account?.platform === "INSTAGRAM" ? (
                      <Instagram className="h-5 w-5" />
                    ) : (
                      <span className="font-bold">TT</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">@{selectedConv.platformUsername || "Unknown"}</p>
                    <p className="text-xs text-gray-500">via {selectedConv.account?.platform || "Social"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedConv(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.direction === 'OUTBOUND' 
                      ? 'bg-pink-600 text-white rounded-br-md' 
                      : 'bg-white shadow-sm rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'OUTBOUND' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Compose */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-3">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Instagram className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the list to view messages</p>
              {socialAccounts.length > 0 && (
                <Button 
                  className="mt-4 bg-pink-600 hover:bg-pink-700"
                  onClick={handleStartCompose}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



