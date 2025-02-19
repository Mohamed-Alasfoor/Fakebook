import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface FollowerProps {
  follower: {
    id: string;
    nickname: string;
    avatar: string;
  };
}

export default function FollowerItem({ follower }: FollowerProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar>
          <AvatarImage
            src={
              follower.avatar
                ? `http://localhost:8080/avatars/${follower.avatar}`
                : "/profile.png"
            }
            alt={follower.nickname}
          />
          <AvatarFallback>{follower.nickname[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{follower.nickname}</h3>
        </div>
        <Link href={`/profile/${follower.id}`}>
          <Button variant="outline" size="sm">
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
