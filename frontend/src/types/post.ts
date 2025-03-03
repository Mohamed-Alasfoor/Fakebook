export interface Post {
  user: string;
  user_id: string;
  id: string;
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
  avatar?: string;
  
}
