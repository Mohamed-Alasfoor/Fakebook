"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Users, Calendar } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string;
  created_at: string;
}

export default function GroupView() {
  const params = useParams(); // Ensure params is correctly retrieved
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return; // Ensure params.id exists

    const fetchGroupData = async () => {
      try {
        const [groupResponse, postsResponse] = await Promise.all([
          axios.get(`http://localhost:8080/groups/${params.id}`, { withCredentials: true }),
          axios.get(`http://localhost:8080/groups/posts?group_id=${params.id}`, { withCredentials: true }),
        ]);
        setGroup(groupResponse.data);
        setPosts(postsResponse.data);
      } catch (error) {
        console.error("Error fetching group data:", error);
        router.push("/groups"); // Redirect if the group is not found
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [params?.id, router]);

  if (isLoading || !group) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-[#6C5CE7] text-white rounded-t-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{group.name}</CardTitle>
                <CardDescription className="text-slate-200 mt-2">
                  Created on {new Date(group.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                className="bg-white text-[#6C5CE7] hover:bg-slate-100"
                onClick={() => router.push("/groups")}
              >
                Back to Groups
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-6">{group.description}</p>

            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-3 gap-4 mx-auto mb-6">
                <TabsTrigger value="chat">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="w-4 h-4 mr-2" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="events">
                  <Calendar className="w-4 h-4 mr-2" />
                  Events
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-center text-muted-foreground">Chat feature coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-center text-muted-foreground">Members list coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-center text-muted-foreground">Events feature coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
