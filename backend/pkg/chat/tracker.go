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
	// You can add additional fields if needed (like connection type)
}

var (
	// chatClients maps user IDs to their active **chat** connection.
	chatClients   = make(map[string]*Client)
	chatClientsMu sync.RWMutex

	// onlineClients maps user IDs to their active **online status** connection.
	onlineClients   = make(map[string]*Client)
	onlineClientsMu sync.RWMutex
)

// OnlineUser holds the friend details that will be sent.
type OnlineUser struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
	Online   bool   `json:"online"`
}

// AddChatClient registers a new private chat connection.
func AddChatClient(userID string, conn *websocket.Conn, db *sql.DB) {
	chatClientsMu.Lock()
	chatClients[userID] = &Client{
		Conn:   conn,
		UserID: userID,
	}
	chatClientsMu.Unlock()
	broadcastFriendsStatus(db)
}

// RemoveChatClient unregisters a private chat connection.
func RemoveChatClient(userID string, db *sql.DB) {
	chatClientsMu.Lock()
	delete(chatClients, userID)
	chatClientsMu.Unlock()
	broadcastFriendsStatus(db)
}

// GetChatClient returns the chat client associated with the given user ID.
func GetChatClient(userID string) (*Client, bool) {
	chatClientsMu.RLock()
	defer chatClientsMu.RUnlock()
	client, ok := chatClients[userID]
	return client, ok
}

// AddOnlineClient registers a new online status connection.
func AddOnlineClient(userID string, conn *websocket.Conn, db *sql.DB) {
	onlineClientsMu.Lock()
	onlineClients[userID] = &Client{
		Conn:   conn,
		UserID: userID,
	}
	onlineClientsMu.Unlock()
	broadcastFriendsStatus(db)
}

// RemoveOnlineClient unregisters an online status connection.
func RemoveOnlineClient(userID string, db *sql.DB) {
	onlineClientsMu.Lock()
	delete(onlineClients, userID)
	onlineClientsMu.Unlock()
	broadcastFriendsStatus(db)
}

// GetOnlineClient returns the online status client associated with the given user ID.
func GetOnlineClient(userID string) (*Client, bool) {
	onlineClientsMu.RLock()
	defer onlineClientsMu.RUnlock()
	client, ok := onlineClients[userID]
	return client, ok
}

// GetOnlineUsers returns a list of user IDs that are currently online (based on onlineClients).
func GetOnlineUsers() []string {
	onlineClientsMu.RLock()
	defer onlineClientsMu.RUnlock()
	online := make([]string, 0, len(onlineClients))
	for userID := range onlineClients {
		online = append(online, userID)
	}
	return online
}

// -----------------------
// Persistent Online Status Functions
// -----------------------

func MarkUserOnline(db *sql.DB, userID string) error {
	_, err := db.Exec(`INSERT OR REPLACE INTO user_status (user_id, status, last_seen) VALUES (?, 'online', ?)`,
		userID, time.Now().Format(time.RFC3339))
	return err
}

func MarkUserOffline(db *sql.DB, userID string) error {
	_, err := db.Exec(`INSERT OR REPLACE INTO user_status (user_id, status, last_seen) VALUES (?, 'offline', ?)`,
		userID, time.Now().Format(time.RFC3339))
	return err
}

func getFriendsStatus(db *sql.DB, userID string) ([]OnlineUser, error) {
	query := `
		SELECT DISTINCT u.id, u.nickname, u.avatar,
			CASE WHEN us.status = 'online' THEN 1 ELSE 0 END AS online
		FROM users u
		LEFT JOIN user_status us ON u.id = us.user_id
		WHERE (
			u.id IN (
				SELECT followed_id FROM followers WHERE follower_id = ? AND status = 'accepted'
				UNION
				SELECT follower_id FROM followers WHERE followed_id = ? AND status = 'accepted'
			)
		)
		OR (u.private = 0 AND u.id != ?)
	`
	rows, err := db.Query(query, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []OnlineUser
	for rows.Next() {
		var user OnlineUser
		var onlineInt int
		if err := rows.Scan(&user.ID, &user.Nickname, &user.Avatar, &onlineInt); err != nil {
			return nil, err
		}
		user.Online = onlineInt == 1
		users = append(users, user)
	}
	return users, nil
}


func broadcastFriendsStatus(db *sql.DB) {
	// We'll broadcast using the online status connections.
	onlineClientsMu.RLock()
	defer onlineClientsMu.RUnlock()
	for _, client := range onlineClients {
		friends, err := getFriendsStatus(db, client.UserID)
		if err != nil {
			log.Printf("Error getting friends status for %s: %v", client.UserID, err)
			continue
		}
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

		// Add the connection to the online-specific tracker.
		AddOnlineClient(userID, conn, db)
		if err := MarkUserOnline(db, userID); err != nil {
			log.Printf("Failed to mark user online: %v", err)
		}

		// Keep the connection open.
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				RemoveOnlineClient(userID, db)
				if err := MarkUserOffline(db, userID); err != nil {
					log.Printf("Failed to mark user offline: %v", err)
				}
				break
			}
		}
	}
}
