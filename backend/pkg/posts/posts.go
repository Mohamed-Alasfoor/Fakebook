package posts

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/sessions"
	"github.com/google/uuid"
	"strings"
	"path/filepath"
	"io"
	"os"

)

type Post struct {
	ID            string   `json:"id"`
	UserID        string   `json:"user_id"`
	Content       string   `json:"content"`
	ImageURL      string   `json:"image_url,omitempty"`
	Privacy       string   `json:"privacy"`
	AllowedUsers  []string `json:"allowed_users,omitempty"`
	LikesCount    int      `json:"likes_count"`
	CommentsCount int      `json:"comments_count"`
	CreatedAt     string   `json:"created_at"`
	Nickname      string   `json:"nickname"`
	Avatar        string   `json:"avatar"`
	HasLiked      bool     `json:"has_liked"` // New field
}



// CreatePostHandler allows a user to create a post
func CreatePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Parse multipart form with a max upload size of 10 MB
		const maxUploadSize = 10 << 20 // 10 MB
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			http.Error(w, "File is too large. Max size is 10 MB.", http.StatusBadRequest)
			return
		}

		// Retrieve the text fields
		content := r.FormValue("content")
		privacy := r.FormValue("privacy")
		userID := r.FormValue("user_id")

		// Validate that user_id exists in the users table
		var userExists bool
		err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)`, userID).Scan(&userExists)
		if err != nil {
			http.Error(w, "Failed to validate user", http.StatusInternalServerError)
			return
		}
		if !userExists {
			http.Error(w, "Invalid user_id. User does not exist.", http.StatusBadRequest)
			return
		}

		// Validate privacy (optional)
		if privacy == "" {
			privacy = "public" // Default privacy
		} else if privacy != "public" && privacy != "almost_private" && privacy != "private" {
			http.Error(w, "Invalid privacy setting", http.StatusBadRequest)
			return
		}

		// Handle the file upload
		file, fileHeader, err := r.FormFile("file") // "file" is the field name in the form
		if err != nil {
			http.Error(w, "File upload failed. Ensure you included an image.", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// Validate the file type
		allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif"}
		fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
		if !contains(allowedExtensions, fileExt) {
			http.Error(w, "Invalid file type. Only .jpg, .jpeg, .png, and .gif are allowed.", http.StatusBadRequest)
			return
		}

		// Generate a unique file name and save the file
		fileName := uuid.New().String() + fileExt
		filePath := filepath.Join("uploads", fileName) // Make sure the "uploads" directory exists
		outFile, err := os.Create(filePath)
		if err != nil {
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}
		defer outFile.Close()

		// Copy the uploaded file to the server
		if _, err := io.Copy(outFile, file); err != nil {
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}

		// Generate a UUID for the post
		postID := uuid.New().String()

		// Insert the post into the database
		query := `
			INSERT INTO posts (id, user_id, content, image_url, privacy)
			VALUES (?, ?, ?, ?, ?)
		`
		_, err = db.Exec(query, postID, userID, content, "/"+filePath, privacy) // Save the relative path
		if err != nil {
			http.Error(w, "Failed to create post", http.StatusInternalServerError)
			return
		}

		// Handle private posts: add allowed users to post_privacy
		if privacy == "private" {
			allowedUsers := r.Form["allowed_users"] // Retrieve as a slice of user IDs
			for _, allowedUserID := range allowedUsers {
				_, err := db.Exec(`INSERT INTO post_privacy (post_id, user_id) VALUES (?, ?)`, postID, allowedUserID)
				if err != nil {
					http.Error(w, "Failed to set private post permissions", http.StatusInternalServerError)
					return
				}
			}
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Post created successfully"))
	}
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}





// GetPostsHandler fetches all posts based on privacy and includes if the user has liked each post
func GetPostsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Retrieve the user_id from the session
		requesterID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// SQL query to fetch posts with valid user references
		query := `
			SELECT 
				posts.id, 
				posts.user_id, 
				posts.content, 
				posts.image_url, 
				posts.privacy, 
				posts.likes_count, 
				posts.comments_count, 
				posts.created_at, 
				users.nickname, 
				users.avatar,
				EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) AS has_liked
			FROM posts
			INNER JOIN users ON posts.user_id = users.id
			WHERE
				posts.privacy = 'public'
				OR (posts.privacy = 'almost_private' AND posts.user_id IN (SELECT followed_id FROM followers WHERE follower_id = ?))
				OR (posts.privacy = 'private' AND posts.id IN (SELECT post_id FROM post_privacy WHERE user_id = ?))
			ORDER BY posts.created_at DESC;
		`

		rows, err := db.Query(query, requesterID, requesterID, requesterID)
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post
		for rows.Next() {
			var post Post
			var nickname, avatar string
			var hasLiked bool // To store whether the user liked the post

			if err := rows.Scan(
				&post.ID, &post.UserID, &post.Content, &post.ImageURL,
				&post.Privacy, &post.LikesCount, &post.CommentsCount,
				&post.CreatedAt, &nickname, &avatar, &hasLiked,
			); err != nil {
				http.Error(w, "Failed to parse posts", http.StatusInternalServerError)
				return
			}

			post.Nickname = nickname
			post.Avatar = avatar

			// Add the 'has_liked' attribute to the post JSON response
			post.HasLiked = hasLiked

			posts = append(posts, post)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}
}






// UpdatePostPrivacyHandler updates the privacy of a post
func UpdatePostPrivacyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var updateRequest struct {
			PostID       string   `json:"post_id"`
			Privacy      string   `json:"privacy"`
			AllowedUsers []string `json:"allowed_users"` // Only for private posts
		}

		if err := json.NewDecoder(r.Body).Decode(&updateRequest); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Update the privacy in the database
		_, err := db.Exec(`UPDATE posts SET privacy = ? WHERE id = ?`, updateRequest.Privacy, updateRequest.PostID)
		if err != nil {
			http.Error(w, "Failed to update privacy", http.StatusInternalServerError)
			return
		}

		// Handle private posts: update allowed users in post_privacy
		if updateRequest.Privacy == "private" {
			// Clear existing allowed users
			_, err := db.Exec(`DELETE FROM post_privacy WHERE post_id = ?`, updateRequest.PostID)
			if err != nil {
				http.Error(w, "Failed to clear private post permissions", http.StatusInternalServerError)
				return
			}

			// Add new allowed users
			for _, userID := range updateRequest.AllowedUsers {
				_, err := db.Exec(`INSERT INTO post_privacy (post_id, user_id) VALUES (?, ?)`, updateRequest.PostID, userID)
				if err != nil {
					http.Error(w, "Failed to update private post permissions", http.StatusInternalServerError)
					return
				}
			}
		}

		w.Write([]byte("Post privacy updated successfully"))
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

		// Clean up private permissions for the post
		_, err = db.Exec(`DELETE FROM post_privacy WHERE post_id = ?`, postID)
		if err != nil {
			http.Error(w, "Failed to delete post privacy settings", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Post deleted successfully"))
	}
}
