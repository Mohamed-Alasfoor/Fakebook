import { useState, useEffect } from "react";
import axios from "axios";
import { Post } from "@/types/post";

interface UseLikesReturn {
  likesState: { [key: number]: boolean };
  likesCount: { [key: number]: number };
  handleLike: (postId: number) => Promise<void>;
}

export function useLikes(initialPosts: Post[], refreshPosts?: () => void): UseLikesReturn {
  const [likesState, setLikesState] = useState<{ [key: number]: boolean }>({});
  const [likesCount, setLikesCount] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (initialPosts.length > 0) {
      setLikesState((prev) => {
        const newState = { ...prev };
        let hasChanged = false;

        initialPosts.forEach((post) => {
          if (newState[post.id] !== post.has_liked) {
            newState[post.id] = post.has_liked;
            hasChanged = true;
          }
        });

        return hasChanged ? newState : prev;
      });

      setLikesCount((prev) => {
        const newCount = { ...prev };
        let hasChanged = false;

        initialPosts.forEach((post) => {
          if (newCount[post.id] !== post.likes_count) {
            newCount[post.id] = post.likes_count;
            hasChanged = true;
          }
        });

        return hasChanged ? newCount : prev;
      });
    }
  }, [initialPosts]); 

  //  Handle like/unlike requests
  const handleLike = async (postId: number) => {
    try {
      const isLiked = likesState[postId] ?? false;

      // Optimistically update the UI
      setLikesState((prev) => ({ ...prev, [postId]: !isLiked }));
      setLikesCount((prev) => ({
        ...prev,
        [postId]: isLiked ? prev[postId] - 1 : prev[postId] + 1,
      }));

      if (isLiked) {
        // Unlike request
        await axios.delete("http://localhost:8080/posts/unlike", {
          params: { post_id: postId },
          withCredentials: true,
        });
      } else {
        // Like request
        await axios.post("http://localhost:8080/posts/like", null, {
          params: { post_id: postId },
          withCredentials: true,
        });
      }

      //  Refresh posts only when needed
      if (refreshPosts) refreshPosts();
    } catch (error) {
      console.error("Error toggling like:", error);

      // Rollback state changes on failure
      setLikesState((prev) => ({ ...prev, [postId]: likesState[postId] }));
      setLikesCount((prev) => ({ ...prev, [postId]: likesCount[postId] }));
    }
  };

  return {
    likesState,
    likesCount,
    handleLike,
  };
}
