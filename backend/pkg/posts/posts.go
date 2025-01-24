package posts

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Post struct {
	ID            string `json:"id"`
	UserID        string `json:"user_id"`
	Content       string `json:"content"`
	ImageURL      string `json:"image_url,omitempty"`
	Privacy       string `json:"privacy"`
	LikesCount    int    `json:"likes_count"`
	CommentsCount int    `json:"comments_count"`
	CreatedAt     string `json:"created_at"`
}

// CreatePostHandler allows a user to create a post
func CreatePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var post Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Insert the post into the database
		query := `
			INSERT INTO posts (id, user_id, content, image_url, privacy)
			VALUES (?, ?, ?, ?, ?)
		`
		_, err := db.Exec(query, post.ID, post.UserID, post.Content, post.ImageURL, post.Privacy)
		if err != nil {
			http.Error(w, "Failed to create post", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Post created successfully"))
	}
}

// GetPostsHandler fetches all posts
func GetPostsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		rows, err := db.Query(`
			SELECT id, user_id, content, image_url, privacy, likes_count, comments_count, created_at
			FROM posts
		`)
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post
		for rows.Next() {
			var post Post
			if err := rows.Scan(&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.LikesCount, &post.CommentsCount, &post.CreatedAt); err != nil {
				http.Error(w, "Failed to parse posts", http.StatusInternalServerError)
				return
			}
			posts = append(posts, post)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}
}

// DeletePostHandler allows a user to delete their own post
func DeletePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Extract post ID from query
		postID := r.URL.Query().Get("id")
		if postID == "" {
			http.Error(w, "Missing post ID", http.StatusBadRequest)
			return
		}

		// Delete the post from the database
		query := `DELETE FROM posts WHERE id = ?`
		_, err := db.Exec(query, postID)
		if err != nil {
			http.Error(w, "Failed to delete post", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Post deleted successfully"))
	}
}
