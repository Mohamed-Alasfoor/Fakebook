"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  type: string;
  created_at: string;
}

interface ChatSocketContextValue {
  ws: WebSocket | null;
  sendMessage: (msg: Omit<ChatMessage, "id" | "created_at">) => void;
  messages: ChatMessage[];
}

const ChatSocketContext = createContext<ChatSocketContextValue | undefined>(
  undefined
);

export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Ensure the initial state is an empty array
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => []);

  // Use a ref to ensure we only connect once
  const connectedRef = useRef(false);

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    let socket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      console.log("🔄 Connecting to private chat WebSocket...");
      socket = new WebSocket("ws://localhost:8080/chat/private");

      socket.onopen = () => {
        console.log("✅ Connected to private chat WebSocket");
      };

      socket.onmessage = (event) => {
        console.log("📩 Private chat message received:", event.data);
        try {
          const data: ChatMessage = JSON.parse(event.data);
          setMessages((prev) => {
            if (prev == null) {
              console.warn("prevMessages was null; defaulting to empty array");
              return [data];
            }
            return [...prev, data];
          });
        } catch (e) {
          console.error("Error parsing private chat message", e);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ Private chat WebSocket error:", error);
        reconnectTimer = setTimeout(connect, 5000);
      };

      socket.onclose = () => {
        console.warn("⚠️ Private chat WebSocket closed. Reconnecting in 5s...");
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
        id: Date.now().toString(), // Temporary ID; backend may override it
        created_at: new Date().toISOString(),
      };
      ws.send(JSON.stringify(message));
      setMessages((prev) => {
        if (prev == null) {
          console.warn(
            "prevMessages was null in sendMessage; defaulting to empty array"
          );
          return [message];
        }
        return [...prev, message];
      });
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return (
    <ChatSocketContext.Provider value={{ ws, sendMessage, messages }}>
      {children}
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
