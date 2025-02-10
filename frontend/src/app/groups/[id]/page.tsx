"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Users, Calendar, Plus } from "lucide-react";

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
  image_url?: string;
  created_at: string;
}
interface Member {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  avatar?: string;
}
interface Event {
  id: string;
  group_id: string;
  title: string;
  description: string;
  date_time: string;
  creator_id: string;
}

interface RSVPStatus {
  event_id: string;
  user_id: string;
  status: "going" | "not_going" | null;
}

export default function GroupView() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<RSVPStatus[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  useEffect(() => {
    if (!params?.id) return;

    const fetchGroupData = async () => {
      try {
        const groupId = params.id as string;
        const [groupResponse, postsResponse, membersResponse] = await Promise.all([
          axios.get(`http://localhost:8080/groups/{group_id}?group_id=${groupId}`, { withCredentials: true }).catch(() => null),
          axios.get(`http://localhost:8080/groups/posts?group_id=${groupId}`, { withCredentials: true }).catch(() => null),
          axios.get(`http://localhost:8080/groups/members?group_id=${groupId}`, { withCredentials: true }).catch(() => null),
        ]);

        if (!groupResponse?.data || Object.keys(groupResponse.data).length === 0) {
          router.push("/groups");
          return;
        }

        setGroup(groupResponse.data);
        setPosts(postsResponse?.data || []);
        setMembers(membersResponse?.data || []);
      } catch (error) {
        console.error("Error fetching group data:", error);
        router.push("/groups");
      } finally {
        setIsLoading(false);
        setIsLoadingMembers(false);
      }
    };

    fetchGroupData();
  }, [params?.id, router]);
  const handleCreatePost = async () => {
    if (!postContent.trim()) return alert("Post content cannot be empty.");

    const formData = new FormData();
    formData.append("group_id", params.id as string);
    formData.append("content", postContent);
    if (postFile) formData.append("file", postFile);

    try {
      const response = await axios.post("http://localhost:8080/groups/posts/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPosts([{ id: response.data.post_id, user_id: "me", content: postContent, image_url: response.data.image_url, created_at: new Date().toISOString() }, ...posts]);
      setPostContent("");
      setPostFile(null);
      setIsCreatingPost(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Error creating post.");
    }
  };
  // Fetch RSVP statuses for events
  useEffect(() => {
    if (events.length === 0) return;

    const fetchRSVPs = async () => {
      try {
        const rsvpResponses = await Promise.all(
          events.map((event) =>
            axios.get(`http://localhost:8080/groups/events/rsvps?event_id=${event.id}`, { withCredentials: true }).catch(() => null)
          )
        );

        const rsvpData = rsvpResponses.flatMap((response) => response?.data || []);
        setRsvps(rsvpData);
      } catch (error) {
        console.error("Error fetching RSVPs:", error);
      }
    };

    fetchRSVPs();
  }, [events]);

  // Create a new event
  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDateTime) {
      return alert("All fields are required.");
    }

    try {
      const response = await axios.post("http://localhost:8080/groups/events/create", {
        group_id: params.id,
        title: eventTitle,
        description: eventDescription,
        date_time: eventDateTime,
      }, { withCredentials: true });

      setEvents([{ id: response.data.event_id, group_id: params.id as string, title: eventTitle, description: eventDescription, date_time: eventDateTime, creator_id: "me" }, ...events]);
      setEventTitle("");
      setEventDescription("");
      setEventDateTime("");
      setIsCreatingEvent(false);
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Error creating event.");
    }
  };

  // RSVP to an event
  const handleRSVP = async (eventId: string, status: "going" | "not_going") => {
    try {
      await axios.post("http://localhost:8080/groups/events/rsvp", { event_id: eventId, status }, { withCredentials: true });
      setRsvps([...rsvps, { event_id: eventId, user_id: "me", status }]);
    } catch (error) {
      console.error("Failed to RSVP:", error);
    }
  };
  if (isLoading) return <div className="text-center py-10 text-gray-500">Loading group details...</div>;
  if (!group) return <div className="text-center py-10 text-red-500">Group not found.</div>;

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
            <p className="text-gray-700 mb-6">{group.description}</p>

            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-4 gap-4 mx-auto mb-6">
                <TabsTrigger value="posts">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Posts
                </TabsTrigger>
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

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Group Posts</h3>
                  <Dialog open={isCreatingPost} onOpenChange={setIsCreatingPost}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#6C5CE7] text-white flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a Post</DialogTitle>
                      </DialogHeader>
                      <Textarea
                        placeholder="What's on your mind?"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                      />
                      <Input type="file" accept="image/*" onChange={(e) => setPostFile(e.target.files?.[0] || null)} />
                      <Button className="w-full mt-2 bg-[#6C5CE7] text-white" onClick={handleCreatePost}>
                        Post
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>

                {posts.length === 0 ? (
                  <p className="text-gray-500 text-center">No posts yet. Be the first to post!</p>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Posted on {new Date(post.created_at).toLocaleString()}</p>
                        <p className="mt-2">{post.content}</p>
                        {post.image_url && <img src={`http://localhost:8080/uploads/${post.image_url}`} alt="Post Image" className="mt-2 rounded-md" />}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

               {/* Members Tab */}
               <TabsContent value="members">
                <h3 className="text-lg font-semibold mb-4">Group Members</h3>
                {isLoadingMembers ? (
                  <p className="text-center text-gray-500">Loading members...</p>
                ) : members.length === 0 ? (
                  <p className="text-center text-gray-500">No members yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {members.map((member) => (
                      <Card key={member.id} className="border shadow-sm">
                        <CardContent className="p-4 flex items-center space-x-4">
                          
                          <div>
                            <p className="font-semibold">{member.first_name} {member.last_name}</p>
                            {member.nickname && <p className="text-gray-500 text-sm">@{member.nickname}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

               {/* Events Tab */}
               <TabsContent value="events">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Group Events</h3>
                  <Dialog open={isCreatingEvent} onOpenChange={setIsCreatingEvent}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#6C5CE7] text-white flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create an Event</DialogTitle>
                      </DialogHeader>
                      <Input placeholder="Event Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                      <Textarea placeholder="Event Description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} />
                      <Input type="datetime-local" value={eventDateTime} onChange={(e) => setEventDateTime(e.target.value)} />
                      <Button className="w-full mt-2 bg-[#6C5CE7] text-white" onClick={handleCreateEvent}>
                        Create Event
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>

                {events.map((event) => (
                  <Card key={event.id} className="border shadow-sm mb-4">
                    <CardContent className="p-4">
                      <p className="text-lg font-semibold">{event.title}</p>
                      <p className="text-sm text-gray-500">{new Date(event.date_time).toLocaleString()}</p>
                      <p className="mt-2">{event.description}</p>
                      <Button className="mr-2 mt-2" onClick={() => handleRSVP(event.id, "going")}>Going</Button>
                      <Button variant="destructive" className="mt-2" onClick={() => handleRSVP(event.id, "not_going")}>Not Going</Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
          
        </Card>
      </div>
    </div>
  );
}
