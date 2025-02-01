import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, UserIcon, UsersIcon, LockIcon } from "lucide-react";

interface ProfileHeaderProps {
  user: any;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
            <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{user.first_name} {user.last_name}</h1>
            <p className="text-xl text-muted-foreground mb-4">@{user.nickname}</p>
            <p className="text-lg mb-4">{user.about_me}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>Joined {formatDate(user.date_of_birth)}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <span>{user.followers_count} Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4" />
                <span>{user.following_count} Following</span>
              </div>
              {user.private && (
                <div className="flex items-center gap-1">
                  <LockIcon className="w-4 h-4" />
                  <span>Private Account</span>
                </div>
              )}
            </div>
          </div>
          <Button className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white">
            {user.private ? "Request to Follow" : "Follow"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
