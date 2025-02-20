import useSWR from "swr";
import { fetcher } from "@/lib/hooks/swr/fetcher";

export function useFollowers(userId?: string) {
  // If userId is provided, use it; otherwise, rely on the session's logged-in user.
  const { data, error } = useSWR(
    userId
      ? `http://localhost:8080/followers?user_id=${userId}`
      : `http://localhost:8080/followers`,
    fetcher
  );

  return {
    followers: data, // Array of follower objects: { id, nickname, avatar }
    isLoading: !error && !data,
    isError: !!error,
  };
}
