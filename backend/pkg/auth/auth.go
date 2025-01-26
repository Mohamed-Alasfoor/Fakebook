package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/sessions"

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
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var creds struct {
			Identifier string `json:"identifier"`
			Password   string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			log.Println("Error decoding JSON:", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		var hashedPassword, userID string
		query := `SELECT id, password FROM users WHERE email = ? OR nickname = ?`
		err := db.QueryRow(query, creds.Identifier, creds.Identifier).Scan(&userID, &hashedPassword)
		if err == sql.ErrNoRows {
			log.Println("Invalid credentials: no matching user found")
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		} else if err != nil {
			log.Println("Database error:", err)
			http.Error(w, "Failed to retrieve user", http.StatusInternalServerError)
			return
		}

		if err := CheckPassword(hashedPassword, creds.Password); err != nil {
			log.Println("Password mismatch:", err)
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Generate a session ID
		sessionID := uuid.New().String()

		// Set session ID in the cookie
		if err := sessions.SetSessionValue(w, r, sessions.SessionCookieName, sessionID); err != nil {
			log.Println("Failed to create session:", err)
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		log.Println("User logged in successfully:", userID)

		// Return session ID as response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"session_id": "` + sessionID + `"}`))
	}
}




func LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := sessions.DestroySession(w, r); err != nil {
			http.Error(w, "Failed to logout", http.StatusInternalServerError)
			return
		}
		w.Write([]byte("Logout successful"))
	}
}


