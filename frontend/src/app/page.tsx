"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LeftSidebar } from "@/components/home/leftSideBar";
import { MainContent } from "@/components/home/mainContent";
import { RightSidebar } from "@/components/Notifications/Sidebar";
import { checkAuth } from "@/lib/hooks/checkAuth";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true); // Notifications sidebar
  const router = useRouter();

  useEffect(() => {
    checkAuth(setLoading, router);
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right Sidebar (Notifications) */}
      <RightSidebar
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
      />

      {/* Main Content Container with margins to account for both sidebars */}
      <div className="flex-1 md:ml-64 md:mr-80">
        <MainContent onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
