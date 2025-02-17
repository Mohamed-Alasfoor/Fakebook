"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupDialog } from "../../components/groups/create-group-dialog";
import { GroupList } from "@/components/groups/group-list";
import { useGroups } from "../../lib/hooks/use-groups";
import axios from "axios";

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { groups, joinedGroups, isLoading, searchGroups, refreshGroups } =
    useGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function requestToJoin(groupId: string) {
    try {
      await axios.post(
        "http://localhost:8080/groups/join",
        { group_id: groupId },
        { withCredentials: true }
      );
      refreshGroups();
    } catch (error) {
      console.error("Error sending join request:", error);
    }
  }

  function enterGroupChat(groupId: string) {
    window.location.href = `/groups/${groupId}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#6C5CE7]">
              Groups
            </h1>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 sm:mt-0 bg-[#6C5CE7] text-white px-4 py-2"
            >
              Create New Group
            </Button>
          </div>

          {/* Search Input */}
          <div className="w-full">
            <Input
              placeholder="Search groups..."
              className="w-full pl-9 border border-[#6C5CE7] rounded-md"
              value={searchQuery}
              onChange={(e) => searchGroups(e.target.value)}
            />
          </div>

          {/* Tabs for Group Lists */}
          <Tabs defaultValue="discover">
            <TabsList className="flex justify-around border-b">
              <TabsTrigger
                value="discover"
                className="px-4 py-2 text-sm sm:text-base"
              >
                Discover Groups
              </TabsTrigger>
              <TabsTrigger
                value="joined"
                className="px-4 py-2 text-sm sm:text-base"
              >
                My Groups
              </TabsTrigger>
            </TabsList>
            <TabsContent value="discover">
              <GroupList
                groups={groups as any[]}
                type="discover"
                isLoading={isLoading}
                refreshGroups={refreshGroups}
                requestToJoin={requestToJoin}
                enterGroupChat={enterGroupChat}
              />
            </TabsContent>
            <TabsContent value="joined">
              <GroupList
                groups={joinedGroups as any[]}
                type="joined"
                isLoading={isLoading}
                refreshGroups={refreshGroups}
                requestToJoin={requestToJoin}
                enterGroupChat={enterGroupChat}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <CreateGroupDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        refreshGroups={refreshGroups}
      />
    </div>
  );
}
