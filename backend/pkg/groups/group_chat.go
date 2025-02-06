package groups

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
	"social-network/pkg/sessions"
)

// WebSocket connection manager
var clients = make(map[*websocket.Conn]string) // Stores user ID for each connection
var clientsMutex = sync.Mutex{}
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all connections
}

// ChatMessage struct for messages
type ChatMessage struct {
	GroupID  string `json:"group_id"`
	SenderID string `json:"sender_id"`
	Message  string `json:"message"`
}

// WebSocket handler for group chat
func GroupChatHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Upgrade HTTP to WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("WebSocket upgrade error:", err)
			return
		}
		defer conn.Close()

		// Authenticate user
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			conn.WriteMessage(websocket.TextMessage, []byte("Unauthorized"))
			return
		}

		// Get group ID from query params
		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			conn.WriteMessage(websocket.TextMessage, []byte("Missing group_id"))
			return
		}

		// Check if user is a member of the group
		var isMember bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)", groupID, userID).Scan(&isMember)
		if err != nil || !isMember {
			conn.WriteMessage(websocket.TextMessage, []byte("Not a member of this group"))
			return
		}

		// Add user to WebSocket connections
		clientsMutex.Lock()
		clients[conn] = userID
		clientsMutex.Unlock()

		// Listen for incoming messages
		for {
			_, messageBytes, err := conn.ReadMessage()
			if err != nil {
				log.Println("Read error:", err)
				break
			}

			// Parse message
			var msg ChatMessage
			err = json.Unmarshal(messageBytes, &msg)
			if err != nil {
				log.Println("Invalid message format")
				continue
			}

			// Save message to database
			messageID := uuid.New().String()
			_, err = db.Exec("INSERT INTO group_chat_messages (id, group_id, sender_id, message) VALUES (?, ?, ?, ?)",
				messageID, msg.GroupID, userID, msg.Message)
			if err != nil {
				log.Println("Failed to save message:", err)
				continue
			}

			// Broadcast message to all clients
			broadcastMessage := fmt.Sprintf(`{"group_id":"%s","sender_id":"%s","message":"%s"}`, msg.GroupID, msg.SenderID, msg.Message)
			clientsMutex.Lock()
			for client := range clients {
				client.WriteMessage(websocket.TextMessage, []byte(broadcastMessage))
			}
			clientsMutex.Unlock()
		}

		// Remove client when they disconnect
		clientsMutex.Lock()
		delete(clients, conn)
		clientsMutex.Unlock()
	}
}

// Fetches previous messages from the group chat
func GetGroupChatMessagesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			http.Error(w, "Missing group_id", http.StatusBadRequest)
			return
		}

		// Query old messages
		rows, err := db.Query(`
			SELECT sender_id, message, created_at
			FROM group_chat_messages
			WHERE group_id = ?
			ORDER BY created_at ASC
		`, groupID)
		if err != nil {
			http.Error(w, "Failed to fetch messages", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Prepare response
		var messages []ChatMessage
		for rows.Next() {
			var msg ChatMessage
			err := rows.Scan(&msg.SenderID, &msg.Message)
			if err != nil {
				http.Error(w, "Error processing messages", http.StatusInternalServerError)
				return
			}
			messages = append(messages, msg)
		}

		// Send JSON response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}

