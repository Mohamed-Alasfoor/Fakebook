import { useState, useEffect } from "react";
import axios from "axios";
import { Post } from "@/types/post";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  ArrowLeft,
  Send,
  Image as ImageIcon,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommentItem } from "@/components/home/posts/comment";
import { useUserProfile } from "@/lib/hooks/swr/getUserProfile";
import Cookies from "js-cookie";

interface PostViewProps {
  post: Post;
  onClose: () => void;
  handleLike: (postId: number) => Promise<void>;
  likesState: { [key: number]: boolean };
  likesCount: { [key: number]: number };
}

export interface Comment {
  id: string;  // Change id from number to string (UUID)
  user_id: string;  // Ensure consistency with UUID format
  userProfileImage?: string;
  nickname?: string;
  content: string;
  created_at: string;
  image_url?: string;
}

export function PostView({
  post,
  onClose,
  handleLike,
  likesState,
  likesCount,
}: PostViewProps) {
  const { user, isLoading } = useUserProfile(Cookies.get("user_id"));
  const hasLiked = likesState[post.id] ?? post.has_liked;
  const currentLikesCount = likesCount[post.id] ?? post.likes_count;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments function
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8080/posts/comments/all?post_id=${post.id}`
      );
      if (response.data === null) {
        setComments([]);
        return;
      }
      const loadedComments = response.data.map((c: any) => ({
        id: c.id, // Keep UUID as a string
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        image_url: c.image_url
          ? `${c.image_url}`
          : undefined,
        userProfileImage: c.userProfileImage
          ? `http://localhost:8080/uploads/${c.userProfileImage}`
          : "/profile.png",
        nickname: c.nickname 
      }));

      setComments(loadedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments when component mounts or post.id changes
  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setSelectedFilePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAddComment = async () => {
    if (!user || isLoading || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("post_id", String(post.id));
      formData.append("content", newComment);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await axios.post(
        "http://localhost:8080/posts/comments",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        setNewComment("");
        setSelectedFile(null);
        setSelectedFilePreview(null);

        // Fetch latest comments after posting a new one
        fetchComments();
      } else {
        throw new Error("Server did not return a successful response.");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Post Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar>
          <AvatarImage
            src={
              post.userProfileImage
                ? `http://localhost:8080/uploads/${post.userProfileImage}`
                : "/profile.png"
            }
            alt={post.nickname}
          />
          <AvatarFallback>{post.nickname?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{post.nickname}</h3>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-gray-600 mb-4">{post.content}</p>

      {post.image_url && (
        <img
          src={`http://localhost:8080/uploads/${post.image_url}`}
          alt="Post"
          className="w-full rounded-lg mb-4"
        />
      )}

      {/* Likes / Comments count
      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
        <button
          className={`flex items-center gap-2 ${
            hasLiked ? "text-red-500" : "text-gray-500"
          }`}
          onClick={() => handleLike(post.id)}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? "text-red-500" : ""}`} />
          {currentLikesCount} Likes
        </button>
        <span className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> {comments.length} Comments
        </span>
      </div> */}

      <h3 className="text-lg font-semibold mt-4 mb-2">Comments</h3>

      {loading && <p className="text-gray-500">Loading comments...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Add Comment */}
      <div className="mt-4">
        {selectedFilePreview && (
          <div className="relative">
            <img
              src={selectedFilePreview}
              alt="Preview"
              className="w-20 h-20 rounded-lg mb-2"
            />
            <button
              onClick={() => {
                setSelectedFile(null);
                setSelectedFilePreview(null);
              }}
              className="absolute top-0 right-0 text-red-500"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            required
          />
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <ImageIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </label>
          <Button onClick={handleAddComment} disabled={submitting}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
