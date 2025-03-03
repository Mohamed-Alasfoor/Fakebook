"use client";

import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

interface RemoveMemberButtonProps {
  groupId: string;
  userId: string;       // The ID of the member to remove
  onRemove?: () => void // Optional callback for updating local state
}

const MySwal = withReactContent(Swal);

export function RemoveMemberButton({ groupId, userId, onRemove }: RemoveMemberButtonProps) {
  const handleRemove = async () => {
    const result = await MySwal.fire({
      title: "Remove Member?",
      text: "Are you sure you want to remove this member from the group?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#6C5CE7",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // Make a DELETE request with { group_id, user_id } in the body
        const response = await axios.delete("http://localhost:8080/groups/remove", {
          data: {
            group_id: groupId,
            user_id: userId,
          },
          withCredentials: true,
        });

        // Success alert
        await MySwal.fire({
          title: "Member Removed",
          text: response.data,
          icon: "success",
          confirmButtonColor: "#6C5CE7",
        });

        if (onRemove) onRemove();
      } catch (error: unknown) {
        console.error("Error removing member:", error);
      
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 403) {
            await MySwal.fire({
              title: "Forbidden",
              text: "Only the group creator can remove members.",
              icon: "error",
              confirmButtonColor: "#6C5CE7",
            });
          } else {
            await MySwal.fire({
              title: "Error",
              text: error.response?.data || "Error removing member.",
              icon: "error",
              confirmButtonColor: "#6C5CE7",
            });
          }
        } else {
          // Handle non-Axios errors
          await MySwal.fire({
            title: "Unexpected Error",
            text: "An unexpected error occurred while removing the member.",
            icon: "error",
            confirmButtonColor: "#6C5CE7",
          });
        }
      }
      
    }
  };

  return (
    <Button variant="destructive" onClick={handleRemove}>
      Remove Member
    </Button>
  );
}
