import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { X, Image, Globe, Lock, Users, User } from "lucide-react";
import axios from "axios";
import { useFollowers } from "@/lib/hooks/swr/useFollowers";
import Cookies from "js-cookie";

interface CreatePostPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (post: any) => void;
}

export function CreatePostPopup({
  isOpen,
  onClose,
  onCreatePost,
}: CreatePostPopupProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [privacy, setPrivacy] = useState("public");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const maxChars = 500; // Maximum allowed characters

  // Get logged-in user's ID from cookies and fetch real followers
  const loggedInUserId = Cookies.get("user_id") || "";
  const { followers, isLoading: followersLoading } =
    useFollowers(loggedInUserId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setContent(text);
      setError("");
    } else {
      setError(`Content cannot exceed ${maxChars} characters.`);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!content.trim()) {
        alert("Content cannot be empty");
        return;
      }

      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("privacy", privacy);
      if (image) {
        formData.append("file", image);
      }
      if (privacy === "private") {
        selectedUsers.forEach((user) =>
          formData.append("allowed_users[]", user)
        );
      }

      const response = await fetch("http://localhost:8080/posts", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create post");
      }

      const result = await response.json();
      alert("Post created successfully!");

      onCreatePost((prevPosts: any[]) =>
        Array.isArray(prevPosts) ? [result, ...prevPosts] : [result]
      );

      // Reset form
      setContent("");
      setPrivacy("public");
      setSelectedUsers([]);
      setImage(null);
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create New Post
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={handleContentChange}
            className="min-h-[180px] text-lg"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-sm text-gray-500">
            Character count: {content.length}/{maxChars}
          </p>

          {/* Image Upload */}
          <div className="flex items-center gap-4">
            <Label
              htmlFor="image-upload"
              className="cursor-pointer flex items-center gap-2 text-[#6C5CE7] hover:text-[#6C5CE7]/80"
            >
              <Image className="h-6 w-6" />
              <span className="text-base font-medium">
                {image ? "Change Image" : "Add Image"}
              </span>
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {image && (
              <span className="text-sm text-gray-500">{image.name}</span>
            )}
          </div>

          {/* Privacy Selection */}
          <Select value={privacy} onValueChange={setPrivacy}>
            <SelectTrigger className="w-full text-base">
              <SelectValue placeholder="Select privacy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span>Public</span>
                </div>
              </SelectItem>
              <SelectItem value="almost-private">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Almost Private</span>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <span>Private</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Private user selection using real followers */}
          {privacy === "private" && (
            <div>
              <Label className="mb-2 block font-medium">
                Select users who can see this post:
              </Label>
              {followersLoading ? (
                <p>Loading followers...</p>
              ) : (
                <div className="max-h-60 overflow-y-auto border p-2 rounded space-y-2">
                  {followers && followers.length > 0 ? (
                    followers.map((follower: any) => (
                      <div key={follower.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`follower-${follower.id}`}
                          className="mr-2"
                          checked={selectedUsers.includes(follower.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers((prev) => [
                                ...prev,
                                follower.id,
                              ]);
                            } else {
                              setSelectedUsers((prev) =>
                                prev.filter((id) => id !== follower.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`follower-${follower.id}`}
                          className="flex items-center gap-2"
                        >
                          <User className="h-5 w-5" />
                          <span>{follower.nickname}</span>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p>No followers available</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="w-full bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white py-6 text-lg font-semibold"
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
