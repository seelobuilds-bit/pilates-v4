"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Mail,
  MessageSquare,
  Send,
  User,
  Plus,
  RefreshCw,
  Check,
  X,
  Edit3,
  AlertCircle,
  Loader2,
  Instagram
} from "lucide-react"

interface Message {
  id: string
  channel: "EMAIL" | "SMS"
  direction: "INBOUND" | "OUTBOUND"
  status: string
  subject?: string | null
  body: string
  fromName: string | null
  sentAt?: string | null
  createdAt: string
}

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}

interface Conversation {
  clientId: string
  client: Client | null
  lastMessage: Message
  messageCount: number
  unreadCount: number
  isDraft?: boolean
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
  account: { id: string; platform: string; username: string } | undefined
}

export default function TeacherInboxPage() {
  // Tab state
  const [inboxTab, setInboxTab] = useState<"messages" | "social">("messages")
  
  // Email/SMS state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "email" | "sms">("all")
  const [composeType, setComposeType] = useState<"email" | "sms">("email")
  const [newMessage, setNewMessage] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Client search state for compose
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
  // Social inbox state
  const [socialAccounts, setSocialAccounts] = useState<Array<{
    id: string
    platform: "INSTAGRAM" | "TIKTOK"
    username: string
  }>>([])
  const [socialConversations, setSocialConversations] = useState<SocialConversation[]>([])
  const [selectedSocialConv, setSelectedSocialConv] = useState<SocialConversation | null>(null)
  const [socialMessages, setSocialMessages] = useState<Array<{
    id: string
    content: string
    direction: string
    createdAt: string
    isRead: boolean
  }>>([])
  const [newSocialMessage, setNewSocialMessage] = useState("")
  
  // Social compose state
  const [socialComposing, setSocialComposing] = useState(false)
  const [socialComposeUsername, setSocialComposeUsername] = useState("")
  const [socialComposeMessage, setSocialComposeMessage] = useState("")
  const [socialComposePlatform, setSocialComposePlatform] = useState<"INSTAGRAM" | "TIKTOK">("INSTAGRAM")
  const [socialComposeAccountId, setSocialComposeAccountId] = useState("")
  const [socialPlatformFilter, setSocialPlatformFilter] = useState<"all" | "INSTAGRAM" | "TIKTOK">("all")
  const [socialSearchQuery, setSocialSearchQuery] = useState("")

  // Fetch conversations (clients with messages)
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/inbox')
      if (res.ok) {
        const data = await res.json()
        // Transform the data to match conversation format
        const convs: Conversation[] = (data.conversations || []).map((c: {
          clientId: string
          clientName: string
          clientEmail: string
          clientPhone: string | null
          lastMessage: { channel: string; body: string; createdAt: string; direction: string } | null
          totalMessages: number
          unreadCount: number
        }) => ({
          clientId: c.clientId,
          client: {
            id: c.clientId,
            firstName: c.clientName.split(' ')[0] || '',
            lastName: c.clientName.split(' ').slice(1).join(' ') || '',
            email: c.clientEmail,
            phone: c.clientPhone
          },
          lastMessage: c.lastMessage ? {
            id: '',
            channel: c.lastMessage.channel as "EMAIL" | "SMS",
            direction: c.lastMessage.direction as "INBOUND" | "OUTBOUND",
            status: 'SENT',
            body: c.lastMessage.body,
            fromName: null,
            createdAt: c.lastMessage.createdAt
          } : {} as Message,
          messageCount: c.totalMessages,
          unreadCount: c.unreadCount
        }))
        setConversations(convs)
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch messages for a specific conversation
  const fetchMessages = async (clientId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/teacher/inbox?clientId=${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setConversationMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Fetch clients for autocomplete (only clients this teacher has taught)
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.map((c: { id: string; firstName: string; lastName: string; email: string; phone?: string }) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone
        })))
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchConversations()
    fetchClients()
  }, [fetchConversations, fetchClients])

  // Fetch social conversations when tab changes
  const fetchSocialConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/social-inbox')
      if (res.ok) {
        const data = await res.json()
        setSocialAccounts(data.accounts || [])
        setSocialConversations(data.conversations || [])
      }
    } catch (err) {
      console.error("Failed to fetch social conversations:", err)
    }
  }, [])

  const fetchSocialMessages = async (accountId: string, platformUserId: string) => {
    try {
      const res = await fetch(`/api/teacher/social-inbox?accountId=${accountId}&platformUserId=${platformUserId}`)
      if (res.ok) {
        const data = await res.json()
        setSocialMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to fetch social messages:", err)
    }
  }

  const handleSendSocialMessage = async () => {
    if (!selectedSocialConv || !newSocialMessage.trim()) return
    
    setSending(true)
    try {
      const res = await fetch('/api/teacher/social-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedSocialConv.account?.id,
          platformUserId: selectedSocialConv.platformUserId,
          platformUsername: selectedSocialConv.platformUsername,
          content: newSocialMessage
        })
      })
      if (res.ok) {
        setNewSocialMessage("")
        if (selectedSocialConv.account?.id) {
          await fetchSocialMessages(selectedSocialConv.account.id, selectedSocialConv.platformUserId)
        }
      }
    } catch (err) {
      console.error("Failed to send social message:", err)
    } finally {
      setSending(false)
    }
  }

  const handleStartSocialCompose = () => {
    setSocialComposing(true)
    setSelectedSocialConv(null)
    setSocialComposeUsername("")
    setSocialComposeMessage("")
    const defaultAccount = socialAccounts.find(a => a.platform === socialComposePlatform) || socialAccounts[0]
    if (defaultAccount) {
      setSocialComposeAccountId(defaultAccount.id)
      setSocialComposePlatform(defaultAccount.platform)
    }
  }

  const handleSendNewSocialMessage = async () => {
    if (!socialComposeAccountId || !socialComposeUsername.trim() || !socialComposeMessage.trim()) return
    
    setSending(true)
    try {
      const platformUserId = `new_${socialComposeUsername.replace('@', '')}_${Date.now()}`
      
      const res = await fetch('/api/teacher/social-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: socialComposeAccountId,
          platformUserId,
          platformUsername: socialComposeUsername.replace('@', ''),
          content: socialComposeMessage
        })
      })
      if (res.ok) {
        await fetchSocialConversations()
        setSocialComposing(false)
        setSocialComposeUsername("")
        setSocialComposeMessage("")
      }
    } catch (err) {
      console.error("Failed to send new social message:", err)
    } finally {
      setSending(false)
    }
  }

  // Filter social conversations
  const filteredSocialConversations = socialConversations.filter(conv => {
    const matchesPlatform = socialPlatformFilter === "all" || conv.account?.platform === socialPlatformFilter
    const matchesSearch = !socialSearchQuery || 
      conv.platformUsername?.toLowerCase().includes(socialSearchQuery.toLowerCase()) ||
      conv.lastMessage?.content?.toLowerCase().includes(socialSearchQuery.toLowerCase())
    return matchesPlatform && matchesSearch
  })

  useEffect(() => {
    if (inboxTab === "social") {
      fetchSocialConversations()
    }
  }, [inboxTab, fetchSocialConversations])

  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
    const search = clientSearch.toLowerCase()
    return fullName.includes(search) || client.email.toLowerCase().includes(search)
  })

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!conv.client) return false
    const matchesSearch = 
      `${conv.client.firstName} ${conv.client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.client.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filterType === "all") return matchesSearch
    return matchesSearch && conv.lastMessage?.channel?.toLowerCase() === filterType
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchConversations()
    setRefreshing(false)
  }

  const handleCompose = () => {
    setSelectedConversation({
      clientId: "",
      client: null,
      lastMessage: {} as Message,
      messageCount: 0,
      unreadCount: 0,
      isDraft: true
    })
    setSelectedClient(null)
    setClientSearch("")
    setNewMessage("")
    setNewSubject("")
    setConversationMessages([])
  }

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client)
    setClientSearch(`${client.firstName} ${client.lastName}`)
    setShowClientDropdown(false)
    
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.clientId === client.id)
    if (existingConv) {
      setSelectedConversation(existingConv)
      fetchMessages(client.id)
    } else {
      setSelectedConversation({
        clientId: client.id,
        client: client,
        lastMessage: {} as Message,
        messageCount: 0,
        unreadCount: 0,
        isDraft: true
      })
    }
  }

  const handleCancelDraft = () => {
    setSelectedConversation(null)
    setSelectedClient(null)
    setClientSearch("")
    setNewMessage("")
    setNewSubject("")
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    if (conv.client) {
      setSelectedClient(conv.client)
      setClientSearch(`${conv.client.firstName} ${conv.client.lastName}`)
    }
    if (conv.clientId) {
      fetchMessages(conv.clientId)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedClient || !newMessage.trim()) return
    
    setSending(true)
    setError(null)
    
    try {
      const res = await fetch('/api/teacher/communicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: composeType,
          clientId: selectedClient.id,
          subject: composeType === "email" ? newSubject : undefined,
          message: newMessage
        })
      })
      
      if (res.ok) {
        await fetchConversations()
        await fetchMessages(selectedClient.id)
        setNewMessage("")
        setNewSubject("")
        
        if (selectedConversation?.isDraft) {
          const updatedConv = conversations.find(c => c.clientId === selectedClient.id)
          if (updatedConv) {
            setSelectedConversation(updatedConv)
          }
        }
      } else {
        const data = await res.json()
        setError(data.error || "Failed to send message")
      }
    } catch (err) {
      console.error("Failed to send message:", err)
      setError("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
  const socialUnread = socialConversations.reduce((sum, c) => sum + c.unreadCount, 0)

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Inbox Type Tabs */}
      <div className="border-b bg-white px-4 pt-4">
        <Tabs value={inboxTab} onValueChange={(v) => setInboxTab(v as typeof inboxTab)}>
          <TabsList className="bg-gray-100/50">
            <TabsTrigger value="messages" className="data-[state=active]:bg-white">
              <Mail className="h-4 w-4 mr-2" />
              Email & SMS
              {totalUnread > 0 && (
                <Badge className="ml-2 bg-violet-100 text-violet-700 hover:bg-violet-100">{totalUnread}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-white">
              <Instagram className="h-4 w-4 mr-2" />
              Social
              {socialUnread > 0 && (
                <Badge className="ml-2 bg-pink-100 text-pink-700 hover:bg-pink-100">{socialUnread}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      {inboxTab === "messages" ? (
        <div className="flex-1 flex">
          {/* Conversations List */}
          <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                  {totalUnread > 0 && (
                    <p className="text-sm text-gray-500">{totalUnread} unread</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-violet-600 hover:bg-violet-700"
                    onClick={handleCompose}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Compose
                  </Button>
                </div>
              </div>
              
              {/* Search & Filter */}
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
                <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start by composing a new message</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.clientId}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.clientId === conv.clientId ? 'bg-violet-50 border-l-4 border-l-violet-500' : ''
                    } ${conv.unreadCount > 0 ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-medium flex-shrink-0">
                        {conv.client ? `${conv.client.firstName[0]}${conv.client.lastName[0]}` : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {conv.client ? `${conv.client.firstName} ${conv.client.lastName}` : 'Unknown'}
                          </p>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {conv.lastMessage?.createdAt 
                              ? new Date(conv.lastMessage.createdAt).toLocaleDateString() 
                              : ''}
                          </span>
                        </div>
                        <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {conv.lastMessage?.body || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {conv.lastMessage?.channel === "EMAIL" ? (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Badge>
                          ) : conv.lastMessage?.channel === "SMS" ? (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS
                            </Badge>
                          ) : null}
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-violet-600 text-white text-xs">
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

          {/* Message View */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                        selectedConversation.isDraft ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {selectedConversation.isDraft && !selectedClient ? (
                          <Edit3 className="h-5 w-5" />
                        ) : selectedClient ? (
                          `${selectedClient.firstName[0]}${selectedClient.lastName[0]}`
                        ) : '?'}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {selectedConversation.isDraft && !selectedClient 
                            ? "New Message" 
                            : selectedClient 
                              ? `${selectedClient.firstName} ${selectedClient.lastName}`
                              : "Unknown"}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.isDraft && !selectedClient 
                            ? "Select a recipient below" 
                            : selectedClient?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConversation.isDraft ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelDraft}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      ) : selectedClient && (
                        <Link href={`/teacher/clients/${selectedClient.id}`}>
                          <Button variant="outline" size="sm">
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Draft - Client Selection */}
                {selectedConversation.isDraft && !selectedClient && (
                  <div className="p-4 bg-white border-b border-gray-200">
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">To:</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search for a client..."
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value)
                            setShowClientDropdown(true)
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          className="pl-9"
                        />
                      </div>
                      
                      {/* Client Dropdown */}
                      {showClientDropdown && clientSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                              <div
                                key={client.id}
                                onClick={() => handleSelectClient(client)}
                                className="p-3 hover:bg-violet-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-medium">
                                    {client.firstName[0]}{client.lastName[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                                    <p className="text-sm text-gray-500">{client.email}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No clients found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Only clients who have attended your classes are shown
                    </p>
                  </div>
                )}

                {/* Selected Client Badge */}
                {selectedConversation.isDraft && selectedClient && (
                  <div className="p-4 bg-white border-b border-gray-200">
                    <div className="p-3 bg-violet-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-medium">
                          {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                          <p className="text-sm text-gray-500">{selectedClient.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedClient(null)
                          setClientSearch("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                  ) : selectedConversation.isDraft && conversationMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Select a client and compose your message below</p>
                      </div>
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    </div>
                  ) : (
                    conversationMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-lg rounded-lg p-4 ${
                          msg.direction === 'OUTBOUND' 
                            ? msg.channel === 'EMAIL' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}>
                          {msg.subject && (
                            <p className={`font-medium mb-2 ${msg.direction === 'OUTBOUND' ? 'text-white' : 'text-gray-900'}`}>
                              {msg.subject}
                            </p>
                          )}
                          <p className={`whitespace-pre-wrap text-sm ${msg.direction === 'OUTBOUND' ? 'text-white' : 'text-gray-700'}`}>
                            {msg.body}
                          </p>
                          <div className={`flex items-center gap-2 mt-2 text-xs ${
                            msg.direction === 'OUTBOUND' ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            {msg.channel === 'EMAIL' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                            <span>{new Date(msg.sentAt || msg.createdAt).toLocaleString()}</span>
                            {msg.fromName && <span>• {msg.fromName}</span>}
                            {msg.direction === 'OUTBOUND' && msg.status === 'SENT' && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  </div>
                )}

                {/* Shared inbox notice */}
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
                  <p className="text-xs text-blue-700 text-center">
                    💬 This conversation is shared - HQ and other teachers can see all messages
                  </p>
                </div>

                {/* Compose Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                  {/* Message Type Toggle */}
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg mb-3">
                    <button
                      onClick={() => setComposeType("email")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                        composeType === "email" 
                          ? "bg-white text-blue-600 shadow-sm font-medium" 
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => setComposeType("sms")}
                      disabled={!!(selectedClient && !selectedClient.phone)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                        composeType === "sms" 
                          ? "bg-white text-green-600 shadow-sm font-medium" 
                          : "text-gray-500 hover:text-gray-900"
                      } ${selectedClient && !selectedClient.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS</span>
                    </button>
                  </div>
                  
                  {composeType === "email" && (
                    <Input
                      placeholder="Subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="mb-2"
                    />
                  )}
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={`Type your ${composeType === 'email' ? 'email' : 'SMS'} message...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending || !selectedClient}
                      className={`self-end ${composeType === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {composeType === "sms" && (
                    <p className="text-xs text-gray-400 mt-1">{newMessage.length}/160 characters</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to view messages</p>
                  <Button 
                    className="mt-4 bg-violet-600 hover:bg-violet-700"
                    onClick={handleCompose}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== SOCIAL INBOX ==================== */
        <div className="flex-1 flex">
          {/* Social Conversations List */}
          <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Social DMs</h1>
                  {socialUnread > 0 && (
                    <p className="text-sm text-gray-500">{socialUnread} unread</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchSocialConversations}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleStartSocialCompose}
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
                  Connect your Instagram or TikTok in <Link href="/teacher/social-media" className="underline font-medium">Social Media</Link> to see DMs here.
                </div>
              ) : (
                /* Search & Filter */
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={socialSearchQuery}
                      onChange={(e) => setSocialSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={socialPlatformFilter} onValueChange={(v) => setSocialPlatformFilter(v as typeof socialPlatformFilter)}>
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
              {filteredSocialConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Instagram className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start by composing a new message</p>
                  {socialAccounts.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={handleStartSocialCompose}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start a conversation
                    </Button>
                  )}
                </div>
              ) : (
                filteredSocialConversations.map(conv => (
                  <div
                    key={conv.platformUserId}
                    onClick={() => {
                      setSelectedSocialConv(conv)
                      setSocialComposing(false)
                      if (conv.account?.id) {
                        fetchSocialMessages(conv.account.id, conv.platformUserId)
                      }
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSocialConv?.platformUserId === conv.platformUserId ? 'bg-pink-50 border-l-4 border-l-pink-500' : ''
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

          {/* Social Message Thread or Compose */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {socialComposing ? (
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
                    <Button variant="ghost" size="sm" onClick={() => setSocialComposing(false)}>
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
                          variant={socialComposePlatform === "INSTAGRAM" ? "default" : "outline"}
                          className={`flex-1 ${socialComposePlatform === "INSTAGRAM" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}`}
                          onClick={() => {
                            setSocialComposePlatform("INSTAGRAM")
                            const igAccount = socialAccounts.find(a => a.platform === "INSTAGRAM")
                            if (igAccount) setSocialComposeAccountId(igAccount.id)
                          }}
                        >
                          <Instagram className="h-4 w-4 mr-2" />
                          Instagram
                        </Button>
                        <Button
                          type="button"
                          variant={socialComposePlatform === "TIKTOK" ? "default" : "outline"}
                          className={`flex-1 ${socialComposePlatform === "TIKTOK" ? "bg-black" : ""}`}
                          onClick={() => {
                            setSocialComposePlatform("TIKTOK")
                            const ttAccount = socialAccounts.find(a => a.platform === "TIKTOK")
                            if (ttAccount) setSocialComposeAccountId(ttAccount.id)
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
                        value={socialComposeAccountId}
                        onValueChange={setSocialComposeAccountId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {socialAccounts
                            .filter(a => a.platform === socialComposePlatform)
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
                      value={socialComposeUsername}
                      onChange={(e) => setSocialComposeUsername(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Enter the Instagram or TikTok username</p>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <Textarea
                      placeholder="Type your message..."
                      value={socialComposeMessage}
                      onChange={(e) => setSocialComposeMessage(e.target.value)}
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
                    <Button variant="outline" onClick={() => setSocialComposing(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendNewSocialMessage}
                      disabled={!socialComposeAccountId || !socialComposeUsername.trim() || !socialComposeMessage.trim() || sending}
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
            ) : selectedSocialConv ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedSocialConv.account?.platform === "INSTAGRAM" 
                          ? "bg-pink-100 text-pink-700" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedSocialConv.account?.platform === "INSTAGRAM" ? (
                          <Instagram className="h-5 w-5" />
                        ) : (
                          <span className="font-bold">TT</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">@{selectedSocialConv.platformUsername || "Unknown"}</p>
                        <p className="text-xs text-gray-500">via {selectedSocialConv.account?.platform || "Social"}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSocialConv(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {socialMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.direction === 'OUTBOUND' 
                          ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-br-md' 
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
                <div className="p-4 bg-white border-t">
                  <div className="flex items-end gap-3">
                    <Textarea
                      placeholder="Type your message..."
                      value={newSocialMessage}
                      onChange={(e) => setNewSocialMessage(e.target.value)}
                      rows={2}
                      className="flex-1 resize-none"
                    />
                    <Button 
                      onClick={handleSendSocialMessage}
                      disabled={!newSocialMessage.trim() || sending}
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
                      onClick={handleStartSocialCompose}
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
      )}
    </div>
  )
}











