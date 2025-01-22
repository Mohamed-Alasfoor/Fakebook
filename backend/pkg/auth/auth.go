package auth

import (
	"database/sql"
	"encoding/json"
	"net/http"
)


// RegisterHandler handles user registration
func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate the user input
		if err := ValidateUser(user); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
		}

	//HashPassword func from auth_utils.go 
	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	user.Password = hashedPassword

		// Insert the user into the database
		_, err = db.Exec(
			`INSERT INTO users (email, password, first_name, last_name, nickname, about_me, avatar, date_of_birth) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			user.Email, user.Password, user.FirstName, user.LastName, user.Nickname, user.AboutMe, user.Avatar, user.DateOfBirth,
		)
		if err != nil {
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

	
		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Retrieve the user's hashed password from the database using either email or nickname
		var hashedPassword string
		query := `
			SELECT password FROM users 
			WHERE email = ? OR nickname = ?
		`
		err := db.QueryRow(query, creds.Identifier, creds.Identifier).Scan(&hashedPassword)
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, "Failed to retrieve user", http.StatusInternalServerError)
			return
		}

		// Compare the hashed password with the provided password
		if err := CheckPassword(hashedPassword, creds.Password); err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Respond with success (session handling will come later)
		w.Write([]byte("Login successful"))
	}
}

