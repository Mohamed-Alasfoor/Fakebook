package users

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/sessions"
)

func UpdatePrivacyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// the logged-in user ID from session
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Parse the request body
		var request struct {
			Private *bool `json:"private"` // Use a pointer to distinguish between missing and false
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			log.Printf("Error decoding request body: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate `private` field is provided
		if request.Private == nil {
			http.Error(w, "Missing private field", http.StatusBadRequest)
			return
		}

		// Update the privacy setting for the logged-in user
		_, err = db.Exec(`UPDATE users SET private = ? WHERE id = ?`, *request.Private, userID)
		if err != nil {
			log.Printf("Error updating user privacy: %v", err)
			http.Error(w, "Failed to update privacy setting", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Privacy setting updated successfully"))
	}
}


