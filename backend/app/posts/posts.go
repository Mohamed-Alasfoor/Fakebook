package posts

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"social-network/app/sessions"
	"strings"

	"github.com/google/uuid"
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

        // Parse multipart form with a max upload size of 100 MB
        const maxUploadSize = 100 << 20 // 100 MB
        if err := r.ParseMultipartForm(maxUploadSize); err != nil {
            http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
            return
        }

        // Retrieve user ID from session
        userID, err := sessions.GetUserIDFromSession(r)
        if err != nil {
            http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
            return
        }

        // Retrieve form fields
        content := r.Form.Get("content")
        privacy := r.Form.Get("privacy")

        if strings.TrimSpace(content) == "" {
            http.Error(w, "Content cannot be empty", http.StatusBadRequest)
            return
        }
        if len(content) > 500 {
            http.Error(w, "Content cannot exceed 500 characters", http.StatusBadRequest)
            return
        }

        if privacy == "" {
            privacy = "public"
        } else if privacy != "public" && privacy != "almost-private" && privacy != "private" {
            http.Error(w, "Invalid privacy setting", http.StatusBadRequest)
            return
        }

        // Ensure the "uploads" directory exists
        uploadDir := "uploads"
        if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
            if err = os.MkdirAll(uploadDir, 0755); err != nil {
                log.Printf("Failed to create upload directory: %v", err)
                http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
                return
            }
        }

        // Handle file upload (optional)
        var imageURL string
        file, fileHeader, err := r.FormFile("file")
        if err == nil { // file exists
            defer file.Close()
            allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif"}
            fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
            if !contains(allowedExtensions, fileExt) {
                http.Error(w, "Invalid file type. Only .jpg, .jpeg, .png, and .gif are allowed.", http.StatusBadRequest)
                return
            }
            fileName := uuid.New().String() + fileExt
            savePath := filepath.Join(uploadDir, fileName)
            log.Printf("Saving file to: %s", savePath)
            outFile, err := os.Create(savePath)
            if err != nil {
                log.Printf("Failed to create file: %v", err)
                http.Error(w, "Failed to save file", http.StatusInternalServerError)
                return
            }
            defer outFile.Close()
            if _, err := io.Copy(outFile, file); err != nil {
                log.Printf("Failed to copy file: %v", err)
                http.Error(w, "Failed to save file", http.StatusInternalServerError)
                return
            }
            imageURL = fileName
        } else if err != http.ErrMissingFile {
            http.Error(w, "Failed to upload file: "+err.Error(), http.StatusBadRequest)
            return
        }

        // Generate a UUID for the post
        postID := uuid.New().String()

        // Insert post into the database (with created_at timestamp)
        query := `
            INSERT INTO posts (id, user_id, content, image_url, privacy, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `
        _, err = db.Exec(query, postID, userID, content, imageURL, privacy)
        if err != nil {
            http.Error(w, "Failed to create post", http.StatusInternalServerError)
            return
        }

        // Retrieve the created_at timestamp for the response
        var createdAt string
        err = db.QueryRow(`SELECT created_at FROM posts WHERE id = ?`, postID).Scan(&createdAt)
        if err != nil {
            http.Error(w, "Failed to fetch post timestamp", http.StatusInternalServerError)
            return
        }

        // If privacy is private, handle allowed users
        if privacy == "private" {
            allowedUsers := r.Form["allowed_users[]"]
            for _, allowedUserID := range allowedUsers {
                _, err := db.Exec("INSERT INTO post_privacy (post_id, user_id) VALUES (?, ?)", postID, allowedUserID)
                if err != nil {
                    http.Error(w, "Failed to set allowed users", http.StatusInternalServerError)
                    return
                }
            }
        }

        // Build the response
        response := map[string]interface{}{
            "message":    "Post created successfully",
            "post_id":    postID,
            "content":    content,
            "privacy":    privacy,
            "image_url":  imageURL,
            "created_at": createdAt, // Include created_at to prevent frontend errors
        }

        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(response)
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
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

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
	OR (posts.privacy = 'almost-private' AND (posts.user_id = ? OR EXISTS(
	    SELECT 1 FROM followers WHERE follower_id = ? AND followed_id = posts.user_id AND status = 'accepted'
	)))
	OR (posts.privacy = 'private' AND (posts.user_id = ? OR EXISTS(
	    SELECT 1 FROM post_privacy WHERE post_id = posts.id AND user_id = ?
	)))
ORDER BY posts.created_at DESC;
`
		// Pass the userID 5 times as needed:
		rows, err := db.Query(query, userID, userID, userID, userID, userID)
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post
		for rows.Next() {
			var post Post
			var nickname, avatar string
			var hasLiked bool

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

		// Retrieve user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Parse the request body
		var updateRequest struct {
			PostID       string   `json:"post_id"`
			Privacy      string   `json:"privacy"`
			AllowedUsers []string `json:"allowed_users,omitempty"` // Only for private posts
		}

		if err := json.NewDecoder(r.Body).Decode(&updateRequest); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Check if the user is the owner of the post
		var ownerID string
		err = db.QueryRow(`SELECT user_id FROM posts WHERE id = ?`, updateRequest.PostID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to check post ownership", http.StatusInternalServerError)
			return
		}

		// Ensure the logged-in user is the owner
		if ownerID != userID {
			http.Error(w, "Unauthorized: You can only update your own post's privacy", http.StatusForbidden)
			return
		}

		// Update the privacy in the database
		_, err = db.Exec(`UPDATE posts SET privacy = ? WHERE id = ?`, updateRequest.Privacy, updateRequest.PostID)
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
			for _, allowedUserID := range updateRequest.AllowedUsers {
				_, err := db.Exec(`INSERT INTO post_privacy (post_id, user_id) VALUES (?, ?)`, updateRequest.PostID, allowedUserID)
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

		// Retrieve user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Ensure the user is the owner of the post before deletion
		var ownerID string
		err = db.QueryRow(`SELECT user_id FROM posts WHERE id = ?`, postID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to check post ownership", http.StatusInternalServerError)
			return
		}

		// Check if the user owns the post
		if ownerID != userID {
			http.Error(w, "Unauthorized: You can only delete your own posts", http.StatusForbidden)
			return
		}

		// Delete the post from the database
		query := `DELETE FROM posts WHERE id = ?`
		_, err = db.Exec(query, postID)
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

