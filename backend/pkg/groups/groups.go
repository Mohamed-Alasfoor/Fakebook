package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/sessions"
	"github.com/google/uuid"
	"os"
	"path/filepath"
	"io"
	"strings"
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


// CreateGroupPostHandler allows users to create posts in a group
func CreateGroupPostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Parse multipart form (for file uploads)
		const maxUploadSize = 100 << 20 // 100 MB
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Get user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract form values
		groupID := r.Form.Get("group_id")
		content := r.Form.Get("content")

		if groupID == "" || strings.TrimSpace(content) == "" {
			http.Error(w, "Group ID and content are required", http.StatusBadRequest)
			return
		}

		// Ensure "uploads" directory exists
		uploadDir := "uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
				return
			}
		}

		// Handle file upload
		var imageURL string
		file, fileHeader, err := r.FormFile("file")
		if err == nil { // File exists
			defer file.Close()

			// Validate file type
			allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif"}
			fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
			if !contains(allowedExtensions, fileExt) {
				http.Error(w, "Invalid file type. Only JPG, PNG, and GIF allowed.", http.StatusBadRequest)
				return
			}

			// Save file with unique name
			fileName := uuid.New().String() + fileExt
			savePath := filepath.Join(uploadDir, fileName)

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

			// Store only the filename
			imageURL = fileName
		} else if err != http.ErrMissingFile {
			http.Error(w, "Failed to upload file", http.StatusBadRequest)
			return
		}

		// Generate post ID
		postID := uuid.New().String()

		// Insert into database
		_, err = db.Exec(`INSERT INTO group_posts (id, group_id, user_id, content, image_url) VALUES (?, ?, ?, ?, ?)`, postID, groupID, userID, content, imageURL)
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

		// Extract group ID from query params
		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			http.Error(w, "Missing group_id", http.StatusBadRequest)
			return
		}

		// Check if the user is a member of the group
		var isMember bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'member')`, groupID, userID).Scan(&isMember)
		if err != nil || !isMember {
			http.Error(w, "Forbidden: You are not a member of this group", http.StatusForbidden)
			return
		}

		// Fetch all posts from the group
		rows, err := db.Query(`SELECT id, user_id, content, image_url, created_at FROM group_posts WHERE group_id = ? ORDER BY created_at DESC`, groupID)
		if err != nil {
			http.Error(w, "Failed to fetch group posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []map[string]string
		for rows.Next() {
			var post map[string]string
			var id, userID, content, imageURL, createdAt string
			if err := rows.Scan(&id, &userID, &content, &imageURL, &createdAt); err != nil {
				http.Error(w, "Failed to parse posts", http.StatusInternalServerError)
				return
			}
			post = map[string]string{
				"id":         id,
				"user_id":    userID,
				"content":    content,
				"image_url":  imageURL,
				"created_at": createdAt,
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

