export interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: string;
  user_status: "member" | "not_joined" | "pending_request" | "pending_invite";
  }

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  nickname?: string;  
  avatar?: string;  
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  avatar?: string;
}

export interface Event {
  id: string;
  group_id: string;
  title: string;
  description: string;
  event_date: string;
  creator_id: string;
  user_status: string;
}

export interface RSVPStatus {
  event_id: string;
  user_id: string;
  status: "going" | "not going" | null;
}
