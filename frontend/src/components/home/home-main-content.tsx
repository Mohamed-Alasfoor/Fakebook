import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageCircle, Send, Heart, ArrowLeft, Share2, Menu } from "lucide-react";
import { CreatePostPopup } from "@/components/home/posts/create_post_popup";
import { usePosts } from "@/lib/hooks/swr/getPosts"; // Ensure correct import
import axios from "axios";

interface Post {
  user: string;
  user_id: number;
  id: number;
  content: string;
  userProfileImage: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  privacy: string;
  selectedUsers?: string[];
  nickname?: string;
  has_liked: boolean;
}

interface MainContentProps {
  onOpenSidebar: () => void;
}

export function MainContent({ onOpenSidebar }: MainContentProps) {
  const { posts, isLoading, isError, refreshPosts } = usePosts(); // Fetch posts
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [likesState, setLikesState] = useState<{ [key: number]: boolean }>({}); // Track like states
  const [likesCount, setLikesCount] = useState<{ [key: number]: number }>({}); // Track like counts

  // Initialize like states and counts when posts are loaded
  useEffect(() => {
    if (posts.length > 0) {
      const initialLikesState: { [key: number]: boolean } = {};
      const initialLikesCount: { [key: number]: number } = {};
      posts.forEach((post: Post) => {
        initialLikesState[post.id] = post.has_liked; // Initialize like state from has_liked
        initialLikesCount[post.id] = post.likes_count; // Initialize likes count
      });
      setLikesState(initialLikesState);
      setLikesCount(initialLikesCount);
    }
  }, [posts]);

  // Handle like/unlike functionality
  const handleLike = async (postId: number) => {
    try {
      const isLiked = likesState[postId] ?? false;

      // Optimistically update UI
      setLikesState((prev) => ({ ...prev, [postId]: !isLiked }));
      setLikesCount((prev) => ({
        ...prev,
        [postId]: isLiked ? prev[postId] - 1 : prev[postId] + 1,
      }));

      if (isLiked) {
        // Unlike request
        await axios.delete(`http://localhost:8080/posts/unlike`, {
          params: { post_id: postId },
          withCredentials: true,
        });
      } else {
        // Like request
        await axios.post(`http://localhost:8080/posts/like`, null, {
          params: { post_id: postId },
          withCredentials: true,
        });
      }

      // Optional: Refresh posts to ensure backend sync (only if needed)
      refreshPosts();
    } catch (error) {
      console.error("Error toggling like:", error);

      // Rollback UI changes on failure
      setLikesState((prev) => ({ ...prev, [postId]: likesState[postId] }));
      setLikesCount((prev) => ({ ...prev, [postId]: likesCount[postId] }));
    }
  };

  const PostsList = () => {
    if (isLoading) {
      return <div>Loading posts...</div>;
    }

    if (isError) {
      return <div className="text-red-500">Error loading posts. Please try again later.</div>;
    }

    return (
      <>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSidebar}>
            <Menu className="h-6 w-6" />
          </Button>
          <Input placeholder="Search for friends, groups, pages" className="flex-1" />
          <Button
            className="gap-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90"
            onClick={() => setIsCreatePostOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New Post</span>
          </Button>
        </div>

        {posts.map((post: Post) => {
          const hasLiked = likesState[post.id] ?? post.has_liked;
          const currentLikesCount = likesCount[post.id] ?? post.likes_count;

          return (
            <div
              className="bg-white rounded-lg shadow p-4 mb-4 cursor-pointer transition-all hover:shadow-md"
              key={post.id}
              onClick={() => setSelectedPost(post)}
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

              {post.image_url && (
                <img
                  src={`http://localhost:8080/uploads/${post.image_url}`}
                  alt="Post image"
                  className="w-full rounded-lg mb-4"
                />
              )}

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
  };

  const PostView = () => {
    if (!selectedPost) return null;

    const hasLiked = likesState[selectedPost.id] ?? selectedPost.has_liked;
    const currentLikesCount = likesCount[selectedPost.id] ?? selectedPost.likes_count;

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedPost(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Posts
          </Button>
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={selectedPost.userProfileImage} alt="User Avatar" />
              <AvatarFallback>{selectedPost.nickname?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{selectedPost.nickname}</h3>
              <p className="text-sm text-gray-500">{selectedPost.created_at}</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{selectedPost.content}</p>
          {selectedPost.image_url && (
            <img
              src={`http://localhost:8080/uploads/${selectedPost.image_url}`}
              alt="Post image"
              className="w-full rounded-lg mb-4"
            />
          )}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <button
              className={`flex items-center gap-2 ${hasLiked ? "text-red-500" : "text-gray-500"}`}
              onClick={() => handleLike(selectedPost.id)}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? "text-red-500" : ""}`} /> {currentLikesCount} Likes
            </button>
            <button className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> {selectedPost.comments_count} Comments
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-6">
      {selectedPost ? <PostView /> : <PostsList />}
      <CreatePostPopup
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreatePost={refreshPosts}
      />
    </main>
  );
}
