package notifications

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"social-network/pkg/sessions"

	"github.com/google/uuid"
)

type Notification struct {
	ID             string `json:"id"`
	UserID         string `json:"user_id"`
	Type           string `json:"type"`
	Content        string `json:"content"`
	PostID         string `json:"post_id,omitempty"`
	RelatedUserID  string `json:"related_user_id,omitempty"`
	GroupID        string `json:"group_id,omitempty"`
	EventID        string `json:"event_id,omitempty"`
	Read           bool   `json:"read"`
	CreatedAt      string `json:"created_at"`
	SenderNickname string `json:"sender_nickname,omitempty"`
	SenderAvatar   string `json:"sender_avatar,omitempty"`
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

// GetNotificationsHandler fetches notifications for a user (including sender's nickname and avatar)
func GetNotificationsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Query to fetch notifications with sender's nickname and avatar
		rows, err := db.Query(`
			SELECT n.id, n.user_id, n.type, n.content, n.post_id, n.related_user_id, n.group_id, n.event_id, n.read, n.created_at,
			       u.nickname, u.avatar
			FROM notifications n
			LEFT JOIN users u ON u.id = n.related_user_id
			WHERE n.user_id = ?
			ORDER BY n.created_at DESC
		`, userID)
		if err != nil {
			http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var notifications []Notification
		for rows.Next() {
			var notification Notification
			if err := rows.Scan(
				&notification.ID,
				&notification.UserID,
				&notification.Type,
				&notification.Content,
				&notification.PostID,
				&notification.RelatedUserID,
				&notification.GroupID,
				&notification.EventID,
				&notification.Read,
				&notification.CreatedAt,
				&notification.SenderNickname,
				&notification.SenderAvatar,
			); err != nil {
				http.Error(w, "Failed to parse notifications", http.StatusInternalServerError)
				return
			}
			notifications = append(notifications, notification)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(notifications)
	}
}

// MarkNotificationReadHandler marks a single notification as read.
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

// MarkAllNotificationsReadHandler marks all notifications as read for the current user.
func MarkAllNotificationsReadHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}
		_, err = db.Exec(`UPDATE notifications SET read = TRUE WHERE user_id = ?`, userID)
		if err != nil {
			http.Error(w, "Failed to mark all notifications as read", http.StatusInternalServerError)
			return
		}
		w.Write([]byte("All notifications marked as read"))
	}
}