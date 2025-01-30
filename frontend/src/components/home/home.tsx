"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LeftSidebar } from "@/components/home/leftSideBar";
import { MainContent } from "@/components/home/mainContent";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:8080/posts/all", { 
          withCredentials: true,
        });

        if (response.status === 200 && response.data?.authenticated) {
          setLoading(false); // User is authenticated
        } else {
          router.push("/login"); // Redirect to login page
        }
      } catch (error) {
        router.push("/login"); // Redirect to login on error
      }
    };

    checkAuth();
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
