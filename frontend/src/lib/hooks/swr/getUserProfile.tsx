import useSWR from "swr";
import { fetcher } from "@/lib/hooks/swr/fetcher";

export function useUserProfile(user_id?: string) {
  const shouldFetch = !!user_id;
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `http://localhost:8080/users/profile?user_id=${user_id}` : null,
    fetcher
  );

  return {
    user: data,
    isLoading,
    isError: !!error,
    refreshUser: mutate,
  };
}
