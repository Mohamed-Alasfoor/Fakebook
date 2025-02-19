// components/groups/DeleteGroupButton.tsx
"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";
import React from "react";

interface DeleteGroupButtonProps {
  groupId: string;
  onDelete?: () => void;
}

export function DeleteGroupButton({ groupId, onDelete }: DeleteGroupButtonProps) {
  const handleDelete = async () => {
    try {
      const response = await axios.delete(`http://localhost:8080/groups/delete?group_id=${groupId}`, {
        withCredentials: true,
      });
      alert(response.data);
      if (onDelete) onDelete();
    } catch (error: any) {
      console.error("Error deleting group:", error);
      alert(error.response?.data || "Error deleting group.");
    }
  };

  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete Group
    </Button>
  );
}
