export interface User {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  avatar?: string;
  date_of_birth: string;
  followers_count: number;
  following_count: number;
  private: boolean;
  is_following: boolean;
  is_my_profile: boolean;
}