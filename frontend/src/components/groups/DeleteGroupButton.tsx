// components/groups/DeleteGroupButton.tsx
"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import Alert from "@/components/ui/alert";
import { set } from "date-fns";
interface DeleteGroupButtonProps {
  groupId: string;
  onDelete?: () => void;
}

export function DeleteGroupButton({ groupId, onDelete }: DeleteGroupButtonProps) {
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const handleDelete = async () => {
    try {
      const response = await axios.delete(`http://localhost:8080/groups/delete?group_id=${groupId}`, {
        withCredentials: true,
      });
      setAlert({ type: "success", message: "Group deleted successfully!" });
      if (onDelete) onDelete();
    } catch (error: any) {
      console.error("Error deleting group:", error);
      setAlert({ type: "error", message: "Failed to delete group. Please try again." });
    }
  };

  return (
   
    <> {alert && (
      <Alert
        title={alert.type === "success" ? "Success" : "Error"}
        message={alert.message}
        type={alert.type}
        duration={5000}
        onClose={() => setAlert(null)}
      />
    )}
      <Button variant="destructive" onClick={handleDelete}>
      Delete Group
    </Button>
    </>
  );
}
