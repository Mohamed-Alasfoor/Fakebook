import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowerItem from "@/components/profile/followerItem";
import FollowingItem from "@/components/profile/followingItem";
import PostsList from "../home/posts/postList";
import { useState } from "react";
import { Post } from "@/types/post";
import { PostView } from "@/components/home/posts/postView";

interface Follower {
  id: string;
  nickname: string;
  avatar?: string; // Can be undefined
}

interface Following {
  id: string;
  nickname: string;
  avatar?: string; // Can be undefined
}

interface User {
  id: string;
  posts: Post[] | null;
  followers: Follower[] | null;
  following: Following[] | null;
}

interface ProfileTabsProps {
  user: User;
}

export default function ProfileTabs({ user }: ProfileTabsProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <Tabs defaultValue="posts">
      <TabsList className="w-full justify-start mb-6">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="followers">Followers</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        {user.posts !== null && user.posts.length > 0 ? (
          selectedPost ? (
            <PostView
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
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
        {user.followers !== null && user.followers.length > 0 ? (
          user.followers
            .filter(
              (follower, index, self) =>
                self.findIndex((f) => f.id === follower.id) === index
            )
            .map((follower, index) => (
              <FollowerItem
                key={`${follower.id}-${index}`}
                follower={{
                  ...follower,
                  avatar: follower.avatar ?? "/profile.png", // Ensure avatar is always a string
                }}
              />
            ))
        ) : (
          <p className="text-center text-gray-500">No followers yet.</p>
        )}
      </TabsContent>

      <TabsContent value="following">
        {user.following !== null && user.following.length > 0 ? (
          user.following
            .filter(
              (following, index, self) =>
                self.findIndex((f) => f.id === following.id) === index
            )
            .map((following, index) => (
              <FollowingItem
                key={`${following.id}-${index}`}
                following={{
                  ...following,
                  avatar: following.avatar ?? "/profile.png", // Ensure avatar is always a string
                }}
              />
            ))
        ) : (
          <p className="text-center text-gray-500">Not following anyone yet.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
