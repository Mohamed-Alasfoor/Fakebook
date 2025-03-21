"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useUserProfile } from "@/lib/hooks/swr/getUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function SettingsPage() {
  // Prevent hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current user id from cookies.
  const userId = Cookies.get("user_id");

  // Fetch user profile data.
  const { user, isLoading, isError, refreshUser } = useUserProfile(userId);

  // Local state for profile details.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [avatar, setAvatar] = useState(""); // current avatar filename
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(""); // URL for image preview
  const [isPrivate, setIsPrivate] = useState(false);
  const [message, setMessage] = useState("");
  // New state to track the type of message: "success" or "error"
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // When user data is fetched, update local state.
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setNickname(user.nickname || "");
      setAboutMe(user.about_me || "");
      setAvatar(user.avatar || "");
      setIsPrivate(user.private);
      // Use the correct URL for serving avatars.
      if (user.avatar) {
        const url = `http://localhost:8080/avatars/${user.avatar}`;
        setAvatarPreview(url);
        console.log("Avatar preview URL:", url);
      }
    }
  }, [user]);

  // Handler for avatar file input change.
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setAvatarPreview(previewURL);
    }
  };

  // Handler for profile update.
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        formData.append("nickname", nickname);
        formData.append("about_me", aboutMe);
        formData.append("avatar", avatarFile);
        await axios.put(
          "http://localhost:8080/users/profile/update",
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        await axios.put(
          "http://localhost:8080/users/profile/update",
          {
            first_name: firstName,
            last_name: lastName,
            nickname: nickname,
            about_me: aboutMe,
            avatar: avatar,
          },
          { withCredentials: true }
        );
      }
      setMessage("Profile updated successfully!");
      setMessageType("success");
      refreshUser();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data;
        
        if (typeof errorMessage === "string" && errorMessage.includes("Nickname already taken")) {
          setMessage("Nickname already taken. Please choose another.");
        } else {
          setMessage("Error updating profile.");
        }
      } else {
        setMessage("An unexpected error occurred.");
      }
  
      setMessageType("error");
    }
  };

  // Handler for toggling privacy.
  const handleTogglePrivacy = async () => {
    setMessage("");
    setMessageType("");
    try {
      await axios.put(
        "http://localhost:8080/users/profile/privacy",
        { private: !isPrivate },
        { withCredentials: true }
      );
      setIsPrivate(!isPrivate);
      setMessage("Privacy setting updated!");
      setMessageType("success");
      refreshUser();
    } catch (err: unknown) {
      console.log(err);
      setMessage("Error updating privacy setting.");
      setMessageType("error");
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }
  if (isLoading) return <LoadingSpinner size="large"/>;
  if (isError) return <div>Error loading profile.</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
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
              <div>
                <Label htmlFor="avatar">Avatar</Label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      No Avatar
                    </div>
                  )}
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full"
                  />
                </div>
              </div>
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

            {message && (
              <p
                className={`mt-4 ${
                  messageType === "error" ? "text-red-600" : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
