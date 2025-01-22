"use client"

import { useState } from "react"
import { MainContent } from "@/components/home-main-content"
import { LeftSidebar } from "@/components/left-side-bar"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MainContent onOpenSidebar={() => setSidebarOpen(true)} />
    </div>
  )
}

