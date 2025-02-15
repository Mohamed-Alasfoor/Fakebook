"use client"

import { useState } from "react"
import { UserList } from "@/components/chat/UserList"
import { ChatWindow } from "@/components/chat/ChatWindow"
import type { User } from "@/types/chat"

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <div className="flex h-screen bg-gray-50">
      <UserList onSelectUser={setSelectedUser} selectedUser={selectedUser} />
      <ChatWindow user={selectedUser} />
    </div>
  )
}

