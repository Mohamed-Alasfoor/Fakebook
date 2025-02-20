"use client"

import type { User } from "@/types/chat"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"

interface ChatWindowProps {
  // We add a prop for the logged-in user’s ID
  currentUserId: string
  user: User | null
}

export function ChatWindow({ currentUserId, user }: ChatWindowProps) {
  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-400">Select a chat to start messaging</p>
      </div>
    )
  }

  return (
    <div className="flex-grow flex flex-col bg-white shadow-lg rounded-r-2xl">
      <ChatHeader user={user} />
      {/* Pass currentUserId to MessageList */}
      <MessageList currentUserId={currentUserId} userId={user.id} />
      {/* Pass currentUserId to ChatInput */}
      <ChatInput currentUserId={currentUserId} userId={user.id} />
    </div>
  )
}
