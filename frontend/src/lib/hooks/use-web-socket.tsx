"use client";

import { useState, useEffect, useCallback } from "react";

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
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
      }
    },
    [socket, isConnected]
  );

  return { socket, isConnected, sendMessage };
}
