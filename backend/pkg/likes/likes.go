package likes

import (
	"database/sql"
	"net/http"
	"social-network/pkg/notifications"
	"social-network/pkg/sessions"

	"github.com/google/uuid"
)

type Like struct {
	ID     string `json:"id"`
	PostID string `json:"post_id"`
	UserID string `json:"user_id"`
}

// AddLikeHandler allows a user to like a post
func AddLikeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Retrieve the user_id from the session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Extract post_id from query params
		postID := r.URL.Query().Get("post_id")
		if postID == "" {
			http.Error(w, "Missing post_id", http.StatusBadRequest)
			return
		}

		// Check if the user has already liked the post
		var exists bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?)`, postID, userID).Scan(&exists)
		if err != nil {
			http.Error(w, "Failed to check like status", http.StatusInternalServerError)
			return
		}

		if exists {
			http.Error(w, "Post already liked", http.StatusBadRequest)
			return
		}

		// Generate a unique ID for the like
		likeID := uuid.New().String()

		// Insert the like into the database
		query := `
			INSERT INTO likes (id, post_id, user_id)
			VALUES (?, ?, ?)
		`
		_, err = db.Exec(query, likeID, postID, userID)
		if err != nil {
			http.Error(w, "Failed to add like", http.StatusInternalServerError)
			return
		}

		// Fetch the owner of the post
		var postOwnerID string
		err = db.QueryRow(`SELECT user_id FROM posts WHERE id = ?`, postID).Scan(&postOwnerID)
		if err != nil {
			http.Error(w, "Failed to retrieve post owner", http.StatusInternalServerError)
			return
		}

		// Use utility function to add a notification
		err = notifications.CreateNotification(db, postOwnerID, "like", "Your post was liked", postID, userID, "", "")
		if err != nil {
			http.Error(w, "Failed to create notification", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Post liked successfully"))
	}
}


// RemoveLikeHandler allows a user to unlike a post
func RemoveLikeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Retrieve the user_id from the session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Extract post_id from query params
		postID := r.URL.Query().Get("post_id")
		if postID == "" {
			http.Error(w, "Missing post_id", http.StatusBadRequest)
			return
		}

		// Check if the user has already liked the post
		var exists bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?)`, postID, userID).Scan(&exists)
		if err != nil {
			http.Error(w, "Failed to check like status", http.StatusInternalServerError)
			return
		}

		if !exists {
			http.Error(w, "Cannot unlike a post you haven't liked", http.StatusBadRequest)
			return
		}

		// Remove the like from the database
		query := `
			DELETE FROM likes
			WHERE post_id = ? AND user_id = ?
		`
		_, err = db.Exec(query, postID, userID)
		if err != nil {
			http.Error(w, "Failed to remove like", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Post unliked successfully"))
	}
}

