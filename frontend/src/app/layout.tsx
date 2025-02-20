"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";

import { LeftSidebar } from "@/components/home/leftSideBar";
import { RightSidebar } from "@/components/Notifications/Sidebar";
import { ChatSocketProvider } from "@/lib/ChatSocketProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar open states for small screens
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Hide sidebars on login/register
  const pathname = usePathname();
  const hideSidebarRoutes = ["/login", "/register"];
  const shouldHideSidebars = hideSidebarRoutes.includes(pathname);

  if (shouldHideSidebars) {
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* Wrap everything in ChatSocketProvider so it doesn't unmount */}
          <ChatSocketProvider>{children}</ChatSocketProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ChatSocketProvider here as well */}
        <ChatSocketProvider>
          <div className="relative min-h-screen bg-gray-50">
            {/* Left & Right Sidebars */}
            <LeftSidebar isOpen={leftOpen} onClose={() => setLeftOpen(false)} />
            <RightSidebar
              isOpen={rightOpen}
              onClose={() => setRightOpen(false)}
            />

            {/*
              Main container:
              - pinned sidebars on xl (≥1280px): xl:ml-64 xl:mr-80
              - limit overall width: max-w-screen-xl, center: mx-auto
            */}
            <div className="xl:ml-64 xl:mr-80">
              <div className="max-w-screen-xl mx-auto w-full">
                {/*
                  On screens below xl, show 2 icon buttons:
                  1) Hamburger menu (Menu icon) -> toggles left sidebar
                  2) Bell icon -> toggles right sidebar
                */}
                <div className="flex items-center justify-between p-4 xl:hidden">
                  {/* LEFT SIDEBAR ICON */}
                  <button
                    onClick={() => setLeftOpen(!leftOpen)}
                    className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-md"
                  >
                    <Menu className="w-6 h-6" />
                  </button>

                  {/* RIGHT SIDEBAR ICON */}
                  <button
                    onClick={() => setRightOpen(!rightOpen)}
                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-md"
                  >
                    <Bell className="w-6 h-6" />
                  </button>
                </div>

                {/* Page Content */}
                <main>{children}</main>
              </div>
            </div>
          </div>
        </ChatSocketProvider>
      </body>
    </html>
  );
}
