"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CalendarDays } from "lucide-react";
import { Event } from "@/types/groupTypes";

interface EventsTabProps {
  events: Event[];
  isCreatingEvent: boolean;
  setIsCreatingEvent: (value: boolean) => void;
  eventTitle: string;
  setEventTitle: (value: string) => void;
  eventDescription: string;
  setEventDescription: (value: string) => void;
  eventDateTime: string;
  setEventDateTime: (value: string) => void;
  handleCreateEvent: () => void;
  handleRSVP: (eventId: string, status: "going" | "not going") => void;
}

export default function EventsTab({
  events,
  isCreatingEvent,
  setIsCreatingEvent,
  eventTitle,
  setEventTitle,
  eventDescription,
  setEventDescription,
  eventDateTime,
  setEventDateTime,
  handleCreateEvent,
  handleRSVP,
}: EventsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">Upcoming Events</h3>
        <Dialog open={isCreatingEvent} onOpenChange={setIsCreatingEvent}>
          <DialogTrigger asChild>
            <Button className="bg-[#6C5CE7] text-white flex items-center hover:bg-[#5b4edc] transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Create New Event
              </DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Event Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="mb-2"
            />
            <Textarea
              placeholder="Event Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="mb-2"
            />
            <Input
              type="datetime-local"
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
              className="mb-4"
            />
            <Button
              className="w-full bg-[#6C5CE7] text-white hover:bg-[#5b4edc] transition-all"
              onClick={handleCreateEvent}
            >
              Create Event
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <p className="text-center text-gray-500">No events available.</p>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="border shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-all"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-bold text-[#6C5CE7]">
                    {event.title}
                  </h4>
                  <div className="flex items-center text-gray-600 text-sm">
                    <CalendarDays className="w-5 h-5 mr-1" />
                    {new Date(event.event_date).toLocaleString()}
                  </div>
                </div>
                <p className="mt-2 text-gray-700">{event.description}</p>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    {/* "Going" Button */}
                    <Button
                      className={`px-4 py-2 rounded-lg transition-all ${
                        event.user_status === "going"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-300 text-gray-700 hover:bg-green-500 hover:text-white"
                      }`}
                      onClick={() => handleRSVP(event.id, "going")}
                    >
                      ✅ Going
                    </Button>

                    {/* "Not Going" Button */}
                    <Button
                      className={`px-4 py-2 rounded-lg transition-all ${
                        event.user_status === "not going"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-300 text-gray-700 hover:bg-red-500 hover:text-white"
                      }`}
                      onClick={() => handleRSVP(event.id, "not going")}
                    >
                      ❌ Not Going
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your RSVP:{" "}
                    <strong className="text-gray-800">
                      {event.user_status === "going"
                        ? "Going"
                        : event.user_status === "not going"
                        ? "Not Going"
                        : "None"}
                    </strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
