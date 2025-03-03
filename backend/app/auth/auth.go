package auth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"social-network/app/chat"
	"social-network/app/sessions"
	"strings"
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

		// Parse multipart form with max 10 MB upload size
		const maxUploadSize = 10 << 20 // 10 MB
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Extract JSON fields
		user := User{
			Email:       r.FormValue("email"),
			Password:    r.FormValue("password"),
			FirstName:   r.FormValue("first_name"),
			LastName:    r.FormValue("last_name"),
			Nickname:    r.FormValue("nickname"),
			AboutMe:     r.FormValue("about_me"),
			DateOfBirth: r.FormValue("date_of_birth"),
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

		// Auto-generate a nickname if it's empty
		if strings.TrimSpace(user.Nickname) == "" {
			baseNickname := strings.Split(user.Email, "@")[0]
			nicknameCandidate := baseNickname
			count := 1
			for {
				var exists bool
				err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE nickname = ?)", nicknameCandidate).Scan(&exists)
				if err != nil {
					log.Println("Failed to check duplicate nickname:", err)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					return
				}
				if !exists {
					break
				}
				count++
				nicknameCandidate = fmt.Sprintf("%s%d", baseNickname, count)
			}
			user.Nickname = nicknameCandidate
		}

		// Handle avatar upload
		avatarFile, avatarHeader, err := r.FormFile("avatar")
		var avatarFilename string
		if err == nil { // File exists
			defer avatarFile.Close()

			// Validate the file type
			allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif"}
			fileExt := strings.ToLower(filepath.Ext(avatarHeader.Filename))
			if !contains(allowedExtensions, fileExt) {
				http.Error(w, "Invalid avatar file type. Allowed: .jpg, .jpeg, .png, .gif", http.StatusBadRequest)
				return
			}

			// Ensure the "avatars" directory exists
			avatarDir := "avatars"
			if _, err := os.Stat(avatarDir); os.IsNotExist(err) {
				err = os.MkdirAll(avatarDir, 0755)
				if err != nil {
					log.Printf("Failed to create avatars directory: %v", err)
					http.Error(w, "Failed to create avatar directory", http.StatusInternalServerError)
					return
				}
			}

			// Generate a unique filename and save the avatar
			avatarFilename = uuid.New().String() + fileExt
			avatarPath := filepath.Join(avatarDir, avatarFilename)

			outFile, err := os.Create(avatarPath)
			if err != nil {
				log.Printf("Failed to create avatar file: %v", err)
				http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
				return
			}
			defer outFile.Close()

			if _, err := io.Copy(outFile, avatarFile); err != nil {
				log.Printf("Failed to copy avatar file: %v", err)
				http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
				return
			}
		} else if err != http.ErrMissingFile {
			http.Error(w, "Failed to upload avatar: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Insert the user into the database
		_, err = db.Exec(
			`INSERT INTO users (id, email, password, first_name, last_name, nickname, about_me, avatar, date_of_birth) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			userID, user.Email, user.Password, user.FirstName, user.LastName, user.Nickname, user.AboutMe, avatarFilename, user.DateOfBirth,
		)
		if err != nil {
			log.Println("Failed to register user:", err)
			http.Error(w, "Failed to register user", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "User registered successfully",
			"user_id": userID,
			"avatar":  avatarFilename, // Return the avatar filename for frontend use
		})
	}
}


// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
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

// In your auth/logout handler (assuming similar structure to your other handlers)
func LogoutHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed. Only POST is allowed.", http.StatusMethodNotAllowed)
			return
		}

		// Retrieve session cookie and validate session
		cookie, err := r.Cookie("social-network-session")
		if err != nil || cookie.Value == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		sessionID := cookie.Value

		// Get user ID from session (using your existing helper)
		userID, err := sessions.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Delete session from the database (your existing logic)
		_, err = db.Exec(`DELETE FROM active_sessions WHERE session_id = ?`, sessionID)
		if err != nil {
			http.Error(w, "Failed to logout", http.StatusInternalServerError)
			return
		}

		// Mark the user offline in persistent storage
		if err := chat.MarkUserOffline(db, userID); err != nil {
			http.Error(w, "Failed to update online status", http.StatusInternalServerError)
			return
		}

		// Clear the session cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "social-network-session",
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		})
		http.SetCookie(w, &http.Cookie{
			Name:     "user_id",
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		})

		w.Write([]byte("Logout successful"))
	}
}

