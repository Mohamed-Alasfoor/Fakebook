"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Users, Settings, MessageCircle, LogOut, X } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { handleLogout } from "@/lib/functions/logout";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/hooks/swr/getUserProfile";
import Cookies from "js-cookie";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve user_id from cookies
    const storedUserId = Cookies.get("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch user profile data
  const { user, isLoading, isError } = useUserProfile(userId ?? undefined);

  const handleLogoutClick = () => {
    handleLogout(router);
  };

  const handleProfileClick = () => {
    if (userId) {
      router.push(`/profile/${userId}`);
    }
  };

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Users, label: "Groups", href: "/groups" },
    { icon: MessageCircle, label: "Chats", href: "/chat" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div
      className={`
        fixed top-0 left-0 z-50 w-80 h-screen
        bg-gradient-to-br from-purple-700 to-indigo-900
        text-white p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-purple-700 font-bold">F</span>
          </div>
          <span className="font-semibold text-lg">Fakebook</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search"
          className="bg-white/20 border-0 placeholder:text-white/70 text-white"
        />
      </div>

      {/* Navigation */}
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile Section */}
      <div className="pt-4 border-t border-white/10 mt-auto">
        {isLoading ? (
          <p className="text-center text-sm">Loading profile...</p>
        ) : isError || !user ? (
          <p className="text-center text-red-500 text-sm">
            Error loading profile
          </p>
        ) : (
          <div
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/10 rounded-lg"
            onClick={handleProfileClick}
          >
            <Avatar>
              <AvatarImage
                src={
                  user.avatar
                    ? `http://localhost:8080/avatars/${user.avatar}`
                    : "/profile.png"
                }
                alt="User Avatar"
              />

              <AvatarFallback>{user.nickname?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">
                {user.nickname || "Unknown User"}
              </h3>
              <p className="text-xs text-white/70">View Profile</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white"
              onClick={handleLogoutClick}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
