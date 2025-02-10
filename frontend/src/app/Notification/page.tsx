// app/notifications/page.tsx
"use client"; 
import React, { useEffect, useState } from "react";

// MUI
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Tooltip
} from "@mui/material";
import { Done as DoneIcon } from "@mui/icons-material";

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt?: string;
}

export default function CrazyNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [flash, setFlash] = useState(false); // For a quick background flash

  // 1) Fetch notifications from the Go backend
  useEffect(() => {
    fetch("http://localhost:8080/notifications/get", {
      method: "GET",
       credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch. Status: " + res.status);
        return res.json();
      })
      .then((data: Notification[]) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications:", err));
  }, []);

  // 2) Mark a single notification as read
  const markAsRead = (id: string) => {
    fetch(`http://localhost:8080/notifications/read?id=${id}`, {
      method: "PUT",
       credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to mark read. Status: " + res.status);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      })
      .catch((err) => console.error("Error marking read:", err));
  };

  // 3) Mark all as read + quick flash
  const markAllAsRead = () => {
    const unreadItems = notifications.filter((n) => !n.read);
    if (!unreadItems.length) return;

    Promise.all(
      unreadItems.map((n) =>
        fetch(`http://localhost:8080/notifications/read?id=${n.id}`, {
          method: "PUT",
          credentials: "include",
        })
      )
    )
      .then(() => {
        // Update state, then trigger a quick flash
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      })
      .catch((err) => console.error("Error marking all read:", err));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Some bright color set
  const colors = ["#FFC107", "#E91E63", "#00BCD4", "#8BC34A", "#FF5722", "#9C27B0"];
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  return (
    <Box
      sx={{
        height: "100vh",
        overflowY: "auto",
        position: "relative",
        // Wavy gradient background
        background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
        backgroundSize: "400% 400%",
        animation: "wave 10s ease-in-out infinite",

        // Quick flash effect
        transition: "background-color 0.2s",
        backgroundColor: flash ? "#fff176" : "transparent",

        // Keyframes
        "@keyframes wave": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },

        p: 3
      }}
    >
      <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2, color: "#2f2e41" }}>
        CRAZY NOTIFICATIONS!
      </Typography>

      <Button
        variant="contained"
        sx={{ mb: 3, backgroundColor: "#ff4081", "&:hover": { backgroundColor: "#ff79b0" } }}
        onClick={markAllAsRead}
        disabled={unreadCount === 0}
      >
        Mark All as Read ({unreadCount})
      </Button>

      {notifications.map((notif) => {
        const accentColor = notif.read ? "#bdbdbd" : randomColor();

        return (
          <Card
            key={notif.id}
            sx={{
              mb: 3,
              borderLeft: `10px solid ${accentColor}`,
              // Pulsing for unread
              animation: notif.read ? "none" : "pulse 1.5s infinite ease-in-out",
              // Rotate on hover
              transition: "transform 0.3s",
              "&:hover": { transform: "rotate(-1deg) scale(1.02)" },

              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.02)" },
                "100%": { transform: "scale(1)" },
              },
            }}
          >
            <CardContent>
              {/* Top row */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: notif.read ? 400 : 700,
                    color: notif.read ? "#616161" : "#212121",
                  }}
                >
                  {notif.type}
                </Typography>
                {!notif.read ? (
                  <Tooltip title="Mark as read">
                    <IconButton onClick={() => markAsRead(notif.id)}>
                      <DoneIcon sx={{ color: "#9b51e0" }} />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Already read">
                    <IconButton disabled>
                      <DoneIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Content row */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: randomColor() }}>N</Avatar>
                <Typography variant="body1">{notif.content}</Typography>
              </Box>

              <Typography variant="caption" sx={{ color: "#757575", display: "block", mt: 1 }}>
                {notif.createdAt ? `Created: ${notif.createdAt}` : ""}
              </Typography>
            </CardContent>
          </Card>
        );
      })}

      {notifications.length === 0 && (
        <Typography variant="h6" sx={{ color: "#666", mt: 4 }}>
          No notifications found. You're all caught up!
        </Typography>
      )}
    </Box>
  );
}
