"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LeftSidebar } from "@/components/home/leftSideBar";
import { MainContent } from "@/components/home/mainContent";
import { checkAuth } from "@/lib/hooks/checkAuth";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth(setLoading, router);
  }, [router]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Checking authentication...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-64">
        <MainContent onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
