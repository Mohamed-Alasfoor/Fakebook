package chat

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"social-network/pkg/sessions"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// -----------------------------
// Data Structures and Handlers
// -----------------------------

// PrivateMessage represents a private chat message.
type PrivateMessage struct {
	ID         string `json:"id"`
	SenderID   string `json:"sender_id"`
	ReceiverID string `json:"receiver_id"`
	Message    string `json:"message"`
	CreatedAt  string `json:"created_at"`
	Read       bool   `json:"read"`
}

// GetPrivateChatHistoryHandler retrieves the chat history between the logged-in user and another user.
func GetPrivateChatHistoryHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure the request method is GET.
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method, use GET", http.StatusMethodNotAllowed)
			return
		}

		// Get the logged-in user's ID.
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Get the other user's ID from the query parameter "with".
		otherUserID := r.URL.Query().Get("with")
		if otherUserID == "" {
			http.Error(w, "Missing 'with' parameter", http.StatusBadRequest)
			return
		}

		// Query for messages between the two users.
		query := `
			SELECT id, sender_id, receiver_id, message, created_at, read
			FROM private_chat_messages
			WHERE (sender_id = ? AND receiver_id = ?)
			   OR (sender_id = ? AND receiver_id = ?)
			ORDER BY created_at ASC
		`
		rows, err := db.Query(query, userID, otherUserID, otherUserID, userID)
		if err != nil {
			http.Error(w, "Failed to fetch messages", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Collect messages.
		var messages []PrivateMessage
		for rows.Next() {
			var msg PrivateMessage
			if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Message, &msg.CreatedAt, &msg.Read); err != nil {
				http.Error(w, "Error scanning messages", http.StatusInternalServerError)
				return
			}
			messages = append(messages, msg)
		}

		// Return the messages as JSON.
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}

// ChatMessage represents the structure for private chat messages (used over WebSocket).
type ChatMessage struct {
	ID         string `json:"id"`
	SenderID   string `json:"sender_id"`
	ReceiverID string `json:"receiver_id"`
	Message    string `json:"message"`
	// Type can be "message" for regular messages or "typing" for typing notifications.
	Type      string `json:"type"`
	CreatedAt string `json:"created_at"`
}

// -----------------------------
// WebSocket Upgrade and Tracking
// -----------------------------

var upgrader = websocket.Upgrader{
	// Allow connections from any origin (adjust as needed for production)
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}


// -----------------------------
// WebSocket Chat Handler with Persistent Status
// -----------------------------

// PrivateChatHandler handles the private chat WebSocket connection.
func PrivateChatHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Upgrade the HTTP connection to a WebSocket.
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("WebSocket upgrade error:", err)
			return
		}
		defer conn.Close()

		// Retrieve the user ID from the session.
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			conn.WriteMessage(websocket.TextMessage, []byte("Unauthorized"))
			return
		}

		// Add the connection to the in-memory tracker.
		AddClient(userID, conn, db)
		log.Printf("User %s connected to private chat", userID)

		// Update persistent status to "online".
		if err := MarkUserOnline(db, userID); err != nil {
			log.Println("Failed to mark user online:", err)
		}

		// Ensure that when the connection closes, we mark the user offline.
		defer func() {
			RemoveClient(userID, db)
			log.Printf("User %s disconnected from private chat", userID)
			if err := MarkUserOffline(db, userID); err != nil {
				log.Println("Failed to mark user offline:", err)
			}
		}()
		

		// Main loop: read and process messages.
		for {
			msgType, msgBytes, err := conn.ReadMessage()
			if err != nil {
				log.Println("Read message error:", err)
				break
			}
			if msgType != websocket.TextMessage {
				continue
			}

			var msg ChatMessage
			if err := json.Unmarshal(msgBytes, &msg); err != nil {
				log.Println("JSON unmarshal error:", err)
				continue
			}

			// Force the sender to be the current user.
			msg.SenderID = userID
			msg.ID = uuid.New().String()
			msg.CreatedAt = time.Now().Format(time.RFC3339)

			// Handle typing indicator messages.
			if msg.Type == "typing" {
				// Forward the typing notification to the recipient if online.
				if client, ok := GetClient(msg.ReceiverID); ok {
					typingNotification := map[string]string{
						"type":      "typing",
						"sender_id": userID,
					}
					notifBytes, _ := json.Marshal(typingNotification)
					client.Conn.WriteMessage(websocket.TextMessage, notifBytes)
				}
				continue
			}

			//Enforce a message word limit 
			words := strings.Fields(msg.Message)
			if len(words) > 200 {
				errorMsg := map[string]string{"error": "Message cannot exceed 200 words"}
				errorBytes, _ := json.Marshal(errorMsg)
				conn.WriteMessage(websocket.TextMessage, errorBytes)
				continue
			}

			// For regular messages, first verify that private messaging is allowed.
			var allowed bool
			checkQuery := `
                SELECT EXISTS(
                    SELECT 1 FROM followers 
                    WHERE (follower_id = ? AND followed_id = ? AND status = 'accepted')
                       OR (follower_id = ? AND followed_id = ? AND status = 'accepted')
                )
            `
			if err := db.QueryRow(checkQuery, userID, msg.ReceiverID, msg.ReceiverID, userID).Scan(&allowed); err != nil || !allowed {
				errorMsg := map[string]string{"error": "Chat not permitted: you must follow each other (or be followed) to chat."}
				errorBytes, _ := json.Marshal(errorMsg)
				conn.WriteMessage(websocket.TextMessage, errorBytes)
				continue
			}

			// Store the message in the database.
			_, err = db.Exec(`
                INSERT INTO private_chat_messages (id, sender_id, receiver_id, message, created_at)
                VALUES (?, ?, ?, ?, ?)
            `, msg.ID, userID, msg.ReceiverID, msg.Message, msg.CreatedAt)
			if err != nil {
				log.Println("Database insert error:", err)
			}

			// If the recipient is online, send the message in real time.
			if client, ok := GetClient(msg.ReceiverID); ok {
				sendBytes, _ := json.Marshal(msg)
				client.Conn.WriteMessage(websocket.TextMessage, sendBytes)
			}
		}
	}
}

// -----------------------------
// Mark Message as Read Handler
// -----------------------------

// MarkMessageReadRequest represents the expected JSON payload.
type MarkMessageReadRequest struct {
	MessageID string `json:"message_id"`
}

// MarkMessageReadHandler marks a private chat message as read using a PUT request.
// It prevents marking the same message as read more than once.
func MarkMessageReadHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure the request method is PUT.
		if r.Method != http.MethodPut {
			http.Error(w, "Invalid request method, use PUT", http.StatusMethodNotAllowed)
			return
		}

		// Decode the JSON payload.
		var req MarkMessageReadRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		if req.MessageID == "" {
			http.Error(w, "Missing message_id field", http.StatusBadRequest)
			return
		}

		// First, check if the message exists and whether it has already been read.
		var alreadyRead bool
		err := db.QueryRow(`SELECT "read" FROM private_chat_messages WHERE id = ?`, req.MessageID).Scan(&alreadyRead)
		if err == sql.ErrNoRows {
			http.Error(w, "Message not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if alreadyRead {
			http.Error(w, "Message already seen", http.StatusBadRequest)
			return
		}

		// Update the read status to 1 in the database only if it hasn't been marked as read yet.
		result, err := db.Exec(`UPDATE private_chat_messages SET "read" = 1 WHERE id = ? AND "read" = 0`, req.MessageID)
		if err != nil {
			http.Error(w, "Failed to mark message as read", http.StatusInternalServerError)
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			log.Println("Error getting rows affected:", err)
		} else if rowsAffected == 0 {
			// This case should not occur since we already checked the status,
			// but it’s a safeguard in case of a race condition.
			http.Error(w, "Message already seen", http.StatusBadRequest)
			return
		}

		w.Write([]byte("Message marked as read"))
	}
}

