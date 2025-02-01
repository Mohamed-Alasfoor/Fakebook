import { useState, useEffect } from "react";
import { usePosts } from "@/lib/hooks/swr/getPosts";
import PostItem from "@/components/home/posts/postItem";;

interface PostsListProps {
  posts: any[];
  isLoading: boolean;
  isError: boolean;
  onSelectPost: (post: any) => void;
}


export default function PostsList({ posts, isLoading, isError, onSelectPost }: PostsListProps) {
  const [likesState, setLikesState] = useState<{ [key: number]: boolean }>({});
  const [likesCount, setLikesCount] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (posts.length > 0) {
      const initialLikesState: { [key: number]: boolean } = {};
      const initialLikesCount: { [key: number]: number } = {};
      posts.forEach((post) => {
        initialLikesState[post.id] = post.has_liked;
        initialLikesCount[post.id] = post.likes_count;
      });
      setLikesState(initialLikesState);
      setLikesCount(initialLikesCount);
    }
  }, [posts]);

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div className="text-red-500">Error loading posts. Please try again later.</div>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          hasLiked={likesState[post.id]}
          likesCount={likesCount[post.id]}
          onLike={() => setLikesState((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
          onSelectPost={() => onSelectPost(post)}
        />
      ))}
    </div>
  );
}
