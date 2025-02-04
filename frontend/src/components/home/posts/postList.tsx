import { useLikes } from "@/lib/hooks/useLikes";
import PostItem from "@/components/home/posts/postItem";

interface PostsListProps {
  posts: any[];
  isLoading?: boolean;
  isError?: boolean;
  onSelectPost: (post: any) => void;
  refreshPosts?: () => void;  // Pass refresh function
}

export default function PostsList({ posts, isLoading, isError, onSelectPost, refreshPosts }: PostsListProps) {
  const { likesState, likesCount, handleLike } = useLikes(posts || [], refreshPosts); // Ensure `posts` is always an array

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div className="text-red-500">Error loading posts. Please try again later.</div>;

  if (!Array.isArray(posts)) {
    console.error("Error: posts is not an array", posts);
    return <div className="text-red-500">Something went wrong. Please try again.</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          hasLiked={likesState[post.id] ?? false}
          likesCount={likesCount[post.id] ?? 0}
          onLike={() => handleLike(post.id)}
          onSelectPost={() => onSelectPost(post)}
        />
      ))}
    </div>
  );
}
