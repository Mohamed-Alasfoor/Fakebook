package followers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

func FollowHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var request struct {
			FollowerID string `json:"follower_id"`
			FollowedID string `json:"followed_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		followID := uuid.New().String()
		_, err := db.Exec(`INSERT INTO followers (id, follower_id, followed_id) VALUES (?, ?, ?)`, followID, request.FollowerID, request.FollowedID)
		if err != nil {
			http.Error(w, "Failed to follow user", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Followed successfully"))
	}
}

func UnfollowHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var request struct {
			FollowerID string `json:"follower_id"`
			FollowedID string `json:"followed_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		_, err := db.Exec(`DELETE FROM followers WHERE follower_id = ? AND followed_id = ?`, request.FollowerID, request.FollowedID)
		if err != nil {
			http.Error(w, "Failed to unfollow user", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Unfollowed successfully"))
	}
}

func GetFollowersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			http.Error(w, "Missing user_id parameter", http.StatusBadRequest)
			return
		}

		rows, err := db.Query(`SELECT follower_id FROM followers WHERE followed_id = ?`, userID)
		if err != nil {
			http.Error(w, "Failed to fetch followers", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var followers []string
		for rows.Next() {
			var followerID string
			if err := rows.Scan(&followerID); err != nil {
				http.Error(w, "Failed to parse followers", http.StatusInternalServerError)
				return
			}
			followers = append(followers, followerID)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(followers)
	}
}
