"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useUserProfile } from "@/lib/hooks/swr/getUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LeftSidebar } from "@/components/home/leftSideBar";
import { RightSidebar } from "@/components/Notifications/Sidebar";

export default function SettingsPage() {
  // This state helps us delay rendering until after mounting
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current user id from cookies (client-only)
  const userId = Cookies.get("user_id");

  // Always call your SWR hook regardless of mounted state
  const { user, isLoading, isError, refreshUser } = useUserProfile(userId);

  // Local state for profile details.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [message, setMessage] = useState("");

  // When user data is fetched, update local state.
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setNickname(user.nickname || "");
      setAboutMe(user.about_me || "");
      setAvatar(user.avatar || "");
      setIsPrivate(user.private);
    }
  }, [user]);

  // Handler for profile update.
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://localhost:8080/users/profile/update",
        {
          first_name: firstName,
          last_name: lastName,
          nickname: nickname,
          about_me: aboutMe,
          avatar: avatar, // Adjust if you add file upload support later
        },
        { withCredentials: true }
      );
      setMessage("Profile updated successfully!");
      refreshUser();
    } catch (err) {
      console.error(err);
      setMessage("Error updating profile.");
    }
  };

  // Handler for toggling privacy.
  const handleTogglePrivacy = async () => {
    try {
      await axios.put(
        "http://localhost:8080/users/profile/privacy",
        { private: !isPrivate },
        { withCredentials: true }
      );
      setIsPrivate(!isPrivate);
      setMessage("Privacy setting updated!");
      refreshUser();
    } catch (err) {
      console.error(err);
      setMessage("Error updating privacy setting.");
    }
  };

  // Render a fallback if not mounted.
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <LeftSidebar isOpen={true} onClose={() => {}} />

      {/* Main Content Area */}
      <div className="flex-1 max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#6C5CE7]">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="aboutMe">About Me</Label>
                <Input
                  id="aboutMe"
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                />
              </div>
              {/* Optionally, add an input for avatar if desired */}
              <Button type="submit" className="bg-[#6C5CE7] text-white">
                Update Profile
              </Button>
            </form>

            {/* Privacy Toggle Section */}
            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-semibold">Privacy Settings</h2>
              <p className="mb-2">
                Your account is currently{" "}
                <span className="font-bold">
                  {isPrivate ? "Private" : "Public"}
                </span>
                .
              </p>
              <Button
                onClick={handleTogglePrivacy}
                className="bg-[#6C5CE7] text-white"
              >
                Switch to {isPrivate ? "Public" : "Private"} Account
              </Button>
            </div>

            {message && <p className="mt-4 text-green-600">{message}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar (Notifications) */}
      <RightSidebar isOpen={true} onClose={() => {}} />
    </div>
  );
}
