package followers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
)

// FollowHandler handles follow requests
func FollowHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received request for FollowHandler")

		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var request struct {
			FollowerID string `json:"follower_id"`
			FollowedID string `json:"followed_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			log.Printf("Error decoding request body: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		log.Printf("Decoded request: FollowerID=%s, FollowedID=%s", request.FollowerID, request.FollowedID)

		// Validate fields
		if request.FollowerID == "" {
			log.Println("Missing follower_id in the request.")
			http.Error(w, "Missing follower_id", http.StatusBadRequest)
			return
		}

		if request.FollowedID == "" {
			log.Println("Missing followed_id in the request.")
			http.Error(w, "Missing followed_id", http.StatusBadRequest)
			return
		}

		if request.FollowerID == request.FollowedID {
			log.Println("Attempt to follow self detected.")
			http.Error(w, "You cannot follow yourself", http.StatusBadRequest)
			return
		}

		// Check if both users exist
		var followerExists, followedExists bool
		err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)`, request.FollowerID).Scan(&followerExists)
		if err != nil || !followerExists {
			http.Error(w, "Follower not found", http.StatusNotFound)
			return
		}

		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)`, request.FollowedID).Scan(&followedExists)
		if err != nil || !followedExists {
			http.Error(w, "Followed user not found", http.StatusNotFound)
			return
		}

		// Check if follow relationship already exists
		var existingStatus string
		err = db.QueryRow(`
			SELECT status FROM followers WHERE follower_id = ? AND followed_id = ?
		`, request.FollowerID, request.FollowedID).Scan(&existingStatus)

		if err == nil {
			if existingStatus == "accepted" {
				http.Error(w, "Already following this user", http.StatusBadRequest)
				return
			} else if existingStatus == "pending" {
				http.Error(w, "Follow request already pending", http.StatusBadRequest)
				return
			}
		} else if err != sql.ErrNoRows {
			log.Printf("Error checking follow relationship: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// Check privacy of the followed user
		var isPrivate bool
		err = db.QueryRow(`SELECT private FROM users WHERE id = ?`, request.FollowedID).Scan(&isPrivate)
		if err != nil {
			log.Printf("Error checking profile privacy: %v", err)
			http.Error(w, "Failed to retrieve profile privacy", http.StatusInternalServerError)
			return
		}

		// Handle private vs public profile
		if isPrivate {
			log.Printf("User %s has a private profile. Creating follow request...", request.FollowedID)
			_, err := db.Exec(`
				INSERT INTO followers (id, follower_id, followed_id, status, request_type)
				VALUES (?, ?, ?, 'pending', 'manual')
			`, uuid.New().String(), request.FollowerID, request.FollowedID)
			if err != nil {
				log.Printf("Error inserting follow request: %v", err)
				http.Error(w, "Failed to send follow request", http.StatusInternalServerError)
				return
			}
			w.Write([]byte("Follow request sent"))
		} else {
			log.Printf("User %s has a public profile. Following directly...", request.FollowedID)
			_, err := db.Exec(`
				INSERT INTO followers (id, follower_id, followed_id, status, request_type)
				VALUES (?, ?, ?, 'accepted', 'auto')
			`, uuid.New().String(), request.FollowerID, request.FollowedID)
			if err != nil {
				log.Printf("Error inserting follow relationship: %v", err)
				http.Error(w, "Failed to follow user", http.StatusInternalServerError)
				return
			}
			w.Write([]byte("Followed successfully"))
		}
	}
}

// UnfollowHandler handles requests to unfollow a user
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

		_, err := db.Exec(`
			DELETE FROM followers
			WHERE follower_id = ? AND followed_id = ?
		`, request.FollowerID, request.FollowedID)
		if err != nil {
			http.Error(w, "Failed to unfollow user", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Unfollowed successfully"))
	}
}

// GetFollowersHandler fetches the followers of a user
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

		rows, err := db.Query(`SELECT follower_id FROM followers WHERE followed_id = ? AND status = 'accepted'`, userID)
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

// HandleFollowRequest allows accepting or declining follow requests
func HandleFollowRequest(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var request struct {
			FollowerID string `json:"follower_id"`
			FollowedID string `json:"followed_id"`
			Action     string `json:"action"` // "accept" or "decline"
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate action
		if request.Action != "accept" && request.Action != "decline" {
			http.Error(w, "Invalid action, must be 'accept' or 'decline'", http.StatusBadRequest)
			return
		}

		// Verify a pending follow request exists
		var existingStatus string
		err := db.QueryRow(`
			SELECT status FROM followers WHERE follower_id = ? AND followed_id = ? AND status = 'pending'
		`, request.FollowerID, request.FollowedID).Scan(&existingStatus)

		if err == sql.ErrNoRows {
			http.Error(w, "No pending follow request found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// Update status
		newStatus := "accepted"
		if request.Action == "decline" {
			newStatus = "declined"
		}

		result, err := db.Exec(`
			UPDATE followers SET status = ? WHERE follower_id = ? AND followed_id = ?
		`, newStatus, request.FollowerID, request.FollowedID)
		if err != nil {
			http.Error(w, "Failed to update follow request", http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			http.Error(w, "No pending follow request found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(fmt.Sprintf("Follow request %s", request.Action)))
	}
}

// GetFollowRequestsHandler fetches pending follow requests for a user
func GetFollowRequestsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		followedID := r.URL.Query().Get("followed_id")
		if followedID == "" {
			http.Error(w, "Missing followed_id parameter", http.StatusBadRequest)
			return
		}

		rows, err := db.Query(`
			SELECT id, follower_id, status, created_at
			FROM followers
			WHERE followed_id = ? AND status = 'pending'
		`, followedID)
		if err != nil {
			http.Error(w, "Failed to fetch follow requests", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var requests []struct {
			ID         string `json:"id"`
			FollowerID string `json:"follower_id"`
			Status     string `json:"status"`
			CreatedAt  string `json:"created_at"`
		}

		for rows.Next() {
			var request struct {
				ID         string `json:"id"`
				FollowerID string `json:"follower_id"`
				Status     string `json:"status"`
				CreatedAt  string `json:"created_at"`
			}
			if err := rows.Scan(&request.ID, &request.FollowerID, &request.Status, &request.CreatedAt); err != nil {
				http.Error(w, "Failed to parse follow requests", http.StatusInternalServerError)
				return
			}
			requests = append(requests, request)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(requests)
	}
}
