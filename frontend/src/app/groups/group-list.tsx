import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import axios from "axios";

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
}

export function GroupList({ groups, type, isLoading, refreshGroups }: GroupListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No groups found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>Created on {new Date(group.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{group.description}</p>
            {type === "discover" ? (
              <Button className="w-full" variant="outline" onClick={() => requestToJoin(group.id, refreshGroups)}>
                Request to Join
              </Button>
            ) : (
              <Button className="w-full" onClick={() => enterGroupChat(group.id)}>
                Enter Chat
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function requestToJoin(groupId: string, refreshGroups: () => void) {
  try {
    await axios.post("http://localhost:8080/groups/join", { group_id: groupId }, { withCredentials: true });
    refreshGroups(); // Refresh groups after request
  } catch (error) {
    console.error("Error sending join request:", error);
  }
}

function enterGroupChat(groupId: string) {
  window.location.href = `/groups/${groupId}/chat`;
}
