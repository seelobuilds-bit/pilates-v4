// Demo Inbox Page - Mirrors /studio/inbox/page.tsx
// Keep in sync with the real inbox page

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Mail, MessageSquare, MoreVertical } from "lucide-react"
import { demoMessages, demoClients } from "../_data/demo-data"

export default function DemoInboxPage() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500 mt-1">Client communications</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardContent className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search messages..." className="pl-10 border-gray-200" />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-lg text-sm font-medium text-violet-700">
                <Mail className="h-4 w-4" />
                All
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
                <MessageSquare className="h-4 w-4" />
                Unread
                <Badge className="bg-pink-100 text-pink-700 border-0 ml-1">2</Badge>
              </button>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              {demoMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMessage === message.id
                      ? "bg-violet-50 border border-violet-200"
                      : message.read
                      ? "bg-white hover:bg-gray-50"
                      : "bg-blue-50 hover:bg-blue-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-700">
                        {message.client.firstName[0]}{message.client.lastName[0]}
                      </div>
                      <div>
                        <p className={`text-sm ${!message.read ? "font-semibold" : "font-medium"} text-gray-900`}>
                          {message.client.firstName} {message.client.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{message.subject}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 truncate">{message.preview}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            {selectedMessage ? (
              <>
                {(() => {
                  const message = demoMessages.find(m => m.id === selectedMessage)
                  if (!message) return null
                  return (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center text-lg font-medium text-violet-700">
                            {message.client.firstName[0]}{message.client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {message.client.firstName} {message.client.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{message.subject}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-gray-700">{message.preview}</p>
                        <p className="text-gray-700 mt-4">
                          I really appreciate all the help the team has provided. The classes have been amazing and I&apos;ve seen so much progress!
                        </p>
                        <p className="text-sm text-gray-400 mt-4">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <Input placeholder="Type your reply..." className="mb-3" />
                        <div className="flex justify-end">
                          <Button className="bg-violet-600 hover:bg-violet-700">Send Reply</Button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a message to view</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
