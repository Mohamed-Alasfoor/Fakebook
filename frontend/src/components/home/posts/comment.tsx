import { Comment } from "@/types/comment";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg">
      <Avatar>
        <AvatarImage src={comment.userProfileImage} alt={comment.nickname} />
        <AvatarFallback>{comment.nickname?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{comment.nickname}</h4>
          <p className="text-xs text-gray-500">{comment.created_at}</p>
        </div>
        <p className="text-gray-700">{comment.content}</p>
      </div>
    </div>
  );
}
