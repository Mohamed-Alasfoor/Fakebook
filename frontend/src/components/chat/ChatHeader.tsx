"use client";

import type { User } from "@/types/chat";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatHeaderProps {
  user: User;
}

export function ChatHeader({ user }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-100">
      <div className="flex items-center">
        <Avatar className="h-10 w-10 mr-4">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
          <p
            className={`text-sm ${
              user.online ? "text-green-500" : "text-gray-500"
            }`}
          >
            {user.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>
    </div>
  );
}
