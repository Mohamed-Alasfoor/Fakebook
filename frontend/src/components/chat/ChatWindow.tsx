import type { User } from "@/types/chat"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { MessageList } from "@/components/chat/MessageList"
import { ChatInput } from "@/components/chat/ChatInput"

interface ChatWindowProps {
  user: User | null
}

export function ChatWindow({ user }: ChatWindowProps) {
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
      <MessageList userId={user.id} />
      <ChatInput userId={user.id} />
    </div>
  )
}
