// components/groups/InviteButton.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Alert from "@/components/ui/alert";
import { set } from "date-fns";
interface InviteButtonProps {
  groupId: string;
  // Optional callback to run after a successful invite (e.g. to refresh group data)
  onInviteSuccess?: () => void;
}

export function InviteButton({ groupId, onInviteSuccess }: InviteButtonProps) {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const handleInvite = async () => {
    if (!nickname.trim()) {
      setAlert({ type: "error", message: "Please enter a nickname." });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/groups/invite",
        { group_id: groupId, nickname },
        { withCredentials: true }
      );
      setAlert({ type: "success", message: "Invite sent successfully!" });
      setNickname("");
      setOpen(false);
      if (onInviteSuccess) {
        onInviteSuccess();
      }
    } catch (error: any) {
      setAlert({ type: "error", message: "Failed to invite member. Please try again." });
    } finally {
      setLoading(false);
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
     <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-[#6C5CE7] text-white">
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Input
            placeholder="Enter nickname to invite"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? "Inviting..." : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
   </>
  );
}
