"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Send,
  RefreshCw,
  Loader2,
  Mail,
  MessageSquare,
  User,
  ChevronRight,
  Inbox,
  Instagram,
  Music2,
  Image,
  Heart,
  MessageCircle,
  Play
} from "lucide-react"

// ============== CLIENT EMAIL/SMS TYPES ==============
interface ClientConversation {
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  lastMessage: {
    channel: "EMAIL" | "SMS"
    body: string
    createdAt: string
    direction: "INBOUND" | "OUTBOUND"
  } | null
  unreadCount: number
  totalMessages: number
}

interface ClientMessage {
  id: string
  channel: "EMAIL" | "SMS"
  direction: "INBOUND" | "OUTBOUND"
  subject: string | null
  body: string
  fromName: string | null
  createdAt: string
}

// ============== SOCIAL MEDIA TYPES ==============
interface SocialConversation {
  id: string
  platform: "instagram" | "tiktok"
  username: string
  displayName: string
  avatarUrl: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isFollower: boolean
}

interface SocialMessage {
  id: string
  content: string
  timestamp: string
  isFromUser: boolean
  mediaUrl?: string
  mediaType?: "image" | "video" | "story_reply" | "reel_reply"
}

export default function TeacherInboxPage() {
  const [activeTab, setActiveTab] = useState<"clients" | "social">("clients")
  
  // ============== CLIENT EMAIL/SMS STATE ==============
  const [clientLoading, setClientLoading] = useState(true)
  const [conversations, setConversations] = useState<ClientConversation[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientConversation | null>(null)
  const [clientMessages, setClientMessages] = useState<ClientMessage[]>([])
  const [loadingClientMessages, setLoadingClientMessages] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [messageType, setMessageType] = useState<"email" | "sms">("email")
  const [emailSubject, setEmailSubject] = useState("")
  const [clientMessageBody, setClientMessageBody] = useState("")
  const [sendingClient, setSendingClient] = useState(false)
  const clientMessagesEndRef = useRef<HTMLDivElement>(null)

  // ============== SOCIAL MEDIA STATE ==============
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialConversations, setSocialConversations] = useState<SocialConversation[]>([])
  const [selectedSocial, setSelectedSocial] = useState<SocialConversation | null>(null)
  const [socialMessages, setSocialMessages] = useState<SocialMessage[]>([])
  const [loadingSocialMessages, setLoadingSocialMessages] = useState(false)
  const [socialSearchQuery, setSocialSearchQuery] = useState("")
  const [socialMessageBody, setSocialMessageBody] = useState("")
  const [sendingSocial, setSendingSocial] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<"all" | "instagram" | "tiktok">("all")
  const socialMessagesEndRef = useRef<HTMLDivElement>(null)

  // ============== CLIENT EMAIL/SMS FUNCTIONS ==============
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/inbox')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
    }
    setClientLoading(false)
  }, [])

  const fetchClientMessages = async (clientId: string) => {
    setLoadingClientMessages(true)
    try {
      const res = await fetch(`/api/teacher/inbox?clientId=${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setClientMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    }
    setLoadingClientMessages(false)
  }

  const selectClientConversation = (conv: ClientConversation) => {
    setSelectedClient(conv)
    setMessageType(conv.clientPhone ? "email" : "email")
    fetchClientMessages(conv.clientId)
  }

  const sendClientMessage = async () => {
    if (!selectedClient || !clientMessageBody.trim()) return
    if (messageType === "email" && !emailSubject.trim()) return

    setSendingClient(true)
    try {
      const res = await fetch("/api/teacher/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: messageType,
          clientId: selectedClient.clientId,
          subject: emailSubject,
          message: clientMessageBody
        })
      })

      if (res.ok) {
        setEmailSubject("")
        setClientMessageBody("")
        fetchClientMessages(selectedClient.clientId)
        fetchConversations()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSendingClient(false)
    }
  }

  // ============== SOCIAL MEDIA FUNCTIONS ==============
  const fetchSocialConversations = useCallback(async () => {
    setSocialLoading(true)
    try {
      const res = await fetch('/api/teacher/social-inbox')
      if (res.ok) {
        const data = await res.json()
        setSocialConversations(data.conversations || [])
      }
    } catch (err) {
      console.error("Failed to fetch social conversations:", err)
    }
    setSocialLoading(false)
  }, [])

  const fetchSocialMessages = async (conversationId: string) => {
    setLoadingSocialMessages(true)
    try {
      const res = await fetch(`/api/teacher/social-inbox?conversationId=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setSocialMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to fetch social messages:", err)
    }
    setLoadingSocialMessages(false)
  }

  const selectSocialConversation = (conv: SocialConversation) => {
    setSelectedSocial(conv)
    fetchSocialMessages(conv.id)
  }

  const sendSocialMessage = async () => {
    if (!selectedSocial || !socialMessageBody.trim()) return

    setSendingSocial(true)
    try {
      const res = await fetch("/api/teacher/social-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedSocial.id,
          message: socialMessageBody
        })
      })

      if (res.ok) {
        setSocialMessageBody("")
        fetchSocialMessages(selectedSocial.id)
        fetchSocialConversations()
      }
    } catch (error) {
      console.error("Failed to send social message:", error)
    } finally {
      setSendingSocial(false)
    }
  }

  // ============== EFFECTS ==============
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (activeTab === "social" && socialConversations.length === 0) {
      fetchSocialConversations()
    }
  }, [activeTab, socialConversations.length, fetchSocialConversations])

  useEffect(() => {
    clientMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [clientMessages])

  useEffect(() => {
    socialMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [socialMessages])

  // ============== FILTERS ==============
  const filteredClientConversations = conversations.filter(conv =>
    conv.clientName.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    conv.clientEmail.toLowerCase().includes(clientSearchQuery.toLowerCase())
  )

  const filteredSocialConversations = socialConversations.filter(conv => {
    const matchesSearch = conv.username.toLowerCase().includes(socialSearchQuery.toLowerCase()) ||
      conv.displayName.toLowerCase().includes(socialSearchQuery.toLowerCase())
    const matchesPlatform = platformFilter === "all" || conv.platform === platformFilter
    return matchesSearch && matchesPlatform
  })

  // ============== RENDER ==============
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Tabs */}
      <div className="bg-white border-b px-4 py-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clients" | "social")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Client Email/SMS
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Social Media
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ============== CLIENT EMAIL/SMS TAB ============== */}
        {activeTab === "clients" && (
          <>
            {/* Conversations List */}
            <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Client Messages</h1>
                    <p className="text-sm text-gray-500">Email & SMS with your clients</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchConversations}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {clientLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                  </div>
                ) : filteredClientConversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 px-4">
                    <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm mt-1">Messages with your clients will appear here</p>
                    <Link href="/teacher/clients">
                      <Button variant="outline" className="mt-4">View My Clients</Button>
                    </Link>
                  </div>
                ) : (
                  filteredClientConversations.map(conv => (
                    <div
                      key={conv.clientId}
                      onClick={() => selectClientConversation(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedClient?.clientId === conv.clientId ? 'bg-violet-50 border-l-4 border-l-violet-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-violet-700">
                            {conv.clientName.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate text-gray-900">{conv.clientName}</p>
                            {conv.lastMessage && (
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{conv.clientEmail}</p>
                          {conv.lastMessage && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {conv.lastMessage.channel === "EMAIL" ? (
                                  <><Mail className="h-3 w-3 mr-1" /> Email</>
                                ) : (
                                  <><MessageSquare className="h-3 w-3 mr-1" /> SMS</>
                                )}
                              </Badge>
                              <p className="text-xs text-gray-400 truncate flex-1">
                                {conv.lastMessage.direction === "OUTBOUND" && "You: "}
                                {conv.lastMessage.body.substring(0, 40)}...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Client Message Thread */}
            <div className="flex-1 flex flex-col bg-gray-50">
              {selectedClient ? (
                <>
                  <div className="p-4 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedClient.clientName}</p>
                          <p className="text-xs text-gray-500">{selectedClient.clientEmail}</p>
                        </div>
                      </div>
                      <Link href={`/teacher/clients/${selectedClient.clientId}`}>
                        <Button variant="outline" size="sm">
                          View Profile <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="p-3 bg-white border-b flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Send via:</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={messageType === "email" ? "default" : "outline"}
                        onClick={() => setMessageType("email")}
                        className={messageType === "email" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        <Mail className="h-4 w-4 mr-1" /> Email
                      </Button>
                      <Button
                        size="sm"
                        variant={messageType === "sms" ? "default" : "outline"}
                        onClick={() => setMessageType("sms")}
                        disabled={!selectedClient.clientPhone}
                        className={messageType === "sms" ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> SMS
                      </Button>
                    </div>
                    {!selectedClient.clientPhone && (
                      <span className="text-xs text-gray-400">(No phone number)</span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingClientMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                      </div>
                    ) : clientMessages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation below</p>
                      </div>
                    ) : (
                      <>
                        {clientMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              msg.direction === "OUTBOUND"
                                ? msg.channel === "EMAIL" ? "bg-emerald-600 text-white rounded-br-md" : "bg-blue-600 text-white rounded-br-md"
                                : "bg-white shadow-sm rounded-bl-md"
                            }`}>
                              <div className={`flex items-center gap-2 mb-1 text-xs ${msg.direction === "OUTBOUND" ? "text-white/70" : "text-gray-500"}`}>
                                <Badge variant="outline" className={`text-xs ${msg.direction === "OUTBOUND" ? "border-white/30 text-white/80" : ""}`}>
                                  {msg.channel === "EMAIL" ? <><Mail className="h-3 w-3 mr-1" /> Email</> : <><MessageSquare className="h-3 w-3 mr-1" /> SMS</>}
                                </Badge>
                                {msg.fromName && msg.direction === "OUTBOUND" && <span>by {msg.fromName}</span>}
                              </div>
                              {msg.channel === "EMAIL" && msg.subject && (
                                <p className={`font-medium text-sm mb-1 ${msg.direction === "OUTBOUND" ? "text-white" : "text-gray-900"}`}>{msg.subject}</p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                              <p className={`text-xs mt-2 ${msg.direction === "OUTBOUND" ? "text-white/60" : "text-gray-400"}`}>
                                {new Date(msg.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={clientMessagesEndRef} />
                      </>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t space-y-3">
                    {messageType === "email" && (
                      <Input placeholder="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                    )}
                    <div className="flex items-end gap-3">
                      <Textarea
                        placeholder={messageType === "email" ? "Write your email..." : "Write your SMS..."}
                        value={clientMessageBody}
                        onChange={(e) => setClientMessageBody(e.target.value)}
                        rows={3}
                        className="flex-1 resize-none"
                      />
                      <Button
                        onClick={sendClientMessage}
                        disabled={sendingClient || !clientMessageBody.trim() || (messageType === "email" && !emailSubject.trim())}
                        className={messageType === "email" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}
                      >
                        {sendingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">💡 This conversation is shared - HQ and other teachers can see all messages</p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Inbox className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">Choose a client from the list to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ============== SOCIAL MEDIA TAB ============== */}
        {activeTab === "social" && (
          <>
            {/* Social Conversations List */}
            <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Social Inbox</h1>
                    <p className="text-sm text-gray-500">Instagram & TikTok DMs</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchSocialConversations}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Platform Filter */}
                <div className="flex gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={platformFilter === "all" ? "default" : "outline"}
                    onClick={() => setPlatformFilter("all")}
                    className={platformFilter === "all" ? "bg-violet-600" : ""}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={platformFilter === "instagram" ? "default" : "outline"}
                    onClick={() => setPlatformFilter("instagram")}
                    className={platformFilter === "instagram" ? "bg-gradient-to-r from-purple-500 to-pink-500 border-0" : ""}
                  >
                    <Instagram className="h-4 w-4 mr-1" /> Instagram
                  </Button>
                  <Button
                    size="sm"
                    variant={platformFilter === "tiktok" ? "default" : "outline"}
                    onClick={() => setPlatformFilter("tiktok")}
                    className={platformFilter === "tiktok" ? "bg-black border-0" : ""}
                  >
                    <Music2 className="h-4 w-4 mr-1" /> TikTok
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by username..."
                    value={socialSearchQuery}
                    onChange={(e) => setSocialSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {socialLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                  </div>
                ) : filteredSocialConversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 px-4">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No social DMs yet</p>
                    <p className="text-sm mt-1">Connect your accounts in Social Media settings</p>
                    <Link href="/teacher/social-media">
                      <Button variant="outline" className="mt-4">Social Media Settings</Button>
                    </Link>
                  </div>
                ) : (
                  filteredSocialConversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => selectSocialConversation(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSocial?.id === conv.id ? 'bg-violet-50 border-l-4 border-l-violet-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            {conv.avatarUrl ? (
                              <img src={conv.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-white font-medium">{conv.displayName[0]}</span>
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                            conv.platform === "instagram" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-black"
                          }`}>
                            {conv.platform === "instagram" ? (
                              <Instagram className="h-3 w-3 text-white" />
                            ) : (
                              <Music2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate text-gray-900">{conv.displayName}</p>
                            <span className="text-xs text-gray-500">{conv.lastMessageTime}</span>
                          </div>
                          <p className="text-sm text-gray-500">@{conv.username}</p>
                          <p className="text-xs text-gray-400 truncate mt-1">{conv.lastMessage}</p>
                          {conv.unreadCount > 0 && (
                            <Badge className="mt-1 bg-violet-600">{conv.unreadCount} new</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Social Message Thread */}
            <div className="flex-1 flex flex-col bg-gray-50">
              {selectedSocial ? (
                <>
                  <div className="p-4 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          {selectedSocial.avatarUrl ? (
                            <img src={selectedSocial.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-medium">{selectedSocial.displayName[0]}</span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                          selectedSocial.platform === "instagram" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-black"
                        }`}>
                          {selectedSocial.platform === "instagram" ? (
                            <Instagram className="h-3 w-3 text-white" />
                          ) : (
                            <Music2 className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedSocial.displayName}</p>
                        <p className="text-xs text-gray-500">@{selectedSocial.username}</p>
                      </div>
                      {selectedSocial.isFollower && (
                        <Badge variant="secondary" className="ml-auto">
                          <Heart className="h-3 w-3 mr-1 text-pink-500" /> Follower
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingSocialMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                      </div>
                    ) : socialMessages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No messages in this conversation</p>
                      </div>
                    ) : (
                      <>
                        {socialMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              msg.isFromUser
                                ? selectedSocial.platform === "instagram"
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md"
                                  : "bg-black text-white rounded-br-md"
                                : "bg-white shadow-sm rounded-bl-md"
                            }`}>
                              {msg.mediaUrl && (
                                <div className="mb-2 rounded-lg overflow-hidden">
                                  {msg.mediaType === "video" || msg.mediaType === "reel_reply" ? (
                                    <div className="relative bg-black aspect-video flex items-center justify-center">
                                      <Play className="h-8 w-8 text-white" />
                                      <span className="absolute bottom-2 left-2 text-xs text-white/70">
                                        {msg.mediaType === "reel_reply" ? "Replied to Reel" : "Video"}
                                      </span>
                                    </div>
                                  ) : msg.mediaType === "story_reply" ? (
                                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                                      <p className="text-xs text-white/80">Replied to Story</p>
                                    </div>
                                  ) : (
                                    <img src={msg.mediaUrl} alt="" className="max-w-full rounded" />
                                  )}
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-xs mt-2 ${msg.isFromUser ? "text-white/60" : "text-gray-400"}`}>
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={socialMessagesEndRef} />
                      </>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t">
                    <div className="flex items-end gap-3">
                      <Textarea
                        placeholder={`Reply on ${selectedSocial.platform === "instagram" ? "Instagram" : "TikTok"}...`}
                        value={socialMessageBody}
                        onChange={(e) => setSocialMessageBody(e.target.value)}
                        rows={2}
                        className="flex-1 resize-none"
                      />
                      <Button
                        onClick={sendSocialMessage}
                        disabled={sendingSocial || !socialMessageBody.trim()}
                        className={selectedSocial.platform === "instagram"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          : "bg-black hover:bg-gray-800"
                        }
                      >
                        {sendingSocial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">Choose a DM from the list to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
