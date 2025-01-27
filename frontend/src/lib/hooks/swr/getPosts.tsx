import useSWR from 'swr';

import { fetcher } from '@/lib/hooks/swr/fetcher';

export function usePosts() {
  const { data, error, isLoading, mutate } = useSWR('http://localhost:8080/posts/all', fetcher);

  return {
    posts: data || [],
    isLoading,
    isError: !!error,
    refreshPosts: mutate, // To manually refresh the data
  };
}