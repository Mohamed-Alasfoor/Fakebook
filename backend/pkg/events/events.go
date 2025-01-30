package events

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/sessions"
	"github.com/google/uuid"
)

type Event struct {
	ID          string `json:"id"`
	GroupID     string `json:"group_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	DateTime    string `json:"date_time"`
	CreatorID   string `json:"creator_id"` // Consistent with migration file
}

// CreateEventHandler allows users to create events in groups
func CreateEventHandler(db *sql.DB) http.HandlerFunc {
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

		var event Event
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		event.ID = uuid.New().String()
		event.CreatorID = userID // Corrected field name

		_, err = db.Exec(`INSERT INTO events (id, group_id, title, description, date_time, creator_id) VALUES (?, ?, ?, ?, ?, ?)`,
			event.ID, event.GroupID, event.Title, event.Description, event.DateTime, event.CreatorID)
		if err != nil {
			http.Error(w, "Failed to create event", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Event created successfully", "event_id": event.ID})
	}
}
