import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Home, Users, Settings, MessageCircle, Bell, LogOut, X } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface LeftSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Users, label: "Groups", href: "/groups" },
    { icon: MessageCircle, label: "Chats", href: "/chats" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]

  return (
    <div
      className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-[#6C5CE7] text-white p-4 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:relative md:translate-x-0
    `}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-[#6C5CE7] font-bold">F</span>
          </div>
          <span className="font-semibold text-lg">Fakebook</span>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="relative mb-6">
        <Input placeholder="Search" className="bg-white/20 border-0 placeholder:text-white/70 text-white" />
      </div>

      <nav className="flex-1">
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

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar>
            <AvatarImage src="/profile.png" alt="Img" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">UserName</h3>
            <p className="text-xs text-white/70">Profile</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

