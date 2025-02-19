"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import PostView from "@/components/groups/postView";
import { Post } from "@/types/groupTypes";

interface PostsTabProps {
  posts: Post[];
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (value: boolean) => void;
  postContent: string;
  setPostContent: (value: string) => void;
  postFile: File | null;
  setPostFile: (file: File | null) => void;
  handleCreatePost: () => void;
}

export default function PostsTab({
  posts,
  selectedPost,
  setSelectedPost,
  isCreatingPost,
  setIsCreatingPost,
  postContent,
  setPostContent,
  postFile,
  setPostFile,
  handleCreatePost,
}: PostsTabProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Group Posts</h3>
        <Dialog open={isCreatingPost} onOpenChange={setIsCreatingPost}>
          <DialogTrigger asChild>
            <Button className="bg-[#6C5CE7] text-white flex items-center px-4 py-2">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Post</DialogTitle>
            </DialogHeader>
            <Textarea
          placeholder="What's on your mind?"
          value={postContent}
          onChange={(e) => {
            const text = e.target.value;
            if (text.length <= 500) {
              setPostContent(text);
            }
          }}
          className="mt-2"
        />

            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPostFile(e.target.files?.[0] || null)}
              className="mt-2"
            />
            <Button
              className="w-full mt-3 bg-[#6C5CE7] text-white py-2"
              onClick={handleCreatePost}
            >
              Post
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {selectedPost ? (
        <PostView post={selectedPost} onClose={() => setSelectedPost(null)} />
      ) : posts.length === 0 ? (
        <p className="text-gray-500 text-center">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition duration-200 rounded-lg overflow-hidden bg-white"
              onClick={() => setSelectedPost(post)}
            >
              <CardContent className="p-5">
                {/* User Info Section */}
                <div className="flex items-center space-x-3">
                  <img
                    src={post.avatar || "/profile.png"}
                    alt="User Avatar"
                    className="w-12 h-12 rounded-full border border-gray-300 object-cover"
                  />
                  <div>
                    <p className="text-md font-semibold text-gray-800">
                      {post.nickname || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="mt-3 text-gray-900 text-sm leading-relaxed">
                  {post.content}
                </p>

                {/* Post Image (if available) */}
                {post.image_url && (
                  <div className="mt-3">
                    <img
                      src={`http://localhost:8080/uploads/${post.image_url}`}
                      alt="Post Image"
                      className="w-full rounded-lg border border-gray-300 object-cover max-h-[400px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
