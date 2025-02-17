import type { User } from "@/types/chat"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserItem } from "@/components/chat/UserItem"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface UserListProps {
  users: User[]
  onSelectUser: (user: User) => void
  selectedUser: User | null
}

export function UserList({ users, onSelectUser, selectedUser }: UserListProps) {
  return (
    <div className="w-80 bg-white shadow-lg rounded-l-2xl flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Chats</h2>
        <div className="relative">
          <Input placeholder="Search users..." className="pl-10 bg-gray-50 border-none rounded-full" />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>
      <ScrollArea className="flex-grow">
        {users.map((user) => (
          <UserItem key={user.id} user={user} onClick={() => onSelectUser(user)} isSelected={selectedUser?.id === user.id} />
        ))}
      </ScrollArea>
    </div>
  )
}
