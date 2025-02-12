import useSWR from "swr";

const API_URL = "http://localhost:8080"; // Adjust this if needed

// An improved fetcher that checks for HTTP errors
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // Try to parse the error message from the response
    const errorInfo = await res.text();
    throw new Error(`Error ${res.status}: ${res.statusText}. ${errorInfo}`);
  }
  return res.json();
};

export function useSearch(query: string) {
  const { data, error } = useSWR(
    query ? `${API_URL}/search?query=${encodeURIComponent(query)}` : null,
    fetcher
  );

  return {
    searchResults: data, // Expected format: { users: [...], groups: [...] }
    isLoading: !error && !data && query !== "",
    isError: error,
  };
}
