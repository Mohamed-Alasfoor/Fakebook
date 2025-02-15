"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/types/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MessageListProps {
  userId: string
}

export function MessageList({ userId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages: Message[] = [
    { id: "1", senderId: userId, text: "Hey there!", timestamp: new Date().toISOString() },
    { id: "2", senderId: "currentUser", text: "Hi! How are you?", timestamp: new Date().toISOString() },
    {
      id: "3",
      senderId: userId,
      text: "I'm doing great, thanks for asking! How about you?",
      timestamp: new Date().toISOString(),
    },
    {
      id: "4",
      senderId: "currentUser",
      text: "I'm good too. Just working on some projects.",
      timestamp: new Date().toISOString(),
    },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <ScrollArea className="flex-grow p-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`flex mb-4 ${message.senderId === "currentUser" ? "justify-end" : "justify-start"}`}
        >
          {message.senderId !== "currentUser" && index === 0 && (
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={`/avatars/${userId}.jpg`} />
              <AvatarFallback>{userId.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <div
            className={`p-3 rounded-2xl max-w-xs ${
              message.senderId === "currentUser" ? "bg-[#6C5CE7] text-white" : "bg-gray-100 text-gray-800"
            }`}
          >
            <p className="text-sm">{message.text}</p>
            <p className="text-xs mt-1 opacity-70">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </ScrollArea>
  )
}

