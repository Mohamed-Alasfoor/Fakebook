package followers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"social-network/app/notifications"
	"social-network/app/sessions"

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

		// The logged-in user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		var request struct {
			FollowedID string `json:"followed_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			log.Printf("Error decoding request body: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		log.Printf("Decoded request: UserID=%s, FollowedID=%s", userID, request.FollowedID)

		if request.FollowedID == "" {
			http.Error(w, "Missing followed_id", http.StatusBadRequest)
			return
		}
		if userID == request.FollowedID {
			http.Error(w, "You cannot follow yourself", http.StatusBadRequest)
			return
		}

		// Check if the followed user exists
		var followedExists bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)`, request.FollowedID).Scan(&followedExists)
		if err != nil || !followedExists {
			http.Error(w, "Followed user not found", http.StatusNotFound)
			return
		}

		// Check if follow relationship already exists
		var existingStatus string
		err = db.QueryRow(`
			SELECT status 
			FROM followers 
			WHERE follower_id = ? AND followed_id = ?
		`, userID, request.FollowedID).Scan(&existingStatus)

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

		// Retrieve the nickname of the follower (the current user)
		var followerNickname string
		err = db.QueryRow(`SELECT nickname FROM users WHERE id = ?`, userID).Scan(&followerNickname)
		if err != nil {
			log.Printf("Error fetching follower nickname: %v", err)
			http.Error(w, "Error fetching user nickname", http.StatusInternalServerError)
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
			`, uuid.New().String(), userID, request.FollowedID)
			if err != nil {
				log.Printf("Error inserting follow request: %v", err)
				http.Error(w, "Failed to send follow request", http.StatusInternalServerError)
				return
			}

			// Send notification to the private user
			err = notifications.CreateNotification(
				db,
				request.FollowedID,               // The user receiving the request
				"follow_request",                 // Notification type
				fmt.Sprintf("%s has requested to follow you.", followerNickname),
				"",                               // postID
				userID,                           // relatedUserID (the follower)
				"",                               // groupID
				"",
			)
			if err != nil {
				log.Println("Failed to create notification:", err)
			}

			w.Write([]byte("Follow request sent"))
		} else {
			log.Printf("User %s has a public profile. Following directly...", request.FollowedID)
			_, err := db.Exec(`
				INSERT INTO followers (id, follower_id, followed_id, status, request_type)
				VALUES (?, ?, ?, 'accepted', 'auto')
			`, uuid.New().String(), userID, request.FollowedID)
			if err != nil {
				log.Printf("Error inserting follow relationship: %v", err)
				http.Error(w, "Failed to follow user", http.StatusInternalServerError)
				return
			}

			// Also create a notification for the followed user:
			err = notifications.CreateNotification(
				db,
				request.FollowedID, // The user being followed
				"follow",           // Notification type for direct follows
				fmt.Sprintf("%s is now following you.", followerNickname),
				"",                 // postID
				userID,             // relatedUserID (the follower)
				"",                 // groupID
				"",
			)
			if err != nil {
				log.Println("Failed to create notification:", err)
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

		// The logged-in user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		var request struct {
			FollowedID string `json:"followed_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.FollowedID == "" {
			http.Error(w, "Missing followed_id", http.StatusBadRequest)
			return
		}

		// Check if follow relationship exists
		var exists bool
		err = db.QueryRow(`
			SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND followed_id = ?)
		`, userID, request.FollowedID).Scan(&exists)

		if err != nil {
			http.Error(w, "Failed to check follow status", http.StatusInternalServerError)
			return
		}

		if !exists {
			http.Error(w, "You are not following this user", http.StatusBadRequest)
			return
		}

		// Remove the follow relationship from the database
		_, err = db.Exec(`
			DELETE FROM followers
			WHERE follower_id = ? AND followed_id = ?
		`, userID, request.FollowedID)
		if err != nil {
			http.Error(w, "Failed to unfollow user", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Unfollowed successfully"))
	}
}

// GetFollowersHandler fetches the followers (with details) for the logged-in user
func GetFollowersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get the logged-in user ID from the session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Join followers with users table to get follower details
		rows, err := db.Query(`
			SELECT users.id, users.nickname, users.avatar 
			FROM followers 
			JOIN users ON followers.follower_id = users.id 
			WHERE followers.followed_id = ? AND followers.status = 'accepted'
		`, userID)
		if err != nil {
			http.Error(w, "Failed to fetch followers", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var followers []struct {
			ID       string `json:"id"`
			Nickname string `json:"nickname"`
			Avatar   string `json:"avatar"`
		}

		for rows.Next() {
			var follower struct {
				ID       string `json:"id"`
				Nickname string `json:"nickname"`
				Avatar   string `json:"avatar"`
			}
			if err := rows.Scan(&follower.ID, &follower.Nickname, &follower.Avatar); err != nil {
				http.Error(w, "Failed to parse followers", http.StatusInternalServerError)
				return
			}
			followers = append(followers, follower)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(followers)
	}
}

// HandleFollowRequest allows the logged-in user (private profile owner)
// to accept or decline follow requests.
func HandleFollowRequest(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// The logged-in user (the one receiving the follow request)
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		var request struct {
			FollowerID string `json:"follower_id"`
			Action     string `json:"action"` // "accept" or "decline"
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.Action != "accept" && request.Action != "decline" {
			http.Error(w, "Invalid action, must be 'accept' or 'decline'", http.StatusBadRequest)
			return
		}

		var action string
		if request.Action == "accept" {
			action = "accepted"
		} else {
			action = "declined"
		}

		// Update the follow request status
		result, err := db.Exec(`UPDATE followers SET status = ? WHERE follower_id = ? AND followed_id = ? AND status = 'pending'`,
			action, request.FollowerID, userID)
		if err != nil {
			http.Error(w, "Failed to update follow request", http.StatusInternalServerError)
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "Failed to determine affected rows", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			http.Error(w, "No pending follow request found", http.StatusNotFound)
			return
		}

		// Remove the original follow_request notification
		_, err = db.Exec("DELETE FROM notifications WHERE user_id = ? AND related_user_id = ? AND type = 'follow_request'", userID, request.FollowerID)
		if err != nil {
			http.Error(w, "Failed to delete follow request notification", http.StatusInternalServerError)
			return
		}

		// Fetch the nickname of the logged-in user (the one accepting/declining)
		var userNickname string
		err = db.QueryRow(`SELECT nickname FROM users WHERE id = ?`, userID).Scan(&userNickname)
		if err != nil {
			log.Printf("Error fetching user nickname: %v", err)
			http.Error(w, "Error fetching user nickname", http.StatusInternalServerError)
			return
		}

		// Send a follow_response notification to the requester
		err = notifications.CreateNotification(
			db,
			request.FollowerID, // The user who made the follow request
			"follow_response",  // Notification type for the follow response
			fmt.Sprintf("%s has %s your follow request.", userNickname, request.Action),
			"",    // postID
			userID, // relatedUserID: the responder
			"",    // groupID
			"",
		)
		if err != nil {
			log.Println("Failed to create follow response notification:", err)
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

		// Get the logged-in user ID from the session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		rows, err := db.Query(`
			SELECT follower_id FROM followers WHERE followed_id = ? AND status = 'pending'
		`, userID)
		if err != nil {
			http.Error(w, "Failed to fetch follow requests", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var requests []string
		for rows.Next() {
			var followerID string
			if err := rows.Scan(&followerID); err != nil {
				http.Error(w, "Failed to parse follow requests", http.StatusInternalServerError)
				return
			}
			requests = append(requests, followerID)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(requests)
	}
}
