import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CommentItemProps {
  comment: Comment;
}

interface Comment {
  id: string;
  user_id: string;
  userProfileImage?: string;
  nickname?: string;
  content: string;
  created_at: string;
  image_url?: string;
  avatar?: string;
}

export function CommentItem({ comment }: CommentItemProps) {
  console.log("Comment data:", comment);
  // Use comment.avatar if present, otherwise try comment.userProfileImage
  const avatarSource = comment.avatar || comment.userProfileImage;

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm w-full">
      <Avatar className="w-12 h-12 flex-shrink-0">
        <AvatarImage
          src={
            avatarSource
              ? `http://localhost:8080/avatars/${avatarSource}`
              : "/profile.png"
          }
          alt={comment.nickname}
        />
        <AvatarFallback>{comment.nickname?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col bg-gray-100 px-4 py-3 rounded-xl w-full">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-semibold text-gray-900">{comment.nickname}</h4>
          <p className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleString()}
          </p>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-wrap">
          {comment.content}
        </p>
        {comment.image_url && (
          <div className="mt-3 rounded-lg border border-gray-300 overflow-hidden">
            <img
              src={`http://localhost:8080/uploads/${comment.image_url}`}
              alt="Comment attachment"
              className="w-full max-w-md object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
