"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupDialog } from "./create-group-dialog";
import { GroupList } from "./group-list";
import { useGroups } from "./use-groups";

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { groups, joinedGroups, isLoading, searchGroups, refreshGroups } = useGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Groups</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Create New Group</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search groups..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchGroups(e.target.value);
          }}
        />
      </div>

      <Tabs defaultValue="discover">
        <TabsList>
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          <TabsTrigger value="joined">My Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="discover">
          <GroupList groups={groups} type="discover" isLoading={isLoading} refreshGroups={refreshGroups} />
        </TabsContent>
        <TabsContent value="joined">
          <GroupList groups={joinedGroups} type="joined" isLoading={isLoading} refreshGroups={refreshGroups} />
        </TabsContent>
      </Tabs>

      <CreateGroupDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} refreshGroups={refreshGroups} />
    </div>
  );
}
 