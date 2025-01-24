package main

import (
	"log"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/likes"
	"social-network/pkg/posts"
	"social-network/pkg/comments"
)

func main() {
	// Connect to the database
	db := sqlite.ConnectDB()
	defer db.Close()

	// Apply migrations
	sqlite.ApplyMigrations(db)


	// Register authentication routes
	http.HandleFunc("/register", auth.RegisterHandler(db))
	http.HandleFunc("/login", auth.LoginHandler(db))
	http.HandleFunc("/logout", auth.LogoutHandler())
	http.HandleFunc("/posts", posts.CreatePostHandler(db))
	http.HandleFunc("/posts/all", posts.GetPostsHandler(db))
	http.HandleFunc("/posts/delete", posts.DeletePostHandler(db))
	http.HandleFunc("/posts/like", likes.AddLikeHandler(db))
	http.HandleFunc("/posts/unlike", likes.RemoveLikeHandler(db))
	http.HandleFunc("/posts/comments", comments.AddCommentHandler(db))
	http.HandleFunc("/posts/comments/delete", comments.DeleteCommentHandler(db))	

	// Protected routes
	http.Handle("/protected-resource", auth.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("This is a protected resource"))
	})))	

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
