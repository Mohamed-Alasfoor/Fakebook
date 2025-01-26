import { usePosts } from "@/lib/hooks/swr/getPosts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Plus, MessageCircle, Send, Heart, Menu } from "lucide-react";

interface MainContentProps {
  onOpenSidebar: () => void;
}

export function MainContent({ onOpenSidebar }: MainContentProps) {
  const { posts, isLoading, isError } = usePosts();

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  if (isError) {
    return <div>Error loading posts. Please try again.</div>;
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <Input placeholder="Search for friends, groups, pages" className="flex-1" />
        <Button className="gap-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Post</span>
        </Button>
      </div>

      {posts.map((post: any) => (
        <div className="bg-white rounded-lg shadow p-4 mb-4" key={post.postId}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={post.userProfileImage || "/placeholder.svg"} alt="User avatar" />
            </Avatar>
            <div>
              <h3 className="font-semibold">{post.user}</h3>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{post.content}</p>

          {post.postImage && (
            <img src={post.postImage} alt="Post image" className="w-full rounded-lg mb-4" />
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <button className="flex items-center gap-2">
              <Heart /> {post.likes} Likes
            </button>
            <button className="flex items-center gap-2">
              <MessageCircle /> {post.comments} Comments
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 flex items-center gap-2">
              <Input placeholder="Write your comment..." className="flex-1" />
              <Button size="icon" className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
