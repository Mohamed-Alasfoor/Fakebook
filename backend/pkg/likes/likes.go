package likes

import (
	"database/sql"
	"net/http"
   "social-network/pkg/notifications"
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

		// Extract post_id and user_id from query params
		postID := r.URL.Query().Get("post_id")
		userID := r.URL.Query().Get("user_id")
		if postID == "" || userID == "" {
			http.Error(w, "Missing post_id or user_id", http.StatusBadRequest)
			return
		}

		// Generate a unique ID for the like
		likeID := uuid.New().String()

		// Insert the like into the database
		query := `
			INSERT INTO likes (id, post_id, user_id)
			VALUES (?, ?, ?)
		`
		_, err := db.Exec(query, likeID, postID, userID)
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

		// Extract post_id and user_id from query params
		postID := r.URL.Query().Get("post_id")
		userID := r.URL.Query().Get("user_id")
		if postID == "" || userID == "" {
			http.Error(w, "Missing post_id or user_id", http.StatusBadRequest)
			return
		}

		// Remove the like from the database
		query := `
			DELETE FROM likes
			WHERE post_id = ? AND user_id = ?
		`
		_, err := db.Exec(query, postID, userID)
		if err != nil {
			http.Error(w, "Failed to remove like", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Post unliked successfully"))
	}
}
