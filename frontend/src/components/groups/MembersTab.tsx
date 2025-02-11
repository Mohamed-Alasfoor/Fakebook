"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Member } from "@/types/groupTypes";

interface MembersTabProps {
  members: Member[];
  isLoadingMembers: boolean;
}

export default function MembersTab({
  members,
  isLoadingMembers,
}: MembersTabProps) {
  return (
    <>
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
                  <p className="font-semibold">
                    {member.first_name} {member.last_name}
                  </p>
                  {member.nickname && (
                    <p className="text-gray-500 text-sm">
                      @{member.nickname}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
