"use client"; 

import { useParams } from "next/navigation";
import { useUserProfile } from "@/lib/hooks/swr/getUserProfile";
import ProfileHeader from "@/components/profile/profileHeader";
import ProfileTabs from "@/components/profile/profileTabs";
import { LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Alert from "@/components/ui/alert";
import { useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
export default function ProfilePage() {
  const params = useParams();
  const [isRequested, setIsRequested] = useState(false);
  const userId = params?.id as string | undefined;
  const { user, isLoading, isError } = useUserProfile(userId);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  if (!userId) return <p className="text-center text-red-500">Invalid user ID.</p>;
  if (isLoading) return <LoadingSpinner size="large"/>;
  if (isError) return <p className="text-center text-red-500">Error loading profile.</p>;
  const followRequest = async (followedId: string) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/follow",
        { followed_id: followedId },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data); 
      setIsRequested(true);
        setAlert({ type: "success", message: "User followed successfully" });
    } catch (error) {
      console.log("Error following user:", error);
        setAlert({ type: "error", message: "Failed to follow user" });
    }
  };
  // Handle Private Profile Case
  if (user.private && !user.is_following && !user.is_my_profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-6 text-center border border-gray-200">
          <LockIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">This Profile is Private</h2>
          <p className="text-gray-500 mt-2">
            You must follow <span className="font-medium">@{user.nickname}</span> to view their posts and details.
          </p>
          {!user.is_my_profile && user.pending==="0" && !isRequested && (
            <Button 
            className="mt-4 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
            onClick={() => followRequest(user.id)}
          >
            Request to Follow
          </Button>
          )}
          {((!user.is_my_profile && user.pending==="1" )|| (!user.is_my_profile && isRequested )) && (
            <Button 
            className="mt-4 bg-[rgb(140,136,168)] hover:bg-[rgb(140,136,168)]/90 text-white cursor-not-allowed"
          >
            Requested
          </Button>
          )}
        </div>
      </div>
    );
  }

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
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      <ProfileHeader user={user} />
      <ProfileTabs user={user} />
    </div>
    </>
    
  );
}




