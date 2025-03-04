import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { CalendarIcon, UserIcon, UsersIcon, LockIcon } from "lucide-react";
import Alert from "@/components/ui/alert";
import { useState } from "react";
import Link from "next/link";
import { User } from "@/types/user";

interface ProfileHeaderProps {
  user: User;
}

export default function ProfileHeader({
  user: initialUser,
}: ProfileHeaderProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const refreshProfile = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/users/profile?user_id=${user.id}`,
        {
          withCredentials: true,
        }
      );
      setUser(response.data);
    } catch (error) {
      console.log("Error fetching profile data", error);
    }
  };

  const followUser = async () => {
    try {
      await axios.post(
        "http://localhost:8080/follow",
        { followed_id: user.id },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      setAlert({ type: "success", message: "User followed successfully!" });
      refreshProfile(); // Fetch updated user data
      location.reload();
    } catch (error) {
      console.log(error);
      setAlert({ type: "error", message: "Error following user" });
    }
  };

  const unfollowUser = async () => {
    try {
      await axios.delete("http://localhost:8080/unfollow", {
        data: { followed_id: user.id },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setAlert({ type: "success", message: "User unfollowed successfully!" });
      location.reload();
      refreshProfile(); // Fetch updated user data
    } catch (error) {
      console.log(error);
      setAlert({ type: "error", message: "Error unfollowing user" });
    }
  };

  return (
    <>
      {alert && (
        <Alert
          title={alert.type === "success" ? "Success" : "Error"}
          message={alert.message}
          type={alert.type}
          duration={5000}
          onClose={() => setAlert(null)}
        />
      )}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
            <Avatar className="w-32 h-32">
              <AvatarImage
                src={
                  user.avatar
                    ? `http://localhost:8080/avatars/${user.avatar}`
                    : "/profile.png"
                }
                alt={`${user.first_name} ${user.last_name}`}
              />
              <AvatarFallback>
                {user.first_name[0]}
                {user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                @{user.nickname}
              </p>
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
            {user.is_my_profile ? (
              <Link href="/settings">
                <Button variant="outline" className="mt-4">
                  Edit Profile
                </Button>
              </Link>
            ) : !user.is_following ? (
              <Button
                className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
                onClick={followUser}
              >
                {user.private ? "Request to Follow" : "Follow"}
              </Button>
            ) : (
              <Button
                className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
                onClick={unfollowUser}
              >
                Unfollow
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
