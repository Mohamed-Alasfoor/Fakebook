import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, Send, X } from "lucide-react"

interface Comment {
  id: number
  user: string
  userImage: string
  content: string
  timestamp: string
}

interface PostViewProps {
  post: {
    id: number
    user: string
    userImage: string
    content: string
    image?: string
    likes: number
    comments: number
    timestamp: string
  }
  onClose: () => void
}

export function PostView({ post, onClose }: PostViewProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: "Jane Doe",
      userImage: "/placeholder.svg?height=40&width=40",
      content: "Great post! Thanks for sharing.",
      timestamp: "2h ago",
    },
    {
      id: 2,
      user: "John Smith",
      userImage: "/placeholder.svg?height=40&width=40",
      content: "I completely agree with your points. Very insightful!",
      timestamp: "1h ago",
    },
  ])
  const [newComment, setNewComment] = useState("")

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      const comment: Comment = {
        id: comments.length + 1,
        user: "Current User",
        userImage: "/placeholder.svg?height=40&width=40",
        content: newComment,
        timestamp: "Just now",
      }
      setComments([...comments, comment])
      setNewComment("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="sticky top-0 bg-white z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.userImage} alt={post.user} />
              <AvatarFallback>{post.user[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{post.user}</h3>
              <p className="text-sm text-gray-500">{post.timestamp}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{post.content}</p>
          {post.image && (
            <img src={post.image || "/placeholder.svg"} alt="Post content" className="w-full rounded-lg" />
          )}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <button className="flex items-center gap-2">
              <Heart className="w-5 h-5" /> {post.likes} Likes
            </button>
            <button className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> {comments.length} Comments
            </button>
            <button className="flex items-center gap-2">
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">Comments</h4>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={comment.userImage} alt={comment.user} />
                    <AvatarFallback>{comment.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="font-semibold">{comment.user}</p>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{comment.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="sticky bottom-0 bg-white border-t">
          <form onSubmit={handleCommentSubmit} className="w-full flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

