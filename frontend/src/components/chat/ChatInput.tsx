"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface ChatInputProps {
  userId: string
}

export function ChatInput({ userId }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    let newWs: WebSocket | null = null
    let reconnectTimer: NodeJS.Timeout

    const connectWebSocket = () => {
      console.log("🔄 Connecting to WebSocket...")

      try {
        newWs = new WebSocket(`ws://localhost:8080/chat/private`)

        newWs.onopen = () => {
          console.log("✅ WebSocket connected to private chat")
        }

        newWs.onmessage = (event) => {
          console.log("📩 WebSocket Message:", event.data)
        }

        newWs.onerror = (error) => {
          console.error("❌ WebSocket error:", error)
          reconnectTimer = setTimeout(connectWebSocket, 5000) // Retry after 5s
        }

        newWs.onclose = () => {
          console.warn("⚠️ WebSocket closed. Reconnecting in 5s...")
          reconnectTimer = setTimeout(connectWebSocket, 5000)
        }

        setWs(newWs)
      } catch (error) {
        console.error("❌ WebSocket connection failed:", error)
      }
    }

    connectWebSocket()

    return () => {
      if (newWs) newWs.close()
      clearTimeout(reconnectTimer)
    }
  }, [userId])

  const handleSendMessage = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket is not connected.")
      return
    }

    if (!message.trim()) return

    const msg = {
      senderId: "currentUser",
      receiverId: userId,
      text: message,
      type: "message",
      timestamp: new Date().toISOString(),
    }

    try {
      ws.send(JSON.stringify(msg))
      setMessage("")
    } catch (error) {
      console.error("❌ Error sending message:", error)
    }
  }

  return (
    <div className="p-6 border-t border-gray-100 bg-white flex items-center space-x-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        className="flex-grow rounded-full bg-gray-50 border-none"
      />
      <Button onClick={handleSendMessage} className="bg-[#6C5CE7] hover:bg-[#5A4BD1] rounded-full">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
