"use client";

import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const userId = Cookies.get("user_id");

    // Only establish WebSocket connection if user is logged in
    if (!userId) {
      console.warn("User not logged in, skipping WebSocket connection");
      return;
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("✅ WebSocket Connected");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("❌ WebSocket Disconnected");
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket && isConnected) {
        socket.send(message);
      } else {
        console.warn("Cannot send message, WebSocket is not connected");
      }
    },
    [socket, isConnected]
  );

  return { socket, isConnected, sendMessage };
}
