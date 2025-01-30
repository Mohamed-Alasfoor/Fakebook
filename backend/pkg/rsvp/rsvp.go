package rsvp

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/sessions"
)

type RSVP struct {
	EventID string `json:"event_id"`
	UserID  string `json:"user_id"`
	Status  string `json:"status"`
}

// RSVPHandler allows users to RSVP to an event
func RSVPHandler(db *sql.DB) http.HandlerFunc {
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

		var rsvp RSVP
		if err := json.NewDecoder(r.Body).Decode(&rsvp); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		_, err = db.Exec(`INSERT INTO rsvps (event_id, user_id, status) VALUES (?, ?, ?)`,
			rsvp.EventID, userID, rsvp.Status)
		if err != nil {
			http.Error(w, "Failed to RSVP", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("RSVP submitted successfully"))
	}
}
