package comments

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Comment struct {
	ID        string `json:"id"`
	PostID    string `json:"post_id"`
	UserID    string `json:"user_id"`
	Content   string `json:"content"`
	ImageURL  string `json:"image_url,omitempty"`
	CreatedAt string `json:"created_at"`
}

// AddCommentHandler allows a user to add a comment
func AddCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var comment Comment
		if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Insert the comment into the database
		query := `
			INSERT INTO comments (id, post_id, user_id, content, image_url)
			VALUES (?, ?, ?, ?, ?)
		`
		_, err := db.Exec(query, comment.ID, comment.PostID, comment.UserID, comment.Content, comment.ImageURL)
		if err != nil {
			http.Error(w, "Failed to add comment", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Comment added successfully"))
	}
}

// DeleteCommentHandler allows a user to delete their own comment
func DeleteCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Extract comment_id from query params
		commentID := r.URL.Query().Get("comment_id")
		if commentID == "" {
			http.Error(w, "Missing comment_id", http.StatusBadRequest)
			return
		}

		// Delete the comment from the database
		query := `
			DELETE FROM comments
			WHERE id = ?
		`
		_, err := db.Exec(query, commentID)
		if err != nil {
			http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Comment deleted successfully"))
	}
}
