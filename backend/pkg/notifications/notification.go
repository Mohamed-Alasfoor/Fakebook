package notifications

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"github.com/google/uuid"
)

type Notification struct {
	ID            string `json:"id"`
	UserID        string `json:"user_id"`
	Type          string `json:"type"`
	Content       string `json:"content"`
	PostID        string `json:"post_id,omitempty"`
	RelatedUserID string `json:"related_user_id,omitempty"`
	GroupID       string `json:"group_id,omitempty"`
	EventID       string `json:"event_id,omitempty"`
	Read          bool   `json:"read"`
	CreatedAt     string `json:"created_at"`
}

// AddNotificationHandler adds a new notification
func AddNotificationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var notification Notification
		if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		notification.ID = uuid.New().String()

		_, err := db.Exec(`
			INSERT INTO notifications (id, user_id, type, content, post_id, related_user_id, group_id, event_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, notification.ID, notification.UserID, notification.Type, notification.Content, notification.PostID, notification.RelatedUserID, notification.GroupID, notification.EventID)
		if err != nil {
			http.Error(w, "Failed to create notification", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Notification created successfully"))
	}
}

// GetNotificationsHandler fetches notifications for a user
func GetNotificationsHandler(db *sql.DB) http.HandlerFunc {
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

		rows, err := db.Query(`
			SELECT id, user_id, type, content, post_id, related_user_id, group_id, event_id, read, created_at
			FROM notifications
			WHERE user_id = ?
			ORDER BY created_at DESC
		`, userID)
		if err != nil {
			http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var notifications []Notification
		for rows.Next() {
			var notification Notification
			if err := rows.Scan(&notification.ID, &notification.UserID, &notification.Type, &notification.Content, &notification.PostID, &notification.RelatedUserID, &notification.GroupID, &notification.EventID, &notification.Read, &notification.CreatedAt); err != nil {
				http.Error(w, "Failed to parse notifications", http.StatusInternalServerError)
				return
			}
			notifications = append(notifications, notification)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(notifications)
	}
}

// MarkNotificationReadHandler marks a notification as read
func MarkNotificationReadHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		notificationID := r.URL.Query().Get("id")
		if notificationID == "" {
			http.Error(w, "Missing notification ID", http.StatusBadRequest)
			return
		}

		_, err := db.Exec(`
			UPDATE notifications
			SET read = TRUE
			WHERE id = ?
		`, notificationID)
		if err != nil {
			http.Error(w, "Failed to mark notification as read", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Notification marked as read"))
	}
}
