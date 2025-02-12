import useSWR from "swr";

const API_URL = "http://localhost:8080"; // Change this if your backend lives elsewhere

// A fetcher that checks for HTTP errors and returns JSON data
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
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
    searchResults: data, // Expected to be of the form { users: [...], groups: [...] }
    isLoading: !error && !data && query !== "",
    isError: error,
  };
}
