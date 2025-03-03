"use client";

import React from "react";
import Cookies from "js-cookie";
import { useLikes } from "@/lib/hooks/useLikes";
import LoadingSpinner from "@/components/ui/loading-spinner";
import PostItem from "@/components/home/posts/postItem";
import { DeletePostButton } from "./DeletePostButton";
import { Post } from "@/types/post";

interface PostsListProps {
  posts: Post[];
  isLoading?: boolean;
  isError?: boolean;
  onSelectPost: (post: Post) => void;
}

export default function PostsList({
  posts,
  isLoading,
  isError,
  onSelectPost,
}: PostsListProps) {
  const { likesState, likesCount, handleLike } = useLikes(posts || [], undefined);

  const currentUserId = Cookies.get("user_id");

  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }

  
  if (isError) {
    return <div className="text-red-500">Error loading posts. Please try again later.</div>;
  }

  //  Guard if posts is not an array
  if (!Array.isArray(posts)) {
    return <div className="text-red-500">Something went wrong. Please try again.</div>;
  }

  //  Render the posts
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
            {/*    if user is owner , display the trash icon in topright corner */}
            {post.user_id === currentUserId && (
              <div className="absolute top-2 right-2">
                <DeletePostButton postId={post.id} />
              </div>
            )}

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
