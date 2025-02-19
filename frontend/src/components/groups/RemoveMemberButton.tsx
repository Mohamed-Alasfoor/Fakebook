// components/groups/RemoveMemberButton.tsx
"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";
import React from "react";

interface RemoveMemberButtonProps {
  groupId: string;
  userId: string; // The ID of the member to be removed.
  onRemove?: () => void;
}

export function RemoveMemberButton({ groupId, userId, onRemove }: RemoveMemberButtonProps) {
  const handleRemove = async () => {
    try {
      const response = await axios.delete("http://localhost:8080/groups/remove", {
        data: { group_id: groupId, user_id: userId },
        withCredentials: true,
      });
      alert(response.data);
      if (onRemove) onRemove();
    } catch (error: any) {
      console.error("Error removing member:", error);
      alert(error.response?.data || "Error removing member.");
    }
  };

  return (
    <Button variant="destructive" onClick={handleRemove}>
      Remove Member
    </Button>
  );
}
