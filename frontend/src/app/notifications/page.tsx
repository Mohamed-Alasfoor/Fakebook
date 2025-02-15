"use client";
import React, { useState } from "react";
import { RightSidebar } from "@/components/Notifications/Sidebar";

export default function Notification() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <RightSidebar 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
    />
  );
}
