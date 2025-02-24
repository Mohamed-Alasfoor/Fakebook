"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MessageCircle, Users, Calendar } from "lucide-react";
import PostsTab from "@/components/groups/PostsTab";
import MembersTab from "@/components/groups/MembersTab";
import EventsTab from "@/components/groups/EventsTab";
import ChatTab from "@/components/groups/ChatTab";
import { InviteButton } from "@/components/groups/InviteButton";
import { LeaveGroupButton } from "@/components/groups/LeaveGroupButton";
import { DeleteGroupButton } from "@/components/groups/DeleteGroupButton";
import { RemoveMemberButton } from "@/components/groups/RemoveMemberButton";
import { Group, Post, Member, Event, RSVPStatus } from "@/types/groupTypes";
import { useWebSocket } from "@/lib/hooks/use-web-socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Alert from "@/components/ui/alert";
import { set } from "date-fns";
interface ChatMessage {
  sender_id: string;
  message: string;
  created_at: string;
}

export default function GroupView() {
  const params = useParams();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<RSVPStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  // --- Chat States & Refs ---
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // --- WebSocket hook ---
  const { socket, isConnected, sendMessage } = useWebSocket(
    `ws://localhost:8080/groups/chat?group_id=${params.id}`
  );

  // --- Fetch Group Data ---
  useEffect(() => {
    if (!params?.id) return;

    const fetchGroupData = async () => {
      try {
        const groupId = params.id as string;
        console.log("Fetching group data for groupId:", groupId);
        const [groupResponse, postsResponse, membersResponse, eventsResponse] =
          await Promise.all([
            axios.get(
              `http://localhost:8080/groups/{group_id}?group_id=${groupId}`,
              { withCredentials: true }
            ),
            axios.get(
              `http://localhost:8080/groups/posts?group_id=${groupId}`,
              { withCredentials: true }
            ),
            axios.get(
              `http://localhost:8080/groups/members?group_id=${groupId}`,
              { withCredentials: true }
            ),
            axios.get(
              `http://localhost:8080/groups/events?group_id=${groupId}`,
              { withCredentials: true }
            ),
          ]);

        if (
          !groupResponse?.data ||
          Object.keys(groupResponse.data).length === 0
        ) {
          router.push("/groups");
          return;
        }

        // Debug log the fetched group data
        console.log("Fetched group data:", groupResponse.data);
        // Map backend fields if needed:
        const fetchedGroup: Group = {
          ...groupResponse.data,
          id: groupResponse.data.id || groupResponse.data.group_id,
        };
        setGroup(fetchedGroup);
        setPosts(postsResponse?.data || []);
        setMembers(membersResponse?.data || []);
        setEvents(eventsResponse?.data || []);
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

  // --- Create Post ---
  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      return setAlert({
        type: "error",
        message: "Post content cannot be empty.",
      });
    }
    const formData = new FormData();
    formData.append("group_id", params.id as string);
    formData.append("content", postContent);
    if (postFile) formData.append("file", postFile);

    try {
      const response = await axios.post(
        "http://localhost:8080/groups/posts/create",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setPosts([
        {
          id: response.data.post_id,
          user_id: "me",
          content: postContent,
          image_url: response.data.image_url,
          created_at: new Date().toISOString(),
        },
        ...posts,
      ]);
      setPostContent("");
      setPostFile(null);
      setIsCreatingPost(false);
    } catch (error) {
      setAlert({
        type: "error",
        message: "Failed to create post. Please try again.",
      });
    }
  };

  // --- Fetch RSVPs for events ---
  useEffect(() => {
    if (events.length === 0) return;

    const fetchRSVPs = async () => {
      try {
        const rsvpResponses = await Promise.all(
          events.map((event) =>
            axios
              .get(
                `http://localhost:8080/groups/events/rsvps?event_id=${event.id}`,
                { withCredentials: true }
              )
              .catch(() => null)
          )
        );

        const rsvpData = rsvpResponses.flatMap(
          (response) => response?.data || []
        );
        setRsvps(rsvpData);
      } catch (error) {
        console.error("Error fetching RSVPs:", error);
      }
    };

    fetchRSVPs();
  }, [events]);

  // --- Create Event ---
  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDateTime) {
      return setAlert({
        type: "error",
        message: "Please fill in all fields.",
      });
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/groups/events/create",
        {
          group_id: params.id,
          title: eventTitle,
          description: eventDescription,
          event_date: eventDateTime,
        },
        { withCredentials: true }
      );

      setEvents([
        {
          id: response.data.event_id,
          group_id: params.id as string,
          title: eventTitle,
          description: eventDescription,
          event_date: eventDateTime,
          creator_id: "me",
          user_status: "none",
        },
        ...events,
      ]);
      setEventTitle("");
      setEventDescription("");
      setEventDateTime("");
      setIsCreatingEvent(false);
    } catch (error) {
      setAlert({
        type: "error",
        message: "Failed to create event. Please try again.",
      });
    }
  };

  // --- RSVP Handler ---
  const handleRSVP = async (eventId: string, status: "going" | "not going") => {
    try {
      await axios.post(
        "http://localhost:8080/groups/events/rsvp",
        { event_id: eventId, status },
        { withCredentials: true }
      );

      setEvents((prevEvents) =>
        prevEvents.map((ev) =>
          ev.id === eventId ? { ...ev, user_status: status } : ev
        )
      );

      setRsvps((prev) => {
        const existingRSVP = prev.find((rsvp) => rsvp.event_id === eventId);
        if (existingRSVP) {
          return prev.map((rsvp) =>
            rsvp.event_id === eventId ? { ...rsvp, status } : rsvp
          );
        }
        return [...prev, { event_id: eventId, user_id: "me", status }];
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: "Failed to RSVP. Please try again.",
      });
    }
  };

  // --- Fetch Previous Chat Messages ---
  useEffect(() => {
    if (!params?.id) return;
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/groups/chat/messages?group_id=${params.id}`,
          { withCredentials: true }
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching previous chat messages:", error);
      }
    };
    fetchMessages();
  }, [params?.id]);

  // --- Listen for Incoming WebSocket Messages ---
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages((prevMessages) => [...(prevMessages ?? []), message]);
      };
    }
  }, [socket]);

  // --- Auto-scroll when messages update ---
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Send Message Handler ---
  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      const now = new Date();
      const message = {
        message: newMessage,
        // Use now.getTime() for a numeric id (converted to string)
        id: now.getTime().toString(),
        // Generate a valid ISO timestamp
        created_at: now.toISOString(),
      };
      // Pass the JSON string to sendMessage (since your useWebSocket hook expects a string)
      sendMessage(JSON.stringify(message));
      setNewMessage("");
    }
  };

  // Determine current user ID from cookies
  const currentUserId = Cookies.get("user_id");

  // Check if current user is the creator of the group.
  const isCreator = group?.creator_id === currentUserId;

  if (isLoading)
    return (
      <div className="text-center py-10 text-gray-500">
        Loading group details...
      </div>
    );
  if (!group)
    return (
      <div className="text-center py-10 text-red-500">Group not found.</div>
    );

  return (
   <>
  {alert && (
        <Alert
          title={alert.type === "success" ? "Success" : "Error"}
          message={alert.message}
          type={alert.type}
          duration={5000}
          onClose={() => setAlert(null)}
        />
      )}
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
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  className="bg-white text-[#6C5CE7] hover:bg-slate-100"
                  onClick={() => router.push("/groups")}
                >
                  Back to Groups
                </Button>
                {/* Invite Button */}
                <InviteButton groupId={group.id} onInviteSuccess={() => {}} />
                {/* If current user is creator, show Delete Group button;
                    otherwise show Leave Group button */}
                {isCreator ? (
                  <DeleteGroupButton
                    groupId={group.id}
                    onDelete={() => router.push("/groups")}
                  />
                ) : (
                  <LeaveGroupButton
                    groupId={group.id}
                    onLeave={() => router.push("/groups")}
                  />
                )}
              </div>
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
                <PostsTab
                  posts={posts}
                  selectedPost={selectedPost}
                  setSelectedPost={setSelectedPost}
                  isCreatingPost={isCreatingPost}
                  setIsCreatingPost={setIsCreatingPost}
                  postContent={postContent}
                  setPostContent={setPostContent}
                  postFile={postFile}
                  setPostFile={setPostFile}
                  handleCreatePost={handleCreatePost}
                />
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="p-0">
                <ChatTab
                  messages={messages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  handleSendMessage={handleSendMessage}
                  currentUserId={currentUserId}
                />
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members">
                <div className="space-y-4">
                  {/* Render each member with an optional remove button if current user is creator */}
                  {isLoadingMembers ? (
                    <p className="text-center text-gray-500">
                      Loading members...
                    </p>
                  ) : members.length === 0 ? (
                    <p className="text-center text-gray-500">No members yet.</p>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={
                                member.avatar
                                  ? `http://localhost:8080/avatars/${member.avatar}`
                                  : "/profile.png"
                              }
                            />
                            <AvatarFallback>
                              {member.first_name[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-semibold">
                              {member.first_name} {member.last_name}
                            </p>
                            {member.nickname && (
                              <p className="text-gray-500 text-sm">
                                @{member.nickname}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Show RemoveMemberButton only if current user is the creator and this member is not the creator */}
                        {isCreator && member.id !== group.creator_id && (
                          <RemoveMemberButton
                            groupId={group.id}
                            userId={member.id}
                            onRemove={() => {
                              // Remove the member from local state after successful removal
                              setMembers((prev) =>
                                prev.filter((m) => m.id !== member.id)
                              );
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events">
                <EventsTab
                  events={events}
                  isCreatingEvent={isCreatingEvent}
                  setIsCreatingEvent={setIsCreatingEvent}
                  eventTitle={eventTitle}
                  setEventTitle={setEventTitle}
                  eventDescription={eventDescription}
                  setEventDescription={setEventDescription}
                  eventDateTime={eventDateTime}
                  setEventDateTime={setEventDateTime}
                  handleCreateEvent={handleCreateEvent}
                  handleRSVP={handleRSVP}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
   </>
  );
}
