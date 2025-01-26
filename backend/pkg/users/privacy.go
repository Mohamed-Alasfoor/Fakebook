package users

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

func UpdatePrivacyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Parse the request body
		var request struct {
			UserID  string `json:"user_id"`
			Private *bool  `json:"private"` // Use a pointer to distinguish between missing and false
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			log.Printf("Error decoding request body: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate the request fields
		if request.UserID == "" {
			http.Error(w, "Missing user_id", http.StatusBadRequest)
			return
		}

		if request.Private == nil { // Check if `private` is missing
			http.Error(w, "Missing private field", http.StatusBadRequest)
			return
		}

		// Check if the user exists
		var exists bool
		err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)`, request.UserID).Scan(&exists)
		if err != nil {
			log.Printf("Error checking user existence: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		if !exists {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		// Update the privacy setting
		_, err = db.Exec(`UPDATE users SET private = ? WHERE id = ?`, *request.Private, request.UserID)
		if err != nil {
			log.Printf("Error updating user privacy: %v", err)
			http.Error(w, "Failed to update privacy setting", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Privacy setting updated successfully"))
	}
}

