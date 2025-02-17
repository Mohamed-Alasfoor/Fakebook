"use client"

import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/types/chat"

interface MessageListProps {
  userId: string
}

export function MessageList({ userId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get<Message[]>(`http://localhost:8080/chat/history?with=${userId}`, {
          withCredentials: true, // ✅ Ensures cookies/tokens are included
        })
        setMessages(res.data ?? []) // ✅ Ensures messages is never null
      } catch (error) {
        console.error("❌ Error fetching messages:", error)
        setMessages([]) // ✅ Default to empty array if error occurs
      }
    }
    fetchMessages()
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <ScrollArea className="flex-grow p-6">
      {messages.length === 0 ? (
        <p className="text-center text-gray-400">No messages yet. Start the conversation!</p>
      ) : (
        messages.map((message) => (
          <div key={message.id || Math.random()} className={`flex mb-4 ${message.senderId === "currentUser" ? "justify-end" : "justify-start"}`}>
            <div className={`p-3 rounded-2xl max-w-xs ${message.senderId === "currentUser" ? "bg-[#6C5CE7] text-white" : "bg-gray-100 text-gray-800"}`}>
              <p className="text-sm">{message.text}</p>
              <p className="text-xs mt-1 opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </ScrollArea>
  )
}
