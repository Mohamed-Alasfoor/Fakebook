package chat

import (
	"database/sql"
	"log"
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

// OnlineUser holds the friend details that will be sent.
type OnlineUser struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
	Online   bool   `json:"online"`
}

// AddClient registers a new client connection and broadcasts updated status.
func AddClient(userID string, conn *websocket.Conn, db *sql.DB) {
	clientsMutex.Lock()
	clients[userID] = &Client{
		Conn:   conn,
		UserID: userID,
	}
	clientsMutex.Unlock()
	broadcastFriendsStatus(db)
}

// RemoveClient unregisters a client connection and broadcasts updated status.
func RemoveClient(userID string, db *sql.DB) {
	clientsMutex.Lock()
	delete(clients, userID)
	clientsMutex.Unlock()
	broadcastFriendsStatus(db)
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

// getFriendsStatus returns a slice of OnlineUser for a given user.
// It retrieves users that the given user follows or who follow the given user.
func getFriendsStatus(db *sql.DB, userID string) ([]OnlineUser, error) {
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
	rows, err := db.Query(query, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var friends []OnlineUser
	for rows.Next() {
		var friend OnlineUser
		var onlineInt int
		if err := rows.Scan(&friend.ID, &friend.Nickname, &friend.Avatar, &onlineInt); err != nil {
			return nil, err
		}
		friend.Online = onlineInt == 1
		friends = append(friends, friend)
	}
	return friends, nil
}

// broadcastFriendsStatus iterates over each connected client and sends them their friend list.
func broadcastFriendsStatus(db *sql.DB) {
	clientsMutex.RLock()
	defer clientsMutex.RUnlock()
	for _, client := range clients {
		// Get personalized friend details for this client.
		friends, err := getFriendsStatus(db, client.UserID)
		if err != nil {
			log.Printf("Error getting friends status for %s: %v", client.UserID, err)
			continue
		}
		// Prepare the message payload.
		if err := client.Conn.WriteJSON(friends); err != nil {
			log.Printf("Error broadcasting to client %s: %v", client.UserID, err)
		}
		
	}
}

// OnlineUsersSocketHandler upgrades the connection and sends real-time friend status updates.
func OnlineUsersSocketHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Upgrade the HTTP connection to a WebSocket.
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
			return
		}

		// Retrieve user ID from session.
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			conn.WriteMessage(websocket.TextMessage, []byte("Unauthorized"))
			conn.Close()
			return
		}

		// Add the connection and mark user online.
		AddClient(userID, conn, db)
		if err := MarkUserOnline(db, userID); err != nil {
			log.Printf("Failed to mark user online: %v", err)
		}

		// Keep the connection open.
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				RemoveClient(userID, db)
				if err := MarkUserOffline(db, userID); err != nil {
					log.Printf("Failed to mark user offline: %v", err)
				}
				break
			}
		}
	}
}
