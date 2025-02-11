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
import { Plus } from "lucide-react";
import { Event, RSVPStatus } from "@/types/groupTypes";

interface EventsTabProps {
  events: Event[];
  rsvps: RSVPStatus[];
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
  rsvps,
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
    <>
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
            <Input
              placeholder="Event Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
            <Textarea
              placeholder="Event Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
            <Input
              type="datetime-local"
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
            />
            <Button
              className="w-full mt-2 bg-[#6C5CE7] text-white"
              onClick={handleCreateEvent}
            >
              Create Event
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <p className="text-center text-gray-500">No events yet.</p>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => {
            const userRSVP = rsvps.find(
              (rsvp) => rsvp.event_id === event.id
            )?.status;

            return (
              <Card
                key={event.id}
                className="border shadow-lg rounded-lg overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-bold text-[#6C5CE7]">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(event.event_date).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-2 text-gray-700">{event.description}</p>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                      <Button
                        className={`text-white ${
                          userRSVP === "going"
                            ? "bg-green-600"
                            : "bg-gray-300 hover:bg-green-500"
                        }`}
                        onClick={() => handleRSVP(event.id, "going")}
                      >
                        ✅ Going
                      </Button>
                      <Button
                        className={`text-white ${
                          userRSVP === "not going"
                            ? "bg-red-600"
                            : "bg-gray-300 hover:bg-red-500"
                        }`}
                        onClick={() =>
                          handleRSVP(event.id, "not going")
                        }
                      >
                        ❌ Not Going
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Your RSVP:{" "}
                      <strong>
                        {userRSVP ? userRSVP.toUpperCase() : "None"}
                      </strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
