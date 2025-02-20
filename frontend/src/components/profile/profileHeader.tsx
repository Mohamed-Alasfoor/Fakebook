"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { CalendarIcon, UserIcon, UsersIcon, LockIcon } from "lucide-react";

interface ProfileHeaderProps {
  user: any;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const router = useRouter();

  // 1) Local state to track user data
  const [localUser, setLocalUser] = useState(user);

  // If the parent passes a new user, sync local state
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 2) Follow logic
  const followUser = async (followedId: string) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/follow",
        { followed_id: followedId },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      alert("Follow Response: " + response.data);

      // Update local state so the button changes to "Unfollow"
      setLocalUser((prev: any) => ({
        ...prev,
        is_following: true,
        followers_count: prev.followers_count + 1,
      }));
    } catch (error) {
      alert("Error following user");
    }
  };

  // 3) Unfollow logic
  const unfollowUser = async (followedId: string) => {
    try {
      const response = await axios.delete("http://localhost:8080/unfollow", {
        data: { followed_id: followedId },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      alert(response.data);

      // Update local state so the button changes to "Follow"
      setLocalUser((prev: any) => ({
        ...prev,
        is_following: false,
        followers_count: prev.followers_count - 1,
      }));
    } catch (error) {
      alert("Error unfollowing user");
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
          <Avatar className="w-32 h-32">
            <AvatarImage
              src={
                localUser.avatar
                  ? `http://localhost:8080/avatars/${localUser.avatar}`
                  : "/profile.png"
              }
              alt={`${localUser.first_name} ${localUser.last_name}`}
            />
            <AvatarFallback>
              {localUser.first_name[0]}
              {localUser.last_name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {localUser.first_name} {localUser.last_name}
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              @{localUser.nickname}
            </p>
            <p className="text-lg mb-4">{localUser.about_me}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>Joined {formatDate(localUser.date_of_birth)}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <span>{localUser.followers_count} Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4" />
                <span>{localUser.following_count} Following</span>
              </div>
              {localUser.private && (
                <div className="flex items-center gap-1">
                  <LockIcon className="w-4 h-4" />
                  <span>Private Account</span>
                </div>
              )}
            </div>
          </div>

          {/* Button Logic */}
          {localUser.is_my_profile ? (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/settings")}
            >
              Edit Profile
            </Button>
          ) : !localUser.is_following ? (
            <Button
              className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
              onClick={() => followUser(localUser.id)}
            >
              {localUser.private ? "Request to Follow" : "Follow"}
            </Button>
          ) : (
            <Button
              className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
              onClick={() => unfollowUser(localUser.id)}
            >
              Unfollow
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
