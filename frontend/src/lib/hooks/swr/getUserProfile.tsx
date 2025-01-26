import useSWR from 'swr';
import { fetcher } from '@/lib/hooks/swr/fetcher';

export function useUserProfile() {
  const { data, error, isLoading, mutate } = useSWR('http://localhost:8080/userProfile', fetcher);

  return {
    user: data,
    isLoading,
    isError: !!error,
    refreshUser: mutate,
  };
}
