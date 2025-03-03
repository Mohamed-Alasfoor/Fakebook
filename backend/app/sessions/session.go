package sessions

import (
	"database/sql"
	"errors"
	"net/http"
)

const SessionCookieName = "social-network-session"

// DB is the database connection (assume it's initialized elsewhere)
var DB *sql.DB

// SetSessionValue sets a session cookie with the given key-value pair
func SetSessionValue(w http.ResponseWriter, r *http.Request, key, value string) error {
	http.SetCookie(w, &http.Cookie{
		Name:     key,
		Value:    value,
		Path:     "/",
		HttpOnly: true,                      // Prevent access to cookies via JavaScript
		Secure:   true,                      // Ensure cookies are sent over HTTPS only
		SameSite: http.SameSiteStrictMode,   // Enforce SameSite: Strict
	})
	return nil
}


// GetSessionValue retrieves the session cookie value for the given key
func GetSessionValue(r *http.Request, key string) (string, error) {
	cookie, err := r.Cookie(key)
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return "", nil
		}
		return "", err
	}
	return cookie.Value, nil
}

// DestroySession clears the session cookie
func DestroySession(w http.ResponseWriter, r *http.Request) error {
	http.SetCookie(w, &http.Cookie{
		Name:   SessionCookieName,
		Value:  "",
		Path:   "/",
		MaxAge: -1, // Expire the cookie immediately
	})
	return nil
}

// GetUserIDFromSession retrieves the user_id from the session cookie
func GetUserIDFromSession(r *http.Request) (string, error) {
	// Retrieve the session_id from the session cookie
	sessionID, err := GetSessionValue(r, SessionCookieName)
	if err != nil {
		return "", err
	}

	// If session_id is empty, return an error
	if sessionID == "" {
		return "", errors.New("session_id not found in session cookie")
	}

	// Query the database to retrieve the user_id associated with the session_id
	var userID string
	query := "SELECT user_id FROM active_sessions WHERE session_id = ? AND expires_at > CURRENT_TIMESTAMP"
	err = DB.QueryRow(query, sessionID).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errors.New("invalid or expired session")
		}
		return "", err
	}

	// Return the user_id
	return userID, nil
}