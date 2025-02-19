"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  nickname?: string;
  avatar?: string;
}

interface PostViewProps {
  post: Post;
  onClose: () => void;
}

export default function PostView({ post, onClose }: PostViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // Fetch comments when the post is opened
  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/groups/posts/comments?post_id=${post.id}`,
        { withCredentials: true }
      );
      setComments(response.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return alert("Comment cannot be empty.");

    try {
      await axios.post(
        "http://localhost:8080/groups/posts/comments/create",
        { post_id: post.id, content: newComment },
        { withCredentials: true }
      );

      setNewComment(""); // Clear input
      fetchComments(); // Re-fetch comments after posting
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Error adding comment.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg relative max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header with Close Button */}
        <div className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-t-lg">
          <h3 className="text-lg font-semibold">Post Details</h3>
          <Button
            className="text-gray-600 hover:bg-gray-300 rounded-full p-2"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Full Scrollable Content */}
        <div className="p-4 flex-1">
          {/* Post Content */}
          <Card className="border shadow-sm mb-4">
            <CardHeader>
              <CardTitle>Post</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Posted on {new Date(post.created_at).toLocaleString()}
              </p>
              <div className="mt-2 whitespace-pre-line">{post.content}</div>
              {post.image_url && (
                <img
                  src={`http://localhost:8080/uploads/${post.image_url}`}
                  alt="Post"
                  className="mt-2 rounded-md w-full max-h-96 object-cover"
                />
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3">Comments</h3>
            {isLoadingComments ? (
              <p className="text-gray-500">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id} className="border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">
                        {comment.nickname || "Anonymous"}:
                      </p>
                      <p className="mt-1">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment Section */}
       <div className="mt-6">
         <Textarea
           placeholder="Write a comment..."
          value={newComment}
           onChange={(e) => {
                 const text = e.target.value;
             if (text.length <= 250) {
               setNewComment(text);
             }
           }}
         />
  <div className="flex justify-between mt-3">
    <Button variant="secondary" className="text-gray-600" onClick={onClose}>
      Cancel
    </Button>
    <Button className="bg-[#6C5CE7] text-white" onClick={handleAddComment}>
      Add Comment
    </Button>
  </div>
</div>
        </div>
      </div>
    </div>
  );
}
