package events

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/sessions"
	"github.com/google/uuid"
	"fmt"
	"social-network/pkg/notifications"
)

type Event struct {
	ID          string `json:"id"`
	GroupID     string `json:"group_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	EventDate   string `json:"event_date"`
	CreatorID   string `json:"creator_id"`
}

// CreateEventHandler allows users to create events in groups
func CreateGroupEventHandler(db *sql.DB) http.HandlerFunc {
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
		var event struct {
			GroupID     string `json:"group_id"`
			Title       string `json:"title"`
			Description string `json:"description"`
			EventDate   string `json:"event_date"` 
	}

		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if event.GroupID == "" || event.Title == "" || event.Description == "" || event.EventDate== "" {
			http.Error(w, "All fields are required", http.StatusBadRequest)
			return
		}

		// Generate event ID
		eventID := uuid.New().String()

		// Insert event into database
   _, err = db.Exec(`
   INSERT INTO events (id, group_id, title, description, event_date) 
   VALUES (?, ?, ?, ?, ?)`, 
   eventID, event.GroupID, event.Title, event.Description, event.EventDate )
   if err != nil {
   http.Error(w, err.Error(), http.StatusInternalServerError)
  return
   }

		// Notify group members about the new event
		rows, err := db.Query(`SELECT user_id FROM group_membership WHERE group_id = ? AND status = 'member' AND user_id != ?`, event.GroupID, userID)
		if err != nil {
			http.Error(w, "Failed to fetch group members", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var memberID string
			if err := rows.Scan(&memberID); err == nil {
				notificationMsg := fmt.Sprintf("A new event has been created in your group: %s", event.Title)
				_ = notifications.CreateNotification(db, memberID, "group_event_created",
					notificationMsg, "", userID, event.GroupID, eventID)
			}
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Event created successfully",
			"event_id": eventID,
		})
	}
}

 // Fetch Events in a Group
 func GetGroupEventsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
					http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
					return
			}

			groupID := r.URL.Query().Get("group_id")
			if groupID == "" {
					http.Error(w, "Missing group_id", http.StatusBadRequest)
					return
			}

			rows, err := db.Query(`
					SELECT id, group_id, title, description, event_date, creator_id 
					FROM events WHERE group_id = ? ORDER BY event_date ASC`, groupID)
			if err != nil {
					http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
					return
			}
			defer rows.Close()

			var events []map[string]string
			for rows.Next() {
					var id, groupID, title, description, dateTime, creatorID string
					if err := rows.Scan(&id, &groupID, &title, &description, &dateTime, &creatorID); err != nil {
							http.Error(w, "Failed to parse events", http.StatusInternalServerError)
							return
					}
					event := map[string]string{
							"id": id, "group_id": groupID, "title": title, "description": description, "date_time": dateTime, "creator_id": creatorID,
					}
					events = append(events, event)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(events)
	}
}

//allows users to respond to events in a group
func RSVPGroupEventHandler(db *sql.DB) http.HandlerFunc {
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

			var rsvp struct {
					EventID string `json:"event_id"`
					Status  string `json:"status"`
			}

			if err := json.NewDecoder(r.Body).Decode(&rsvp); err != nil {
					http.Error(w, "Invalid request body", http.StatusBadRequest)
					return
			}

			if rsvp.EventID == "" || (rsvp.Status != "going" && rsvp.Status != "not_going") {
					http.Error(w, "Invalid RSVP status", http.StatusBadRequest)
					return
			}

			// Insert RSVP into database (or update if exists)
			_, err = db.Exec(`
					INSERT INTO event_rsvp (id, event_id, user_id, status) 
					VALUES (?, ?, ?, ?) ON CONFLICT(event_id, user_id) DO UPDATE SET status = ?`, 
					uuid.New().String(), rsvp.EventID, userID, rsvp.Status, rsvp.Status)
			if err != nil {
					http.Error(w, "Failed to RSVP", http.StatusInternalServerError)
					return
			}

			w.Write([]byte("RSVP updated successfully"))
	}
}

// Fetches all RSVP responses for a specific event
func GetRSVPsForEventHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
					http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
					return
			}

			eventID := r.URL.Query().Get("event_id")
			if eventID == "" {
					http.Error(w, "Missing event_id", http.StatusBadRequest)
					return
			}

			rows, err := db.Query(`
					SELECT user_id, status FROM event_rsvp WHERE event_id = ?`, eventID)
			if err != nil {
					http.Error(w, "Failed to fetch RSVPs", http.StatusInternalServerError)
					return
			}
			defer rows.Close()

			var rsvps []map[string]string
			for rows.Next() {
					var userID, status string
					if err := rows.Scan(&userID, &status); err != nil {
							http.Error(w, "Failed to parse RSVPs", http.StatusInternalServerError)
							return
					}
					rsvps = append(rsvps, map[string]string{
							"user_id": userID,
							"status":  status,
					})
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(rsvps)
	}
}

//Removes a user's RSVP for an event.
func RemoveRSVPHandler(db *sql.DB) http.HandlerFunc {
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

			eventID := r.URL.Query().Get("event_id")
			if eventID == "" {
					http.Error(w, "Missing event_id", http.StatusBadRequest)
					return
			}

			_, err = db.Exec(`DELETE FROM event_rsvp WHERE event_id = ? AND user_id = ?`, eventID, userID)
			if err != nil {
					http.Error(w, "Failed to remove RSVP", http.StatusInternalServerError)
					return
			}

			w.Write([]byte("RSVP removed successfully"))
	}
}

