"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
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
import { Group, Post, Member, Event, RSVPStatus } from "@/types/groupTypes";
import { useWebSocket } from "@/lib/hooks/use-web-socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatTab from "@/components/groups/ChatTab";
import Cookies from "js-cookie";

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

        setGroup(groupResponse.data);
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
      return alert("Post content cannot be empty.");
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
      console.error("Failed to create post:", error);
      alert("Error creating post.");
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
      return alert("All fields are required.");
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
      console.error("Failed to create event:", error);
      alert("Error creating event.");
    }
  };

  // --- RSVP Handler (Updated to directly update events array) ---
  const handleRSVP = async (eventId: string, status: "going" | "not going") => {
    try {
      await axios.post(
        "http://localhost:8080/groups/events/rsvp",
        { event_id: eventId, status },
        { withCredentials: true }
      );

      // Update the user_status in the events array directly
      setEvents((prevEvents) =>
        prevEvents.map((ev) =>
          ev.id === eventId ? { ...ev, user_status: status } : ev
        )
      );

      // You can still track RSVPs separately if you want:
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
      console.error("Failed to RSVP:", error);
      alert("Error updating RSVP.");
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
        setMessages((prevMessages) => [...prevMessages, message]);
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
      sendMessage(JSON.stringify({ message: newMessage }));
      setNewMessage("");
    }
  };

  if (isLoading)
    return (
      <div className="text-center py-10 text-gray-500">
        Loading group details...
      </div>
    );
  if (!group)
    return (
      <div className="text-center py-10 text-red-500">
        Group not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-[#6C5CE7] text-white rounded-t-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{group.name}</CardTitle>
                <CardDescription className="text-slate-200 mt-2">
                  Created on{" "}
                  {new Date(group.created_at).toLocaleDateString()}
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
                  currentUserId={Cookies.get("user_id")}
                />
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members">
                <MembersTab
                  members={members}
                  isLoadingMembers={isLoadingMembers}
                />
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
  );
}
