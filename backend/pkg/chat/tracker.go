package chat

import (
	"encoding/json"
	"net/http"
	"sync"

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

// GetOnlineUsers returns a list of user IDs that are currently online.
func GetOnlineUsers() []string {
	clientsMutex.RLock()
	defer clientsMutex.RUnlock()
	online := make([]string, 0, len(clients))
	for userID := range clients {
		online = append(online, userID)
	}
	return online
}


// GetOnlineUsersHandler returns a JSON list of currently online user IDs.
func GetOnlineUsersHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		onlineUsers := GetOnlineUsers() // Uses the tracker from tracker.go
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(onlineUsers)
	}
}