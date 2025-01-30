import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Menu } from "lucide-react";
import { CreatePostPopup } from "@/components/home/posts/CreatePostPopup";
import { PostsList } from "@/components/home/posts/postList";
import { PostView } from "@/components/home/posts/postView";
import { usePosts } from "@/lib/hooks/swr/getPosts"; 
import { Post } from "@/types/post";
import { useLikes } from "@/lib/hooks/useLikes";

interface MainContentProps {
  onOpenSidebar: () => void;
}

export function MainContent({ onOpenSidebar }: MainContentProps) {
  const { posts, isLoading, isError, refreshPosts } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { likesState, likesCount, handleLike } = useLikes(posts, refreshPosts);

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-6">
      {selectedPost ? (
        <PostView
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          handleLike={handleLike} 
          likesState={likesState}
          likesCount={likesCount} 
        />
      ) : (
        <PostsList
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          onSelectPost={setSelectedPost}
          refreshPosts={refreshPosts}
        />
      )}
    </main>
  );
}
