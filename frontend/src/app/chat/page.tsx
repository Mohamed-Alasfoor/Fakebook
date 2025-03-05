"use client";

import { useRef, useEffect, useState } from "react";
import { UserList } from "@/components/chat/UserList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { User } from "@/types/chat";
import Cookies from "js-cookie";

export default function ChatPage() {
  console.log("ChatPage mount");
  const actualUserId = Cookies.get("user_id") || "";
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Online status socket in a ref so it doesn't re-open multiple times
  const onlineSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (onlineSocketRef.current) return; // already connected

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWebSocket = () => {
      const ws = new WebSocket("ws://localhost:8080/ws/online");
      onlineSocketRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected to WebSocket: /ws/online");
      };

      ws.onmessage = (event) => {
        console.log("📩 Raw WebSocket message:", event.data);
        try {
          const trimmedData =
            typeof event.data === "string" ? event.data.trim() : "";
          if (trimmedData.startsWith("{") || trimmedData.startsWith("[")) {
            const receivedUsers = JSON.parse(trimmedData);
            const formattedUsers: User[] = receivedUsers.map((user: User) => ({
              id: user.id,
              name: user.nickname || "You",
              avatar: user.avatar
                ? `http://localhost:8080/avatars/${user.avatar}`
                : "/default-avatar.png",
              online: user.online,
            }));
            setUsers(formattedUsers);
          } else {
            console.warn("Received non-JSON message:", event.data);
          }
        } catch (error) {
          console.log("❌ Error parsing WebSocket message:", error, event.data);
        }
      };

      ws.onerror = (error) => {
        console.log("❌ WebSocket error:", error);
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      };

      ws.onclose = () => {
        console.warn("⚠️ /ws/online connection closed. Reconnecting in 5s...");
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (onlineSocketRef.current) {
        onlineSocketRef.current.close();
        onlineSocketRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <UserList
        users={users}
        onSelectUser={setSelectedUser}
        selectedUser={selectedUser}
      />
      <ChatWindow currentUserId={actualUserId} user={selectedUser} />
    </div>
  );
}
