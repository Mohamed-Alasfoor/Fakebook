package groups

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
	"social-network/pkg/sessions"
)

// Client holds connection-specific data.
type Client struct {
	Conn    *websocket.Conn
	UserID  string
	GroupID string
}

// Global map to hold active WebSocket connections.
var clients = make(map[*websocket.Conn]Client)
var clientsMutex = sync.Mutex{}

// Upgrader upgrades HTTP connections to WebSocket connections.
var upgrader = websocket.Upgrader{
	// Allow connections from any origin (adjust this in production)
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ChatMessage represents the message structure.
type ChatMessage struct {
	GroupID  string `json:"group_id"`  // Overridden with the authenticated group_id.
	SenderID string `json:"sender_id"` // Overridden with the authenticated user_id.
	Message  string `json:"message"`
	Nickname string `json:"nickname"`  // Sender's nickname.
	Avatar   string `json:"avatar"`    // Sender's avatar.
}

// GroupChatHandler upgrades the connection and processes messages.
func GroupChatHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Upgrade the HTTP connection to a WebSocket.
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("WebSocket upgrade error:", err)
			return
		}
		defer conn.Close()

		// Authenticate the user.
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			conn.WriteMessage(websocket.TextMessage, []byte("Unauthorized"))
			return
		}

		// Retrieve the group ID from query parameters.
		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			conn.WriteMessage(websocket.TextMessage, []byte("Missing group_id"))
			return
		}

		// Check if the user is a member of the group.
		var isMember bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM group_membership WHERE group_id = ? AND user_id = ?)", groupID, userID).Scan(&isMember)
		if err != nil || !isMember {
			conn.WriteMessage(websocket.TextMessage, []byte("Not a member of this group"))
			return
		}

		// Add the connection to our clients map.
		clientsMutex.Lock()
		clients[conn] = Client{
			Conn:    conn,
			UserID:  userID,
			GroupID: groupID,
		}
		clientsMutex.Unlock()

		// Listen for incoming messages.
		for {
			_, messageBytes, err := conn.ReadMessage()
			if err != nil {
				log.Println("Read error:", err)
				break
			}

			var msg ChatMessage
			if err := json.Unmarshal(messageBytes, &msg); err != nil {
				log.Println("Invalid message format:", err)
				continue
			}

			// Override the fields to ensure data integrity.
			msg.SenderID = userID
			msg.GroupID = groupID

			// Query the database to get the sender's nickname and avatar.
			err = db.QueryRow(`SELECT nickname, avatar FROM users WHERE id = ?`, userID).Scan(&msg.Nickname, &msg.Avatar)
			if err != nil {
				log.Println("Failed to retrieve sender info:", err)
				msg.Nickname = "Unknown"
				msg.Avatar = ""
			}

			// Save the message to the database.
			messageID := uuid.New().String()
			_, err = db.Exec("INSERT INTO group_chat_messages (id, group_id, sender_id, message) VALUES (?, ?, ?, ?)",
				messageID, msg.GroupID, msg.SenderID, msg.Message)
			if err != nil {
				log.Println("Failed to save message:", err)
				continue
			}

			// Marshal the message (now including Nickname and Avatar) for broadcasting.
			broadcastMessage, err := json.Marshal(msg)
			if err != nil {
				log.Println("Failed to marshal message:", err)
				continue
			}

			// Broadcast the message only to clients in the same group.
			clientsMutex.Lock()
			for clientConn, client := range clients {
				if client.GroupID == groupID {
					if err := clientConn.WriteMessage(websocket.TextMessage, broadcastMessage); err != nil {
						log.Println("Write error, closing connection:", err)
						clientConn.Close()
						delete(clients, clientConn)
					}
				}
			}
			clientsMutex.Unlock()
		}

		// On disconnect, remove the client.
		clientsMutex.Lock()
		delete(clients, conn)
		clientsMutex.Unlock()
	}
}

// GetGroupChatMessagesHandler retrieves past messages for a given group.
// Modified to return sender's nickname and avatar as well.
func GetGroupChatMessagesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			http.Error(w, "Missing group_id", http.StatusBadRequest)
			return
		}

		// Query past messages by joining with the users table.
		rows, err := db.Query(`
			SELECT m.sender_id, m.message, m.created_at, u.nickname, u.avatar
			FROM group_chat_messages m
			JOIN users u ON m.sender_id = u.id
			WHERE m.group_id = ?
			ORDER BY m.created_at ASC
		`, groupID)
		if err != nil {
			http.Error(w, "Failed to fetch messages", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type MessageResponse struct {
			SenderID  string `json:"sender_id"`
			Message   string `json:"message"`
			CreatedAt string `json:"created_at"`
			Nickname  string `json:"nickname"`
			Avatar    string `json:"avatar"`
		}
		var messages []MessageResponse
		for rows.Next() {
			var msg MessageResponse
			if err := rows.Scan(&msg.SenderID, &msg.Message, &msg.CreatedAt, &msg.Nickname, &msg.Avatar); err != nil {
				http.Error(w, "Error processing messages", http.StatusInternalServerError)
				return
			}
			messages = append(messages, msg)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}
