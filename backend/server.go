package main

import (
	"log"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/comments"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/followers"
	"social-network/pkg/likes"
	"social-network/pkg/middleware"
	"social-network/pkg/notifications"
	"social-network/pkg/posts"
	"social-network/pkg/sessions"
	"social-network/pkg/users"
	"social-network/pkg/groups"
	"social-network/pkg/events"
	"social-network/pkg/rsvp"
)

func main() {
	// Connect to the database
	db := sqlite.ConnectDB()
	defer db.Close()

	// Apply migrations
	sqlite.ApplyMigrations(db)

	// Assign the database connection to the sessions package
	sessions.DB = db

	// Create a new ServeMux to manage routes
	mux := http.NewServeMux()

	// Public Routes
	mux.HandleFunc("/register", auth.RegisterHandler(db))
	mux.HandleFunc("/login", auth.LoginHandler(db))
	mux.HandleFunc("/logout", auth.LogoutHandler(db)) 

	// Posts
	mux.HandleFunc("/posts", posts.CreatePostHandler(db))
	mux.HandleFunc("/posts/all", posts.GetPostsHandler(db))
	mux.HandleFunc("/posts/delete", posts.DeletePostHandler(db))
	mux.HandleFunc("/posts/like", likes.AddLikeHandler(db))
	mux.HandleFunc("/posts/unlike", likes.RemoveLikeHandler(db))

	// Comments
	mux.HandleFunc("/posts/comments", comments.AddCommentHandler(db))
	mux.HandleFunc("/posts/comments/delete", comments.DeleteCommentHandler(db))
	mux.HandleFunc("/posts/comments/all", comments.GetCommentsByPostHandler(db))

	// Post Privacy
	mux.HandleFunc("/posts/privacy", posts.UpdatePostPrivacyHandler(db))

// Notifications
	mux.HandleFunc("/notifications", notifications.AddNotificationHandler(db))
	mux.HandleFunc("/notifications/get", notifications.GetNotificationsHandler(db))
	mux.HandleFunc("/notifications/read", notifications.MarkNotificationReadHandler(db))

  	// Followers
	mux.HandleFunc("/follow", followers.FollowHandler(db))
	mux.HandleFunc("/unfollow", followers.UnfollowHandler(db))
	mux.HandleFunc("/followers", followers.GetFollowersHandler(db))
	mux.HandleFunc("/follow/request", followers.HandleFollowRequest(db))
	mux.HandleFunc("/follow/requests", followers.GetFollowRequestsHandler(db))

	// User Privacy
	mux.HandleFunc("/users/privacy", users.UpdatePrivacyHandler(db))


// Groups endpoints
  mux.HandleFunc("/groups", groups.GetAllGroupsHandler(db))                    // Fetch all groups for browsing
  mux.HandleFunc("/groups/search", groups.SearchGroupsHandler(db))             // Search for groups by name
  mux.HandleFunc("/groups/create", groups.CreateGroupHandler(db))              // Create a new group
  mux.HandleFunc("/groups/join", groups.RequestToJoinHandler(db))              // Request to join a group
  mux.HandleFunc("/groups/join/respond", groups.HandleJoinRequestHandler(db))  // Accept/decline a join request
  mux.HandleFunc("/groups/invite", groups.SendInvitationHandler(db))           // Send a group invitation
  mux.HandleFunc("/groups/invite/respond", groups.HandleInvitationHandler(db)) // Accept/decline a group invitation
  mux.HandleFunc("/groups/leave", groups.LeaveGroupHandler(db))                // Leave a group
  mux.HandleFunc("/groups/user", groups.GetUserGroupsHandler(db))              // Get all groups a user belongs to
  mux.HandleFunc("/groups/requests", groups.GetPendingRequestsHandler(db))     // Get all pending join requests for a creator's groups
  mux.HandleFunc("/groups/remove", groups.RemoveMemberHandler(db))             // Remove a member from a group (only for creator)
  mux.HandleFunc("/groups/delete", groups.DeleteGroupHandler(db))              // Delete a group (only for creator)
  mux.HandleFunc("/groups/members", groups.GetGroupMembersHandler(db))         // Get a list of all members in a group


// Group Posts 
  mux.HandleFunc("/groups/posts/create", groups.CreateGroupPostHandler(db))       // Create a group post
  mux.HandleFunc("/groups/posts/delete", groups.DeleteGroupPostHandler(db))       // Delete a group post
  mux.HandleFunc("/groups/posts", groups.GetGroupPostsHandler(db))                // Fetch all posts in a group

// Group Post Comments
  mux.HandleFunc("/groups/posts/comments/create", groups.CreateGroupPostCommentHandler(db)) // Add comment to group post
  mux.HandleFunc("/groups/posts/comments", groups.GetGroupPostCommentsHandler(db))         // Fetch comments for a post
  mux.HandleFunc("/groups/posts/comments/delete", groups.DeleteGroupPostCommentHandler(db)) // Delete comment

		// Event Routes
		mux.HandleFunc("/events/create", events.CreateEventHandler(db))
	
		// RSVP Routes
		mux.HandleFunc("/events/rsvp", rsvp.RSVPHandler(db))


	// Protected Routes (require authentication)
	mux.Handle("/protected-resource", auth.AuthMiddleware(db, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("This is a protected resource"))
	})))

	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))



	// Apply CORS middleware globally
	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", middleware.CORSMiddleware(mux)))
}
