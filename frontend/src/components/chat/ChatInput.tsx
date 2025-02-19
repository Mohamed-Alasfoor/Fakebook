"use client";

import { useState } from "react";
import { useChatSocket } from "@/lib/ChatSocketProvider";

interface ChatInputProps {
  // The logged-in user's ID.
  currentUserId: string;
  // The ID of the user we are chatting with.
  userId: string;
}

export function ChatInput({ currentUserId, userId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { sendMessage } = useChatSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // Send the message over the WebSocket using snake_case fields.
    sendMessage({
      sender_id: currentUserId,
      receiver_id: userId,
      message: message,
      type: "message",
    });
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
      <input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </form>
  );
}
