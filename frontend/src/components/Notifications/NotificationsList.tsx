"use client"; 
import React, { useState, useEffect } from "react";
import { List, ListItem, ListItemText, IconButton } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { fetchNotifications, markNotificationAsRead } from "@/lib/notifications";

interface NotificationType {
  id: string;
  type: string;
  content: string;
  post_id?: string;
  related_user_id?: string;
  group_id?: string;
  event_id?: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    // Fetch notifications once the component mounts
    fetchNotifications()
      .then(data => {
        setNotifications(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      // Update the local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <List>
      {notifications.map(notification => (
        <ListItem
          key={notification.id}
          secondaryAction={
            !notification.read && (
              <IconButton onClick={() => handleMarkRead(notification.id)}>
                <CheckIcon />
              </IconButton>
            )
          }
        >
          <ListItemText
            primary={notification.type}
            secondary={`${notification.content} — ${notification.created_at}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
