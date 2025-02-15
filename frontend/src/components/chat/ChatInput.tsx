"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile } from "lucide-react"

interface ChatInputProps {
  userId: string
}

export function ChatInput({ userId }: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message, "to user:", userId)
      setMessage("")
    }
  }

  return (
    <div className="p-6 border-t border-gray-100 bg-white flex items-center space-x-2">
      
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-grow rounded-full bg-gray-50 border-none"
        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
      />
      
      <Button onClick={handleSendMessage} className="bg-[#6C5CE7] hover:bg-[#5A4BD1] rounded-full">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

