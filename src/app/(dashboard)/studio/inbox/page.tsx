"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search,
  Mail,
  MessageSquare,
  Send,
  User,
  Plus,
  Star,
  RefreshCw,
  Check,
  X,
  Edit3,
  AlertCircle,
  Loader2
} from "lucide-react"

interface Message {
  id: string
  channel: "EMAIL" | "SMS"
  direction: "INBOUND" | "OUTBOUND"
  status: string
  subject?: string | null
  body: string
  fromAddress: string
  toAddress: string
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
  starred?: boolean
  isDraft?: boolean
  messages?: Message[]
}

export default function InboxPage() {
  const searchParams = useSearchParams()
  
  // Get URL params for pre-populating
  const urlClientId = searchParams.get('clientId')
  const urlClientName = searchParams.get('clientName')
  const urlClientEmail = searchParams.get('clientEmail')
  const urlClientPhone = searchParams.get('clientPhone')
  
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/messages')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
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
      const res = await fetch(`/api/studio/messages?clientId=${clientId}`)
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

  // Fetch clients for autocomplete
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data)
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

  // Handle URL params for pre-populated client
  useEffect(() => {
    if (urlClientId && urlClientName && urlClientEmail && clients.length > 0) {
      // Check if conversation exists
      const existingConv = conversations.find(c => c.clientId === urlClientId)
      if (existingConv) {
        setSelectedConversation(existingConv)
        fetchMessages(urlClientId)
      } else {
        // Create draft conversation
        const draftClient: Client = {
          id: urlClientId,
          firstName: urlClientName.split(' ')[0] || '',
          lastName: urlClientName.split(' ').slice(1).join(' ') || '',
          email: urlClientEmail,
          phone: urlClientPhone
        }
        setSelectedClient(draftClient)
        setClientSearch(urlClientName)
        setSelectedConversation({
          clientId: urlClientId,
          client: draftClient,
          lastMessage: {} as Message,
          messageCount: 0,
          unreadCount: 0,
          isDraft: true,
          messages: []
        })
      }
    }
  }, [urlClientId, urlClientName, urlClientEmail, urlClientPhone, clients, conversations])

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
    return matchesSearch && conv.lastMessage.channel.toLowerCase() === filterType
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
      isDraft: true,
      messages: []
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
        isDraft: true,
        messages: []
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
      const res = await fetch('/api/studio/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          channel: composeType.toUpperCase(),
          subject: composeType === "email" ? newSubject : undefined,
          message: newMessage
        })
      })
      
      if (res.ok) {
        // Refresh conversations and messages
        await fetchConversations()
        await fetchMessages(selectedClient.id)
        setNewMessage("")
        setNewSubject("")
        
        // Update selected conversation to not be draft
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
              <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
              {totalUnread > 0 && (
                <p className="text-sm text-gray-500">{totalUnread} unread messages</p>
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
                        {conv.lastMessage.sentAt 
                          ? new Date(conv.lastMessage.sentAt).toLocaleDateString() 
                          : new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conv.lastMessage.subject || conv.lastMessage.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {conv.lastMessage.channel === "EMAIL" ? (
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          SMS
                        </Badge>
                      )}
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
                    <Link href={`/studio/clients/${selectedClient.id}`}>
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
                  disabled={selectedClient && !selectedClient.phone}
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
  )
}
