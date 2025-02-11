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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Group Posts</h3>
        <Dialog open={isCreatingPost} onOpenChange={setIsCreatingPost}>
          <DialogTrigger asChild>
            <Button className="bg-[#6C5CE7] text-white flex items-center">
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
              onChange={(e) => setPostContent(e.target.value)}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPostFile(e.target.files?.[0] || null)
              }
            />
            <Button
              className="w-full mt-2 bg-[#6C5CE7] text-white"
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
        posts.map((post) => (
          <Card
            key={post.id}
            className="border shadow-sm cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">
                Posted on {new Date(post.created_at).toLocaleString()}
              </p>
              <p className="mt-2">{post.content}</p>
              {post.image_url && (
                <img
                  src={`http://localhost:8080/uploads/${post.image_url}`}
                  alt="Post Image"
                  className="mt-2 rounded-md"
                />
              )}
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
