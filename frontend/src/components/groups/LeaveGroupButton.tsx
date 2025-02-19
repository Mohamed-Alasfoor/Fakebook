// components/groups/LeaveGroupButton.tsx
"use client";

import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface LeaveGroupButtonProps {
  groupId: string;
  onLeave?: () => void;
}

export function LeaveGroupButton({ groupId, onLeave }: LeaveGroupButtonProps) {
  const handleLeave = async () => {
    try {
      const response = await axios.delete("http://localhost:8080/groups/leave", {
        data: { group_id: groupId },
        withCredentials: true,
      });
      alert(response.data);
      if (onLeave) onLeave();
    } catch (error: any) {
      console.error("Error leaving group:", error);
      alert(error.response?.data || "Error leaving group.");
    }
  };

  return (
    <Button variant="destructive" onClick={handleLeave}>
      Leave Group
    </Button>
  );
}
