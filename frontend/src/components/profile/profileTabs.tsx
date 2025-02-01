import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostItem from "@/components/profile/postItem";
import FollowerItem from "@/components/profile/followerItem";
import FollowingItem from "@/components/profile/followingItem";

export default function ProfileTabs({ user }: any) {
    return (
      <Tabs defaultValue="posts">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
  
        <TabsContent value="posts">
          {user.posts.length > 0 ? (
            user.posts.map((post: any, index: number) => (
              <PostItem key={`${post.id}-${index}`} post={post} />
            ))
          ) : (
            <p className="text-center text-gray-500">No posts yet.</p>
          )}
        </TabsContent>
  
        <TabsContent value="followers">
          {user.followers.length > 0 ? (
            user.followers
              .filter((follower: any, index: number, self: any[]) => self.findIndex(f => f.id === follower.id) === index)
              .map((follower: any, index: number) => (
                <FollowerItem key={`${follower.id}-${index}`} follower={follower} />
              ))
          ) : (
            <p className="text-center text-gray-500">No followers yet.</p>
          )}
        </TabsContent>
  
        <TabsContent value="following">
          {user.following && user.following.length > 0 ? (
            user.following
              .filter((following: any, index: number, self: any[]) => self.findIndex(f => f.id === following.id) === index)
              .map((following: any, index: number) => (
                <FollowingItem key={`${following.id}-${index}`} following={following} />
              ))
          ) : (
            <p className="text-center text-gray-500">Not following anyone yet.</p>
          )}
        </TabsContent>
      </Tabs>
    );
  }