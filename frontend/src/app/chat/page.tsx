"use client"

import { useState, useEffect } from "react"
import { UserList } from "@/components/chat/UserList"
import { ChatWindow } from "@/components/chat/ChatWindow"
import type { User } from "@/types/chat"
import { ChatSocketProvider } from "@/lib/ChatSocketProvider"
import Cookies from "js-cookie"

export default function ChatPage() {
  const actualUserId = Cookies.get("user_id") || ""

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    let ws: WebSocket | null = null

    const connectWebSocket = () => {
      ws = new WebSocket("ws://localhost:8080/ws/online")

      ws.onopen = () => {
        console.log("✅ Connected to WebSocket: /ws/online")
      }

      ws.onmessage = (event) => {
        console.log("📩 Raw WebSocket message:", event.data)
        try {
          // Trim the incoming data and check if it starts with a JSON character
          const trimmedData =
            typeof event.data === "string" ? event.data.trim() : ""
          if (trimmedData.startsWith("{") || trimmedData.startsWith("[")) {
            const receivedUsers = JSON.parse(trimmedData)
            // Format users to match the expected User interface
            const formattedUsers: User[] = receivedUsers.map((user: any) => ({
              id: user.id,
              name: user.nickname || "Unknown User",
              avatar: user.avatar
                ? `http://localhost:8080/uploads/avatars/${user.avatar}`
                : "/default-avatar.png",
              online: user.online,
            }))
            console.log("✅ Formatted Users:", formattedUsers)
            setUsers(formattedUsers)
          } else {
            console.warn("Received non-JSON message:", event.data)
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error, event.data)
        }
      }

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error)
        setTimeout(connectWebSocket, 5000)
      }

      ws.onclose = () => {
        console.warn("⚠️ WebSocket connection closed. Reconnecting in 5s...")
        setTimeout(connectWebSocket, 5000)
      }
    }

    connectWebSocket()

    return () => ws?.close()
  }, [])

  return (
    <ChatSocketProvider>
      <div className="flex h-screen bg-gray-50">
        <UserList
          users={users}
          onSelectUser={setSelectedUser}
          selectedUser={selectedUser}
        />
        <ChatWindow currentUserId={actualUserId} user={selectedUser} />
      </div>
    </ChatSocketProvider>
  )
}
