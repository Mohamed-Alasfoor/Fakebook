"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatSocket } from "@/lib/ChatSocketProvider";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  // The logged-in user's ID.
  currentUserId: string;
  // The ID of the user we are chatting with.
  userId: string;
}

export function MessageList({ currentUserId, userId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const { messages: socketMessages } = useChatSocket();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get<ChatMessage[]>(
          `http://localhost:8080/chat/history?with=${userId}`,
          { withCredentials: true }
        );
        setHistoryMessages(res.data ?? []);
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
        setHistoryMessages([]);
      }
    };
    fetchMessages();
  }, [userId]);

  // Filter socket messages relevant to the conversation.
  const filteredSocketMessages = socketMessages.filter(
    (msg) =>
      (msg.sender_id === currentUserId && msg.receiver_id === userId) ||
      (msg.sender_id === userId && msg.receiver_id === currentUserId)
  );

  // Merge history and socket messages and sort by timestamp.
  const mergedMessages = [...historyMessages, ...filteredSocketMessages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mergedMessages]);

  return (
    <ScrollArea className="flex-grow p-6">
      {mergedMessages.length === 0 ? (
        <p className="text-center text-gray-400">
          No messages yet. Start the conversation!
        </p>
      ) : (
        mergedMessages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-4 ${
              message.sender_id === currentUserId
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-2xl max-w-xs ${
                message.sender_id === currentUserId
                  ? "bg-[#6C5CE7] text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="text-sm">{message.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
}
