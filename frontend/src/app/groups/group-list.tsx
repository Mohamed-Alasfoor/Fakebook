import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { Users } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: string;
}

interface GroupListProps {
  groups: Group[];
  type: "discover" | "joined";
  isLoading: boolean;
  refreshGroups: () => void;
  requestToJoin: (groupId: string) => void;
  enterGroupChat: (groupId: string) => void;
}

export function GroupList({ groups, type, isLoading, refreshGroups, requestToJoin, enterGroupChat }: GroupListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-2 border-slate-100">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (groups===null) {
    return (
      <Card className="border-2 border-slate-100">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-[#6C5CE7] mb-4" />
          <p className="text-xl font-medium text-[#6C5CE7]">No groups found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {type === "discover" ? "Try adjusting your search or create a new group" : "Join some groups to see them here"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.id} className="border-2 border-slate-100 hover:border-[#6C5CE7] transition-colors">
          <CardHeader>
            <Link href={`/groups/${group.id}`}>
              <CardTitle className="text-[#6C5CE7] hover:underline cursor-pointer">{group.name}</CardTitle>
            </Link>
            <CardDescription>Created on {new Date(group.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
            {type === "discover" ? (
              <Button className="gap-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90"  onClick={() => requestToJoin(group.id)}>
                Request to Join
              </Button>
            ) : (
              <Button className="gap-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90" onClick={() => enterGroupChat(group.id)}>
                Enter Group
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
