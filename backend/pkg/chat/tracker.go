package chat

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/sessions"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents an active chat connection.
type Client struct {
	Conn   *websocket.Conn
	UserID string
}

var (
	// clients maps user IDs to their active chat connection.
	clients = make(map[string]*Client)
	// clientsMutex protects concurrent access to the clients map.
	clientsMutex sync.RWMutex
)

// AddClient registers a new client connection.
func AddClient(userID string, conn *websocket.Conn) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()
	clients[userID] = &Client{
		Conn:   conn,
		UserID: userID,
	}
}

// RemoveClient unregisters a client connection.
func RemoveClient(userID string) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()
	delete(clients, userID)
}

// GetClient returns the client associated with the given user ID.
func GetClient(userID string) (*Client, bool) {
	clientsMutex.RLock()
	defer clientsMutex.RUnlock()
	client, ok := clients[userID]
	return client, ok
}

// GetOnlineUsers returns a list of user IDs that are currently online (in‑memory).
func GetOnlineUsers() []string {
	clientsMutex.RLock()
	defer clientsMutex.RUnlock()
	online := make([]string, 0, len(clients))
	for userID := range clients {
		online = append(online, userID)
	}
	return online
}

// GetOnlineUsersHandler returns a JSON list of currently online user IDs (in‑memory).
func GetOnlineUsersHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		onlineUsers := GetOnlineUsers() // Uses the in‑memory tracker
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(onlineUsers)
	}
}

// -----------------------
// Persistent Online Status Functions
// -----------------------

// MarkUserOnline updates the persistent status of a user to "online".
func MarkUserOnline(db *sql.DB, userID string) error {
	_, err := db.Exec(`INSERT OR REPLACE INTO user_status (user_id, status, last_seen) VALUES (?, 'online', ?)`,
		userID, time.Now().Format(time.RFC3339))
	return err
}

// MarkUserOffline updates the persistent status of a user to "offline" and records the last seen time.
func MarkUserOffline(db *sql.DB, userID string) error {
	_, err := db.Exec(`INSERT OR REPLACE INTO user_status (user_id, status, last_seen) VALUES (?, 'offline', ?)`,
		userID, time.Now().Format(time.RFC3339))
	return err
}

// GetPersistentOnlineUsersHandler returns a JSON list of user IDs marked as online in the database.
func GetPersistentOnlineUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get logged-in user ID from the session.
		loggedInUserID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Query to get users (both online and offline) that are either following you or that you follow.
		query := `
			SELECT u.id, u.nickname, u.avatar,
				CASE WHEN us.status = 'online' THEN 1 ELSE 0 END AS online
			FROM users u
			LEFT JOIN user_status us ON u.id = us.user_id
			WHERE u.id IN (
				SELECT followed_id FROM followers WHERE follower_id = ? AND status = 'accepted'
				UNION
				SELECT follower_id FROM followers WHERE followed_id = ? AND status = 'accepted'
			)
		`

		rows, err := db.Query(query, loggedInUserID, loggedInUserID)
		if err != nil {
			http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type OnlineUser struct {
			ID       string `json:"id"`
			Nickname string `json:"nickname"`
			Avatar   string `json:"avatar"`
			Online   bool   `json:"online"`
		}

		var onlineUsers []OnlineUser
		for rows.Next() {
			var user OnlineUser
			var onlineInt int
			if err := rows.Scan(&user.ID, &user.Nickname, &user.Avatar, &onlineInt); err != nil {
				http.Error(w, "Error scanning user", http.StatusInternalServerError)
				return
			}
			user.Online = onlineInt == 1
			onlineUsers = append(onlineUsers, user)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(onlineUsers)
	}
}