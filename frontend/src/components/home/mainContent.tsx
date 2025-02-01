import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Menu } from "lucide-react";
import { CreatePostPopup } from "@/components/home/posts/CreatePostPopup";
import  PostsList  from "@/components/home/posts/postList";
import { PostView } from "@/components/home/posts/postView";
import { usePosts } from "@/lib/hooks/swr/getPosts"; 
import { Post } from "@/types/post";
import { useLikes } from "@/lib/hooks/useLikes";
interface MainContentProps {
  onOpenSidebar: () => void;
}

interface MainContentProps {
  onOpenSidebar: () => void;
}

export function MainContent({ onOpenSidebar }: MainContentProps) {
  const { posts, isLoading, isError, refreshPosts } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  return (
    <main className="w-full max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Search and Create Post */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <Input placeholder="Search for friends, groups, pages" className="flex-1" />
        <Button className="gap-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90" onClick={() => setIsCreatePostOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Post</span>
        </Button>
      </div>

      {/* Post View or Posts List */}
      {selectedPost ? (
        <PostView post={selectedPost} onClose={() => setSelectedPost(null)} handleLike={function (postId: number): Promise<void> {
          throw new Error("Function not implemented.");
        } } likesState={{}} likesCount={{}} />
      ) : (
        <PostsList posts={posts} isLoading={isLoading} isError={isError} onSelectPost={setSelectedPost} />
      )}

      {/* Create Post Popup */}
      <CreatePostPopup isOpen={isCreatePostOpen} onClose={() => setIsCreatePostOpen(false)} onCreatePost={refreshPosts} />
    </main>
  );
}