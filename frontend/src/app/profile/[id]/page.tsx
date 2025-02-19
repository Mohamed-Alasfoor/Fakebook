"use client"; 

import { useParams } from "next/navigation"
import { useUserProfile } from "@/lib/hooks/swr/getUserProfile";
import ProfileHeader from "@/components/profile/profileHeader";
import ProfileTabs from "@/components/profile/profileTabs";




export default function ProfilePage() {
  const params = useParams();
  const userId = params?.id as string | undefined;
  const { user, isLoading, isError } = useUserProfile(userId);

  if (!userId) return <p className="text-center text-red-500">Invalid user ID.</p>;
  if (isLoading) return <p className="text-center">Loading profile...</p>;
  if (isError) return <p className="text-center text-red-500">Error loading profile.</p>;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      <ProfileHeader user={user} />
      <ProfileTabs user={user} />
    </div>
  );
}

