"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatMessage {
  sender_id: string;
  message: string;
  created_at: string;
  avatar?: string;
  nickname?: string; // <-- new field
}

interface ChatTabProps {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  handleSendMessage: () => void;
  currentUserId: string | undefined;
}

export default function ChatTab({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  currentUserId,
}: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to safely format time
  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col flex-grow min-h-[400px] max-h-[75vh] border rounded-lg shadow-md bg-white">
      {/* Chat Header */}
      <div className="p-3 border-b text-center font-semibold text-gray-700 bg-gray-100">
        Group Chat
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-grow px-4 py-2 overflow-y-auto">
        {!messages || messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-4">No messages yet.</p>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.sender_id === currentUserId;
            return (
              <div
                key={index}
                className={`flex items-end space-x-2 mb-2 ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                {/* Only show avatar + nickname if not the current user */}
                {!isCurrentUser && (
                  <Avatar className="w-6 h-6">
                    <AvatarImage
                      src={
                        msg.avatar
                          ? `http://localhost:8080/avatars/${msg.avatar}`
                          : `https://api.dicebear.com/6.x/initials/svg?seed=${msg.sender_id}`
                      }
                    />
                    <AvatarFallback>
                      {msg.nickname ? msg.nickname.charAt(0) : "?"}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`p-2 rounded-lg text-sm ${
                    isCurrentUser
                      ? "bg-[#6C5CE7] text-white self-end"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-medium text-gray-600">
                      {msg.nickname || "Unknown"}
                    </p>
                  )}
                  <p>{msg.message}</p>
                  <p className="text-xs text-right opacity-60">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Field */}
      <div className="p-3 border-t flex items-center bg-gray-100">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-grow px-3 py-2 text-sm rounded-full border-gray-300 focus:ring-[#6C5CE7]"
        />
        <Button
          onClick={handleSendMessage}
          className="ml-2 rounded-full bg-[#6C5CE7] hover:bg-[#5A4BD1] text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
