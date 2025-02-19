export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  type: string
  created_at: string
}

export interface User {
  id: string
  name: string
  online: boolean
  avatar: string
}
