"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { LeftSidebar } from "@/components/home/leftSideBar";
import { RightSidebar } from "@/components/Notifications/Sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // For toggling sidebars on smaller screens
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Hide sidebars on certain routes (e.g. /login, /register).
  const pathname = usePathname();
  const hideSidebarRoutes = ["/login", "/register"];
  const shouldHideSidebars = hideSidebarRoutes.includes(pathname);

  // If we are on /login or /register, don't show sidebars at all.
  if (shouldHideSidebars) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  // Otherwise, render sidebars + toggles + main content
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="relative min-h-screen bg-gray-50">
          {/* Left Sidebar */}
          <LeftSidebar isOpen={leftOpen} onClose={() => setLeftOpen(false)} />

          {/* Right Sidebar */}
          <RightSidebar isOpen={rightOpen} onClose={() => setRightOpen(false)} />

          {/*
            Main container offset for sidebars ONLY at XL breakpoint:
            .xl:ml-64 means left sidebar is pinned if >= 1280px wide
            .xl:mr-80 means right sidebar is pinned if >= 1280px wide
          */}
          <div className="xl:ml-64 xl:mr-80">
            {/* 
              We also limit overall width and center the content so pages look nice:
              .max-w-screen-xl .mx-auto 
            */}
            <div className="max-w-screen-xl mx-auto w-full">
              {/* 
                Buttons to open sidebars, but only visible below XL 
                (once the screen is big enough, sidebars are pinned anyway).
              */}
              <div className="flex items-center gap-4 p-4 xl:hidden">
                <button
                  onClick={() => setLeftOpen(!leftOpen)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md"
                >
                  Toggle Left
                </button>
                <button
                  onClick={() => setRightOpen(!rightOpen)}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md"
                >
                  Toggle Right
                </button>
              </div>

              <main>{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
