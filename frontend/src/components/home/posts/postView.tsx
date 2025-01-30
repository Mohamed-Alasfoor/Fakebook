import { Post } from "@/types/post";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";

interface PostViewProps {
  post: Post;
  onClose: () => void;
  handleLike: (postId: number) => Promise<void>; // ✅ Receive handleLike from parent
  likesState: { [key: number]: boolean };
  likesCount: { [key: number]: number };
}

export function PostView({ post, onClose, handleLike, likesState, likesCount }: PostViewProps) {
  const hasLiked = likesState[post.id] ?? post.has_liked;
  const currentLikesCount = likesCount[post.id] ?? post.likes_count;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <Button variant="ghost" size="sm" className="mb-4" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Posts
        </Button>
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarImage src={post.userProfileImage} alt="User Avatar" />
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
            onClick={() => handleLike(post.id)} // ✅ Now uses handleLike from PostsList
          >
            <Heart className={`w-5 h-5 ${hasLiked ? "text-red-500" : ""}`} /> {currentLikesCount} Likes
          </button>
          <button className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> {post.comments_count} Comments
          </button>
        </div>
      </div>
    </div>
  );
}
