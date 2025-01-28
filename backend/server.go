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
	"social-network/pkg/users"
	"social-network/pkg/sessions"
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
	mux.HandleFunc("/logout", auth.LogoutHandler(db)) // Updated to include `db`

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

	// Serve uploaded files
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("backend/uploads"))))

	// Protected Routes (require authentication)
	mux.Handle("/protected-resource", auth.AuthMiddleware(db, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("This is a protected resource"))
	})))

	// Apply CORS middleware globally
	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", middleware.CORSMiddleware(mux)))
}
