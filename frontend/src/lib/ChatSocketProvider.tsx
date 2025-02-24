"use client";

import NotificationPopup from "@/components/Notifications/notification-popup";
import Cookies from "js-cookie";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  type: string;
  created_at: string;
  sender_name: string;
}

interface ChatSocketContextValue {
  ws: WebSocket | null;
  sendMessage: (msg: Omit<ChatMessage, "id" | "created_at">) => void;
  messages: ChatMessage[];
}

const ChatSocketContext = createContext<ChatSocketContextValue | undefined>(undefined);

export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);

  const connectedRef = useRef(false);

  useEffect(() => {
    const userId = Cookies.get("user_id");

    // Prevent connection if user is not logged in
    if (!userId) {
      console.warn("User not logged in, skipping chat WebSocket connection");
      return;
    }

    if (connectedRef.current) return;
    connectedRef.current = true;

    let socket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      console.log("🔄 Connecting to chat WebSocket...");
      socket = new WebSocket("ws://localhost:8080/chat/private");

      socket.onopen = () => {
        console.log("✅ Connected to chat WebSocket");
      };

      socket.onmessage = (event) => {
        console.log("📩 Chat message received:", event.data);

        try {
          const data: ChatMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
          setLatestMessage(data);
        } catch (e) {
          console.error("Error parsing chat message", e);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ Chat WebSocket error:", error);
        reconnectTimer = setTimeout(connect, 5000);
      };

      socket.onclose = () => {
        console.warn("⚠️ Chat WebSocket closed. Reconnecting in 5s...");
        reconnectTimer = setTimeout(connect, 5000);
      };

      setWs(socket);
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  const sendMessage = (msg: Omit<ChatMessage, "id" | "created_at">) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        ...msg,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      ws.send(JSON.stringify(message));
      setMessages((prev) => [...prev, message]);
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return (
    <ChatSocketContext.Provider value={{ ws, sendMessage, messages }}>
      {children}
      {latestMessage && (
        <NotificationPopup
          message={latestMessage.message}
          username={`${latestMessage.sender_name}`}
          onClose={() => setLatestMessage(null)}
        />
      )}
    </ChatSocketContext.Provider>
  );
};

export const useChatSocket = () => {
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error("useChatSocket must be used within a ChatSocketProvider");
  }
  return context;
};
