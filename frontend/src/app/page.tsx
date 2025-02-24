"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainContent } from "@/components/home/mainContent";
import { checkAuth } from "@/lib/hooks/checkAuth";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth(setLoading, router);
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
          <LoadingSpinner size="large"/>
        </div>
    );
  }

  return (
    <div className="py-8 px-4">
      {/* This container is inside the layout’s max-w-screen-xl, so it stays centered */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <MainContent onOpenSidebar={function (): void {
          throw new Error("Function not implemented.");
        } } />
      </div>
    </div>
  );
}
