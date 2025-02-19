import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface FollowingProps {
  following: {
    id: string;
    nickname: string;
    avatar: string;
  };
}

export default function FollowingItem({ following }: FollowingProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar>
          <AvatarImage
            src={
              following.avatar
                ? `http://localhost:8080/avatars/${following.avatar}`
                : "/profile.png"
            }
            alt={following.nickname}
          />
          <AvatarFallback>{following.nickname[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{following.nickname}</h3>
        </div>
        <Link href={`/profile/${following.id}`}>
          <Button variant="outline" size="sm">
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
