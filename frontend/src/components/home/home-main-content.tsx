"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MessageCircle, Send, Heart, ArrowLeft, Share2, Menu } from "lucide-react"
import { CreatePostPopup } from "@/components/home/posts/create_post_popup"

interface Comment {
  id: number
  user: string
  userImage: string
  content: string
  timestamp: string
}

interface Post {
  user: string
  postId: number
  content: string
  userProfileImage: string
  postImage?: string
  likes: number
  comments: Comment[]
  timestamp: string
  privacy: string
  selectedUsers?: string[]
}

interface MainContentProps {
  onOpenSidebar: () => void
}

export function MainContent({ onOpenSidebar }: MainContentProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>([
    {
      user: "UserName",
      postId: 1,
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc vel tincidunt lacinia, nisl nisl aliquam nunc, vitae aliquam nisl nisl sit amet nisl.",
      userProfileImage: "/profile.png",
      postImage: "https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg",
      likes: 22,
      comments: [
        {
          id: 1,
          user: "John Doe",
          userImage: "/placeholder.svg?height=40&width=40",
          content: "Great post! Thanks for sharing.",
          timestamp: "2h ago",
        },
      ],
      timestamp: "3h ago",
      privacy: "public",
    },
    {
      user: "UserName",
      postId: 3,
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc vel tincidunt lacinia, nisl nisl aliquam nunc, vitae aliquam nisl nisl sit amet nisl.",
      userProfileImage: "/profile.png",
      postImage: "https://images2.boardingschoolreview.com/photo/593/IMG-Academy-6r5kz9j4u144kso44sw8800k0-1122.jpg",
      likes: 22,
      comments: [
        {
          id: 1,
          user: "Jane Smith",
          userImage: "/placeholder.svg?height=40&width=40",
          content: "This is amazing! Keep up the good work.",
          timestamp: "1h ago",
        },
      ],
      timestamp: "4h ago",
      privacy: "public",
    },
  ])

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPost && newComment.trim()) {
      const updatedPost = {
        ...selectedPost,
        comments: [
          ...selectedPost.comments,
          {
            id: selectedPost.comments.length + 1,
            user: "Current User",
            userImage: "/profile.png",
            content: newComment,
            timestamp: "Just now",
          },
        ],
      }
      setPosts(posts.map((post) => (post.postId === selectedPost.postId ? updatedPost : post)))
      setSelectedPost(updatedPost)
      setNewComment("")
    }
  }

  const handleCreatePost = (newPost: any) => {
    const post: Post = {
      user: "UserName",
      postId: posts.length + 1,
      content: newPost.content,
      userProfileImage: "/profile.png",
      postImage: newPost.image,
      likes: 0,
      comments: [],
      timestamp: "Just now",
      privacy: newPost.privacy,
      selectedUsers: newPost.selectedUsers,
    }
    setPosts([post, ...posts])
  }

  const PostsList = () => (
    <>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <Input placeholder="Search for friends, groups, pages" className="flex-1" />
        <Button className="gap-2 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90" onClick={() => setIsCreatePostOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Post</span>
        </Button>
      </div>

      {posts.map((post) => (
        <div
          className="bg-white rounded-lg shadow p-4 mb-4 cursor-pointer transition-all hover:shadow-md"
          key={post.postId}
          onClick={() => setSelectedPost(post)}
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={post.userProfileImage} alt={post.user} />
              <AvatarFallback>{post.user[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{post.user}</h3>
              <p className="text-sm text-gray-500">{post.timestamp}</p>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{post.content}</p>

          {post.postImage && (
            <img src={post.postImage || "/placeholder.svg"} alt="Post image" className="w-full rounded-lg mb-4" />
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <button className="flex items-center gap-2">
              <Heart className="w-5 h-5" /> {post.likes} Likes
            </button>
            <button className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> {post.comments.length} Comments
            </button>
          </div>
        </div>
      ))}
    </>
  )

  const PostView = () => {
    if (!selectedPost) return null

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedPost(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Posts
          </Button>
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={selectedPost.userProfileImage} alt={selectedPost.user} />
              <AvatarFallback>{selectedPost.user[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{selectedPost.user}</h3>
              <p className="text-sm text-gray-500">{selectedPost.timestamp}</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{selectedPost.content}</p>
          {selectedPost.postImage && (
            <img
              src={selectedPost.postImage || "/placeholder.svg"}
              alt="Post image"
              className="w-full rounded-lg mb-4"
            />
          )}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <button className="flex items-center gap-2">
              <Heart className="w-5 h-5" /> {selectedPost.likes} Likes
            </button>
            <button className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> {selectedPost.comments.length} Comments
            </button>
            <button className="flex items-center gap-2">
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <h4 className="font-semibold mb-4">Comments</h4>
          <div className="space-y-4">
            {selectedPost.comments.map((comment) => (
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
        <div className="p-4 border-t">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
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
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-6">
      {selectedPost ? <PostView /> : <PostsList />}
      <CreatePostPopup
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreatePost={handleCreatePost}
      />
    </main>
  )
}

