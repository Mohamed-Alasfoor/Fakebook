package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// RegisterHandler handles user registration
func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method. Only POST is allowed.", http.StatusMethodNotAllowed)
			return
		}

		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			http.Error(w, "Invalid request body. Ensure the JSON is correctly formatted.", http.StatusBadRequest)
			return
		}

		// Validate the user input
		if err := ValidateUser(user); err != nil {
			http.Error(w, "Validation failed: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Generate a UUID for the user
		userID := uuid.New().String()

		// Hash the password
		hashedPassword, err := HashPassword(user.Password)
		if err != nil {
			log.Println("Failed to hash password:", err)
			http.Error(w, "An internal error occurred while processing your password. Please try again later.", http.StatusInternalServerError)
			return
		}
		user.Password = hashedPassword

		// Insert the user into the database
		_, err = db.Exec(
			`INSERT INTO users (id, email, password, first_name, last_name, nickname, about_me, avatar, date_of_birth) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			userID, user.Email, user.Password, user.FirstName, user.LastName, user.Nickname, user.AboutMe, user.Avatar, user.DateOfBirth,
		)
		if err != nil {
			log.Println("Failed to register user:", err)
			http.Error(w, "Failed to register user", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("User registered successfully"))
	}
}

// LoginHandler handles user login
func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed. Only POST is allowed.", http.StatusMethodNotAllowed)
			return
		}

		var creds struct {
			Identifier string `json:"identifier"`
			Password   string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		var hashedPassword, userID string
		query := `SELECT id, password FROM users WHERE email = ? OR nickname = ?`
		err := db.QueryRow(query, creds.Identifier, creds.Identifier).Scan(&userID, &hashedPassword)
		if err != nil || CheckPassword(hashedPassword, creds.Password) != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		sessionID := uuid.New().String()
		expiresAt := time.Now().Add(24 * time.Hour)
		_, err = db.Exec(
			`INSERT INTO active_sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`,
			sessionID, userID, expiresAt,
		)
		if err != nil {
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		// Set session_id cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "social-network-session",
			Value:    sessionID,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,                    // Ensure secure transport
			SameSite: http.SameSiteStrictMode, // Prevent CSRF attacks
			Expires:  expiresAt,               // Set expiration time
		})

		// Set user_id cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "user_id",
			Value:    userID,
			Path:     "/",
			HttpOnly: false,
			Secure:   true, // Ensure it's only sent over HTTPS
			SameSite: http.SameSiteStrictMode,
			Expires:  expiresAt,
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message":    "Login successful",
			"session_id": sessionID,
			"user_id":    userID, // Optionally return in JSON for frontend convenience
		})
	}
}

func LogoutHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed. Only POST is allowed.", http.StatusMethodNotAllowed)
			return
		}

		cookie, err := r.Cookie("social-network-session")
		if err != nil || cookie.Value == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		sessionID := cookie.Value

		_, err = db.Exec(`DELETE FROM active_sessions WHERE session_id = ?`, sessionID)
		if err != nil {
			http.Error(w, "Failed to logout", http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "social-network-session",
			Value:    "",
			Path:     "/",
			MaxAge:   -1, // Expire the cookie immediately
			HttpOnly: true,
			Secure:   true,                    // Enable Secure flag
			SameSite: http.SameSiteStrictMode, // Enforce SameSite: Strict
		})

		w.Write([]byte("Logout successful"))
	}
}
