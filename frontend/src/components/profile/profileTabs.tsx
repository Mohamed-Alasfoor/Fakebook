import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostItem from "@/components/home/posts/postItem";
import FollowerItem from "@/components/profile/followerItem";
import FollowingItem from "@/components/profile/followingItem";
import PostsList from "../home/posts/postList";
import { useState } from "react";
import { Post } from "@/types/post";
import { PostView } from "@/components/home/posts/postView";

export default function ProfileTabs({ user }: any) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  return (
    <Tabs defaultValue="posts">
      <TabsList className="w-full justify-start mb-6">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="followers">Followers</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        {user.posts.length > 0 ? (
          selectedPost ? (
            <PostView
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
              handleLike={async (postId: number) => {
                throw new Error("Function not implemented.");
              }}
              likesState={{}}
              likesCount={{}}
            />
          ) : (
            <PostsList posts={user.posts} onSelectPost={setSelectedPost} />
          )
        ) : (
          <p className="text-center text-gray-500">No posts yet.</p>
        )}
      </TabsContent>

      <TabsContent value="followers">
        {user.followers.length > 0 ? (
          user.followers
            .filter(
              (follower: any, index: number, self: any[]) =>
                self.findIndex((f) => f.id === follower.id) === index
            )
            .map((follower: any, index: number) => (
              <FollowerItem
                key={`${follower.id}-${index}`}
                follower={follower}
              />
            ))
        ) : (
          <p className="text-center text-gray-500">No followers yet.</p>
        )}
      </TabsContent>

      <TabsContent value="following">
        {user.following && user.following.length > 0 ? (
          user.following
            .filter(
              (following: any, index: number, self: any[]) =>
                self.findIndex((f) => f.id === following.id) === index
            )
            .map((following: any, index: number) => (
              <FollowingItem
                key={`${following.id}-${index}`}
                following={following}
              />
            ))
        ) : (
          <p className="text-center text-gray-500">Not following anyone yet.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
