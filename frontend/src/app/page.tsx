"use client"

import { useState } from "react"
import { MainContent } from "@/components/home/home-main-content"
import { LeftSidebar } from "@/components/home/left-side-bar"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <MainContent onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </div>
  )
}
