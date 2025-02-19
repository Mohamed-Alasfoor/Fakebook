import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PostItemProps {
  post: any;
  hasLiked: boolean;
  likesCount: number;
  onLike: () => void;
  onSelectPost: () => void;
}

export default function PostItem({
  post,
  hasLiked,
  likesCount,
  onLike,
  onSelectPost,
}: PostItemProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 cursor-pointer transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/profile/${post.user_id}`} passHref>
          <Avatar className="cursor-pointer hover:opacity-80 transition">
            <AvatarImage
              src={
                post.avatar
                  ? `http://localhost:8080/avatars/${post.avatar}`
                  : "/profile.png"
              }
              alt={post.nickname}
            />

            <AvatarFallback>{post.nickname?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>

        <div>
          <Link href={`/profile/${post.user_id}`} passHref>
            <h3 className="font-semibold cursor-pointer hover:underline">
              {post.nickname}
            </h3>
          </Link>
          <p className="text-sm text-gray-500">{post.created_at}</p>
        </div>
      </div>

      <div onClick={onSelectPost}>
        <p className="text-gray-600 mb-4 truncate w-full overflow-ellipsis">
          {post.content}
        </p>

        {post.image_url && (
          <img
            src={`http://localhost:8080/uploads/${post.image_url}`}
            alt="Post"
            className="w-full rounded-lg mb-4"
          />
        )}

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <button
            className={`flex items-center gap-2 ${
              hasLiked ? "text-red-500" : "text-gray-500"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? "text-red-500" : ""}`} />{" "}
            {likesCount} Likes
          </button>
          <button className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> {post.comments_count} Comments
          </button>
        </div>
      </div>
    </div>
  );
}
