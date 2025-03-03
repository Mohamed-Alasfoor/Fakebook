package chat

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"social-network/app/sessions"
	"strings"
	"time"

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
    SenderName string `json:"sender_name"`
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
        // Upgrade connection
        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            log.Printf("[PrivateChat] Upgrade error: %v", err)
            return
        }
        defer func() {
            log.Printf("[PrivateChat] Closing connection")
            conn.Close()
        }()

        // Retrieve user ID
       	userID, err := sessions.GetUserIDFromSession(r)

        if err != nil {
            log.Printf("[PrivateChat] Session error: %v", err,userID)
            conn.WriteMessage(websocket.TextMessage, []byte("Unauthorized"))
            return
        }
        log.Printf("[PrivateChat] User %s connected", userID)
        AddChatClient(userID, conn, db)
        if err := MarkUserOnline(db, userID); err != nil {
            log.Printf("[PrivateChat] MarkUserOnline error for user %s: %v", userID, err)
        }
        defer func() {
            RemoveChatClient(userID, db)
            if err := MarkUserOffline(db, userID); err != nil {
                log.Printf("[PrivateChat] MarkUserOffline error for user %s: %v", userID, err)
            }
            log.Printf("[PrivateChat] User %s disconnected", userID)
        }()

        // Set read deadline and pong handler
        conn.SetReadDeadline(time.Now().Add(pongWait))
        conn.SetPongHandler(func(appData string) error {
            log.Printf("[PrivateChat] Received pong from user %s: %s", userID, appData)
            conn.SetReadDeadline(time.Now().Add(pongWait))
            return nil
        })

        // Start ticker to send pings periodically
        ticker := time.NewTicker(pingPeriod)
        defer ticker.Stop()
        go func() {
            for t := range ticker.C {
                log.Printf("[PrivateChat] Sending ping to user %s at %s", userID, t.Format(time.RFC3339))
                if err := conn.WriteMessage(websocket.PingMessage, []byte("ping")); err != nil {
                    log.Printf("[PrivateChat] Ping error for user %s: %v", userID, err)
                    return
                }
            }
        }()

        // Main read loop
        for {
            msgType, msgBytes, err := conn.ReadMessage()
            if err != nil {
                log.Printf("[PrivateChat] Read error for user %s: %v", userID, err)
                break
            }
            log.Printf("[PrivateChat] Received message from user %s: type=%d, payload=%s", userID, msgType, string(msgBytes))
            if msgType != websocket.TextMessage {
                log.Printf("[PrivateChat] Ignoring non-text message from user %s", userID)
                continue
            }

            var msg ChatMessage
            if err := json.Unmarshal(msgBytes, &msg); err != nil {
                log.Printf("[PrivateChat] JSON unmarshal error for user %s: %v", userID, err)
                continue
            }
            // Override sender fields
            msg.SenderID = userID
            msg.ID = uuid.New().String()
            msg.CreatedAt = time.Now().Format(time.RFC3339)
            err = db.QueryRow("SELECT nickname FROM users WHERE id = ?", msg.SenderID).Scan(&msg.SenderName)
            if err != nil {
                msg.SenderName = userID
            }

            // Handle typing notifications
            if msg.Type == "typing" {
                if client, ok := GetChatClient(msg.ReceiverID); ok {
                    typingNotification := map[string]string{
                        "type":      "typing",
                        "sender_id": userID,
                    }
                    notifBytes, _ := json.Marshal(typingNotification)
                    log.Printf("[PrivateChat] Sending typing notification from %s to %s", userID, msg.ReceiverID)
                    client.Conn.WriteMessage(websocket.TextMessage, notifBytes)
                } else {
                    log.Printf("[PrivateChat] No active client for receiver %s", msg.ReceiverID)
                }
                continue
            }

            // Enforce word limit
            words := strings.Fields(msg.Message)
            if len(words) > 200 {
                errorMsg := map[string]string{"error": "Message cannot exceed 200 words"}
                errorBytes, _ := json.Marshal(errorMsg)
                log.Printf("[PrivateChat] Message from user %s exceeds word limit", userID)
                conn.WriteMessage(websocket.TextMessage, errorBytes)
                continue
            }

            // Check if messaging is allowed
            var allowed bool
            checkQuery := `
                SELECT EXISTS(
                    SELECT 1 FROM followers 
                    WHERE (follower_id = ? AND followed_id = ? AND status = 'accepted')
                       OR (follower_id = ? AND followed_id = ? AND status = 'accepted')
                )
            `
            if err := db.QueryRow(checkQuery, userID, msg.ReceiverID, msg.ReceiverID, userID).Scan(&allowed); err != nil || !allowed {
                errorMsg := map[string]string{"error": "Chat not permitted: you must follow each other to chat."}
                errorBytes, _ := json.Marshal(errorMsg)
                log.Printf("[PrivateChat] Chat not permitted: user %s -> %s", userID, msg.ReceiverID)
                conn.WriteMessage(websocket.TextMessage, errorBytes)
                continue
            }

            // Store message in DB
            _, err = db.Exec(`
                INSERT INTO private_chat_messages (id, sender_id, receiver_id, message, created_at)
                VALUES (?, ?, ?, ?, ?)
            `, msg.ID, userID, msg.ReceiverID, msg.Message, msg.CreatedAt)
            if err != nil {
                log.Printf("[PrivateChat] DB insert error for user %s: %v", userID, err)
            }

            // Forward message to recipient if connected
            if client, ok := GetChatClient(msg.ReceiverID); ok {
                sendBytes, _ := json.Marshal(msg)
                log.Printf("[PrivateChat] Forwarding message from %s to %s", userID, msg.ReceiverID)
                client.Conn.WriteMessage(websocket.TextMessage, sendBytes)
            } else {
                log.Printf("[PrivateChat] Receiver %s not connected", msg.ReceiverID)
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
