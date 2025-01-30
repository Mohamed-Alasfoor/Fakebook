import { useState, useEffect } from "react";
import axios from "axios";
import { Post } from "@/types/post";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommentItem } from "@/components/home/posts/comment";

interface PostViewProps {
  post: Post;
  onClose: () => void;
  handleLike: (postId: number) => Promise<void>;
  likesState: { [key: number]: boolean };
  likesCount: { [key: number]: number };
}

interface Comment {
  id: number;
  user_id: number;
  userProfileImage: string;
  nickname: string;
  content: string;
  created_at: string;
}

export function PostView({ post, onClose, handleLike, likesState, likesCount }: PostViewProps) {
  const hasLiked = likesState[post.id] ?? post.has_liked;
  const currentLikesCount = likesCount[post.id] ?? post.likes_count;

  // Fetch comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8080//posts/comments/all?post_id=${post.id}`);
        setComments(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setError(true);
        setLoading(false);
      }
    };

    fetchComments();
  }, [post.id]);

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:8080//posts/comments`,
        { post_id: post.id, content: newComment },
        { withCredentials: true }
      );

      setComments([...comments, response.data]); 
      setNewComment(""); // Clear input
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      {/* Post Content */}
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

      {/* Like and Comment Buttons */}
      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
        <button
          className={`flex items-center gap-2 ${hasLiked ? "text-red-500" : "text-gray-500"}`}
          onClick={() => handleLike(post.id)}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? "text-red-500" : ""}`} /> {currentLikesCount} Likes
        </button>
        <span className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> {comments.length} Comments
        </span>
      </div>

      {/* Comments Section */}
      <h3 className="text-lg font-semibold mt-4 mb-2">Comments</h3>

      {/* Show Loading/Error */}
      {loading && <p>Loading comments...</p>}
      {error && <p className="text-red-500">Failed to load comments.</p>}

      {/* Comments List */}
      <div className="max-h-60 overflow-y-auto space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Add Comment Input */}
      <div className="mt-4 flex items-center gap-2">
        <Input
          type="text"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button onClick={handleAddComment}>
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
