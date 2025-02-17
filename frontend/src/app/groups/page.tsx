"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupList } from "@/components/groups/group-list";
import { useGroups } from "@/lib/hooks/use-groups";
import axios from "axios";
import { LeftSidebar } from "@/components/home/leftSideBar";
import { RightSidebar } from "@/components/Notifications/Sidebar";

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
      <div className="max-w-screen-xl mx-auto p-4">
        {/* Use grid for md+ screens: left sidebar, main content, right sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr_20rem] gap-4">
          {/* Left Sidebar (hidden on mobile) */}
          <div className="hidden md:block">
            <LeftSidebar isOpen={true} onClose={() => {}} />
          </div>

          {/* Main Content */}
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

          {/* Right Sidebar (hidden on mobile) */}
          <div className="hidden md:block">
            <RightSidebar isOpen={true} onClose={() => {}} />
          </div>
        </div>
      </div>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        refreshGroups={refreshGroups}
      />
    </div>
  );
}
