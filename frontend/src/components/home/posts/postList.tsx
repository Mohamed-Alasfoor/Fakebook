"use client";

import React from "react";
import Cookies from "js-cookie";
import { useLikes } from "@/lib/hooks/useLikes";
import LoadingSpinner from "@/components/ui/loading-spinner";
import PostItem from "@/components/home/posts/postItem";
import { DeletePostButton } from "./DeletePostButton";

interface PostsListProps {
  posts: any[];
  isLoading?: boolean;
  isError?: boolean;
  onSelectPost: (post: any) => void;
}

export default function PostsList({
  posts,
  isLoading,
  isError,
  onSelectPost,
}: PostsListProps) {
  // (Optional) If you have "like" functionality
  const { likesState, likesCount, handleLike } = useLikes(posts || [], undefined);

  // Identify the current user (from cookies)
  const currentUserId = Cookies.get("user_id");

  // 1) Loading spinner
  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }

  // 2) Error state
  if (isError) {
    return <div className="text-red-500">Error loading posts. Please try again later.</div>;
  }

  // 3) Guard if posts is not an array
  if (!Array.isArray(posts)) {
    console.error("Error: posts is not an array", posts);
    return <div className="text-red-500">Something went wrong. Please try again.</div>;
  }

  // 4) Render the posts
  return (
    <div className="space-y-4">
      {posts.map((post, index) => {
        const hasLiked = likesState[post.id] ?? false;
        const postLikesCount = likesCount[post.id] ?? 0;

        return (
          <div
            key={post.id || index}
            className="relative bg-white p-4 rounded-lg shadow"
          >
            {/* If user is owner, display the "crazy trash icon" in top-right corner */}
            {post.user_id === currentUserId && (
              <div className="absolute top-2 right-2">
                <DeletePostButton postId={post.id} />
              </div>
            )}

            {/* Main content: e.g. title, text, image, likes, etc. */}
            <PostItem
              post={post}
              hasLiked={hasLiked}
              likesCount={postLikesCount}
              onLike={() => handleLike(post.id)}
              onSelectPost={() => onSelectPost(post)}
            />
          </div>
        );
      })}
    </div>
  );
}
