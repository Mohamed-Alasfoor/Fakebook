import useSWR from "swr";
import { fetcher } from "@/lib/hooks/swr/fetcher";

export function useUserProfile(user_id?: string) {
  const shouldFetch = !!user_id; //  Only fetch when `user_id` exist
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `http://localhost:8080/users/profile?user_id=${user_id}` : null, //  Corrected API URL
    fetcher
  );

  return {
    user: data, //  User profile data
    isLoading,
    isError: !!error,
    refreshUser: mutate, //  Function to manually refresh data
  };
}
