package comments

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"social-network/app/notifications"
	"social-network/app/sessions"
	"strings"

	"github.com/google/uuid"
)

// Comment represents a comment without user-specific display info.
type Comment struct {
	ID        string `json:"id"`
	PostID    string `json:"post_id"`
	UserID    string `json:"user_id"`
	Content   string `json:"content"`
	ImageURL  string `json:"image_url,omitempty"`
	CreatedAt string `json:"created_at"`
}

// AddCommentHandler allows a user to add a comment, including optional images.
func AddCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Parse multipart form with a max upload size (e.g., 10MB)
		const maxUploadSize = 10 << 20 // 10 MB
		err := r.ParseMultipartForm(maxUploadSize)
		if err != nil {
			http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Retrieve user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Retrieve form values
		postID := r.FormValue("post_id")
		content := r.FormValue("content")

		if postID == "" || content == "" {
			http.Error(w, "Post ID and content are required", http.StatusBadRequest)
			return
		}

		// Enforce word count limit (max 250 characters)
		if len(content) > 250 {
			http.Error(w, "Content cannot exceed 250 characters", http.StatusBadRequest)
			return
		}

		// Handle file upload (optional)
		var imageURL string
		file, fileHeader, err := r.FormFile("file")
		if err == nil { // File exists
			defer file.Close()

			allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif"}
			fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
			if !contains(allowedExtensions, fileExt) {
				http.Error(w, "Invalid file type. Only .jpg, .jpeg, .png, and .gif are allowed.", http.StatusBadRequest)
				return
			}

			// Save file
			fileName := uuid.New().String() + fileExt
			savePath := filepath.Join("uploads", fileName)
			outFile, err := os.Create(savePath)
			if err != nil {
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}
			defer outFile.Close()

			if _, err := io.Copy(outFile, file); err != nil {
				http.Error(w, "Failed to write file", http.StatusInternalServerError)
				return
			}

			imageURL = fileName
		}

		// Generate a unique comment ID
		commentID := uuid.New().String()

		// Insert the comment into the database
		query := `
			INSERT INTO comments (id, post_id, user_id, content, image_url)
			VALUES (?, ?, ?, ?, ?)
		`
		_, err = db.Exec(query, commentID, postID, userID, content, imageURL)
		if err != nil {
			http.Error(w, "Failed to add comment: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Fetch the owner of the post
		var postOwnerID string
		err = db.QueryRow(`SELECT user_id FROM posts WHERE id = ?`, postID).Scan(&postOwnerID)
		if err != nil {
			http.Error(w, "Failed to retrieve post owner", http.StatusInternalServerError)
			return
		}

		// If the commenter is not the post owner, create a notification.
		if userID != postOwnerID {
			// Fetch the commenter's nickname
			var nickname string
			err = db.QueryRow(`SELECT nickname FROM users WHERE id = ?`, userID).Scan(&nickname)
			if err != nil {
				nickname = "Someone" // Fallback value if nickname isn't found
			}

			// Create a custom message like "Nickname has commented on your post"
			message := nickname + " has commented on your post"

			// Send notification to the post owner
			err = notifications.CreateNotification(db, postOwnerID, "comment", message, postID, userID, "", "")
			if err != nil {
				http.Error(w, "Failed to create notification", http.StatusInternalServerError)
				return
			}
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

		// Retrieve user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Extract comment_id from query params
		commentID := r.URL.Query().Get("comment_id")
		if commentID == "" {
			http.Error(w, "Missing comment_id", http.StatusBadRequest)
			return
		}

		// Check if the comment belongs to the user
		var ownerID string
		err = db.QueryRow(`SELECT user_id FROM comments WHERE id = ?`, commentID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			http.Error(w, "Comment not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to verify comment ownership", http.StatusInternalServerError)
			return
		}

		// Ensure the logged-in user is the owner
		if ownerID != userID {
			http.Error(w, "Unauthorized: You can only delete your own comments", http.StatusForbidden)
			return
		}

		// Delete the comment from the database
		query := `DELETE FROM comments WHERE id = ?`
		_, err = db.Exec(query, commentID)
		if err != nil {
			http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Comment deleted successfully"))
	}
}

// GetCommentsByPostHandler fetches all comments for a post along with the user's nickname and avatar
func GetCommentsByPostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		postID := r.URL.Query().Get("post_id")
		if postID == "" {
			http.Error(w, "Missing post_id parameter", http.StatusBadRequest)
			return
		}

		// Query to fetch comments along with user's nickname and avatar
		rows, err := db.Query(`
			SELECT c.id, c.post_id, c.user_id, u.nickname, u.avatar, c.content, c.image_url, c.created_at
			FROM comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.post_id = ?
			ORDER BY c.created_at ASC
		`, postID)
		if err != nil {
			http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Struct to hold comment data including nickname and avatar
		type CommentResponse struct {
			ID        string `json:"id"`
			PostID    string `json:"post_id"`
			UserID    string `json:"user_id"`
			Nickname  string `json:"nickname"`
			Avatar    string `json:"avatar"`
			Content   string `json:"content"`
			ImageURL  string `json:"image_url,omitempty"`
			CreatedAt string `json:"created_at"`
		}

		var comments []CommentResponse
		for rows.Next() {
			var comment CommentResponse
			if err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Nickname, &comment.Avatar, &comment.Content, &comment.ImageURL, &comment.CreatedAt); err != nil {
				http.Error(w, "Failed to parse comments", http.StatusInternalServerError)
				return
			}
			comments = append(comments, comment)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(comments)
	}
}


// Helper function to check allowed file extensions
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}