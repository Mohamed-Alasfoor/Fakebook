import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon } from "lucide-react";

export default function PostItem({ post }: any) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={post.avatar} alt={post.nickname} />
          <AvatarFallback>{post.nickname[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{post.nickname}</h3>
          <p className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{post.content}</p>
        {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg mb-4" />}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5" />
            {post.likes_count} Likes
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <MessageCircleIcon className="w-5 h-5" />
            {post.comments_count} Comments
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
