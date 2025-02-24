// components/groups/RemoveMemberButton.tsx
"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import Alert from "@/components/ui/alert";
import { set } from "date-fns";
interface RemoveMemberButtonProps {
  groupId: string;
  userId: string; // The ID of the member to be removed.
  onRemove?: () => void;
}

export function RemoveMemberButton({ groupId, userId, onRemove }: RemoveMemberButtonProps) {
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const handleRemove = async () => {
    try {
      const response = await axios.delete("http://localhost:8080/groups/remove", {
        data: { group_id: groupId, user_id: userId },
        withCredentials: true,
      });
      setAlert({ type: "success", message: "Member removed successfully!" });
      if (onRemove) onRemove();
    } catch (error: any) {
      console.error("Error removing member:", error);
      setAlert({ type: "error", message: "Failed to remove member. Please try again." });
    }
  };

  return (
    <>
    {alert && (
        <Alert
          title={alert.type === "success" ? "Success" : "Error"}
          message={alert.message}
          type={alert.type}
          duration={5000}
          onClose={() => setAlert(null)}
        />
      )}
    <Button variant="destructive" onClick={handleRemove}>
      Remove Member
    </Button>
    </>
  );
}
