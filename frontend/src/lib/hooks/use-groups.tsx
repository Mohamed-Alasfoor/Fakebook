"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: string;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8080/groups", {
        withCredentials: true,
      });
      setGroups(response.data);
    } catch (error) {
      console.log("Error fetching groups:", error);
    }
  }, []);

  const fetchJoinedGroups = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8080/groups/user", {
        withCredentials: true,
      });
      setJoinedGroups(response.data);
    } catch (error) {
      console.log("Error fetching joined groups:", error);
    }
  }, []);

  const searchGroups = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/groups/search?query=${encodeURIComponent(
          query
        )}`,
        {
          withCredentials: true,
        }
      );
      setGroups(response.data);
    } catch (error) {
      console.log("Error searching groups:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchGroups(), fetchJoinedGroups()]).finally(() =>
      setIsLoading(false)
    );
  }, [fetchGroups, fetchJoinedGroups]);

  return {
    groups,
    joinedGroups,
    isLoading,
    searchGroups,
    refreshGroups: fetchGroups,
    refreshJoinedGroups: fetchJoinedGroups,
  };
}
