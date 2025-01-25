package main

import (
	"log"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/likes"
	"social-network/pkg/posts"
	"social-network/pkg/comments"
	"social-network/pkg/middleware" 
)

func main() {
	// Connect to the database
	db := sqlite.ConnectDB()
	defer db.Close()

	// Apply migrations
	sqlite.ApplyMigrations(db)

	// Create a new ServeMux to manage routes
	mux := http.NewServeMux()

	// Public Routes
	mux.HandleFunc("/register", auth.RegisterHandler(db))
	mux.HandleFunc("/login", auth.LoginHandler(db))
	mux.HandleFunc("/logout", auth.LogoutHandler())
	mux.HandleFunc("/posts", posts.CreatePostHandler(db))
	mux.HandleFunc("/posts/all", posts.GetPostsHandler(db))
	mux.HandleFunc("/posts/delete", posts.DeletePostHandler(db))
	mux.HandleFunc("/posts/like", likes.AddLikeHandler(db))
	mux.HandleFunc("/posts/unlike", likes.RemoveLikeHandler(db))
	mux.HandleFunc("/posts/comments", comments.AddCommentHandler(db))
	mux.HandleFunc("/posts/comments/delete", comments.DeleteCommentHandler(db))
	mux.HandleFunc("/posts/comments/all", comments.GetCommentsByPostHandler(db))

	// Protected Routes (require authentication)
	mux.Handle("/protected-resource", auth.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("This is a protected resource"))
	})))

	// Apply CORS middleware globally
	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", middleware.CORSMiddleware(mux)))
}
