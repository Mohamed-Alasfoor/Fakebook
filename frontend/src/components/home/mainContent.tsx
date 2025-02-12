import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Menu } from "lucide-react";
import { CreatePostPopup } from "@/components/home/posts/CreatePostPopup";
import PostsList from "@/components/home/posts/postList";
import { PostView } from "@/components/home/posts/postView";
import { usePosts } from "@/lib/hooks/swr/getPosts";
import { Post } from "@/types/post";
import { useSearch } from "@/lib/hooks/useSearch"; // Import the search hook

interface MainContentProps {
  onOpenSidebar: () => void;
}

export function MainContent({ onOpenSidebar }: MainContentProps) {
  const { posts, isLoading, isError, refreshPosts } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // State for the search query.
  const [searchQuery, setSearchQuery] = useState("");
  const {
    searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSearch(searchQuery);

  return (
    <main className="w-full max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Search and Create Post Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Input
          placeholder="Search for friends, groups, pages"
          className="flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          className="gap-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90"
          onClick={() => setIsCreatePostOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Post</span>
        </Button>
      </div>

      {/* Display Search Results if a query exists; otherwise, show posts */}
      {searchQuery ? (
        <div>
          {isSearchLoading && <p>Loading search results...</p>}
          {isSearchError && (
            <p>Error loading search results: {isSearchError.message}</p>
          )}
          {searchResults && (
            <>
              <h3 className="font-bold mt-4">Users</h3>
              <ul>
                {searchResults.users?.map((user: any) => (
                  <li key={user.id} className="p-2 border-b">
                    {user.nickname}
                  </li>
                ))}
              </ul>
              <h3 className="font-bold mt-4">Groups</h3>
              <ul>
                {searchResults.groups?.map((group: any) => (
                  <li key={group.id} className="p-2 border-b">
                    {group.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : selectedPost ? (
        <PostView
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          handleLike={async (postId: number) => {
            // Implement like functionality as needed
          }}
          likesState={{}}
          likesCount={{}}
        />
      ) : (
        <PostsList
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          onSelectPost={setSelectedPost}
        />
      )}

      {/* Create Post Popup */}
      <CreatePostPopup
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreatePost={refreshPosts}
      />
    </main>
  );
}
