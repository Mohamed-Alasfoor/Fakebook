package users

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"social-network/pkg/posts"
	"social-network/pkg/sessions"
	"strings"

	"github.com/google/uuid"
)

// User represents basic user info for followers and following lists
type User struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar,omitempty"`
}

// Updated UserProfile struct
type UserProfile struct {
	ID             string       `json:"id"`
	Email          string       `json:"email"`
	FirstName      string       `json:"first_name"`
	LastName       string       `json:"last_name"`
	Nickname       string       `json:"nickname,omitempty"`
	AboutMe        string       `json:"about_me,omitempty"`
	Avatar         string       `json:"avatar,omitempty"`
	DateOfBirth    string       `json:"date_of_birth"`
	Private        bool         `json:"private"`
	FollowersCount int          `json:"followers_count"`
	FollowingCount int          `json:"following_count"`
	Followers      []User       `json:"followers"`  // New: list of followers
	Following      []User       `json:"following"`  // New: list of following users
	Posts          []posts.Post `json:"posts"`
}

// GetUserProfileHandler fetches profile info including follower and following details
func GetUserProfileHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		profileID := r.URL.Query().Get("user_id")
		if profileID == "" {
			http.Error(w, "Missing user_id", http.StatusBadRequest)
			return
		}

		// Get logged-in user ID
		loggedInUserID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Check if the logged-in user is viewing their own profile
		isMyProfile := loggedInUserID == profileID

		// Check if the logged-in user is following the profile owner
		var isFollowing bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND followed_id = ? AND status = 'accepted')`,
			loggedInUserID, profileID).Scan(&isFollowing)

		// Fetch profile data
		var profile UserProfile
		err = db.QueryRow(`
			SELECT id, email, first_name, last_name, nickname, about_me, avatar, date_of_birth, private
			FROM users WHERE id = ?`, profileID).Scan(
			&profile.ID, &profile.Email, &profile.FirstName, &profile.LastName,
			&profile.Nickname, &profile.AboutMe, &profile.Avatar, &profile.DateOfBirth, &profile.Private)

		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to fetch user", http.StatusInternalServerError)
			return
		}

		// Fetch followers count
		db.QueryRow(`SELECT COUNT(*) FROM followers WHERE followed_id = ? AND status = 'accepted'`, profileID).Scan(&profile.FollowersCount)
		// Fetch following count
		db.QueryRow(`SELECT COUNT(*) FROM followers WHERE follower_id = ? AND status = 'accepted'`, profileID).Scan(&profile.FollowingCount)

		// If the profile is private and the requester is NOT the owner or a follower, return limited info
		if profile.Private && !isMyProfile && !isFollowing {
			// Return limited data
			response := struct {
				ID          string `json:"id"`
				Nickname    string `json:"nickname"`
				Avatar      string `json:"avatar,omitempty"`
				Private     bool   `json:"private"`
				Followers   int    `json:"followers_count"`
				Following   int    `json:"following_count"`
				IsFollowing bool   `json:"is_following"`
				IsMyProfile bool   `json:"is_my_profile"`
				Message     string `json:"message"`
			}{
				ID:          profile.ID,
				Nickname:    profile.Nickname,
				Avatar:      profile.Avatar,
				Private:     profile.Private,
				Followers:   profile.FollowersCount,
				Following:   profile.FollowingCount,
				IsFollowing: isFollowing,
				IsMyProfile: isMyProfile,
				Message:     "This profile is private. You must follow to see more details.",
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}

		// Fetch followers details
		rows, err := db.Query(`
			SELECT users.id, users.nickname, users.avatar 
			FROM followers 
			JOIN users ON followers.follower_id = users.id 
			WHERE followers.followed_id = ? AND followers.status = 'accepted'`, profileID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var follower User
				if err := rows.Scan(&follower.ID, &follower.Nickname, &follower.Avatar); err == nil {
					profile.Followers = append(profile.Followers, follower)
				}
			}
		}

		// Fetch following details
		rows, err = db.Query(`
			SELECT users.id, users.nickname, users.avatar 
			FROM followers 
			JOIN users ON followers.followed_id = users.id 
			WHERE followers.follower_id = ? AND followers.status = 'accepted'`, profileID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var following User
				if err := rows.Scan(&following.ID, &following.Nickname, &following.Avatar); err == nil {
					profile.Following = append(profile.Following, following)
				}
			}
		}

		// Fetch user posts
		var query string
		var postRows *sql.Rows

		if profile.Private && !isMyProfile {
			query = `
				SELECT id, user_id, content, image_url, privacy, likes_count, comments_count, created_at, 
					(SELECT nickname FROM users WHERE id = user_id) AS nickname, 
					(SELECT avatar FROM users WHERE id = user_id) AS avatar,
					EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) AS has_liked
				FROM posts 
				WHERE user_id = ? 
				AND (privacy = 'public' OR privacy = 'almost_private' 
					OR (privacy = 'private' AND EXISTS 
						(SELECT 1 FROM followers WHERE follower_id = ? AND followed_id = ? AND status = 'accepted')
					)
				)
				ORDER BY created_at DESC`
			postRows, err = db.Query(query, loggedInUserID, profileID, loggedInUserID, profileID)
		} else {
			query = `
				SELECT id, user_id, content, image_url, privacy, likes_count, comments_count, created_at, 
					(SELECT nickname FROM users WHERE id = user_id) AS nickname, 
					(SELECT avatar FROM users WHERE id = user_id) AS avatar,
					EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) AS has_liked
				FROM posts 
				WHERE user_id = ? 
				ORDER BY created_at DESC`
			postRows, err = db.Query(query, loggedInUserID, profileID)
		}

		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}
		defer postRows.Close()

		for postRows.Next() {
			var post posts.Post
			if err := postRows.Scan(
				&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
				&post.LikesCount, &post.CommentsCount, &post.CreatedAt, &post.Nickname, &post.Avatar, &post.HasLiked,
			); err != nil {
				http.Error(w, "Failed to parse posts", http.StatusInternalServerError)
				return
			}
			profile.Posts = append(profile.Posts, post)
		}

		// ✅ **Include isFollowing and isMyProfile in all responses**
		response := struct {
			UserProfile
			IsFollowing bool `json:"is_following"`
			IsMyProfile bool `json:"is_my_profile"`
		}{
			UserProfile: profile,
			IsFollowing: isFollowing,
			IsMyProfile: isMyProfile,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}



// TogglePrivacyHandler allows a user to toggle their profile visibility
func TogglePrivacyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var request struct {
			Private bool `json:"private"` // Match the correct database column name
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Ensure the SQL query uses the correct column name: `private`
		_, err = db.Exec(`UPDATE users SET private = ? WHERE id = ?`, request.Private, userID)
		if err != nil {
			http.Error(w, "Failed to update privacy setting: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Privacy setting updated successfully"))
	}
}

// UpdateProfileHandler now handles both JSON and multipart/form-data requests.
// If the request contains a file in the "avatar" field, it will process it and update the user's avatar.
// It also checks if the new nickname is already taken by another user.
func UpdateProfileHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Allow only PUT requests.
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get logged-in user ID.
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Use strings.HasPrefix to check multipart/form-data
		contentType := r.Header.Get("Content-Type")

		type updateData struct {
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Nickname  string `json:"nickname,omitempty"`
			AboutMe   string `json:"about_me,omitempty"`
			Avatar    string `json:"avatar,omitempty"`
		}
		var update updateData

		if strings.HasPrefix(contentType, "multipart/form-data") {
			const maxUploadSize = 10 << 20
			if err := r.ParseMultipartForm(maxUploadSize); err != nil {
				http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
				return
			}

			update.FirstName = r.FormValue("first_name")
			update.LastName = r.FormValue("last_name")
			update.Nickname = r.FormValue("nickname")
			update.AboutMe = r.FormValue("about_me")
			if update.FirstName == "" || update.LastName == "" {
				http.Error(w, "First and last names cannot be empty", http.StatusBadRequest)
				return
			}
			// Check for duplicate nickname.
			if update.Nickname != "" {
				var count int
				err = db.QueryRow("SELECT COUNT(*) FROM users WHERE nickname = ? AND id != ?", update.Nickname, userID).Scan(&count)
				if err != nil {
					http.Error(w, "Database error", http.StatusInternalServerError)
					return
				}
				if count > 0 {
					http.Error(w, "Nickname already taken", http.StatusBadRequest)
					return
				}
			}

			// Process avatar file.
			file, fileHeader, err := r.FormFile("avatar")
			if err == nil {
				defer file.Close()
				allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif"}
				fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
				valid := false
				for _, ext := range allowedExtensions {
					if fileExt == ext {
						valid = true
						break
					}
				}
				if !valid {
					http.Error(w, "Invalid avatar file type", http.StatusBadRequest)
					return
				}
				avatarDir := "avatars"
				if _, err := os.Stat(avatarDir); os.IsNotExist(err) {
					if err := os.MkdirAll(avatarDir, 0755); err != nil {
						http.Error(w, "Failed to create avatar directory", http.StatusInternalServerError)
						return
					}
				}
				avatarFilename := uuid.New().String() + fileExt
				avatarPath := filepath.Join(avatarDir, avatarFilename)
				outFile, err := os.Create(avatarPath)
				if err != nil {
					http.Error(w, "Failed to create avatar file", http.StatusInternalServerError)
					return
				}
				defer outFile.Close()
				if _, err := io.Copy(outFile, file); err != nil {
					http.Error(w, "Failed to save avatar file", http.StatusInternalServerError)
					return
				}
				update.Avatar = avatarFilename
			} else if err != http.ErrMissingFile {
				http.Error(w, "Error processing avatar: "+err.Error(), http.StatusBadRequest)
				return
			} else {
				// If no new avatar, use current value.
				var currentAvatar string
				err = db.QueryRow("SELECT avatar FROM users WHERE id = ?", userID).Scan(&currentAvatar)
				if err == nil {
					update.Avatar = currentAvatar
				}
			}
		} else {
			// For JSON requests.
			if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}
			if update.FirstName == "" || update.LastName == "" {
				http.Error(w, "First and last names cannot be empty", http.StatusBadRequest)
				return
			}
			if update.Nickname != "" {
				var count int
				err = db.QueryRow("SELECT COUNT(*) FROM users WHERE nickname = ? AND id != ?", update.Nickname, userID).Scan(&count)
				if err != nil {
					http.Error(w, "Database error", http.StatusInternalServerError)
					return
				}
				if count > 0 {
					http.Error(w, "Nickname already taken", http.StatusBadRequest)
					return
				}
			}
		}

		// Update the user's profile.
		_, err = db.Exec(
			"UPDATE users SET first_name = ?, last_name = ?, nickname = ?, about_me = ?, avatar = ? WHERE id = ?",
			update.FirstName, update.LastName, update.Nickname, update.AboutMe, update.Avatar, userID,
		)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to update profile: %v", err), http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Profile updated successfully"))
	}
}

