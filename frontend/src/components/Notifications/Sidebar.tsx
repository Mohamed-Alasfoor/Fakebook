"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Cookies from "js-cookie";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  post_id?: string;
  related_user_id?: string;
  group_id?: string;
  event_id?: string;
  read: boolean;
  created_at: string;
}

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(timestamp: string): string {
  const time = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - time.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} days ago`;
}

export function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const currentUserId = Cookies.get("user_id");

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/notifications/get", {
        credentials: "include",
      });
      if (!res.ok) {
        console.error(
          "Failed to fetch notifications, status:",
          res.status,
          await res.text()
        );
        setNotifications([]);
        return;
      }
      const data = await res.json();
      setNotifications(data ?? []);
    } catch (error) {
      console.error("Error fetching notifications", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/notifications/read?id=${notificationId}`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      } else {
        console.error("Failed to mark notification as read", res.status);
      }
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  const handleJoinRequestAction = async (
    notification: Notification,
    action: "accept" | "decline"
  ) => {
    try {
      const res = await fetch("http://localhost:8080/groups/join/respond", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: notification.group_id,
          user_id: notification.related_user_id,
          action: action,
        }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      } else {
        console.error("Failed to handle join request", res.status);
      }
    } catch (error) {
      console.error("Error handling join request", error);
    }
  };

  const handleInvitationAction = async (
    notification: Notification,
    action: "accept" | "decline"
  ) => {
    try {
      const res = await fetch("http://localhost:8080/groups/invite/respond", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: notification.group_id,
          action: action,
        }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      } else {
        console.error("Failed to handle invitation", res.status);
      }
    } catch (error) {
      console.error("Error handling invitation", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("http://localhost:8080/notifications/read-all", {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } else {
        console.error("Failed to mark all as read", res.status);
      }
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  return (
    <div
      className={`
        fixed top-0 right-0 z-50 h-screen
        w-80 bg-gradient-to-br from-purple-700 to-indigo-900
        text-white p-6 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        xl:translate-x-0
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7" />
          <span className="text-2xl font-semibold">Notifications</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden text-white"
          onClick={onClose}
        >
          <X className="w-7 h-7" />
        </Button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-center text-lg mt-10">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-lg mt-10">No notifications yet!</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                onClick={() => {
                  // If not a join request or invite, simply mark as read on click.
                  if (
                    notification.type !== "group_join_request" &&
                    notification.type !== "group_invite"
                  ) {
                    markNotificationAsRead(notification.id);
                  }
                }}
                className={`
                  flex flex-col p-4 rounded-xl shadow-md transition transform hover:scale-105 cursor-pointer
                  ${notification.read ? "bg-white/10" : "bg-white/20"}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src="/profile.png"
                        alt="Notification Avatar"
                      />
                      <AvatarFallback>
                        {notification.content.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {!notification.read && (
                      <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        notification.read ? "opacity-80" : "font-semibold"
                      }`}
                    >
                      {notification.content}
                    </p>
                    <span className="text-xs text-gray-200">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>

                {/* If the notification is a join request or an invitation, show action buttons */}
                {(notification.type === "group_join_request" ||
                  notification.type === "group_invite") &&
                  !notification.content.toLowerCase().includes("has been") &&
                  currentUserId === notification.user_id && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        className="w-full border-green-400 text-green-400 hover:bg-green-500 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.type === "group_join_request") {
                            handleJoinRequestAction(notification, "accept");
                          } else {
                            handleInvitationAction(notification, "accept");
                          }
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-400 text-red-400 hover:bg-red-500 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.type === "group_join_request") {
                            handleJoinRequestAction(notification, "decline");
                          } else {
                            handleInvitationAction(notification, "decline");
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
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
          onClick={markAllAsRead}
        >
          Mark all as read
        </Button>
      </div>
    </div>
  );
}
