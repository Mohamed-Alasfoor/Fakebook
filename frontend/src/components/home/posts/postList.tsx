import { Post } from "@/types/post";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";
import { useLikes } from "@/lib/hooks/useLikes"; 
import { PostView } from "@/components/home/posts/postView"; 

interface PostsListProps {
  posts: Post[];
  isLoading: boolean;
  isError: boolean;
  onSelectPost: (post: Post) => void;
  refreshPosts: () => void;
}

export function PostsList({ posts, isLoading, isError, onSelectPost, refreshPosts }: PostsListProps) {
  const { likesState, likesCount, handleLike } = useLikes(posts, refreshPosts);

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Error loading posts. Please try again later.</div>;
  }

  return (
    <>
      {posts.map((post) => {
        const hasLiked = likesState[post.id] ?? post.has_liked;
        const currentLikesCount = likesCount[post.id] ?? post.likes_count;

        return (
          <div
            className="bg-white rounded-lg shadow p-4 mb-4 cursor-pointer transition-all hover:shadow-md"
            key={post.id}
            onClick={() => onSelectPost(post)} // Select post when clicked
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarImage src={post.userProfileImage} alt={post.nickname} />
                <AvatarFallback>{post.nickname?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{post.nickname}</h3>
                <p className="text-sm text-gray-500">{post.created_at}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{post.content}</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button
                className={`flex items-center gap-2 ${hasLiked ? "text-red-500" : "text-gray-500"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(post.id);
                }}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? "text-red-500" : ""}`} /> {currentLikesCount} Likes
              </button>
              <button className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> {post.comments_count} Comments
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
