package groups

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"social-network/pkg/notifications"
	"social-network/pkg/sessions"
	"strings"

	"github.com/google/uuid"
)

type Group struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatorID   string `json:"creator_id"` // Consistent with migration file
	CreatedAt   string `json:"created_at"`
}

// GetAllGroupsHandler - Fetches all existing groups for browsing and includes user status
func GetAllGroupsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get logged-in user ID
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Query to get all groups
		rows, err := db.Query(`
			SELECT id, name, description, creator_id, created_at FROM groups
		`)
		if err != nil {
			http.Error(w, "Failed to fetch groups", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Store the result in a slice
		var groups []map[string]interface{}
		for rows.Next() {
			var groupID, name, description, creatorID, createdAt string
			if err := rows.Scan(&groupID, &name, &description, &creatorID, &createdAt); err != nil {
				http.Error(w, "Failed to parse groups", http.StatusInternalServerError)
				return
			}

			// Check user's relationship with this group
			var userStatus string
			err = db.QueryRow(`
				SELECT status FROM group_membership WHERE group_id = ? AND user_id = ?
			`, groupID, userID).Scan(&userStatus)

			if err == sql.ErrNoRows {
				userStatus = "not_joined" // No record found, user is not part of the group
			} else if err != nil {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}

			// Append group with user status to the response
			group := map[string]interface{}{
				"id":          groupID,
				"name":        name,
				"description": description,
				"creator_id":  creatorID,
				"created_at":  createdAt,
				"user_status": userStatus, // Status like "member", "pending_request", etc.
			}
			groups = append(groups, group)
		}

		// Send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(groups)
	}
}

// Fetches details of a specific group
func GetGroupDetailsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			http.Error(w, "Missing group_id", http.StatusBadRequest)
			return
		}

		var groupName, groupDescription, createdAt string
		err = db.QueryRow(`SELECT name, description, created_at FROM groups WHERE id = ?`, groupID).Scan(&groupName, &groupDescription, &createdAt)
		if err == sql.ErrNoRows {
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to fetch group details", http.StatusInternalServerError)
			return
		}

		// Check if user is a member
		var isMember bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'member')`, groupID, userID).Scan(&isMember)

		if err != nil || !isMember {
			// Non-members can only see limited info
			json.NewEncoder(w).Encode(map[string]string{
				"group_id":    groupID,
				"name":        groupName,
				"description": groupDescription,
				"created_at":  createdAt,
				"message":     "Join this group to see more details.",
			})
			return
		}

		// Members can see full details
		json.NewEncoder(w).Encode(map[string]string{
			"group_id":    groupID,
			"name":        groupName,
			"description": groupDescription,
			"created_at":  createdAt,
			"status":      "member",
		})
	}
}

// Allows users to search for groups by name
func SearchGroupsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		query := r.URL.Query().Get("query")
		if query == "" {
			http.Error(w, "Missing search query", http.StatusBadRequest)
			return
		}

		rows, err := db.Query(`SELECT id, name, description, creator_id, created_at FROM groups WHERE name LIKE ?`, "%"+query+"%")
		if err != nil {
			http.Error(w, "Failed to search groups", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var groups []Group
		for rows.Next() {
			var group Group
			if err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.CreatorID, &group.CreatedAt); err != nil {
				http.Error(w, "Failed to parse groups", http.StatusInternalServerError)
				return
			}
			groups = append(groups, group)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(groups)
	}
}

// CreateGroupHandler allows a user to create a new group
func CreateGroupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var group Group
		if err := json.NewDecoder(r.Body).Decode(&group); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		group.ID = uuid.New().String()
		group.CreatorID = userID // Corrected field name

		// Start a transaction
		tx, err := db.Begin()
		if err != nil {
			http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
			return
		}

		// Insert group into the database
		_, err = tx.Exec(`INSERT INTO groups (id, name, description, creator_id) VALUES (?, ?, ?, ?)`,
			group.ID, group.Name, group.Description, group.CreatorID)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to create group", http.StatusInternalServerError)
			return
		}

		// Insert creator into group_membership as 'member'
		_, err = tx.Exec(`INSERT INTO group_membership (id, group_id, user_id, status) VALUES (?, ?, ?, 'member')`,
			uuid.New().String(), group.ID, group.CreatorID)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to add creator to group membership", http.StatusInternalServerError)
			return
		}

		// Commit transaction
		if err := tx.Commit(); err != nil {
			http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
			return
		}

		// Return success response
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Group created successfully", "group_id": group.ID})
	}
}

// RequestToJoinHandler - Allows users to request to join a group
func RequestToJoinHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var request struct {
			GroupID string `json:"group_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Check if the user already has a join request, invitation, or is a member
		var existingStatus string
		err = db.QueryRow(`
			SELECT status FROM group_membership WHERE group_id = ? AND user_id = ?
		`, request.GroupID, userID).Scan(&existingStatus)

		if err == nil {
			if existingStatus == "pending_request" {
				http.Error(w, "You have already requested to join this group", http.StatusConflict)
				return
			} else if existingStatus == "pending_invite" {
				http.Error(w, "You have already been invited to this group. Accept or decline the invitation first.", http.StatusConflict)
				return
			} else if existingStatus == "member" {
				http.Error(w, "You are already a member of this group", http.StatusConflict)
				return
			}
		} else if err != sql.ErrNoRows {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// Insert new join request
		_, err = db.Exec(`
			INSERT INTO group_membership (id, group_id, user_id, status) 
			VALUES (?, ?, ?, 'pending_request')`, uuid.New().String(), request.GroupID, userID)

		if err != nil {
			http.Error(w, "Failed to send join request", http.StatusInternalServerError)
			return
		}

		// Notify the group creator
		var creatorID string
		err = db.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, request.GroupID).Scan(&creatorID)
		if err == nil {
			notifications.CreateNotification(db, creatorID, "group_join_request",
				"A user has requested to join your group", "", userID, request.GroupID, "")
		}

		w.Write([]byte("Join request sent successfully"))
	}
}

// HandleJoinRequestHandler - Allows group creator to accept or decline join requests
func HandleJoinRequestHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow PUT requests.
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get the creator's (logged-in user's) ID from the session.
		creatorID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Parse the request body.
		var request struct {
			GroupID string `json:"group_id"`
			UserID  string `json:"user_id"` // The requester's ID.
			Action  string `json:"action"`  // "accept" or "decline"
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Ensure that only the group creator can handle join requests.
		var ownerID, groupName string
		err = db.QueryRow(`SELECT creator_id, name FROM groups WHERE id = ?`, request.GroupID).Scan(&ownerID, &groupName)
		if err == sql.ErrNoRows {
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to check group ownership", http.StatusInternalServerError)
			return
		}

		if ownerID != creatorID {
			http.Error(w, "Unauthorized: Only the group creator can handle requests", http.StatusForbidden)
			return
		}

		// Process the join request.
		var notificationMsg string
		if request.Action == "accept" {
			// Update the membership status to 'member'.
			_, err = db.Exec(`UPDATE group_membership SET status = 'member' WHERE group_id = ? AND user_id = ? AND status = 'pending_request'`, request.GroupID, request.UserID)
			notificationMsg = fmt.Sprintf("Your request to join %s has been approved.", groupName)
		} else if request.Action == "decline" {
			// Delete the pending request.
			_, err = db.Exec(`DELETE FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'pending_request'`, request.GroupID, request.UserID)
			notificationMsg = fmt.Sprintf("Your request to join %s has been declined.", groupName)
		} else {
			http.Error(w, "Invalid action", http.StatusBadRequest)
			return
		}

		if err != nil {
			http.Error(w, "Failed to update join request", http.StatusInternalServerError)
			return
		}

		// Delete the original join request notification so it won't reappear.
		_, err = db.Exec(`
			DELETE FROM notifications 
			WHERE type = 'group_join_request' 
			  AND user_id = ? 
			  AND group_id = ? 
			  AND related_user_id = ?`,
			creatorID, request.GroupID, request.UserID)
		if err != nil {
			http.Error(w, "Failed to delete join request notification", http.StatusInternalServerError)
			return
		}

		// Notify the requester about the response.
		err = notifications.CreateNotification(db, request.UserID, "group_join_request", notificationMsg, "", creatorID, request.GroupID, "")
		if err != nil {
			http.Error(w, "Failed to create notification", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Join request " + request.Action + "ed successfully"))
	}
}

// Allows any group member to send invitations
func SendInvitationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID of the inviter from session.
		inviterID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Expect a request body with group_id and nickname.
		var invite struct {
			GroupID  string `json:"group_id"`
			Nickname string `json:"nickname"`
		}

		if err := json.NewDecoder(r.Body).Decode(&invite); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Check if group_id is provided.
		if invite.GroupID == "" {
			log.Printf("Group ID is empty in invite request for user %s", inviterID)
			http.Error(w, "Group ID is required", http.StatusBadRequest)
			return
		}

		// Look up the user ID corresponding to the given nickname.
		var inviteeID string
		err = db.QueryRow(`SELECT id FROM users WHERE nickname = ?`, invite.Nickname).Scan(&inviteeID)
		if err != nil {
			log.Printf("Failed to find user by nickname %s: %v", invite.Nickname, err)
			http.Error(w, "User not found", http.StatusBadRequest)
			return
		}

		// Check if the inviter is a member of the group.
		var status string
		err = db.QueryRow(`
			SELECT status FROM group_membership 
			WHERE group_id = ? AND user_id = ?`, invite.GroupID, inviterID).Scan(&status)
		if err != nil {
			log.Printf("Error retrieving membership status for user %s in group %s: %v", inviterID, invite.GroupID, err)
			http.Error(w, "Failed to retrieve membership status", http.StatusInternalServerError)
			return
		}
		log.Printf("Membership status for user %s in group %s: %s", inviterID, invite.GroupID, status)
		if status != "member" {
			log.Printf("User %s is not a member of group %s (status: %s)", inviterID, invite.GroupID, status)
			http.Error(w, "Unauthorized: Only group members can send invites", http.StatusForbidden)
			return
		}

		// Check if the target user is already in the group or has a pending request.
		var existingStatus string
		err = db.QueryRow(`
			SELECT status FROM group_membership WHERE group_id = ? AND user_id = ?
		`, invite.GroupID, inviteeID).Scan(&existingStatus)
		if err == nil {
			if existingStatus == "pending_invite" {
				http.Error(w, "This user has already been invited", http.StatusConflict)
				return
			} else if existingStatus == "pending_request" {
				http.Error(w, "This user has already requested to join. Accept or decline the request first.", http.StatusConflict)
				return
			} else if existingStatus == "member" {
				http.Error(w, "This user is already a member", http.StatusConflict)
				return
			}
		} else if err != sql.ErrNoRows {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// Insert invitation with pending status.
		_, err = db.Exec(`
			INSERT INTO group_membership (id, group_id, user_id, status) 
			VALUES (?, ?, ?, 'pending_invite')`, uuid.New().String(), invite.GroupID, inviteeID)
		if err != nil {
			http.Error(w, "Failed to send invitation", http.StatusInternalServerError)
			return
		}

		// Create a notification for the invited user.
		err = notifications.CreateNotification(db, inviteeID, "group_invite",
			"You have been invited to join a group.", "", inviterID, invite.GroupID, "")
		if err != nil {
			http.Error(w, "Failed to create notification", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Invitation sent successfully"))
	}
}

// HandleInvitationHandler - Accept or Decline an invitation
func HandleInvitationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow PUT requests.
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session (this is the invitee)
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Parse the request body.
		var request struct {
			GroupID string `json:"group_id"`
			Action  string `json:"action"` // "accept" or "decline"
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.Action != "accept" && request.Action != "decline" {
			http.Error(w, "Invalid action, must be 'accept' or 'decline'", http.StatusBadRequest)
			return
		}

		// Fetch the group creator (to notify them)
		var creatorID string
		err = db.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, request.GroupID).Scan(&creatorID)
		if err == sql.ErrNoRows {
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to retrieve group details", http.StatusInternalServerError)
			return
		}

		var notificationMessage string
		if request.Action == "accept" {
			// Update the membership status to 'member'.
			_, err = db.Exec(`UPDATE group_membership SET status = 'member' WHERE group_id = ? AND user_id = ? AND status = 'pending_invite'`, request.GroupID, userID)
			notificationMessage = "Your invitation to join has been accepted."
		} else {
			// Delete the pending invitation.
			_, err = db.Exec(`DELETE FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'pending_invite'`, request.GroupID, userID)
			notificationMessage = "Your invitation to join has been declined."
		}

		if err != nil {
			http.Error(w, "Failed to update invitation status", http.StatusInternalServerError)
			return
		}

		// Delete the invitation notification (so it doesn’t show up again)
		_, err = db.Exec(`DELETE FROM notifications WHERE type = 'group_invite' AND user_id = ? AND group_id = ?`, userID, request.GroupID)
		if err != nil {
			http.Error(w, "Failed to delete invitation notification", http.StatusInternalServerError)
			return
		}

		// Notify the group creator about the response.
		err = notifications.CreateNotification(db, creatorID, "group_invite_response",
			notificationMessage, "", userID, request.GroupID, "")
		if err != nil {
			http.Error(w, "Failed to create notification", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Invitation " + request.Action + "ed successfully"))
	}
}

// LeaveGroupHandler - Allows users to leave a group
func LeaveGroupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var request struct {
			GroupID string `json:"group_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// 1. Fetch the group's creator
		var groupCreatorID string
		err = db.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, request.GroupID).Scan(&groupCreatorID)
		if err == sql.ErrNoRows {
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to retrieve group information", http.StatusInternalServerError)
			return
		}

		// 2. Compare with current user
		if groupCreatorID == userID {
			http.Error(w, "Creator cannot leave their own group. Please delete it instead.", http.StatusForbidden)
			return
		}

		// 3. If not the creator, delete membership
		_, err = db.Exec(`DELETE FROM group_membership 
                          WHERE group_id = ? 
                            AND user_id = ? 
                            AND status = 'member'`,
			request.GroupID, userID,
		)
		if err != nil {
			http.Error(w, "Failed to leave group", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Left group successfully"))
	}
}

// GetUserGroupsHandler - Fetches groups the user is a member of
func GetUserGroupsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Query to fetch the groups
		rows, err := db.Query(`
			SELECT groups.id, groups.name, groups.description, groups.creator_id, groups.created_at
			FROM groups
			INNER JOIN group_membership ON groups.id = group_membership.group_id
			WHERE group_membership.user_id = ? AND group_membership.status = 'member'`, userID)
		if err != nil {
			http.Error(w, "Failed to fetch groups", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Store result in a slice
		var groups []Group
		for rows.Next() {
			var group Group
			if err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.CreatorID, &group.CreatedAt); err != nil {
				http.Error(w, "Failed to parse groups", http.StatusInternalServerError)
				return
			}
			groups = append(groups, group)
		}

		// Send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(groups)
	}
}

// Lets group creators see pending requests
func GetPendingRequestsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		creatorID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		rows, err := db.Query(`
			SELECT gm.user_id, gm.group_id 
			FROM group_membership gm
			INNER JOIN groups g ON gm.group_id = g.id
			WHERE g.creator_id = ? AND gm.status = 'pending_request'
		`, creatorID)
		if err != nil {
			http.Error(w, "Failed to fetch join requests", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var requests []map[string]string
		for rows.Next() {
			var request map[string]string
			var userID, groupID string
			if err := rows.Scan(&userID, &groupID); err != nil {
				http.Error(w, "Failed to parse requests", http.StatusInternalServerError)
				return
			}
			request = map[string]string{"user_id": userID, "group_id": groupID}
			requests = append(requests, request)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(requests)
	}
}

// Allows the group creator to remove members.
func RemoveMemberHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		creatorID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var request struct {
			GroupID string `json:"group_id"`
			UserID  string `json:"user_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Verify if the logged-in user is the creator of the group
		var ownerID string
		err = db.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, request.GroupID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to check group ownership", http.StatusInternalServerError)
			return
		}

		if ownerID != creatorID {
			http.Error(w, "Unauthorized: Only the group creator can remove members", http.StatusForbidden)
			return
		}

		//delete the user from the group
		_, err = db.Exec(`DELETE FROM group_membership WHERE group_id = ? AND user_id = ?`, request.GroupID, request.UserID)
		if err != nil {
			http.Error(w, "Failed to remove member", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Member removed successfully"))
	}
}

func DeleteGroupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID (Must be the creator)
		creatorID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		groupID := r.URL.Query().Get("group_id")
		_, err = db.Exec(`DELETE FROM groups WHERE id = ? AND creator_id = ?`, groupID, creatorID)
		if err != nil {
			http.Error(w, "Failed to delete group", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Group deleted successfully"))
	}
}

// list all members of a group
func GetGroupMembersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract group ID from query params
		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			http.Error(w, "Missing group_id", http.StatusBadRequest)
			return
		}

		// Check if user is a member
		var isMember bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'member')`, groupID, userID).Scan(&isMember)

		if err != nil || !isMember {
			http.Error(w, "Forbidden: Only members can view the member list", http.StatusForbidden)
			return
		}

		// Fetch members of the group
		rows, err := db.Query(`
					SELECT u.id, u.first_name, u.last_name, u.nickname, u.avatar 
					FROM users u
					INNER JOIN group_membership gm ON u.id = gm.user_id
					WHERE gm.group_id = ? AND gm.status = 'member'
			`, groupID)
		if err != nil {
			http.Error(w, "Failed to fetch group members", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Store members in a slice
		var members []map[string]string
		for rows.Next() {
			var userID, firstName, lastName, nickname, avatar string
			if err := rows.Scan(&userID, &firstName, &lastName, &nickname, &avatar); err != nil {
				http.Error(w, "Failed to parse members data", http.StatusInternalServerError)
				return
			}
			members = append(members, map[string]string{
				"id":         userID,
				"first_name": firstName,
				"last_name":  lastName,
				"nickname":   nickname,
				"avatar":     avatar,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(members)
	}
}

// CreateGroupPostHandler allows users to create posts in a group
func CreateGroupPostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Parse multipart form first
		const maxUploadSize = 100 << 20 // 100 MB
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Now read form values
		groupID := r.Form.Get("group_id")
		if groupID == "" {
			http.Error(w, "Group ID is required", http.StatusBadRequest)
			return
		}

		// Check if the user is a member
		var isMember bool
		err = db.QueryRow(
			`SELECT EXISTS(SELECT 1 FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'member')`,
			groupID, userID,
		).Scan(&isMember)
		if err != nil || !isMember {
			http.Error(w, "Forbidden: Only members can create posts", http.StatusForbidden)
			return
		}

		// Extract content and perform other validations
		content := r.Form.Get("content")
		if strings.TrimSpace(content) == "" {
			http.Error(w, "Content is required", http.StatusBadRequest)
			return
		}
		if len(content) > 250 {
			http.Error(w, "Content cannot exceed 250 characters", http.StatusBadRequest)
			return
		}

		// Handle file upload (if any)
		var imageURL string
		file, fileHeader, err := r.FormFile("file")
		if err == nil {
			defer file.Close()
			allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif"}
			fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
			if !contains(allowedExtensions, fileExt) {
				http.Error(w, "Invalid file type. Only JPG, PNG, and GIF allowed.", http.StatusBadRequest)
				return
			}
			fileName := uuid.New().String() + fileExt
			savePath := filepath.Join("uploads", fileName)
			outFile, err := os.Create(savePath)
			if err != nil {
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}
			defer outFile.Close()
			if _, err := io.Copy(outFile, file); err != nil {
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}
			imageURL = fileName
		} else if err != http.ErrMissingFile {
			http.Error(w, "Failed to upload file", http.StatusBadRequest)
			return
		}

		// Generate post ID and insert into the database
		postID := uuid.New().String()
		_, err = db.Exec(
			`INSERT INTO group_posts (id, group_id, user_id, content, image_url) VALUES (?, ?, ?, ?, ?)`,
			postID, groupID, userID, content, imageURL,
		)
		if err != nil {
			http.Error(w, "Failed to create group post", http.StatusInternalServerError)
			return
		}

		// Send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message":   "Group post created successfully",
			"post_id":   postID,
			"image_url": imageURL,
		})
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

// DeleteGroupPostHandler allows a user to delete their own group post
func DeleteGroupPostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract post ID from query params
		postID := r.URL.Query().Get("post_id")
		if postID == "" {
			http.Error(w, "Missing post_id", http.StatusBadRequest)
			return
		}

		// Check if the user owns the post
		var ownerID string
		err = db.QueryRow(`SELECT user_id FROM group_posts WHERE id = ?`, postID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to verify post ownership", http.StatusInternalServerError)
			return
		}

		// Ensure only the owner can delete
		if ownerID != userID {
			http.Error(w, "Unauthorized: You can only delete your own posts", http.StatusForbidden)
			return
		}

		// Delete the post
		_, err = db.Exec(`DELETE FROM group_posts WHERE id = ?`, postID)
		if err != nil {
			http.Error(w, "Failed to delete post", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Group post deleted successfully"))
	}
}

// GetGroupPostsHandler fetches all posts from a specific group
func GetGroupPostsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure the request method is GET.
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Retrieve the user ID from the session.
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract the group ID from query parameters.
		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			http.Error(w, "Missing group_id", http.StatusBadRequest)
			return
		}

		// Verify that the user is a member of the group.
		var isMember bool
		err = db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM group_membership 
				WHERE group_id = ? AND user_id = ? AND status = 'member'
			)
		`, groupID, userID).Scan(&isMember)
		if err != nil || !isMember {
			http.Error(w, "Forbidden: You are not a member of this group", http.StatusForbidden)
			return
		}

		// Fetch all posts from the group, joining with the users table
		// to retrieve the creator's nickname and avatar.
		rows, err := db.Query(`
			SELECT 
				gp.id, 
				gp.user_id, 
				gp.content, 
				gp.image_url, 
				gp.created_at, 
				u.nickname, 
				u.avatar
			FROM group_posts gp
			JOIN users u ON gp.user_id = u.id
			WHERE gp.group_id = ?
			ORDER BY gp.created_at DESC
		`, groupID)
		if err != nil {
			http.Error(w, "Failed to fetch group posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Prepare a slice to hold the posts.
		var posts []map[string]string
		for rows.Next() {
			var id, creatorID, content, imageURL, createdAt, nickname, avatar string
			if err := rows.Scan(&id, &creatorID, &content, &imageURL, &createdAt, &nickname, &avatar); err != nil {
				http.Error(w, "Failed to parse posts", http.StatusInternalServerError)
				return
			}
			post := map[string]string{
				"id":         id,
				"user_id":    creatorID,
				"content":    content,
				"image_url":  imageURL,
				"created_at": createdAt,
				"nickname":   nickname,
				"avatar":     avatar,
			}
			posts = append(posts, post)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}
}

// CreateGroupPostCommentHandler allows users to add comments to group posts
func CreateGroupPostCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Parse request body
		var request struct {
			PostID  string `json:"post_id"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.PostID == "" || strings.TrimSpace(request.Content) == "" {
			http.Error(w, "Post ID and content are required", http.StatusBadRequest)
			return
		}

		//word count limit
		if len(request.Content) > 200 {
			http.Error(w, "Content cannot exceed 200 words", http.StatusBadRequest)
			return
		}

		// Insert into database
		commentID := uuid.New().String()
		_, err = db.Exec(`INSERT INTO group_post_comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)`, commentID, request.PostID, userID, request.Content)
		if err != nil {
			http.Error(w, "Failed to add comment", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Comment added successfully"))
	}
}

// GetGroupPostCommentsHandler retrieves comments for a specific group post
func GetGroupPostCommentsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Extract post ID from query params
		postID := r.URL.Query().Get("post_id")
		if postID == "" {
			http.Error(w, "Missing post_id", http.StatusBadRequest)
			return
		}

		// Fetch comments for the group post
		rows, err := db.Query(`
			SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.nickname, u.avatar
			FROM group_post_comments c
			INNER JOIN users u ON c.user_id = u.id
			WHERE c.post_id = ?
			ORDER BY c.created_at ASC
		`, postID)
		if err != nil {
			http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var comments []map[string]string
		for rows.Next() {
			var comment map[string]string
			var id, postID, userID, content, createdAt, nickname, avatar string
			if err := rows.Scan(&id, &postID, &userID, &content, &createdAt, &nickname, &avatar); err != nil {
				http.Error(w, "Failed to parse comments", http.StatusInternalServerError)
				return
			}
			comment = map[string]string{
				"id":         id,
				"post_id":    postID,
				"user_id":    userID,
				"content":    content,
				"created_at": createdAt,
				"nickname":   nickname,
				"avatar":     avatar,
			}
			comments = append(comments, comment)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(comments)
	}
}

// DeleteGroupPostCommentHandler allows a user to delete their own comment
func DeleteGroupPostCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract comment ID from query params
		commentID := r.URL.Query().Get("comment_id")
		if commentID == "" {
			http.Error(w, "Missing comment_id", http.StatusBadRequest)
			return
		}

		// Check if the user owns the comment
		var ownerID string
		err = db.QueryRow(`SELECT user_id FROM group_post_comments WHERE id = ?`, commentID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			http.Error(w, "Comment not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to verify comment ownership", http.StatusInternalServerError)
			return
		}

		// Ensure only the owner can delete
		if ownerID != userID {
			http.Error(w, "Unauthorized: You can only delete your own comments", http.StatusForbidden)
			return
		}

		// Delete the comment
		_, err = db.Exec(`DELETE FROM group_post_comments WHERE id = ?`, commentID)
		if err != nil {
			http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Comment deleted successfully"))
	}
}
