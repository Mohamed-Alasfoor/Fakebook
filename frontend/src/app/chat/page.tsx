"use client"

import { useState, useEffect } from "react"
import { UserList } from "@/components/chat/UserList"
import { ChatWindow } from "@/components/chat/ChatWindow"
import type { User } from "@/types/chat"

export default function ChatPage() {
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
        console.log("📩 WebSocket Message Received:", event.data)

        try {
          const receivedUsers = JSON.parse(event.data)

          // ✅ Transform WebSocket data to match expected `User` interface
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
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error, event.data)
        }
      }

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error)
        setTimeout(connectWebSocket, 5000) // Retry after 5s
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
    <div className="flex h-screen bg-gray-50">
      <UserList users={users} onSelectUser={setSelectedUser} selectedUser={selectedUser} />
      <ChatWindow user={selectedUser} />
    </div>
  )
}
