"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Mail,
  Send,
  Building2,
  Users,
  Loader2,
  MessageSquare,
  ArrowLeft
} from "lucide-react"

interface Message {
  id: string
  direction: "INBOUND" | "OUTBOUND"
  subject: string | null
  body: string
  fromName: string | null
  createdAt: string
}

interface Conversation {
  id: string
  name: string
  contactName: string
  contactEmail: string
  status?: string // For leads
  lastMessage: {
    direction: string
    subject: string | null
    body: string
    createdAt: string
  } | null
  totalMessages: number
  unreadCount: number
}

interface ContactDetails {
  id: string
  name: string
  contactName: string
  contactEmail: string
  type: "studio" | "lead"
  status?: string
}

export default function HQInboxPage() {
  const [activeTab, setActiveTab] = useState<"studios" | "leads">("studios")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Compose state
  const [newSubject, setNewSubject] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isReply, setIsReply] = useState(true) // true = reply mode, false = new email

  useEffect(() => {
    fetchConversations()
  }, [activeTab])

  const fetchConversations = async (preserveSelection = false) => {
    setLoading(true)
    if (!preserveSelection) {
      setSelectedContact(null)
      setMessages([])
    }
    try {
      const res = await fetch(`/api/hq/inbox?type=${activeTab}`)
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectContact = async (id: string, type: "studio" | "lead") => {
    setLoadingMessages(true)
    try {
      const param = type === "studio" ? "studioId" : "leadId"
      const res = await fetch(`/api/hq/inbox?type=${activeTab}&${param}=${id}`)
      const data = await res.json()
      
      if (type === "studio" && data.studio) {
        setSelectedContact({
          id: data.studio.id,
          name: data.studio.name,
          contactName: data.studio.ownerName,
          contactEmail: data.studio.ownerEmail,
          type: "studio"
        })
        setMessages(data.messages || [])
      } else if (type === "lead" && data.lead) {
        setSelectedContact({
          id: data.lead.id,
          name: data.lead.studioName,
          contactName: data.lead.contactName,
          contactEmail: data.lead.contactEmail,
          type: "lead",
          status: data.lead.status
        })
        setMessages(data.messages || [])
      }
      
      // Pre-fill subject if replying
      if (data.messages?.length > 0) {
        const lastMsg = data.messages[data.messages.length - 1]
        if (lastMsg.subject && !lastMsg.subject.startsWith("Re:")) {
          setNewSubject(`Re: ${lastMsg.subject}`)
        } else if (lastMsg.subject) {
          setNewSubject(lastMsg.subject)
        }
        setIsReply(true)
      } else {
        setNewSubject("")
        setIsReply(false)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedContact || !newSubject.trim() || !newMessage.trim()) return

    setSending(true)
    try {
      const body = selectedContact.type === "studio" 
        ? { studioId: selectedContact.id, subject: newSubject, message: newMessage }
        : { leadId: selectedContact.id, subject: newSubject, message: newMessage }

      const res = await fetch("/api/hq/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        // Clear message but keep subject for reply
        setNewMessage("")
        
        // Keep subject for follow-up if in reply mode
        if (isReply && !newSubject.startsWith("Re:")) {
          setNewSubject(`Re: ${newSubject}`)
        }
        
        // Refresh messages without losing selection
        await selectContact(selectedContact.id, selectedContact.type)
        
        // Refresh conversations list but preserve selection
        await fetchConversations(true)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const startNewEmail = () => {
    setIsReply(false)
    setNewSubject("")
    setNewMessage("")
  }

  const startReply = () => {
    setIsReply(true)
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      const subject = lastMsg.subject || ""
      if (subject && !subject.startsWith("Re:")) {
        setNewSubject(`Re: ${subject}`)
      } else {
        setNewSubject(subject)
      }
    }
    setNewMessage("")
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700",
      CONTACTED: "bg-yellow-100 text-yellow-700",
      QUALIFIED: "bg-green-100 text-green-700",
      DEMO_SCHEDULED: "bg-purple-100 text-purple-700",
      DEMO_COMPLETED: "bg-indigo-100 text-indigo-700",
      PROPOSAL_SENT: "bg-orange-100 text-orange-700",
      NEGOTIATING: "bg-pink-100 text-pink-700",
      WON: "bg-emerald-100 text-emerald-700",
      LOST: "bg-red-100 text-red-700",
    }
    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-700"}>
        {status.replace(/_/g, " ")}
      </Badge>
    )
  }

  return (
    <div className="h-full min-h-0 flex">
      {/* Sidebar - Conversations List */}
      <div className={`border-r bg-white flex flex-col w-full lg:w-96 ${selectedContact ? "hidden lg:flex" : "flex"}`}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Communications</h1>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "studios" | "leads")} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="studios" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Active Studios
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{activeTab === "studios" ? "No studio conversations" : "No lead conversations"}</p>
              {activeTab === "leads" && (
                <p className="text-sm mt-1">Send an email to a lead to start a conversation</p>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectContact(conv.id, activeTab === "studios" ? "studio" : "lead")}
                className={`w-full p-4 border-b text-left hover:bg-gray-50 transition-colors ${
                  selectedContact?.id === conv.id ? "bg-violet-50 border-l-4 border-l-violet-600" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activeTab === "studios" ? "bg-violet-100" : "bg-blue-100"
                    }`}>
                      {activeTab === "studios" ? (
                        <Building2 className="h-5 w-5 text-violet-600" />
                      ) : (
                        <Users className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{conv.name}</p>
                      <p className="text-sm text-gray-500 truncate">{conv.contactName}</p>
                    </div>
                  </div>
                  {conv.lastMessage && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {conv.status && (
                  <div className="mt-2 pl-13">
                    {getStatusBadge(conv.status)}
                  </div>
                )}
                {conv.lastMessage && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 pl-13">
                    {conv.lastMessage.direction === "INBOUND" ? "↩️ " : "→ "}
                    {conv.lastMessage.body}
                  </p>
                )}
                {conv.unreadCount > 0 && (
                  <Badge className="mt-2 bg-violet-100 text-violet-700">
                    {conv.unreadCount} new
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main - Messages Panel */}
      <div className={`flex-1 flex-col bg-gray-50 ${selectedContact ? "flex" : "hidden lg:flex"}`}>
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a {activeTab === "studios" ? "studio" : "lead"} from the list to view messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                  selectedContact.type === "studio" ? "bg-violet-100" : "bg-blue-100"
                }`}>
                  {selectedContact.type === "studio" ? (
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                  ) : (
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900 truncate">{selectedContact.name}</h2>
                    {selectedContact.status && getStatusBadge(selectedContact.status)}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedContact.contactName} • {selectedContact.contactEmail}
                  </p>
                </div>
                {selectedContact.type === "lead" && (
                  <a 
                    href={`/hq/sales/leads/${selectedContact.id}`}
                    className="text-sm text-violet-600 hover:underline"
                  >
                    View Lead →
                  </a>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Send the first message below</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-lg rounded-lg p-4 ${
                        msg.direction === "OUTBOUND"
                          ? "bg-violet-600 text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      {msg.subject && (
                        <p className={`text-sm font-medium mb-1 ${
                          msg.direction === "OUTBOUND" ? "text-violet-100" : "text-gray-500"
                        }`}>
                          {msg.subject}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className={`text-xs mt-2 ${
                        msg.direction === "OUTBOUND" ? "text-violet-200" : "text-gray-400"
                      }`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Compose */}
            <div className="bg-white border-t p-4 pb-24 lg:pb-4 lg:pr-24">
              <div className="space-y-3">
                {/* Reply/New Email Toggle */}
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                  <Button
                    variant={isReply ? "default" : "outline"}
                    size="sm"
                    onClick={startReply}
                    className={isReply ? "bg-violet-600 hover:bg-violet-700" : ""}
                    disabled={messages.length === 0}
                  >
                    Reply
                  </Button>
                  <Button
                    variant={!isReply ? "default" : "outline"}
                    size="sm"
                    onClick={startNewEmail}
                    className={!isReply ? "bg-violet-600 hover:bg-violet-700" : ""}
                  >
                    New Email
                  </Button>
                  <span className="text-xs text-gray-500">
                    {isReply ? "Continuing conversation thread" : "Starting a new conversation"}
                  </span>
                </div>
                
                <Input
                  placeholder="Subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newSubject.trim() || !newMessage.trim()}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {isReply ? "Send Reply" : "Send Email"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
