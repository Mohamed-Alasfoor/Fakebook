import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageCircle, Send, Heart, ArrowLeft, Share2, Menu } from "lucide-react";
import { CreatePostPopup } from "@/components/home/posts/create_post_popup";
import { usePosts } from "@/lib/hooks/swr/getPosts";
import axios from "axios";

interface Comment {
  id: number;
  user: string;
  userImage: string;
  content: string;
  timestamp: string;
}

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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const { posts, isLoading, isError } = usePosts();

  // Track like status for each post
  const [likesState, setLikesState] = useState<{ [key: number]: boolean }>({});

  // Handle like/unlike action
  const handleLike = async (postId: number) => {
    try {
      const isLiked = likesState[postId] ?? false;
  
      if (isLiked) {
        // Unlike 
        await axios.delete(`http://localhost:8080/posts/unlike`, {
          params: { post_id: postId },
        });
        setLikesState((prev) => ({ ...prev, [postId]: false }));
        // Decrease like count
        const postIndex = posts.findIndex((post: { id: number; }) => post.id === postId);
        if (postIndex >= 0) posts[postIndex].likes_count--;
      } else {
        // Like 
        await axios.post(`http://localhost:8080/posts/like`, null, {
          params: { post_id: postId },
        });
        setLikesState((prev) => ({ ...prev, [postId]: true }));
        // Increase like count
        const postIndex = posts.findIndex((post: { id: number; }) => post.id === postId);
        if (postIndex >= 0) posts[postIndex].likes_count++;
      }
    } catch (error) {
      console.error("Error toggling like:", error);
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

        {posts.map((post: Post) => (
          <div
            className="bg-white rounded-lg shadow p-4 mb-4 cursor-pointer transition-all hover:shadow-md"
            key={post.id}
            onClick={() => setSelectedPost(post)}
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarImage src="" alt={post.user_id.toString()} />
                <AvatarFallback></AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{post.nickname}</h3>
                <p className="text-sm text-gray-500">{post.created_at}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{post.content}</p>

            {post.image_url && (
              <img
                src={post.image_url || "/profile.png"}
                alt="Post image"
                className="w-full rounded-lg mb-4"
              />
            )}

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button
                className={`flex items-center gap-2 ${
                  likesState[post.id] || post.has_liked && "text-red-500" 
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(post.id);
                }}
              >
                <Heart className={`w-5 h-5 ${post.has_liked&&'text-red-500'}`}  /> {post.likes_count} Likes
              </button>
              <button className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> {post.comments_count} Comments
              </button>
            </div>
          </div>
        ))}
      </>
    );
  };

  
  const PostView = () => {
    if (!selectedPost) return null;
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedPost(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Posts
          </Button>
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src="" alt="User Avatar" />
              <AvatarFallback></AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{selectedPost.user_id}</h3>
              <p className="text-sm text-gray-500">{selectedPost.created_at}</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{selectedPost.content}</p>
          {selectedPost.image_url && (
            <img
              src={selectedPost.image_url || "/profile.png"}
              alt="Post image"
              className="w-full rounded-lg mb-4"
            />
          )}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <button className="flex items-center gap-2">
              <Heart className={`w-5 h-5 ${selectedPost.has_liked&&'text-red-500'}`} /> {selectedPost.likes_count} Likes
            </button>
            <button className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> {selectedPost.comments_count} Comments
            </button>
            <button className="flex items-center gap-2">
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <h4 className="font-semibold mb-4">Comments</h4>
          <div className="space-y-4">
            {/* {selectedPost.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar>
                  <AvatarImage src={comment.userImage} alt={comment.user} />
                  <AvatarFallback>{comment.user[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="font-semibold">{comment.user}</p>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{comment.timestamp}</p>
                </div>
              </div>
            ))} */}
          </div>
        </div>
        <div className="p-4 border-t">
          <form className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
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
        onCreatePost={() => {}}
      />
    </main>
  );
}
