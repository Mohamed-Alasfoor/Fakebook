package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/sessions"
	"github.com/google/uuid"
)

type Group struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatorID   string `json:"creator_id"` // Consistent with migration file
	CreatedAt   string `json:"created_at"`
}

// GetAllGroupsHandler - Fetches all existing groups for browsing
func GetAllGroupsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
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

//Allows users to search for groups by name
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

		_, err = db.Exec(`INSERT INTO groups (id, name, description, creator_id) VALUES (?, ?, ?, ?)`,
			group.ID, group.Name, group.Description, group.CreatorID)
		if err != nil {
			http.Error(w, "Failed to create group", http.StatusInternalServerError)
			return
		}

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

		// Get user ID from session
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

		_, err = db.Exec(`
			INSERT INTO group_membership (id, group_id, user_id, status) 
			VALUES (?, ?, ?, 'pending_request')`, uuid.New().String(), request.GroupID, userID)
		if err != nil {
			http.Error(w, "Failed to send join request", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Join request sent"))
	}
}

// HandleJoinRequestHandler - Allows group creator to accept or decline join requests
func HandleJoinRequestHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get creator ID from session
		creatorID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var request struct {
			GroupID string `json:"group_id"`
			UserID  string `json:"user_id"`
			Action  string `json:"action"` // "accept" or "decline"
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Ensure only the group creator can approve/decline requests
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
			http.Error(w, "Unauthorized: Only the group creator can handle requests", http.StatusForbidden)
			return
		}

		// Handle actions
		if request.Action == "accept" {
			_, err = db.Exec(`UPDATE group_membership SET status = 'member' WHERE group_id = ? AND user_id = ? AND status = 'pending_request'`, request.GroupID, request.UserID)
		} else {
			_, err = db.Exec(`DELETE FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'pending_request'`, request.GroupID, request.UserID)
		}

		if err != nil {
			http.Error(w, "Failed to update join request", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Join request " + request.Action + "ed successfully"))
	}
}


// SendInvitationHandler - Allows group creator to send invitations
func SendInvitationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		creatorID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var invite struct {
			GroupID string `json:"group_id"`
			UserID  string `json:"user_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&invite); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Ensure the request is made by the group creator
		var ownerID string
		err = db.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, invite.GroupID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Failed to check group ownership", http.StatusInternalServerError)
			return
		}

		if ownerID != creatorID {
			http.Error(w, "Unauthorized: Only the group creator can send invites", http.StatusForbidden)
			return
		}

		// Insert invitation with pending status
		_, err = db.Exec(`
			INSERT INTO group_membership (id, group_id, user_id, status) 
			VALUES (?, ?, ?, 'pending_invite')`, uuid.New().String(), invite.GroupID, invite.UserID)
		if err != nil {
			http.Error(w, "Failed to send invitation", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Invitation sent successfully"))
	}
}

// HandleInvitationHandler - Accept or Decline an invitation
func HandleInvitationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

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

		// Handle actions
		if request.Action == "accept" {
			_, err = db.Exec(`UPDATE group_membership SET status = 'member' WHERE group_id = ? AND user_id = ? AND status = 'pending_invite'`, request.GroupID, userID)
		} else {
			_, err = db.Exec(`DELETE FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'pending_invite'`, request.GroupID, userID)
		}

		if err != nil {
			http.Error(w, "Failed to update invitation status", http.StatusInternalServerError)
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

		// Get user ID from session
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

		_, err = db.Exec(`DELETE FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'member'`, request.GroupID, userID)
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

//Lets group creators see pending requests
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

//Allows the group creator to remove members.
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

//list all members of a group
func GetGroupMembersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
					http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
					return
			}

			// Extract group ID from query params
			groupID := r.URL.Query().Get("group_id")
			if groupID == "" {
					http.Error(w, "Missing group_id", http.StatusBadRequest)
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




