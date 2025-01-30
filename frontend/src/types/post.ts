export interface Post {
    user: string;
    user_id: number;
    id: number;
    content: string;
    userProfileImage: string;
    image_url?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    privacy: string;
    selectedUsers?: string[];
    nickname?: string;
    has_liked: boolean;
  }
  