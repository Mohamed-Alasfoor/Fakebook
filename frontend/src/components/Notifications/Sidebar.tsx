"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Notification {
  id: number;
  message: string;
  avatar?: string;
  read?: boolean;
  timestamp?: string;
}

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: 1,
        message: "John Doe sent you a friend request.",
        avatar: "/profile.png",
        read: false,
        timestamp: "2 mins ago",
      },
      {
        id: 2,
        message: "Your group invitation has been accepted.",
        avatar: "/group.png",
        read: true,
        timestamp: "1 hour ago",
      },
      {
        id: 3,
        message: "Jane commented on your post.",
        avatar: "/profile2.png",
        read: false,
        timestamp: "3 hours ago",
      },
    ];
    setNotifications(demoNotifications);
  }, []);

  // Mark a single notification as read when clicked
  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div
      className={`
        fixed top-0 right-0 z-50 w-80 h-screen
        bg-gradient-to-br from-purple-700 to-indigo-900
        text-white p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7" />
          <span className="text-2xl font-semibold">Notifications</span>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={onClose}>
          <X className="w-7 h-7" />
        </Button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto pr-2">
        {notifications.length === 0 ? (
          <p className="text-center text-lg mt-10">No notifications yet!</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id)}
                className={`
                  flex items-center gap-4 p-4 rounded-xl shadow-md transition transform hover:scale-105 cursor-pointer
                  ${notification.read ? "bg-white/10" : "bg-white/20"}
                `}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notification.avatar || "/profile.png"} alt="Notification Avatar" />
                    <AvatarFallback>{notification.message.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {/* Show a red dot if the notification is unread */}
                  {!notification.read && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${notification.read ? "opacity-80" : "font-semibold"}`}>
                    {notification.message}
                  </p>
                  <span className="text-xs text-gray-200">{notification.timestamp}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <Button
          variant="outline"
          className="w-full border-white/30 text-white bg-teal-500 hover:bg-teal-600"
          onClick={handleMarkAllAsRead}
        >
          Mark all as read
        </Button>
      </div>
    </div>
  );
}
