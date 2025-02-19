"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupList } from "@/components/groups/group-list";
import { useGroups } from "@/lib/hooks/use-groups";
import axios from "axios";

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { groups, joinedGroups, isLoading, searchGroups, refreshGroups } = useGroups();
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
    <div className="py-8 px-4">
      {/* This container is inside the parent max-w-screen-xl from layout */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <h1 className="text-3xl font-bold text-[#6C5CE7]">Groups</h1>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#6C5CE7] text-white mt-4 sm:mt-0"
          >
            Create New Group
          </Button>
        </div>

        <Input
          placeholder="Search groups..."
          className="pl-9 border-[#6C5CE7] my-4"
          value={searchQuery}
          onChange={(e) => searchGroups(e.target.value)}
        />

        <Tabs defaultValue="discover">
          <TabsList>
            <TabsTrigger value="discover">Discover Groups</TabsTrigger>
            <TabsTrigger value="joined">My Groups</TabsTrigger>
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

      <CreateGroupDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        refreshGroups={refreshGroups}
      />
    </div>
  );
}
